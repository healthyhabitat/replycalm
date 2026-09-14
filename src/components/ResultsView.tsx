"use client";

import { ResultBlock } from "./ResultBlock";
import { UnlockBanner } from "./UnlockBanner";
import { useCheckout } from "@/hooks/useCheckout";
import { packToMarkdown } from "@/lib/generator";
import type { ReplyPack, Tone } from "@/lib/types";

const TONE_ORDER: Tone[] = ["firm", "warm", "brief"];

export function ResultsView({
  pack,
  unlocked,
  paymentsConfigured,
  canMock,
}: {
  pack: ReplyPack;
  unlocked: boolean;
  paymentsConfigured: boolean;
  canMock: boolean;
}) {
  const { busy, notice, unlock, ctaLabel } = useCheckout({
    paymentsConfigured,
    canMock,
  });

  function downloadMd() {
    const md = packToMarkdown(pack);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `replycalm-${pack.seed}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const unlockBtn = (
    <button
      type="button"
      onClick={unlock}
      disabled={busy}
      className="rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-semibold text-[#070b14] transition hover:bg-sky-400 disabled:opacity-60"
    >
      {busy ? "Starting…" : "Unlock all — $1"}
    </button>
  );

  const ordered = TONE_ORDER.map(
    (t) => pack.replies.find((r) => r.tone === t)!
  ).filter(Boolean);

  return (
    <div className="relative space-y-4 pb-24 print:space-y-3 print:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/80">
            Your reply pack
          </p>
          <h2 className="text-2xl font-bold text-sky-50 sm:text-3xl">
            3 professional options
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unlocked ? (
            <button
              type="button"
              onClick={downloadMd}
              className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-sm font-medium text-sky-100 hover:bg-sky-500/20"
            >
              Download Markdown
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled
                title="Unlock for $1 to download"
                className="cursor-not-allowed rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-500"
              >
                Download Markdown 🔒
              </button>
              {unlockBtn}
            </>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:border-white/20"
          >
            Print
          </button>
        </div>
      </div>

      {!unlocked ? (
        <div className="print:hidden">
          <UnlockBanner
            paymentsConfigured={paymentsConfigured}
            canMock={canMock}
            onUnlock={unlock}
            busy={busy}
            notice={notice}
            ctaLabel={ctaLabel}
          />
        </div>
      ) : (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 print:hidden">
          Full pack unlocked. Copy, download, and send.
        </p>
      )}

      {pack.issues.length > 0 ? (
        <ResultBlock
          title="Issues we addressed"
          copyText={pack.issues.map((i) => `• ${i}`).join("\n")}
        >
          <ul className="list-disc space-y-1.5 pl-5 text-slate-300">
            {pack.issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Replies below are built from these themes — not generic templates.
          </p>
        </ResultBlock>
      ) : null}

      <div className="space-y-4">
        {ordered.map((reply) => {
          const isPreview =
            !unlocked && reply.tone === pack.previewTone && reply.body;
          const locked = !unlocked && !isPreview;
          const copyPayload =
            unlocked && reply.subject
              ? `Subject: ${reply.subject}\n\n${reply.body}`
              : reply.body || undefined;

          return (
            <ResultBlock
              key={reply.tone}
              title={`${reply.label} reply`}
              badge={isPreview ? "Free preview" : undefined}
              copyText={locked ? undefined : copyPayload}
              locked={locked}
              lockHint={`Unlock for $1 to reveal the ${reply.label.toLowerCase()} reply + subject line.`}
              lockAction={!unlocked ? unlockBtn : undefined}
            >
              {unlocked && reply.subject ? (
                <p className="mb-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm">
                  <span className="font-medium text-sky-300">Subject: </span>
                  <span className="text-slate-100">{reply.subject}</span>
                </p>
              ) : null}
              {!unlocked && isPreview ? (
                <p className="mb-3 text-xs text-slate-500">
                  Subject line unlocks with the full pack.
                </p>
              ) : null}
              <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
                {reply.body}
              </pre>
            </ResultBlock>
          );
        })}
      </div>

      <ResultBlock
        title="Don't say this"
        copyText={unlocked ? pack.dontSayThis : undefined}
        locked={!unlocked}
        lockHint="Unlock for $1 to see guardrails tailored to this message."
        lockAction={!unlocked ? unlockBtn : undefined}
      >
        <pre className="whitespace-pre-wrap font-sans text-[15px] text-slate-300">
          {pack.dontSayThis}
        </pre>
      </ResultBlock>

      {!unlocked ? (
        <p className="text-center text-xs text-slate-500 print:block">
          Made with ReplyCalm
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#070b14]/95 px-4 py-3 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2">
          <p className="truncate text-sm text-slate-400">
            {unlocked ? "Full pack unlocked" : "1 reply preview · unlock for all 3"}
          </p>
          <div className="flex flex-wrap gap-2">
            {unlocked ? (
              <button
                type="button"
                onClick={downloadMd}
                className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/20"
              >
                Download Markdown
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-500"
                >
                  Download 🔒
                </button>
                <button
                  type="button"
                  onClick={unlock}
                  disabled={busy}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-[#070b14] hover:bg-sky-400 disabled:opacity-60"
                >
                  {busy ? "Starting…" : "Unlock all — $1"}
                </button>
              </>
            )}
          </div>
        </div>
        {notice && !unlocked ? (
          <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-sky-200/90">
            {notice}
          </p>
        ) : null}
      </div>
    </div>
  );
}
