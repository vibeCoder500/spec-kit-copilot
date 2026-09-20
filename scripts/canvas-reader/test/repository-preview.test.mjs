import assert from "node:assert/strict";
import { test } from "node:test";
import { startRepositoryPreview } from "../serve-repositories.mjs";

test("Synthetic repository preview opens the actual SDD shell without exposing a capability in its launcher URL", async () => {
    const preview = await startRepositoryPreview();
    try {
        assert.equal(new URL(preview.url).search, "");
        const redirect = await fetch(preview.url, { redirect: "manual" });
        assert.equal(redirect.status, 302);
        assert.equal(redirect.headers.get("referrer-policy"), "no-referrer");
        const target = new URL(redirect.headers.get("location"));
        assert.equal(target.hostname, "127.0.0.1");
        assert.equal(target.searchParams.has("readerProbe"), false);
        assert(target.searchParams.has("cap"));
        const html = await (await fetch(target)).text();
        assert(html.includes('id="repositoryEntry"'));
        assert(!html.includes('id="repositoryBrowser"'));
        const state = new URL("/api/entry/state", target); state.search = target.search;
        const response = await (await fetch(state)).json();
        assert.equal(response.data.connection.state, "disconnected");
        assert.equal(response.data.configuration, "configured");
        assert.equal(response.data.phase, "chooser");
        assert.equal(response.data.host.canPrepareRemote, true);
        assert.equal(response.data.host.canHandoff, false);
        assert.equal(response.data.host.canRetryHandoff, false);
        assert.equal((await fetch(preview.url, { method: "POST" })).status, 404);
        assert.equal((await fetch(preview.url, { headers: { Origin: "https://untrusted.invalid" } })).status, 404);
    } finally { await preview.stop(); }
});