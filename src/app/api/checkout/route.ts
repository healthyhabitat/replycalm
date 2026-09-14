import { NextResponse } from "next/server";
import { PAYMENTS_SOON_MESSAGE } from "@/lib/checkout-errors";
import { getAppUrl, getStripe, paymentsConfigured } from "@/lib/stripe";

export async function POST() {
  if (!paymentsConfigured()) {
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({
        mock: true,
        url: `${getAppUrl()}/api/unlock/mock`,
        message: "Stripe unset — use mock unlock in development.",
      });
    }
    return NextResponse.json(
      {
        error: "payments_unavailable",
        message: PAYMENTS_SOON_MESSAGE,
      },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    console.error("Stripe client failed to initialize despite configured key");
    return NextResponse.json(
      {
        error: "payments_unavailable",
        message: PAYMENTS_SOON_MESSAGE,
      },
      { status: 503 }
    );
  }

  const appUrl = getAppUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "pay",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 100,
            product_data: {
              name: "ReplyCalm Full Unlock",
              description:
                "Unlock all 3 reply tones, subject lines, Don't-say note, and Markdown download.",
            },
          },
        },
      ],
      success_url: `${appUrl}/api/unlock/verify?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/create?canceled=1`,
      metadata: { product: "replycalm_unlock" },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe checkout error", err);
    return NextResponse.json(
      {
        error: "checkout_failed",
        message: "Could not start checkout. Try again in a moment.",
      },
      { status: 500 }
    );
  }
}
