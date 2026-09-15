import { knownRepositoryError } from "../errors.ts";
import type { RemoteDocument } from "../types.ts";
import type { RepositoryApi } from "./api.ts";

interface ReaderOptions {
    readerId: string;
    state: "ready" | "empty";
    connectionState: "connected";
    document: RemoteDocument;
    artifacts: RemoteDocument["artifact"][];
    selectedArtifactId: string;
    scrollElement: HTMLElement;
    fragment?: string;
    returnLabel: "Back to repository";
    navigationEnabled: true;
    canNavigateBack: boolean;
    canNavigateForward: boolean;
    onSelectArtifact(id: string): void;
    onNavigateReference(target: string): void;
    onNavigateHistory(direction: "back" | "forward"): void;
    onReturnToWorkflow(): void;
}

export type ReaderMount = (element: HTMLElement, options: ReaderOptions) => { update(options: ReaderOptions): void; unmount(): void };

export function createRemoteReader({ container, scrollElement, api, loadReader, onReturn, onDocument = () => undefined, onError = () => undefined }: {
    container: HTMLElement;
    scrollElement: HTMLElement;
    api: RepositoryApi;
    loadReader: () => Promise<ReaderMount>;
    onReturn: () => void;
    onDocument?: (document: RemoteDocument) => void;
    onError?: (code: string) => void;
}) {
    let mounted: ReturnType<ReaderMount> | undefined;
    let controller: AbortController | undefined;
    let generation = 0;
    let contextId = "";
    let current: RemoteDocument | undefined;
    let history: { itemId: string; offset: number; fragment: string }[] = [];
    let position = -1;
    const artifacts = new Map<string, RemoteDocument["artifact"]>();

    function clearDocument() {
        mounted?.unmount(); mounted = undefined;
        container.replaceChildren(); current = undefined;
    }

    function status(message: string) {
        clearDocument();
        const text = container.ownerDocument.createElement("p");
        text.className = "repo-preview-status";
        text.setAttribute("role", "status");
        text.textContent = message;
        container.append(text);
    }

    function remember() { if (history[position]) history[position]!.offset = scrollElement.scrollTop; }

    async function present(document: RemoteDocument, epoch: number, target?: number, fragment = "") {
        if (epoch !== generation || document.contextId !== contextId || !container.isConnected) return;
        artifacts.set(document.artifact.id, document.artifact);
        if (target !== undefined) position = target;
        else {
            history = history.slice(0, position + 1);
            history.push({ itemId: document.artifact.id, offset: 0, fragment });
            if (history.length > 50) history.shift();
            position = history.length - 1;
        }
        if (document.format === "text") {
            clearDocument();
            const source = container.ownerDocument.createElement("div");
            source.className = "repo-text-source";
            source.textContent = `${document.artifact.relativePath} / Git commit ${document.source.commit.slice(0, 12)}`;
            const pre = container.ownerDocument.createElement("pre");
            pre.className = "repo-plain-text"; pre.textContent = document.content;
            pre.setAttribute("aria-label", document.artifact.relativePath);
            container.append(source, pre);
        } else {
            const mount = await loadReader();
            if (epoch !== generation || document.contextId !== contextId || !container.isConnected) return;
            const options: ReaderOptions = { readerId: "sdd-remote-reader", state: document.content.trim() ? "ready" : "empty", connectionState: "connected",
                document, artifacts: [...artifacts.values()], selectedArtifactId: document.artifact.id, scrollElement,
                fragment: fragment || history[position]?.fragment || undefined, returnLabel: "Back to repository", navigationEnabled: true,
                canNavigateBack: position > 0, canNavigateForward: position < history.length - 1,
                onSelectArtifact: (id) => { void reader.open(contextId, id); },
                onNavigateReference: (target) => { void reader.reference(target); },
                onNavigateHistory: (direction) => { void reader.navigate(direction); }, onReturnToWorkflow: onReturn };
            clearDocument();
            mounted = mount(container, options);
        }
        current = document;
        scrollElement.scrollTop = history[position]?.offset ?? 0;
        container.dataset.remoteDocumentState = "ready";
        onDocument(document);
    }

    async function load(operation: (signal: AbortSignal) => Promise<{ document: RemoteDocument; fragment?: string }>, target?: number) {
        remember();
        const epoch = ++generation;
        controller?.abort(); controller = new AbortController();
        status("Loading artifact...");
        container.dataset.remoteDocumentState = "loading";
        try {
            const result = await operation(controller.signal);
            await present(result.document, epoch, target, result.fragment);
        } catch (error) {
            if (epoch !== generation) return;
            const failure = knownRepositoryError((error as { code?: unknown })?.code);
            status(failure.message); container.dataset.remoteDocumentState = "error";
            onError(failure.code);
        }
    }

    const reader = {
        async open(context: string, itemId: string, target?: number) {
            if (context !== contextId) { reader.clear(); contextId = context; }
            await load(async (signal) => ({ document: await api.call<RemoteDocument>("content", { contextId: context, itemId }, undefined, signal) }), target);
        },
        async reference(target: string) {
            if (!current) return;
            const itemId = current.artifact.id;
            await load((signal) => api.call<{ document: RemoteDocument; fragment: string }>("reference", {}, { contextId, itemId, target }, signal));
        },
        async navigate(direction: "back" | "forward") {
            const target = position + (direction === "back" ? -1 : 1);
            if (target < 0 || target >= history.length) return;
            await reader.open(contextId, history[target]!.itemId, target);
        },
        clear() {
            generation++; controller?.abort(); controller = undefined; contextId = ""; history = []; position = -1; artifacts.clear();
            status("No artifact selected."); container.dataset.remoteDocumentState = "idle";
        },
        dispose() { reader.clear(); clearDocument(); },
    };
    return reader;
}