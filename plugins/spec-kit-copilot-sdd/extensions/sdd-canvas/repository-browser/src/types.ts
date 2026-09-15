export interface RepositorySummary {
    id: string;
    name: string;
    defaultBranch: string | null;
    operationalState: "active" | "maintenance";
}

export interface RepositoryDetail extends RepositorySummary {
    sourceVersion: string | null;
    speckitStatus: "enabled" | "not_enabled" | "unscannable" | "unavailable";
}

export type ArtifactRoot = "/.specify" | "/specs";

export interface RepositoryItem {
    id: string;
    path: string;
    label: string;
    kind: "folder" | "file";
    objectId: string;
}

export interface RepositoryContext {
    contextId: string;
    repository: RepositoryDetail;
    sourceVersion: string;
    generation: number;
    roots: ArtifactRoot[];
}

export interface RepositoryPage {
    items: RepositorySummary[];
    hasMore: boolean;
    cursor: string | null;
    outcome: "ready" | "scanning" | "no_associations" | "no_linked_repositories";
}

export interface ItemPage {
    items: RepositoryItem[];
    hasMore: boolean;
    cursor: string | null;
    contextId: string;
    sourceVersion: string;
}

export interface RemoteDocument {
    artifact: { id: string; relativePath: string; label: string; role: "reference"; availability: "available" };
    revision: string;
    content: string;
    byteSize: number;
    sourceKind: "git-commit";
    source: { provider: "azure-devops"; repositoryId: string; repositoryName: string; branch: string; commit: string; objectId: string };
    format: "markdown" | "text";
    contextId: string;
    generation: number;
}