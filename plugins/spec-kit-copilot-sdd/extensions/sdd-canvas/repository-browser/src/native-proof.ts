import { randomBytes, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createRepositoryConnection } from "./auth.ts";
import type { AuthDependencies } from "./auth.ts";
import { readRepositoryProof } from "./ado-client.ts";
import { RepositoryError, errorEnvelope } from "./errors.ts";
import { nativeAuthDependencies } from "./msal-client.ts";
import { parseRepositoryProfile } from "./profile.ts";

const HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>SDD Repository Connection Proof</title><style>
:root{color-scheme:light dark;font-family:"Segoe UI",sans-serif;letter-spacing:0}body{margin:0;padding:24px;max-width:960px}h1{font-size:20px;margin:0 0 20px}button{font:inherit;padding:8px 12px;border-radius:4px;cursor:pointer}nav{display:flex;flex-wrap:wrap;gap:8px}dt{font-weight:600;margin-top:12px}dd{margin:4px 0;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:55vh;overflow:auto;border:1px solid #888;padding:16px}#error{color:#c63d42}button:disabled{cursor:default;opacity:.6}
</style></head><body><h1>SDD Repository Connection Proof</h1><nav aria-label="Microsoft connection">
<button id="connect" type="button">Connect Microsoft account</button><button id="read" type="button" disabled>Check approved artifact</button><button id="disconnect" type="button">Disconnect</button></nav>
<dl><dt>Connection</dt><dd id="connection" role="status">disconnected</dd><dt>Account</dt><dd id="account">Not connected</dd><dt>Host</dt><dd id="host"></dd><dt>Read check</dt><dd id="outcome" role="status">not_run</dd></dl>
<p id="error" role="alert"></p><pre id="document" aria-label="Read-only artifact" hidden></pre><script type="module" src="./proof.js"></script></body></html>`;

const SCRIPT = `const parameters=new URLSearchParams(location.search);const capability=parameters.get("cap");
const element=(id)=>document.getElementById(id);
const endpoint=(path)=>{const url=new URL(path,location.href);url.searchParams.set("cap",capability);return url;};
let generation=-1;
function render(state){if(generation!==state.connection.generation){element("document").textContent="";element("document").hidden=true;}generation=state.connection.generation;element("connection").textContent=state.connection.state;element("account").textContent=state.connection.accountLabel??"Not connected";element("host").textContent=state.runtime.node+" / "+state.runtime.platform+" / workspace acknowledged: "+state.runtime.workspaceAcknowledged;element("read").disabled=state.connection.state!=="connected";element("connect").disabled=state.connection.state==="connecting";element("outcome").textContent=state.readOutcome;element("error").textContent=state.connection.error?.message??state.readError??"";}
async function post(path){const response=await fetch(endpoint(path),{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});const payload=await response.json();if(!payload.ok)throw new Error(payload.error.message);return payload.data;}
element("connect").onclick=()=>post("/api/connect").catch((error)=>{element("error").textContent=error.message;});
element("disconnect").onclick=()=>post("/api/disconnect").catch((error)=>{element("error").textContent=error.message;});
element("read").onclick=async()=>{element("read").disabled=true;try{const proof=await post("/api/read");element("document").textContent=proof.content;element("document").hidden=false; }catch(error){element("error").textContent=error.message;}};
const events=new EventSource(endpoint("/events"));events.addEventListener("state",(event)=>render(JSON.parse(event.data)));window.addEventListener("pagehide",()=>events.close());`;

async function readEmptyJson(req: IncomingMessage) {
    if (!/^application\/json(?:;|$)/i.test(String(req.headers["content-type"] ?? ""))) throw new RepositoryError("invalid_request");
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 4_096) throw new RepositoryError("invalid_request");
        chunks.push(chunk);
    }
    try {
        const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length) throw new Error();
    } catch { throw new RepositoryError("invalid_request"); }
}

export async function createNativeProofServer({ profile: input, repositoryName, workspaceAcknowledged, dependencies, request }: {
    profile: unknown;
    repositoryName: string;
    workspaceAcknowledged: boolean;
    dependencies?: AuthDependencies;
    request?: typeof fetch;
}) {
    const profile = parseRepositoryProfile(input);
    const cap = randomBytes(32).toString("base64url");
    const clients = new Set<ServerResponse>();
    let host = "";
    let origin = "";
    let readOutcome = "not_run";
    let readError: string | undefined;
    let observedGeneration = 0;
    const runtime = { node: process.versions.node, platform: process.platform, workspaceAcknowledged };
    function state() { return { connection: connection.snapshot(), runtime, readOutcome, readError }; }
    function broadcast() {
        const snapshot = connection.snapshot();
        if (snapshot.generation !== observedGeneration) { readOutcome = "not_run"; readError = undefined; observedGeneration = snapshot.generation; }
        for (const client of clients) client.write(`event: state\ndata: ${JSON.stringify(state())}\n\n`);
    }
    const adapter = dependencies ?? nativeAuthDependencies();
    const connection = createRepositoryConnection(profile, { ...adapter, onChange: (snapshot) => { adapter.onChange?.(snapshot); broadcast(); } });
    function json(res: ServerResponse, status: number, payload: unknown) {
        res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(payload));
    }
    const server = createServer(async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Referrer-Policy", "no-referrer");
        res.setHeader("X-Content-Type-Options", "nosniff");
        try {
            const url = new URL(req.url ?? "/", origin);
            const supplied = Buffer.from(url.searchParams.get("cap") ?? "");
            const expected = Buffer.from(cap);
            if (req.headers.host !== host || (req.headers.origin && req.headers.origin !== origin) ||
                url.origin !== origin || url.searchParams.getAll("cap").length !== 1 || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
                json(res, 403, errorEnvelope(new RepositoryError("invalid_request")));
                return;
            }
            if (req.method === "GET" && url.pathname === "/") {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(HTML.replace("./proof.js", `/proof.js?cap=${encodeURIComponent(cap)}`));
            } else if (req.method === "GET" && url.pathname === "/proof.js") {
                res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" }); res.end(SCRIPT);
            } else if (req.method === "GET" && url.pathname === "/api/state") {
                json(res, 200, { ok: true, data: state() });
            } else if (req.method === "GET" && url.pathname === "/events") {
                res.writeHead(200, { "Content-Type": "text/event-stream", Connection: "keep-alive" });
                clients.add(res); res.on("close", () => clients.delete(res)); broadcast();
            } else if (req.method === "POST") {
                if (req.headers.origin !== origin) throw new RepositoryError("invalid_request");
                await readEmptyJson(req);
                if (url.pathname === "/api/connect") {
                    const started = connection.connect();
                    json(res, 202, { ok: true, data: { transactionId: started.transactionId } });
                } else if (url.pathname === "/api/disconnect") {
                    connection.disconnect(); json(res, 200, { ok: true, data: state() });
                } else if (url.pathname === "/api/read") {
                    const epoch = connection.snapshot().generation;
                    readOutcome = "checking"; readError = undefined; broadcast();
                    try {
                        const proof = await readRepositoryProof({ profile, connection, repositoryName, request });
                        if (proof.generation !== connection.snapshot().generation) throw new RepositoryError("invalid_context");
                        readOutcome = "passed"; broadcast();
                        json(res, 200, { ok: true, data: proof });
                    } catch (error) {
                        if (epoch === connection.snapshot().generation) { readOutcome = "failed"; readError = errorEnvelope(error).error.message; broadcast(); }
                        throw error;
                    }
                } else json(res, 404, errorEnvelope(new RepositoryError("invalid_request")));
            } else json(res, 404, errorEnvelope(new RepositoryError("invalid_request")));
        } catch (error) { if (!res.headersSent) json(res, 400, errorEnvelope(error)); else res.end(); }
    });
    await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
    const address = server.address();
    if (!address || typeof address === "string") throw new RepositoryError("upstream_unavailable");
    host = `127.0.0.1:${address.port}`; origin = `http://${host}`;
    return { url: `${origin}/?cap=${encodeURIComponent(cap)}`, snapshot: state,
        async close() { connection.dispose(); for (const client of clients) client.end(); clients.clear();
            await new Promise<void>((resolve) => { server.close(() => resolve()); server.closeAllConnections(); }); },
    };
}