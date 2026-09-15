import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { createRepositoryApi } from "../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/src/ui/api.ts";
import { createRemoteReader } from "../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/src/ui/remote-reader.ts";
import { mountRepositoryBrowser } from "../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/src/ui/repository-browser.ts";

const require = createRequire(new URL("../../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/package.json", import.meta.url));
const { JSDOM } = require("jsdom");

function documentFixture() {
    return { artifact: { id: "item-one", relativePath: "specs/spec.md", label: "spec.md", role: "reference", availability: "available" },
        content: "# Synthetic", revision: `sha256:${"a".repeat(64)}`, byteSize: 11, sourceKind: "git-commit", format: "markdown",
        source: { provider: "azure-devops", repositoryId: "11111111-1111-4111-8111-111111111111", repositoryName: "Synthetic", branch: "refs/heads/main", commit: "b".repeat(40), objectId: "c".repeat(40) },
        contextId: "context-one", generation: 1 };
}

test("browser requests carry only the canvas capability and sanitize server errors", async () => {
    const dom = new JSDOM("<!doctype html>", { url: "http://127.0.0.1:32001/?cap=synthetic-capability" });
    try {
        let fail = false;
        const api = createRepositoryApi({ document: dom.window.document, request: async (input, options) => {
            const url = new URL(input);
            assert.equal(url.origin, "http://127.0.0.1:32001");
            assert.equal(url.searchParams.get("cap"), "synthetic-capability");
            assert.equal(new Headers(options.headers).get("authorization"), null);
            return { ok: !fail, json: async () => fail ? { ok: false, error: { code: "untrusted-code", message: "private-server-value" } } : { ok: true, data: { ready: true } } };
        } });
        assert.equal((await api.call("connection")).ready, true);
        fail = true;
        await assert.rejects(api.call("connection"), (error) => {
            assert.equal(error.code, "upstream_unavailable"); assert(!error.message.includes("private-server-value")); return true;
        });
        api.abort();
    } finally { dom.window.close(); }
});

test("late remote content cannot mount after disconnect or return", async () => {
    const dom = new JSDOM('<div id="scroll"><div id="reader"></div></div>');
    const pending = Promise.withResolvers();
    let mounts = 0;
    const container = dom.window.document.getElementById("reader");
    const reader = createRemoteReader({ container, scrollElement: container.parentElement, api: { call: () => pending.promise },
        loadReader: async () => () => { mounts++; return { update() {}, unmount() {} }; }, onReturn() {} });
    try {
        const request = reader.open("context-one", "item-one");
        reader.clear();
        pending.resolve(documentFixture());
        await request;
        assert.equal(mounts, 0);
        assert.equal(container.dataset.remoteDocumentState, "idle");
        assert(!container.textContent.includes("# Synthetic"));
    } finally { reader.dispose(); dom.window.close(); }
});

test("remote Markdown keeps repository return semantics and text files are literal", async () => {
    const dom = new JSDOM('<div id="scroll"><div id="reader"></div></div>');
    const container = dom.window.document.getElementById("reader");
    let next = documentFixture();
    let options;
    let returns = 0;
    const reader = createRemoteReader({ container, scrollElement: container.parentElement, api: { call: async () => next },
        loadReader: async () => (_container, supplied) => { options = supplied; return { update() {}, unmount() {} }; }, onReturn: () => returns++ });
    try {
        await reader.open("context-one", "item-one");
        assert.equal(options.returnLabel, "Back to repository");
        assert.equal(options.onClarification, undefined);
        options.onReturnToWorkflow();
        assert.equal(returns, 1);
        next = { ...next, format: "text", content: "<script>untrusted text</script>" };
        await reader.open("context-one", "item-one");
        assert.equal(container.querySelectorAll("script").length, 0);
        assert(container.querySelector("pre").textContent.includes("<script>"));
    } finally { reader.dispose(); dom.window.close(); }
});

test("repository dropdown expands artifacts in place and preserves the existing local draft", async () => {
    const dom = new JSDOM('<div id="repositories" hidden></div><header id="localHeader"><h1>Local SDD</h1></header><div id="localLayout"><textarea id="draft">Keep this draft</textarea></div>', { url: "http://127.0.0.1:32001/?cap=synthetic-capability", pretendToBeVisual: true });
    const prior = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
    const repository = { id: "11111111-1111-4111-8111-111111111111", name: "Synthetic repository", defaultBranch: "refs/heads/main", operationalState: "active" };
    const detail = { ...repository, sourceVersion: "b".repeat(40), speckitStatus: "enabled" };
    const context = { contextId: "context-one", repository: detail, sourceVersion: detail.sourceVersion, generation: 1, roots: ["/specs"] };
    const state = { configuration: "configured", connection: { state: "connected", generation: 1, accountLabel: "synthetic@example.invalid" }, localContext: { contextId: "local-test", label: "Local fixture" }, mode: "local", capabilities: { browse: true, clone: false } };
    let readerOptions;
    let instance;
    const tick = () => new Promise((resolve) => setImmediate(resolve));
    try {
        instance = await mountRepositoryBrowser({ container: dom.window.document.getElementById("repositories"), localHeader: dom.window.document.getElementById("localHeader"), localLayout: dom.window.document.getElementById("localLayout"),
            loadReader: async () => (_element, options) => { readerOptions = options; return { update() {}, unmount() {} }; },
            request: async (input) => {
                const path = new URL(input).pathname.split("/").at(-1);
                const data = path === "connection" || path === "local" ? state : path === "relevant" ? { items: [repository], hasMore: false, cursor: null, outcome: "ready" } : path === "detail" ? detail : path === "context" ? context : path === "items" ? { items: [{ id: "item-one", path: "/specs/spec.md", label: "spec.md", kind: "file", objectId: "c".repeat(40) }], hasMore: false, cursor: null } : documentFixture();
                return { ok: true, json: async () => ({ ok: true, data }) };
            } });
        await tick();
        const input = dom.window.document.querySelector('.repo-search'); input.focus();
        const popup = dom.window.document.querySelector('.repo-popup');
        assert.equal(popup.hidden, false);
        popup.querySelector('[data-kind="repository"]').click(); await tick();
        popup.querySelector('[data-kind="root"]').click(); await tick();
        assert.equal(popup.querySelector('[data-kind="file"]').textContent, "spec.md");
        popup.querySelector('[data-kind="file"]').click(); await tick();
        assert.equal(popup.hidden, true);
        assert.equal(readerOptions.document.sourceKind, "git-commit");
        readerOptions.onReturnToWorkflow();
        assert.equal(popup.hidden, false);
        assert.equal(dom.window.document.getElementById("draft").value, "Keep this draft");
    } finally {
        instance?.dispose();
        if (prior) Object.defineProperty(globalThis, "document", prior); else Reflect.deleteProperty(globalThis, "document");
        dom.window.close();
    }
});