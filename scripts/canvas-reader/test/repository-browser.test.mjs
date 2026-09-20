import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { createRepositoryApi } from "../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/src/ui/api.ts";
import { mountRepositoryEntry } from "../../../plugins/spec-kit-copilot-sdd/extensions/sdd-canvas/repository-browser/src/ui/repository-entry.ts";

const require = createRequire(new URL("../../../plugins/spec-kit-copilot-wizard/extensions/speckit-wizard-canvas/ui/markdown-reader/package.json", import.meta.url));
const { JSDOM } = require("jsdom");

function entryState() {
    return { configuration: "unconfigured", phase: "chooser", connection: { state: "disconnected", generation: 0, projectLabel: "" },
        localContext: { contextId: "local-synthetic", label: "Synthetic workspace", state: "repository" },
        host: { activity: "busy", canOpenCurrent: true, canPrepareRemote: false, canHandoff: false, reason: "session_busy" } };
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

test("Entry local continuation is explicit and never reparents the original workflow", async () => {
    const dom = new JSDOM('<main id="entry"></main><div id="original"><textarea id="draft">Keep this draft</textarea></div>', { url: "http://127.0.0.1:32001/?cap=synthetic-capability", pretendToBeVisual: true });
    const prior = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
    const calls = [];
    let instance;
    const tick = () => new Promise((resolve) => setImmediate(resolve));
    try {
        instance = await mountRepositoryEntry({ container: dom.window.document.getElementById("entry"), request: async (input, options) => {
                const path = new URL(input).pathname;
                calls.push({ path, method: options.method });
                assert.ok(["/api/entry/state", "/api/entry/local"].includes(path));
                const data = path.endsWith("/state") ? entryState() : { opened: true };
                return { ok: true, json: async () => ({ ok: true, data }) };
            } });
        assert.deepEqual(calls.map(call => call.path), ["/api/entry/state"]);
        const local = dom.window.document.querySelector('[data-action="local"]');
        assert.equal(local.disabled, false);
        local.click(); local.click();
        await tick();
        assert.equal(calls.filter(call => call.path === "/api/entry/local").length, 1);
        assert.equal(dom.window.document.getElementById("draft").parentElement.id, "original");
        assert.equal(dom.window.document.getElementById("draft").value, "Keep this draft");
        assert.equal(dom.window.document.querySelectorAll(".repo-rail,.repo-preview,.md-reader").length, 0);
        assert.match(dom.window.document.getElementById("entry").textContent, /canvas opened/i);
    } finally {
        instance?.dispose();
        if (prior) Object.defineProperty(globalThis, "document", prior); else Reflect.deleteProperty(globalThis, "document");
        dom.window.close();
    }
});

test("Entry failure offers direct opening without exposing raw server output", async () => {
    const dom = new JSDOM('<main id="entry"></main>', { url: "http://127.0.0.1:32001/?cap=synthetic-capability" });
    const prior = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
    let instance;
    try {
        instance = await mountRepositoryEntry({ container: dom.window.document.getElementById("entry"), request: async () => { throw new Error("private-server-value"); } });
        assert.doesNotMatch(dom.window.document.body.textContent, /private-server-value/);
        assert.ok(dom.window.document.querySelector('[data-action="direct"]'));
        assert.equal(dom.window.document.querySelector('[data-action="local"]').disabled, true);
    } finally {
        instance?.dispose();
        if (prior) Object.defineProperty(globalThis, "document", prior); else Reflect.deleteProperty(globalThis, "document");
        dom.window.close();
    }
});

test("Entry automatically connects once and keeps local actions independent", async () => {
    const dom = new JSDOM('<main id="entry"></main>', { url: "http://127.0.0.1:32001/?cap=synthetic-capability", pretendToBeVisual: true });
    const prior = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
    const state = { ...entryState(), configuration: "configured" };
    const calls = [];
    let releaseConnection;
    const pending = new Promise(resolve => { releaseConnection = resolve; });
    const tick = () => new Promise(resolve => setImmediate(resolve));
    let instance;
    try {
        instance = await mountRepositoryEntry({ container: dom.window.document.getElementById("entry"), request: async (input, options) => {
            const path = new URL(input).pathname;
            calls.push({ path, method: options.method });
            let data;
            if (path.endsWith("/state")) data = structuredClone(state);
            else if (path.endsWith("/connect")) {
                assert.equal(options.method, "POST");
                assert.deepEqual(JSON.parse(options.body), {});
                state.connection = { ...state.connection, state: "connecting", generation: state.connection.generation + 1 };
                await pending;
                state.connection = { ...state.connection, state: "connected", accountLabel: "synthetic@example.invalid" };
                data = { transactionId: "synthetic-transaction" };
            } else if (path.endsWith("/disconnect")) {
                state.connection = { state: "disconnected", generation: state.connection.generation + 1, projectLabel: "" };
                data = {};
            } else if (path.endsWith("/local")) data = { opened: true };
            else if (path.endsWith("/preparations")) data = { items: [] };
            else assert.fail(`Unexpected entry request ${path}`);
            return { ok: true, json: async () => ({ ok: true, data }) };
        } });
        const document = dom.window.document;
        assert.deepEqual(calls.map(call => call.path), ["/api/entry/state", "/api/repositories/connect"]);
        const local = document.querySelector('[data-action="local"]');
        assert.equal(local.disabled, false);
        assert.equal(document.querySelector('[data-action="direct"]').disabled, false);
        local.click(); await tick();
        assert.equal(calls.filter(call => call.path.endsWith("/local")).length, 1);
        releaseConnection(); await tick();
        assert.equal(document.querySelector('[role="combobox"]').disabled, false);
        document.querySelector('[aria-label="Disconnect Microsoft account"]').click(); await tick();
        assert.equal(document.querySelector('[role="combobox"]').disabled, true);
        await instance.refresh(); instance.receive(structuredClone(state)); await tick();
        assert.equal(calls.filter(call => call.path.endsWith("/connect")).length, 1);
        document.querySelector('[aria-label="Connect Microsoft account"]').click(); await tick();
        assert.equal(calls.filter(call => call.path.endsWith("/connect")).length, 2);
        assert.equal(calls.filter(call => call.path.endsWith("/clone")).length, 0);
    } finally {
        releaseConnection(); instance?.dispose();
        if (prior) Object.defineProperty(globalThis, "document", prior); else Reflect.deleteProperty(globalThis, "document");
        dom.window.close();
    }
});

for (const [configuration, connection, generation = 1] of [["unconfigured", "disconnected"], ["disabled", "disconnected"], ["invalid", "disconnected"],
    ["configured", "connected"], ["configured", "connecting"], ["configured", "failed"], ["configured", "disconnected", 2]]) {
    test(`Entry does not auto-connect from ${configuration}/${connection}`, async () => {
        const dom = new JSDOM('<main id="entry"></main>', { url: "http://127.0.0.1:32001/?cap=synthetic-capability" });
        const prior = Object.getOwnPropertyDescriptor(globalThis, "document");
        Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
        const state = { ...entryState(), configuration, connection: { state: connection, generation, projectLabel: "Synthetic" } };
        const calls = [];
        let instance;
        try {
            instance = await mountRepositoryEntry({ container: dom.window.document.getElementById("entry"), request: async (input, options) => {
                const path = new URL(input).pathname; calls.push({ path, method: options.method });
                assert.ok(["/api/entry/state", "/api/entry/preparations"].includes(path));
                const data = path.endsWith("/state") ? structuredClone(state) : { items: [] };
                return { ok: true, json: async () => ({ ok: true, data }) };
            } });
            await instance.refresh();
            instance.receive({ ...state, configuration: "configured", connection: { ...state.connection, state: "disconnected", generation: 2 } });
            await new Promise(resolve => setImmediate(resolve));
            assert.equal(calls.filter(call => call.method === "POST").length, 0);
            assert.equal(dom.window.document.querySelector('[data-action="local"]').disabled, false);
            assert.equal(dom.window.document.querySelector('[data-action="direct"]').disabled, false);
        } finally {
            instance?.dispose();
            if (prior) Object.defineProperty(globalThis, "document", prior); else Reflect.deleteProperty(globalThis, "document");
            dom.window.close();
        }
    });
}

test("Failed automatic sign-in requires an explicit retry and preserves local entry", async () => {
    const dom = new JSDOM('<main id="entry"></main>', { url: "http://127.0.0.1:32001/?cap=synthetic-capability" });
    const prior = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
    const state = { ...entryState(), configuration: "configured" };
    let connections = 0;
    let instance;
    const tick = () => new Promise(resolve => setImmediate(resolve));
    try {
        instance = await mountRepositoryEntry({ container: dom.window.document.getElementById("entry"), request: async input => {
            const path = new URL(input).pathname;
            let data;
            if (path.endsWith("/state")) data = structuredClone(state);
            else if (path.endsWith("/preparations")) data = { items: [] };
            else if (path.endsWith("/connect")) {
                connections++;
                if (connections === 1) {
                    state.connection = { ...state.connection, state: "failed", generation: 1 };
                    return { ok: false, json: async () => ({ ok: false, error: { code: "interaction_required", message: "private-provider-diagnostic" } }) };
                }
                state.connection = { ...state.connection, state: "connected", generation: 2, accountLabel: "synthetic@example.invalid" };
                data = { transactionId: "synthetic-retry" };
            } else assert.fail(`Unexpected entry request ${path}`);
            return { ok: true, json: async () => ({ ok: true, data }) };
        } });
        await tick(); await instance.refresh(); instance.receive(structuredClone(state)); await tick();
        assert.equal(connections, 1);
        const document = dom.window.document;
        assert.equal(document.querySelector('[data-action="local"]').disabled, false);
        assert.equal(document.querySelector('[data-action="direct"]').disabled, false);
        assert.doesNotMatch(document.body.textContent, /private-provider-diagnostic/);
        const retry = document.querySelector('[aria-label="Connect Microsoft account"]');
        assert.equal(retry.hidden, false); assert.equal(retry.disabled, false);
        retry.click(); await tick();
        assert.equal(connections, 2);
        assert.equal(document.querySelector('[role="combobox"]').disabled, false);
    } finally {
        instance?.dispose();
        if (prior) Object.defineProperty(globalThis, "document", prior); else Reflect.deleteProperty(globalThis, "document");
        dom.window.close();
    }
});

test("Entry dropdown restores suggestions, selects by keyboard, and requires explicit clone consent", async () => {
    const dom = new JSDOM('<main id="entry"></main><textarea id="original">Preserved</textarea>', { url: "http://127.0.0.1:32001/?cap=synthetic-capability", pretendToBeVisual: true });
    const prior = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
    const tick = () => new Promise(resolve => setImmediate(resolve));
    const calls = [];
    const state = { ...entryState(), configuration: "configured", connection: { state: "connected", generation: 1, accountLabel: "synthetic@example.invalid", projectLabel: "Synthetic" },
        host: { activity: "idle", canOpenCurrent: true, canPrepareRemote: true, reason: null } };
    const repository = { id: "33333333-3333-4333-8333-333333333333", name: "Team repository", defaultBranch: "refs/heads/main", operationalState: "active", specKitStatus: "present", sourceVersion: "a".repeat(40) };
    const timers = [];
    dom.window.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
    dom.window.clearTimeout = () => undefined;
    let instance;
    try {
        instance = await mountRepositoryEntry({ container: dom.window.document.getElementById("entry"), request: async (input, options) => {
            const url = new URL(input); calls.push(url.pathname);
            let data;
            if (url.pathname.endsWith("/state")) data = state;
            else if (url.pathname.endsWith("/preparations")) data = { items: [] };
            else if (url.pathname.endsWith("/relevant")) data = { items: [repository], hasMore: false, outcome: "ready" };
            else if (url.pathname.endsWith("/search")) data = { items: [{ ...repository, name: "Project match" }], hasMore: false };
            else if (url.pathname.endsWith("/selection")) data = { selectionId: "selected", repository, accountLabel: "synthetic@example.invalid", matchesCurrentWorkspace: false,
                confirmation: "consent", operationId: "a".repeat(32), destination: "C:/Synthetic/SpecKitCanvas/repositories/owned/checkout", expiresAt: Date.now() + 120000, reason: null };
            else if (url.pathname.endsWith("/clone")) { assert.equal(JSON.parse(options.body).confirmation, "consent"); data = { operationId: "a".repeat(32), state: "preparing" }; }
            else if (url.pathname.includes("/operations/")) data = { operationId: "a".repeat(32), state: "preparing" };
            else assert.fail(`Unexpected entry request ${url.pathname}`);
            return { ok: true, json: async () => ({ ok: true, data }) };
        } });
        const search = dom.window.document.querySelector('[role="combobox"]');
        assert.equal(search.disabled, false);
        search.focus(); await tick();
        assert.match(dom.window.document.querySelector('[role="listbox"]').textContent, /Team repository/);
        search.value = "project"; search.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        const debounce = timers.findLast(timer => timer.delay === 1000);
        assert.ok(debounce); debounce.callback(); await tick();
        assert.match(dom.window.document.querySelector('[role="listbox"]').textContent, /Project match/);
        dom.window.document.querySelector('[data-action="clear-search"]').click(); await tick();
        assert.match(dom.window.document.querySelector('[role="listbox"]').textContent, /Team repository/);
        search.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        search.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        await tick();
        assert.match(dom.window.document.body.textContent, /synthetic@example.invalid/);
        assert.match(dom.window.document.body.textContent, new RegExp("a".repeat(40)));
        assert.equal(calls.filter(path => path.endsWith("/clone")).length, 0);
        dom.window.document.querySelector('[data-action="cancel-selection"]').click();
        await tick();
        assert.equal(calls.filter(path => path.endsWith("/clone")).length, 0);
        assert.equal(dom.window.document.activeElement, search);
        search.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        search.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })); await tick();
        const confirm = dom.window.document.querySelector('[data-action="confirm-clone"]');
        confirm.click(); confirm.click(); await tick();
        assert.equal(calls.filter(path => path.endsWith("/clone")).length, 1);
        assert.equal(dom.window.document.querySelectorAll('.repo-rail,.repo-preview,.md-reader').length, 0);
        assert.equal(dom.window.document.getElementById("original").value, "Preserved");
    } finally {
        instance?.dispose();
        if (prior) Object.defineProperty(globalThis, "document", prior); else Reflect.deleteProperty(globalThis, "document");
        dom.window.close();
    }
});

test("Late dropdown responses and idle events cannot replace suggestions or submit commands", async () => {
    const dom = new JSDOM('<main id="entry"></main>', { url: "http://127.0.0.1:32001/?cap=synthetic-capability", pretendToBeVisual: true });
    const prior = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
    const tick = () => new Promise(resolve => setImmediate(resolve));
    const timers = [];
    dom.window.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
    dom.window.clearTimeout = () => undefined;
    let finishSearch;
    const late = new Promise(resolve => { finishSearch = resolve; });
    const state = { ...entryState(), configuration: "configured", connection: { state: "connected", generation: 1, accountLabel: "synthetic@example.invalid" },
        host: { activity: "idle", canOpenCurrent: true, canPrepareRemote: true, reason: null } };
    const repository = { id: "33333333-3333-4333-8333-333333333333", name: "Retained suggestion", defaultBranch: "refs/heads/main", sourceVersion: "a".repeat(40), operationalState: "active" };
    const requests = [];
    let instance;
    try {
        instance = await mountRepositoryEntry({ container: dom.window.document.getElementById("entry"), request: async input => {
            const path = new URL(input).pathname; requests.push(path);
            let data;
            if (path.endsWith("/state")) data = state;
            else if (path.endsWith("/preparations")) data = { items: [] };
            else if (path.endsWith("/relevant")) data = { items: [repository], hasMore: false };
            else if (path.endsWith("/search")) data = await late;
            else if (path.endsWith("/selection")) data = { selectionId: "selection", repository, accountLabel: "synthetic@example.invalid", confirmation: "nonce",
                destination: "C:/Synthetic/checkout", expiresAt: Date.now() + 120000, matchesCurrentWorkspace: false, reason: null };
            else assert.fail("An event must not submit a mutation");
            return { ok: true, json: async () => ({ ok: true, data }) };
        } });
        const search = dom.window.document.querySelector('[role="combobox"]');
        search.focus(); await tick();
        search.value = "late"; search.dispatchEvent(new dom.window.Event("input"));
        timers.findLast(timer => timer.delay === 1000).callback(); await tick();
        dom.window.document.querySelector('[data-action="clear-search"]').click();
        finishSearch({ items: [{ ...repository, name: "Obsolete result" }], hasMore: false }); await tick();
        assert.match(dom.window.document.querySelector('[role="listbox"]').textContent, /Retained suggestion/);
        assert.doesNotMatch(dom.window.document.querySelector('[role="listbox"]').textContent, /Obsolete result/);
        search.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape" }));
        assert.equal(search.getAttribute("aria-expanded"), "false");
        search.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown" }));
        search.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter" })); await tick();
        instance.receive({ ...state, host: { ...state.host, activity: "busy", canPrepareRemote: false, reason: "session_busy" } });
        instance.receive(state);
        assert.equal(dom.window.document.querySelector('[data-action="confirm-clone"]').disabled, true);
        assert.equal(dom.window.document.querySelector('[data-action="local"]').disabled, false);
        assert.ok(requests.every(path => !path.endsWith("/clone") && !path.endsWith("/local")));
    } finally {
        instance?.dispose();
        if (prior) Object.defineProperty(globalThis, "document", prior); else Reflect.deleteProperty(globalThis, "document");
        dom.window.close();
    }
});

for (const restored of [false, true]) {
    test(`Clone-only completion exposes a copyable checkout without handoff controls${restored ? " after reload" : ""}`, async () => {
        const dom = new JSDOM('<main id="entry"></main>', { url: "http://127.0.0.1:32001/?cap=synthetic-capability", pretendToBeVisual: true });
        const prior = Object.getOwnPropertyDescriptor(globalThis, "document");
        Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
        const copied = [];
        Object.defineProperty(dom.window.navigator, "clipboard", { value: { writeText: async path => { copied.push(path); } } });
        const operation = { operationId: "a".repeat(32), state: "prepared", repositoryName: "Cloned repository",
            destination: "C:/Synthetic/SpecKitCanvas/repositories/owned/checkout", sourceCommit: "a".repeat(40), localBranch: "speckit/canvas-owned" };
        const state = { ...entryState(), configuration: "configured", phase: restored ? "chooser" : "prepared",
            connection: { state: "connected", generation: 1, accountLabel: "synthetic@example.invalid" },
            host: { activity: "idle", canOpenCurrent: true, canPrepareRemote: true, canHandoff: false, canRetryHandoff: false, reason: null },
            operation: restored ? null : operation };
        const calls = [];
        let instance;
        try {
            instance = await mountRepositoryEntry({ container: dom.window.document.getElementById("entry"), request: async (input, options) => {
                const path = new URL(input).pathname;
                calls.push({ path, method: options.method });
                assert.ok(["/api/entry/state", "/api/entry/preparations"].includes(path));
                const data = path.endsWith("/state") ? state : { items: restored ? [{ ...operation, handoffState: null }] : [] };
                return { ok: true, json: async () => ({ ok: true, data }) };
            } });
            await new Promise(resolve => setImmediate(resolve));
            const document = dom.window.document;
            assert.match(document.body.textContent, restored ? /Cloned repositories/ : /Clone complete\./);
            if (!restored) assert.match(document.body.textContent, /Current workspace unchanged/);
            assert.equal(document.querySelector('[aria-label="Retry handoff"]'), null);
            assert.equal(document.querySelector('[data-action="local"]').disabled, false);
            const copy = document.querySelector('[data-action="copy-checkout-path"]');
            assert.equal(copy.disabled, false);
            copy.click();
            await new Promise(resolve => setImmediate(resolve));
            assert.deepEqual(copied, [operation.destination]);
            assert.match(document.body.textContent, /Checkout path copied/);
            instance.receive({ ...state, host: { ...state.host, activity: "busy", canPrepareRemote: false } });
            instance.receive(state);
            assert.equal(calls.filter(call => call.method === "POST").length, 0);
            assert.equal(document.querySelector('[aria-label="Retry handoff"]'), null);
        } finally {
            instance?.dispose();
            if (prior) Object.defineProperty(globalThis, "document", prior); else Reflect.deleteProperty(globalThis, "document");
            dom.window.close();
        }
    });
}

test("Broken entry state still permits explicit direct opening without remote setup or dispatch", async () => {
    const dom = new JSDOM('<main id="entry"></main>', { url: "http://127.0.0.1:32001/?cap=synthetic-capability", pretendToBeVisual: true });
    const prior = Object.getOwnPropertyDescriptor(globalThis, "document");
    Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
    const calls = [];
    let instance;
    try {
        instance = await mountRepositoryEntry({ container: dom.window.document.getElementById("entry"), request: async (input, options) => {
            const path = new URL(input).pathname; calls.push(path);
            if (path.endsWith("/state")) throw new Error("synthetic-private-diagnostic");
            assert.equal(path, "/api/entry/direct");
            assert.deepEqual(Object.keys(JSON.parse(options.body)), ["requestId"]);
            return { ok: true, json: async () => ({ ok: true, data: { opened: true } }) };
        } });
        dom.window.document.querySelector('[data-action="direct"]').click();
        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(calls, ["/api/entry/state", "/api/entry/direct"]);
        assert.match(dom.window.document.body.textContent, /canvas opened/i);
        assert.doesNotMatch(dom.window.document.body.textContent, /synthetic-private-diagnostic/);
    } finally {
        instance?.dispose();
        if (prior) Object.defineProperty(globalThis, "document", prior); else Reflect.deleteProperty(globalThis, "document");
        dom.window.close();
    }
});