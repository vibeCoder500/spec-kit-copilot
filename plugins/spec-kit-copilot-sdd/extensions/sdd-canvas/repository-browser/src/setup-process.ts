import { spawn } from "node:child_process";
import { lstat, open, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { delimiter, isAbsolute, join, relative, resolve, sep } from "node:path";
import { nativeExecutable } from "./app-launch.ts";

export type SetupTool = "gh" | "specify" | "uv" | "pipx" | "winget";
export interface SetupCommand {
    executable: string;
    args: string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
    signal: AbortSignal;
    timeoutMs: number;
    input?: string;
    sensitive?: boolean;
    secrets?: string[];
    onOutput?: (text: string) => void;
}
export interface SetupCommandResult { exitCode: number; stdout: string; stderr: string }
export type SetupCommandRunner = (command: SetupCommand) => Promise<SetupCommandResult>;

export class SetupCommandError extends Error {
    readonly reason: "cancelled" | "timeout" | "output_limit" | "spawn";
    constructor(reason: SetupCommandError["reason"], message: string) {
        super(message);
        this.name = "SetupCommandError";
        this.reason = reason;
    }
}

function inside(root: string, target: string) {
    const path = relative(root, target);
    return path === "" || path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

export function redactSetupOutput(text: string, secrets: readonly string[] = []) {
    let result = text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").replace(/[\x00-\x08\x0b-\x1f\x7f]/g, "");
    for (const secret of secrets) if (secret) result = result.replaceAll(secret, "[redacted]");
    return result.replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{10,}|github_pat_[A-Za-z0-9_]{10,})\b/g, "[redacted]")
        .replace(/\b((?:authorization|proxy-authorization)\s*[:=]\s*)(?:bearer|token|basic)\s+\S+/gi, "$1[redacted]")
        .replace(/\b((?:GH_ENTERPRISE_TOKEN|GH_TOKEN|GITHUB_TOKEN)\s*[:=]\s*)\S+/gi, "$1[redacted]")
        .replace(/https?:\/\/[^/\s@]+@/gi, "https://[redacted]@");
}

export async function setupEnvironment(workspacePath: string, environment: NodeJS.ProcessEnv = process.env,
    homeDirectory = homedir()): Promise<NodeJS.ProcessEnv> {
    const allowed = new Set(["systemroot", "windir", "comspec", "temp", "tmp", "userprofile", "home", "localappdata", "appdata",
        "programfiles", "programfiles(x86)", "https_proxy", "http_proxy", "no_proxy", "ssl_cert_file", "ssl_cert_dir",
        "requests_ca_bundle", "curl_ca_bundle", "node_extra_ca_certs"]);
    const env = Object.fromEntries(Object.entries(environment).filter(([name]) => allowed.has(name.toLowerCase())));
    const directories = [];
    for (const directory of (environment.PATH ?? environment.Path ?? "").split(delimiter)) {
        if (!directory || !isAbsolute(directory)) continue;
        try {
            const canonical = await realpath(directory);
            if (!inside(resolve(workspacePath), canonical)) directories.push(canonical);
        } catch (error) {
            if (!["ENOENT", "EACCES", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
        }
    }
    const userBin = join(homeDirectory, ".local", "bin");
    try {
        const canonical = await realpath(userBin);
        if (!inside(resolve(workspacePath), canonical)) directories.unshift(canonical);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        if (!inside(resolve(workspacePath), userBin)) directories.unshift(userBin);
    }
    return { ...env, PATH: [...new Set(directories)].join(delimiter), HOME: homeDirectory, USERPROFILE: homeDirectory,
        NO_COLOR: "1", TERM: "dumb", CLICOLOR: "0", PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8", PYTHONNOUSERSITE: "1",
        UV_NO_CONFIG: "1", UV_DEFAULT_INDEX: "https://packagefeedproxy.microsoft.io/pypi/simple/" };
}

async function pythonConsoleExecutable(candidate: string, workspacePath: string) {
    try {
        const path = await realpath(candidate);
        const info = await lstat(path);
        if (!info.isFile() || inside(resolve(workspacePath), path)) return;
        const handle = await open(path, "r");
        let header;
        try {
            const bytes = Buffer.alloc(1024);
            const read = await handle.read(bytes, 0, bytes.length, 0);
            header = bytes.subarray(0, read.bytesRead).toString("utf8").split(/\r?\n/)[0];
        } finally { await handle.close(); }
        const direct = /^#!(\/[^\s]+\/python(?:\d+(?:\.\d+)*)?)\s*$/.exec(header ?? "");
        if (direct && await nativeExecutable(direct[1]!, workspacePath)) return path;
        if (/^#!\/usr\/bin\/env python(?:\d+(?:\.\d+)*)?\s*$/.test(header ?? "") &&
            await nativeExecutable("/usr/bin/env", workspacePath)) return path;
    } catch (error) {
        if (!["ENOENT", "EACCES", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
    }
    return;
}

export async function findSetupExecutable(tool: SetupTool, workspacePath: string, {
    environment = process.env, homeDirectory = homedir(), platform = process.platform,
}: { environment?: NodeJS.ProcessEnv; homeDirectory?: string; platform?: NodeJS.Platform } = {}): Promise<string | undefined> {
    const directories = [join(homeDirectory, ".local", "bin"), ...(environment.PATH ?? environment.Path ?? "").split(delimiter)];
    if (platform === "win32") {
        if (environment.ProgramFiles) directories.push(join(environment.ProgramFiles, "GitHub CLI"));
        if (environment.LOCALAPPDATA) directories.push(join(environment.LOCALAPPDATA, "Microsoft", "WinGet", "Links"),
            join(environment.LOCALAPPDATA, "Microsoft", "WindowsApps"));
    }
    for (const directory of [...new Set(directories)]) {
        if (!isAbsolute(directory) || inside(resolve(workspacePath), resolve(directory))) continue;
        const executable = await nativeExecutable(join(directory, platform === "win32" ? `${tool}.exe` : tool), workspacePath);
        if (executable) return executable;
        if (platform !== "win32" && ["specify", "pipx"].includes(tool)) {
            const console = await pythonConsoleExecutable(join(directory, tool), workspacePath);
            if (console) return console;
        }
        if (platform === "win32" && tool === "winget" && environment.LOCALAPPDATA &&
            resolve(directory) === resolve(environment.LOCALAPPDATA, "Microsoft", "WindowsApps")) {
            const alias = join(directory, "winget.exe");
            try {
                const parent = await realpath(directory);
                const info = await lstat(alias);
                if (!inside(resolve(workspacePath), parent) && info.size === 0 && (info.isFile() || info.isSymbolicLink())) return alias;
            } catch (error) {
                if (!["ENOENT", "EACCES", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
            }
        }
    }
    return;
}

async function stopOwnedCommand(child: ReturnType<typeof spawn>) {
    if (!child.pid || child.exitCode !== null) return;
    if (process.platform !== "win32") { child.kill("SIGTERM"); return; }
    const executable = join(process.env.SystemRoot ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
    const pid = child.pid;
    const script = `$ids = [System.Collections.Generic.List[int]]::new(); $ids.Add(${pid}); ` +
        `for ($i=0; $i -lt $ids.Count -and $ids.Count -lt 128; $i++) { ` +
        `Get-CimInstance Win32_Process -Filter ("ParentProcessId=" + $ids[$i]) | ForEach-Object { $ids.Add([int]$_.ProcessId) } }; ` +
        `for ($i=$ids.Count-1; $i -ge 0; $i--) { Stop-Process -Id $ids[$i] -Force -ErrorAction SilentlyContinue }`;
    await new Promise<void>((done) => {
        const stopper = spawn(executable, ["-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true, stdio: "ignore" });
        const timer = setTimeout(() => { stopper.kill(); child.kill(); }, 10_000);
        stopper.once("error", () => { clearTimeout(timer); child.kill(); done(); });
        stopper.once("close", () => { clearTimeout(timer); done(); });
    });
}

export const runSetupCommand: SetupCommandRunner = (command) => new Promise((resolveResult, reject) => {
    if (command.signal.aborted) { reject(new SetupCommandError("cancelled", "Setup was cancelled.")); return; }
    const child = spawn(command.executable, command.args, { cwd: command.cwd, env: command.env, shell: false,
        windowsHide: true, stdio: [command.input === undefined ? "ignore" : "pipe", "pipe", "pipe"] });
    let stopped: SetupCommandError["reason"] | undefined;
    let stop: Promise<void> | undefined;
    let bytes = 0;
    let stdout = "";
    let stderr = "";
    const terminate = (reason: SetupCommandError["reason"]) => {
        if (stopped) return;
        stopped = reason;
        stop = stopOwnedCommand(child);
    };
    const timer = setTimeout(() => terminate("timeout"), command.timeoutMs);
    const abort = () => terminate("cancelled");
    command.signal.addEventListener("abort", abort, { once: true });
    const output = (chunk: Buffer, stream: "stdout" | "stderr") => {
        bytes += chunk.length;
        if (bytes > 1_048_576) { terminate("output_limit"); return; }
        const value = chunk.toString("utf8");
        if (stream === "stdout") stdout += value;
        else stderr = (stderr + value).slice(-16_384);
        if (!command.sensitive) command.onOutput?.(redactSetupOutput(value, command.secrets));
    };
    child.stdout!.on("data", (chunk: Buffer) => output(chunk, "stdout"));
    child.stderr!.on("data", (chunk: Buffer) => output(chunk, "stderr"));
    if (command.input !== undefined) {
        child.stdin!.on("error", (error: NodeJS.ErrnoException) => {
            if (error.code !== "EPIPE" && error.code !== "ERR_STREAM_DESTROYED") terminate("spawn");
        });
        child.stdin!.end(command.input);
    }
    const cleanup = () => { clearTimeout(timer); command.signal.removeEventListener("abort", abort); };
    child.once("error", () => { cleanup(); reject(new SetupCommandError("spawn", "The setup command could not be started.")); });
    child.once("close", (code) => {
        cleanup();
        void (stop ?? Promise.resolve()).then(() => {
            if (stopped) { reject(new SetupCommandError(stopped, stopped === "cancelled" ? "Setup was cancelled." : `The setup command stopped (${stopped}).`)); return; }
            resolveResult({ exitCode: code ?? 1, stdout, stderr: command.sensitive ? "" : redactSetupOutput(stderr, command.secrets) });
        });
    });
});
