import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { lstat, open, realpath } from "node:fs/promises";
import { delimiter, isAbsolute, join, relative, resolve, sep } from "node:path";
import { RepositoryError } from "./errors.ts";

type Command = { executable: string; args: string[]; cwd: string; env: NodeJS.ProcessEnv; timeoutMs: number };
export type AppCommandRunner = (command: Command) => Promise<string>;

function inside(root: string, target: string) {
    const path = relative(root, target);
    return path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

export function appLaunchEnvironment(environment: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
    const allowed = new Set(["path", "pathext", "systemroot", "windir", "comspec", "temp", "tmp", "userprofile", "home", "localappdata", "appdata"]);
    return { ...Object.fromEntries(Object.entries(environment).filter(([name]) => allowed.has(name.toLowerCase()))), COPILOT_AUTO_UPDATE: "false" };
}

async function nativeExecutable(candidate: string, workspacePath: string): Promise<string | undefined> {
    try {
        const executable = await realpath(candidate);
        if (inside(resolve(workspacePath), executable)) return;
        const info = await lstat(executable);
        if (!info.isFile() || info.isSymbolicLink()) return;
        const handle = await open(executable, "r");
        try {
            const header = Buffer.alloc(4);
            if ((await handle.read(header, 0, 4, 0)).bytesRead !== 4) return;
            const magic = header.toString("hex");
            if (header.subarray(0, 2).toString() !== "MZ" && !["7f454c46", "feedface", "cefaedfe", "feedfacf", "cffaedfe", "cafebabe"].includes(magic)) return;
        } finally { await handle.close(); }
        return executable;
    } catch { return; }
}

export async function findCopilotExecutable(workspacePath: string, environment: NodeJS.ProcessEnv = process.env,
    platform: NodeJS.Platform = process.platform, architecture = process.arch): Promise<string | undefined> {
    for (const directory of (environment.PATH ?? environment.Path ?? "").split(delimiter)) {
        if (!directory || !isAbsolute(directory) || inside(resolve(workspacePath), resolve(directory))) continue;
        const native = await nativeExecutable(join(directory, platform === "win32" ? "copilot.exe" : "copilot"), workspacePath);
        if (native) return native;
        try {
            const packageFile = join(directory, "node_modules", "@github", "copilot", "package.json");
            if (!(await lstat(packageFile)).isFile()) continue;
            const require = createRequire(packageFile);
            const executable = await nativeExecutable(require.resolve(`@github/copilot-${platform}-${architecture}`), workspacePath);
            if (executable) return executable;
        } catch { continue; }
    }
    return;
}

export const runAppCommand: AppCommandRunner = ({ executable, args, cwd, env, timeoutMs }) => new Promise((resolveResult, reject) => {
    const child = spawn(executable, args, { cwd, env, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let timedOut = false;
    let oversized = false;
    let bytes = 0;
    const chunks: Buffer[] = [];
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > 65_536) { oversized = true; child.kill(); }
        else chunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > 65_536) { oversized = true; child.kill(); }
    });
    child.once("error", () => { clearTimeout(timer); reject(new RepositoryError("app_launch_failed")); });
    child.once("close", code => {
        clearTimeout(timer);
        if (timedOut || oversized) reject(new RepositoryError("app_launch_unknown"));
        else if (code !== 0) reject(new RepositoryError("app_launch_failed"));
        else resolveResult(Buffer.concat(chunks).toString("utf8"));
    });
});

export function createCopilotAppLauncher({ environment = process.env, platform = process.platform, runner = runAppCommand }: {
    environment?: NodeJS.ProcessEnv; platform?: NodeJS.Platform; runner?: AppCommandRunner;
} = {}) {
    let cached: { workspacePath: string; executable: Promise<string | undefined> } | undefined;
    function executable(workspacePath: string) {
        if (!cached || cached.workspacePath !== workspacePath) cached = { workspacePath, executable: findCopilotExecutable(workspacePath, environment, platform) };
        return cached.executable;
    }
    return {
        async available(workspacePath: string) {
            return ["win32", "darwin"].includes(platform) && Boolean(await executable(workspacePath));
        },
        async launch(workspacePath: string, destination: string, beforeOpen?: () => Promise<void>) {
            if (!["win32", "darwin"].includes(platform)) throw new RepositoryError("app_launcher_unavailable");
            if (!isAbsolute(destination) || /[\p{Cc}\p{Cf}]/u.test(destination)) throw new RepositoryError("invalid_request");
            const target = await realpath(destination).catch(() => { throw new RepositoryError("clone_identity_changed"); });
            const info = await lstat(destination);
            if (!info.isDirectory() || info.isSymbolicLink() || target !== resolve(destination)) throw new RepositoryError("clone_identity_changed");
            const selected = await executable(workspacePath);
            if (!selected || inside(target, selected) || await nativeExecutable(selected, workspacePath) !== selected) throw new RepositoryError("app_launcher_unavailable");
            const env = appLaunchEnvironment(environment);
            for (const key of Object.keys(env).filter(name => name.toLowerCase() === "path")) {
                const directories = [];
                for (const directory of (env[key] ?? "").split(delimiter)) {
                    if (!isAbsolute(directory)) continue;
                    const canonical = await realpath(directory).catch(() => undefined);
                    if (canonical && !inside(resolve(workspacePath), canonical) && !inside(target, canonical)) directories.push(canonical);
                }
                env[key] = directories.join(delimiter);
            }
            const command = { executable: selected, cwd: target, env, timeoutMs: 5000 };
            let help;
            try { help = await runner({ ...command, args: ["--no-auto-update", "app", "--help"] }); }
            catch { throw new RepositoryError("app_launcher_unavailable"); }
            if (!/Usage:\s+copilot app\b/i.test(help)) throw new RepositoryError("app_launcher_unavailable");
            await beforeOpen?.();
            await runner({ ...command, args: ["--no-auto-update", "app"], timeoutMs: 10_000 });
            return { status: "requested" as const };
        },
    };
}

export type CopilotAppLauncher = ReturnType<typeof createCopilotAppLauncher>;