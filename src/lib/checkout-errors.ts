/** User-facing checkout / unlock messages — never include env or secret names. */

export const PAYMENTS_SOON_MESSAGE =
  "Payments are being set up — check back shortly.";

const LEAKY =
  /STRIPE_|SECRET_KEY|UNLOCK_COOKIE|NEXT_PUBLIC_|process\.env|payments[_\s-]?not[_\s-]?configured|not configured yet/i;

/** Map API/client errors to safe copy for the customer UI. */
export function safeCheckoutUserMessage(
  message?: string | null,
  errorCode?: string | null
): string {
  const combined = `${message ?? ""} ${errorCode ?? ""}`.trim();
  if (!combined) return PAYMENTS_SOON_MESSAGE;
  if (LEAKY.test(combined)) return PAYMENTS_SOON_MESSAGE;
  if (
    errorCode === "payments_not_configured" ||
    errorCode === "payments_unavailable" ||
    errorCode === "stripe_init_failed"
  ) {
    return PAYMENTS_SOON_MESSAGE;
  }
  // Prefer a short known-safe message from the API when present
  if (message && message.length < 160 && !LEAKY.test(message)) {
    return message;
  }
  return PAYMENTS_SOON_MESSAGE;
}
