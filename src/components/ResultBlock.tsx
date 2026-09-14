"use client";

import { CopyButton } from "./CopyButton";

export function ResultBlock({
  id,
  title,
  children,
  copyText,
  locked,
  lockHint,
  lockAction,
  badge,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  copyText?: string;
  locked?: boolean;
  lockHint?: string;
  lockAction?: React.ReactNode;
  badge?: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-white/8 bg-[#0c1526]/80 p-5 sm:p-6"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-sky-400/90">
            {title}
          </h3>
          {badge ? (
            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
              {badge}
            </span>
          ) : null}
        </div>
        {copyText && !locked ? <CopyButton text={copyText} /> : null}
      </div>
      {locked ? (
        <div className="rounded-xl border border-dashed border-sky-500/30 bg-sky-500/5 px-4 py-6 text-center">
          <p className="text-sm text-slate-300">
            {lockHint ?? "Unlock for $1 to reveal this section."}
          </p>
          {lockAction ? <div className="mt-4 flex justify-center">{lockAction}</div> : null}
        </div>
      ) : (
        <div className="text-[15px] leading-relaxed text-slate-200">{children}</div>
      )}
    </section>
  );
}
