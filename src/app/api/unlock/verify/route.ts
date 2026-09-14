import { NextRequest, NextResponse } from "next/server";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { createUnlockToken, unlockCookieOptions } from "@/lib/unlock";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  const appUrl = getAppUrl();

  if (!sessionId) {
    return NextResponse.redirect(`${appUrl}/create?unlock_error=1`);
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.redirect(`${appUrl}/create?unlock_error=1`);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      session.payment_status === "paid" || session.status === "complete";
    if (!paid) {
      return NextResponse.redirect(`${appUrl}/create?unlock_error=1`);
    }

    const token = await createUnlockToken(session.id);
    const res = NextResponse.redirect(`${appUrl}/success`);
    const opts = unlockCookieOptions(token);
    res.cookies.set(opts.name, opts.value, {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    });
    return res;
  } catch (e) {
    console.error("Verify failed", e);
    return NextResponse.redirect(`${appUrl}/create?unlock_error=1`);
  }
}
