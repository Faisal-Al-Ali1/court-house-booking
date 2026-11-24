import { createHmac, timingSafeEqual } from "node:crypto";

const SEPARATOR = ".";

function mac(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload).digest();
}

export function requireSessionSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is not set");
  }
  return value;
}

export function signRef(value: string, secret: string): string {
  const payload = Buffer.from(value, "utf8").toString("base64url");
  return `${payload}${SEPARATOR}${mac(payload, secret).toString("base64url")}`;
}

export function verifyRef(
  signed: string | undefined,
  secret: string,
): string | null {
  if (!signed) {
    return null;
  }
  const parts = signed.split(SEPARATOR);
  if (parts.length !== 2) {
    return null;
  }
  const [payload, given] = parts;
  const expected = mac(payload, secret);
  const actual = Buffer.from(given, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }
  const value = Buffer.from(payload, "base64url").toString("utf8");
  return value === "" ? null : value;
}
