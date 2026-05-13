/**
 * Decodes a JWT payload as UTF-8.
 * atob() returns a Latin-1 binary string; TextDecoder converts the bytes to proper UTF-8.
 */
export function parseJwtPayload(token) {
    const base64 = (token.split(".")[1] ?? "")
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
}
