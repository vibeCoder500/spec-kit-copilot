import { createServer } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { startFixture } from "./serve-fixture.mjs";

export async function startRepositoryPreview() {
    const fixture = await startFixture({ canvas: "sdd", repositories: true, repositoryEntry: true, cloneOnlyEntryHost: true });
    const target = new URL(fixture.url);
    target.searchParams.delete("readerProbe");
    let host = "";
    let closed = false;
    const server = createServer((request, response) => {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Referrer-Policy", "no-referrer");
        if (request.method !== "GET" || request.url !== "/" || request.headers.host !== host ||
            (request.headers.origin && request.headers.origin !== `http://${host}`)) {
            response.writeHead(404); response.end(); return;
        }
        response.writeHead(302, { Location: target.href });
        response.end();
    });
    try {
        await new Promise((ready, fail) => { server.once("error", fail); server.listen(0, "127.0.0.1", ready); });
        host = `127.0.0.1:${server.address().port}`;
        return { url: `http://${host}/`, async stop() {
            if (closed) return;
            closed = true;
            await new Promise((done) => { server.close(done); server.closeAllConnections(); });
            const cleanup = await fixture.stop();
            if (!cleanup.cleaned) throw new Error("Synthetic preview changed unexpectedly and was preserved.");
        } };
    } catch (error) { server.close(); await fixture.stop(); throw error; }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    startRepositoryPreview().then((preview) => {
        console.log(JSON.stringify({ status: "running", url: preview.url, data: "synthetic only", realAuthentication: false, realClone: false }));
        const stop = () => { preview.stop().catch(() => { process.exitCode = 1; }); };
        process.once("SIGINT", stop); process.once("SIGTERM", stop);
    }).catch(() => { console.error("Synthetic repository preview could not start."); process.exitCode = 1; });
}