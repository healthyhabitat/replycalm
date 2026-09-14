import { NextResponse } from "next/server";
import { isUnlocked } from "@/lib/unlock";
import { paymentsConfigured } from "@/lib/stripe";

export async function GET() {
  const unlocked = await isUnlocked();
  return NextResponse.json({
    unlocked,
    paymentsConfigured: paymentsConfigured(),
    canMock: process.env.NODE_ENV === "development" && !paymentsConfigured(),
  });
}
