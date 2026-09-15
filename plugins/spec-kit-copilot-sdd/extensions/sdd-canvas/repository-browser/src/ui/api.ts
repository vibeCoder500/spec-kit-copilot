import { knownRepositoryError, RepositoryError } from "../errors.ts";
import type { ConnectionSnapshot } from "../auth.ts";

export interface BrowserSnapshot {
    configuration: "configured" | "unconfigured" | "disabled" | "invalid";
    connection: ConnectionSnapshot;
    localContext: { contextId: string; label: string };
    mode: "local" | "remote";
    selectedContextId: string | null;
    capabilities: { browse: boolean; clone: boolean };
}

export function createRepositoryApi({ document, request = globalThis.fetch }: { document: Document; request?: typeof fetch }) {
    const base = new URL(document.location.href);
    const controllers = new Set<AbortController>();
    return {
        async call<Result>(path: string, parameters: Record<string, string> = {}, body?: Record<string, unknown>, signal?: AbortSignal): Promise<Result> {
            const url = new URL(`/api/repositories/${path}`, base);
            const capability = base.searchParams.get("cap");
            if (!capability) throw new RepositoryError("invalid_context");
            url.searchParams.set("cap", capability);
            for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
            const controller = new AbortController();
            controllers.add(controller);
            const combined = AbortSignal.any([controller.signal, AbortSignal.timeout(45_000), ...(signal ? [signal] : [])]);
            try {
                const response = await request(url, { method: body === undefined ? "GET" : "POST", signal: combined,
                    headers: body === undefined ? { Accept: "application/json" } : { Accept: "application/json", "Content-Type": "application/json" },
                    body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", referrerPolicy: "no-referrer" });
                const payload = await response.json();
                if (combined.aborted) throw new RepositoryError("invalid_context");
                if (!response.ok || !payload?.ok) throw knownRepositoryError(payload?.error?.code);
                return payload.data as Result;
            } catch (error) {
                if (error instanceof RepositoryError) throw error;
                throw new RepositoryError(combined.aborted ? "invalid_context" : "upstream_unavailable");
            } finally { controllers.delete(controller); }
        },
        abort() { for (const controller of controllers) controller.abort(); controllers.clear(); },
    };
}

export type RepositoryApi = ReturnType<typeof createRepositoryApi>;