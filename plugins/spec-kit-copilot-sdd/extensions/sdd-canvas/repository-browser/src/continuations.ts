import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { RepositoryError } from "./errors.ts";

export type CursorKind = "search" | "relevant" | "items";
export type CursorBinding = Readonly<Record<string, string | number>>;

function bindingHash(binding: CursorBinding): string {
    const ordered = Object.entries(binding).sort(([left], [right]) => left.localeCompare(right, "en"));
    return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}

export function createContinuations({ now = Date.now, ttlMs = 600_000 } = {}) {
    const key = randomBytes(32);
    let disposed = false;
    return {
        issue(kind: CursorKind, binding: CursorBinding, position: number) {
            if (disposed || !Number.isSafeInteger(position) || position < 0) throw new RepositoryError("invalid_context");
            const encoded = Buffer.from(JSON.stringify({ version: 1, kind, binding: bindingHash(binding), position, expiresAt: now() + ttlMs })).toString("base64url");
            return `${encoded}.${createHmac("sha256", key).update(encoded).digest("base64url")}`;
        },
        verify(cursor: string, kind: CursorKind, binding: CursorBinding): number {
            if (disposed || typeof cursor !== "string" || cursor.length > 8_192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(cursor)) {
                throw new RepositoryError("invalid_context");
            }
            const [encoded, signature] = cursor.split(".");
            const expected = createHmac("sha256", key).update(encoded!).digest();
            const actual = Buffer.from(signature!, "base64url");
            if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new RepositoryError("invalid_context");
            let payload: Record<string, unknown>;
            try { payload = JSON.parse(Buffer.from(encoded!, "base64url").toString("utf8")); }
            catch { throw new RepositoryError("invalid_context"); }
            if (payload.version !== 1 || payload.kind !== kind || payload.binding !== bindingHash(binding) ||
                typeof payload.position !== "number" || !Number.isSafeInteger(payload.position) || payload.position < 0 ||
                typeof payload.expiresAt !== "number" || !Number.isFinite(payload.expiresAt)) throw new RepositoryError("invalid_context");
            if (payload.expiresAt <= now()) throw new RepositoryError("expired_cursor");
            return payload.position;
        },
        dispose() { disposed = true; key.fill(0); },
    };
}