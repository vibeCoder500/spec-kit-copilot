import type { ArtifactRoot, RepositoryContext, RepositoryDetail, RepositoryItem, RepositorySummary } from "../types.ts";

export interface TreePage {
    items: RepositoryItem[];
    cursor: string | null;
    loaded: boolean;
    loading: boolean;
}

export interface BrowserNode {
    key: string;
    kind: "repository" | "root" | "folder" | "file" | "more";
    label: string;
    level: number;
    parentKey?: string;
    expanded?: boolean;
    repository: RepositorySummary;
    root?: ArtifactRoot;
    item?: RepositoryItem;
    status?: string;
}

export function repositoryKey(id: string) { return `repository:${id}`; }
export function rootKey(id: string, root: string) { return `${repositoryKey(id)}:${root}`; }

const order = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
const rank: Record<string, number> = { enabled: 0, not_enabled: 1, unscannable: 3, unavailable: 4 };

export function visibleRepositoryNodes({ repositories, context, roots, expanded, details }: {
    repositories: RepositorySummary[];
    context?: RepositoryContext;
    roots: Map<ArtifactRoot, TreePage>;
    expanded: Set<string>;
    details: Map<string, RepositoryDetail>;
}): BrowserNode[] {
    const result: BrowserNode[] = [];
    const sorted = [...repositories].sort((left, right) => (rank[details.get(left.id)?.speckitStatus ?? ""] ?? 2) -
        (rank[details.get(right.id)?.speckitStatus ?? ""] ?? 2) || order.compare(left.name, right.name) || left.id.localeCompare(right.id, "en"));
    for (const repository of sorted) {
        const key = repositoryKey(repository.id);
        const selected = context?.repository.id === repository.id && expanded.has(key);
        result.push({ key, kind: "repository", label: repository.name, level: 1, expanded: Boolean(selected), repository,
            status: details.get(repository.id)?.speckitStatus });
        if (!selected) continue;
        for (const root of context.roots) {
            const parent = rootKey(repository.id, root);
            result.push({ key: parent, kind: "root", label: root.slice(1), level: 2, parentKey: key, expanded: expanded.has(parent), repository, root });
            if (!expanded.has(parent)) continue;
            const page = roots.get(root);
            const items = [...page?.items ?? []].sort((left, right) => order.compare(left.path, right.path));
            const parents = new Map<string, RepositoryItem>();
            for (const item of items) {
                const segments = item.path.slice(root.length + 1).split("/");
                for (let depth = 1; depth < segments.length; depth++) {
                    const path = `${root}/${segments.slice(0, depth).join("/")}`;
                    if (!parents.has(path)) parents.set(path, { id: `folder:${path}`, path, label: segments[depth - 1]!, kind: "folder", objectId: "" });
                }
                parents.set(item.path, item);
            }
            const rows = [...parents.values()].sort((left, right) => order.compare(left.path, right.path));
            for (const item of rows) {
                const segments = item.path.slice(root.length + 1).split("/");
                let visible = true;
                for (let depth = 1; depth < segments.length; depth++) {
                    if (!expanded.has(`${parent}/${segments.slice(0, depth).join("/")}`)) { visible = false; break; }
                }
                if (!visible) continue;
                const nodeKey = `${parent}/${segments.join("/")}`;
                result.push({ key: nodeKey, kind: item.kind, label: item.label, level: segments.length + 2,
                    parentKey: segments.length === 1 ? parent : `${parent}/${segments.slice(0, -1).join("/")}`, repository, root, item,
                    ...(item.kind === "folder" ? { expanded: expanded.has(nodeKey) } : {}) });
            }
            if (page?.cursor) result.push({ key: `${parent}:more`, kind: "more", label: "Load more artifacts", level: 3, parentKey: parent, repository, root });
        }
    }
    return result;
}