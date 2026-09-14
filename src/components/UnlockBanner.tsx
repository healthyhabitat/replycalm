"use client";

import { PAYMENTS_SOON_MESSAGE } from "@/lib/checkout-errors";

export function UnlockBanner({
  paymentsConfigured,
  canMock,
  onUnlock,
  busy,
  notice,
  ctaLabel,
}: {
  paymentsConfigured: boolean;
  canMock: boolean;
  onUnlock: () => void;
  busy: boolean;
  notice: string | null;
  ctaLabel: string;
}) {
  const paymentsSoon = !paymentsConfigured && !canMock;

  return (
    <div className="rounded-2xl border border-sky-500/40 bg-gradient-to-br from-sky-500/15 to-indigo-600/10 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
        Free preview · unlock full pack
      </p>
      <h3 className="mt-1 text-xl font-bold text-sky-50">
        All 3 replies + subjects for $1
      </h3>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
        <li>✓ Firm, warm, and brief — paste-ready</li>
        <li>✓ Subject lines for each tone</li>
        <li>✓ “Don&apos;t say this” guardrails</li>
        <li>✓ Markdown download</li>
      </ul>

      <button
        type="button"
        onClick={onUnlock}
        disabled={busy}
        className="mt-5 w-full rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-[#070b14] transition hover:bg-sky-400 disabled:opacity-60"
      >
        {ctaLabel}
      </button>

      {paymentsSoon && !notice ? (
        <p className="mt-3 text-sm text-slate-400">{PAYMENTS_SOON_MESSAGE}</p>
      ) : null}

      {notice ? (
        <p
          className="mt-3 rounded-lg border border-sky-500/20 bg-[#070b14]/50 px-3 py-2 text-sm text-sky-100"
          role="status"
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
}
