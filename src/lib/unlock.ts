import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const UNLOCK_COOKIE = "rc_unlock";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getSecret(): Uint8Array {
  const secret =
    process.env.UNLOCK_COOKIE_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    "dev-only-unlock-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createUnlockToken(sessionId?: string): Promise<string> {
  return new SignJWT({
    unlocked: true,
    sid: sessionId ?? "local",
    iat: Math.floor(Date.now() / 1000),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("365d")
    .sign(getSecret());
}

export async function verifyUnlockToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.unlocked === true;
  } catch {
    return false;
  }
}

export async function isUnlocked(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(UNLOCK_COOKIE)?.value;
  return verifyUnlockToken(token);
}

export function unlockCookieOptions(token: string) {
  return {
    name: UNLOCK_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  };
}
