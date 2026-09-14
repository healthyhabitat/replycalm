"use client";

import { useCallback, useState } from "react";
import {
  PAYMENTS_SOON_MESSAGE,
  safeCheckoutUserMessage,
} from "@/lib/checkout-errors";

export function useCheckout({
  paymentsConfigured,
  canMock,
}: {
  paymentsConfigured: boolean;
  canMock: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const clearNotice = useCallback(() => setNotice(null), []);

  const unlock = useCallback(async () => {
    setBusy(true);
    setNotice(null);

    if (!paymentsConfigured && !canMock) {
      setNotice(PAYMENTS_SOON_MESSAGE);
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        message?: string;
        mock?: boolean;
      };
      if (!res.ok) {
        setNotice(safeCheckoutUserMessage(data.message, data.error));
        setBusy(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice("Could not start checkout. Try again in a moment.");
    } catch {
      setNotice("Network error — try again.");
    }
    setBusy(false);
  }, [paymentsConfigured, canMock]);

  const ctaLabel = busy
    ? "Starting checkout…"
    : canMock && !paymentsConfigured
      ? "Unlock free (dev mock) →"
      : "Unlock all replies — $1 →";

  return { busy, notice, clearNotice, unlock, ctaLabel };
}
