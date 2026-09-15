import { mkdir, mkdtemp, readdir, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function createRepositoryFixture() {
    const cloneHome = await realpath(await mkdtemp(join(tmpdir(), "sdd-repository-clone-fixture-")));
    const tenantId = "11111111-1111-4111-8111-111111111111";
    const repositoryId = "33333333-3333-4333-8333-333333333333";
    const otherId = "66666666-6666-4666-8666-666666666666";
    const commit = "a".repeat(40);
    const specBlob = "b".repeat(40);
    const researchBlob = "c".repeat(40);
    const manifestBlob = "d".repeat(40);
    let denied = false;
    let requests = 0;
    let browserOpens = 0;
    const gitCalls = [];
    const repository = { id: repositoryId, name: "Synthetic repository 1", defaultBranch: "refs/heads/main", project: { name: "SyntheticProject" }, isDisabled: false };
    const profile = { schemaVersion: 1, enabled: true, tenantId, clientId: "22222222-2222-4222-8222-222222222222", organization: "SyntheticOrg", project: "SyntheticProject" };
    const result = (nonce) => ({ accessToken: "synthetic-token", tenantId, scopes: ["vso.code", "vso.project", "vso.work"], expiresOn: new Date(Date.now() + 600_000), idTokenClaims: { nonce },
        account: { tenantId, localAccountId: "77777777-7777-4777-8777-777777777777", homeAccountId: "synthetic-account", username: "synthetic@example.invalid" } });
    const options = {
        bindingOptions: { homeDirectory: cloneHome },
        cloneOptions: { homeDirectory: cloneHome, executable: join(cloneHome, "synthetic-git.exe"), runner: async ({ args, cwd }) => {
            gitCalls.push(args);
            if (args.includes("clone")) { await mkdir(join(args.at(-1), ".git"), { recursive: true }); return ""; }
            if (args.includes("get-url")) return `https://dev.azure.com/SyntheticOrg/SyntheticProject/_git/${repositoryId}`;
            if (args.includes("symbolic-ref")) return `speckit/canvas-${cwd.split(/[\\/]/).at(-2)}`;
            if (args.includes("HEAD")) return commit;
            if (args.includes("--git-common-dir")) return join(cwd, ".git");
            return "";
        } },
        profileStatus: { state: "configured", profile },
        dependencies: {
            createClient: () => ({ getAuthCodeUrl: async () => `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`,
                acquireTokenByCode: async (request) => result(request.nonce), acquireTokenSilent: async () => result(), clear: async () => undefined }),
            generatePkce: async () => ({ challenge: "synthetic-challenge", verifier: "synthetic-verifier" }), openBrowser: async () => { browserOpens++; },
            callback: async () => ({ redirectUri: "http://localhost:32001/speckit-canvas/oauth/callback", result: Promise.resolve("synthetic-code"), close() {} }),
        },
        request: async (target, parameters) => {
            const url = new URL(target); requests++;
            if (new Headers(parameters?.headers).get("Authorization") !== "Bearer synthetic-token") throw new Error("Synthetic delegated access required.");
            const path = url.pathname;
            let data;
            if (path.endsWith("/teams")) data = { value: [{ id: "44444444-4444-4444-8444-444444444444", projectId: "55555555-5555-4555-8555-555555555555" }] };
            else if (path.endsWith("/teamfieldvalues")) data = { field: { referenceName: "System.AreaPath" }, values: [{ value: "SyntheticProject\\Owned", includeChildren: true }] };
            else if (path.endsWith("/codesearchresults")) data = { infoCode: 0, count: 1, results: [{ path: "/es-metadata.yml", repository: { id: repositoryId }, project: { name: "SyntheticProject" } }] };
            else if (path.endsWith("/repositories")) data = { value: [repository, { ...repository, id: otherId, name: "Synthetic repository 2" }] };
            else if (denied) return new Response("Not found", { status: 404 });
            else if (path.endsWith("/refs")) data = { value: [{ name: "refs/heads/main", objectId: commit }] };
            else if (path.endsWith(`/blobs/${manifestBlob}`)) return new Response("schemaVersion: 0.0.1\nrouting:\n  defaultAreaPath:\n    org: SyntheticOrg\n    path: 'SyntheticProject\\Owned'\n");
            else if (path.endsWith(`/blobs/${specBlob}`)) return new Response(path.includes(`/repositories/${otherId}/`)
                ? "# Second repository specification\n\n## Independent requirements\n\nThis artifact belongs to the second remote repository.\n"
                : "# Remote specification\n\n## Decisions\n\n[Research](research.md#findings)\n\n![No remote request](https://unexpected.invalid/image.png)\n\n- [ ] A synthetic task\n\n[NEEDS CLARIFICATION: Not actionable remotely]\n");
            else if (path.endsWith(`/blobs/${researchBlob}`)) return new Response("# Remote research\n\n## Findings\n\nA fixed-commit reference.\n");
            else if (path.endsWith("/items")) {
                const itemPath = url.searchParams.get("path");
                if (itemPath === "/.specify") data = { path: itemPath, isFolder: true, objectId: commit };
                else if (itemPath === "/es-metadata.yml") data = { path: itemPath, isFolder: false, objectId: manifestBlob, contentMetadata: { isBinary: false } };
                else if (itemPath) data = { path: itemPath, isFolder: false, objectId: itemPath.endsWith("research.md") ? researchBlob : specBlob, contentMetadata: { isBinary: false, encoding: 65001 } };
                else {
                    const root = url.searchParams.get("scopePath");
                    data = { value: [{ path: root, isFolder: true, objectId: commit },
                        { path: `${root}/001-feature`, isFolder: true, objectId: commit },
                        { path: `${root}/001-feature/spec.md`, isFolder: false, objectId: specBlob },
                        { path: `${root}/001-feature/research.md`, isFolder: false, objectId: researchBlob }] };
                }
            } else if (path.endsWith(`/${otherId}`)) data = { ...repository, id: otherId, name: "Synthetic repository 2" };
            else if (path.endsWith(`/${repositoryId}`)) data = repository;
            else throw new Error("Unexpected synthetic ADO route.");
            return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
        },
    };
    return { options, revoke() { denied = true; }, requests: () => requests, browserOpens: () => browserOpens,
        gitCalls: () => gitCalls.length, cloneFiles: () => readdir(cloneHome),
        async cleanup() { await rm(cloneHome, { recursive: true, force: true }); } };
}