import { describe, expect, it } from "vitest";
import {
  PAYMENTS_SOON_MESSAGE,
  safeCheckoutUserMessage,
} from "./checkout-errors";

describe("safeCheckoutUserMessage", () => {
  it("strips STRIPE_SECRET_KEY and similar leaks", () => {
    expect(
      safeCheckoutUserMessage(
        "Payments are not configured yet. Set STRIPE_SECRET_KEY to enable $1 unlock.",
        "payments_not_configured"
      )
    ).toBe(PAYMENTS_SOON_MESSAGE);
  });

  it("maps payments_unavailable", () => {
    expect(safeCheckoutUserMessage(undefined, "payments_unavailable")).toBe(
      PAYMENTS_SOON_MESSAGE
    );
  });

  it("passes through short safe messages", () => {
    expect(
      safeCheckoutUserMessage("Could not start checkout. Try again in a moment.")
    ).toBe("Could not start checkout. Try again in a moment.");
  });
});
