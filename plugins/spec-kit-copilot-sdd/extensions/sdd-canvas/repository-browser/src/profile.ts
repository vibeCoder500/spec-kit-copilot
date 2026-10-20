import { lstat, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { parseDocument } from "yaml";
import { RepositoryError } from "./errors.ts";
import type { EntrySettings, EntrySettingsStatus } from "./types.ts";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROFILE_FIELDS = new Set(["schemaVersion", "enabled", "tenantId", "clientId", "organization", "project"]);

export const DEFAULT_REPOSITORY_PROFILE: Readonly<RepositoryProfile> = Object.freeze({
    schemaVersion: 1,
    enabled: true,
    tenantId: "72f988bf-86f1-41af-91ab-2d7cd011db47",
    clientId: "bc6942b7-d615-45b4-9461-41eed3e3e45d",
    organization: "MicrosoftIT",
    project: "OneITVSO",
});

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

export async function loadRepositoryProfile(homeDirectory?: string): Promise<ProfileStatus> {
    const resolvedHome = homeDirectory ?? homedir();
    if (!isAbsolute(resolvedHome)) return { state: "invalid" };
    const profilePath = join(resolve(resolvedHome), ".speckit-canvas", "repository-profile.json");
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
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return homeDirectory === undefined
                ? { state: "configured", profile: DEFAULT_REPOSITORY_PROFILE }
                : { state: "unconfigured" };
        }
        return { state: "invalid" };
    }
}

export interface EntrySettingsResult {
    state: EntrySettingsStatus;
    settings: Readonly<EntrySettings>;
}

export async function loadEntrySettings(homeDirectory = homedir()): Promise<EntrySettingsResult> {
    const result = (state: EntrySettingsStatus): EntrySettingsResult => ({ state,
        settings: Object.freeze({ schemaVersion: 1, repositoryEntryEnabled: state === "enabled" }) });
    if (!isAbsolute(homeDirectory)) return result("invalid");
    const filename = join(resolve(homeDirectory), ".speckit-canvas", "entry-settings.json");
    try {
        for (let parent = dirname(filename); ; parent = dirname(parent)) {
            const info = await lstat(parent);
            if (!info.isDirectory() || info.isSymbolicLink()) return result("invalid");
            if (dirname(parent) === parent) break;
        }
        const info = await lstat(filename);
        if (!info.isFile() || info.isSymbolicLink() || info.size > 4096) return result("invalid");
        const bytes = await readFile(filename);
        if (bytes.length > 4096) return result("invalid");
        const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        const input: unknown = JSON.parse(raw);
        if (!input || typeof input !== "object" || Array.isArray(input) || parseDocument(raw, { schema: "json", uniqueKeys: true }).errors.length) return result("invalid");
        const fields = input as Record<string, unknown>;
        if (fields.schemaVersion !== 1 || typeof fields.repositoryEntryEnabled !== "boolean" ||
            Object.keys(fields).some(key => !["schemaVersion", "repositoryEntryEnabled"].includes(key))) return result("invalid");
        return result(fields.repositoryEntryEnabled ? "enabled" : "disabled");
    } catch (error) { return result((error as NodeJS.ErrnoException).code === "ENOENT" ? "enabled" : "invalid"); }
}