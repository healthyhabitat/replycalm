import { NextResponse } from "next/server";
import { createUnlockToken, unlockCookieOptions } from "@/lib/unlock";
import { getAppUrl } from "@/lib/stripe";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Mock unlock is only available in development." },
      { status: 403 }
    );
  }

  const token = await createUnlockToken("mock-dev");
  const res = NextResponse.redirect(`${getAppUrl()}/success?mock=1`);
  const opts = unlockCookieOptions(token);
  res.cookies.set(opts.name, opts.value, {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
    maxAge: opts.maxAge,
  });
  return res;
}

export async function POST() {
  return GET();
}
