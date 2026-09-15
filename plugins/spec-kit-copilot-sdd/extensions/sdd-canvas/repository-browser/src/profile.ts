import { lstat, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { RepositoryError } from "./errors.ts";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROFILE_FIELDS = new Set(["schemaVersion", "enabled", "tenantId", "clientId", "organization", "project"]);

export interface RepositoryProfile {
    schemaVersion: 1;
    enabled: boolean;
    tenantId: string;
    clientId: string;
    organization: string;
    project: string;
}

export type ProfileStatus = { state: "unconfigured" | "disabled" | "invalid" } |
    { state: "configured"; profile: Readonly<RepositoryProfile> };

function identifier(value: unknown): string {
    if (typeof value !== "string" || !UUID.test(value)) throw new RepositoryError("invalid_request");
    return value.toLowerCase();
}

function segment(value: unknown): string {
    if (typeof value !== "string" || !value.trim() || value !== value.trim() || value.length > 128 ||
        /[\p{Cc}\p{Cf}/\\?#%]/u.test(value) || value === "." || value === "..") throw new RepositoryError("invalid_request");
    return value;
}

export function parseRepositoryProfile(value: unknown): Readonly<RepositoryProfile> {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new RepositoryError("invalid_request");
    const input = value as Record<string, unknown>;
    if (Object.keys(input).some((key) => !PROFILE_FIELDS.has(key)) || input.schemaVersion !== 1 || typeof input.enabled !== "boolean") {
        throw new RepositoryError("invalid_request");
    }
    return Object.freeze({ schemaVersion: 1, enabled: input.enabled,
        tenantId: identifier(input.tenantId), clientId: identifier(input.clientId),
        organization: segment(input.organization), project: segment(input.project) });
}

export async function loadRepositoryProfile(homeDirectory = homedir()): Promise<ProfileStatus> {
    if (!isAbsolute(homeDirectory)) return { state: "invalid" };
    const profilePath = join(resolve(homeDirectory), ".speckit-canvas", "repository-profile.json");
    try {
        for (let parent = dirname(profilePath); ; parent = dirname(parent)) {
            const info = await lstat(parent);
            if (!info.isDirectory() || info.isSymbolicLink()) return { state: "invalid" };
            if (dirname(parent) === parent) break;
        }
        const info = await lstat(profilePath);
        if (!info.isFile() || info.isSymbolicLink() || info.size > 16_384) return { state: "invalid" };
        const bytes = await readFile(profilePath);
        if (bytes.length > 16_384) return { state: "invalid" };
        const profile = parseRepositoryProfile(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
        return profile.enabled ? { state: "configured", profile } : { state: "disabled" };
    } catch (error) {
        return { state: (error as NodeJS.ErrnoException).code === "ENOENT" ? "unconfigured" : "invalid" };
    }
}