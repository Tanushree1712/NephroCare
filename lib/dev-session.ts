import { createHmac, timingSafeEqual } from "crypto";

type DevSessionPayload = {
  userId: number;
  issuedAt: number;
};

export const DEV_LOGIN_EMAIL = "demo.patient@nephrocare.plus";
export const DEV_LOGIN_PASSWORD = "DemoPass!2026";
export const DEV_RECEPTION_LOGIN_EMAIL = "demo.reception@nephrocare.plus";
export const DEV_RECEPTION_LOGIN_PASSWORD = "CenterDesk!2026";
export const DEV_SESSION_COOKIE = "nephrocare-dev-session";

const DEV_SESSION_SECRET =
  process.env.DEV_SESSION_SECRET ?? "nephrocare-dev-session-secret";

export const devSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export function isDevLoginEnabled() {
  return process.env.NODE_ENV !== "production";
}

function createSignature(payload: string) {
  return createHmac("sha256", DEV_SESSION_SECRET)
    .update(payload)
    .digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createDevSessionValue(userId: number) {
  const payload = Buffer.from(
    JSON.stringify({ userId, issuedAt: Date.now() } satisfies DevSessionPayload)
  ).toString("base64url");

  return `${payload}.${createSignature(payload)}`;
}

export function readDevSessionValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature || !safeEqual(createSignature(payload), signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as DevSessionPayload;

    if (!Number.isInteger(parsed.userId) || parsed.userId < 1) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
