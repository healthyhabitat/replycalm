"use client";

import { useState } from "react";
import type { ContextRole, ReplyGoal } from "@/lib/types";

export interface FormValues {
  message: string;
  context: ContextRole | "";
  goal: ReplyGoal;
}

export function ReplyForm({
  onSubmit,
  loading,
  initial,
}: {
  onSubmit: (values: FormValues) => void;
  loading?: boolean;
  initial?: Partial<FormValues>;
}) {
  const [message, setMessage] = useState(initial?.message ?? "");
  const [context, setContext] = useState<ContextRole | "">(initial?.context ?? "");
  const [goal, setGoal] = useState<ReplyGoal>(initial?.goal ?? "resolve");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 8) {
      setError("Paste a bit more — at least a rough sentence of the email.");
      return;
    }
    setError(null);
    onSubmit({
      message: message.trim(),
      context,
      goal,
    });
  }

  const field =
    "w-full rounded-xl border border-white/10 bg-[#0a0f1a] px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-2 focus:ring-sky-500/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-200">
          Paste the email or message <span className="text-sky-400">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={7}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`e.g. "This is unacceptable. You missed Friday's deadline and the $4,200 invoice is still unpaid. Send revised files by Wednesday — this is urgent."`}
          className={`${field} resize-y`}
          disabled={loading}
        />
        {error ? (
          <p className="mt-1.5 text-sm text-rose-400" role="alert">
            {error}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-slate-500">
            Rough, angry, awkward, or high-stakes — paste it as-is. We never store it on a server beyond this request.
          </p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-200">
          Who is this for{" "}
          <span className="font-normal text-slate-500">(optional)</span>
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(
            [
              ["boss", "Boss"],
              ["client", "Client"],
              ["vendor", "Vendor"],
              ["colleague", "Colleague"],
              ["other", "Other"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition ${
                context === value
                  ? "border-sky-500/60 bg-sky-500/15 text-sky-100"
                  : "border-white/10 bg-[#0a0f1a] text-slate-400 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="context"
                value={value}
                checked={context === value}
                onChange={() => setContext(value)}
                className="sr-only"
                disabled={loading}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-200">Goal</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["resolve", "Resolve"],
              ["decline", "Decline"],
              ["delay", "Delay"],
              ["clarify", "Clarify"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition ${
                goal === value
                  ? "border-sky-500/60 bg-sky-500/15 text-sky-100"
                  : "border-white/10 bg-[#0a0f1a] text-slate-400 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="goal"
                value={value}
                checked={goal === value}
                onChange={() => setGoal(value)}
                className="sr-only"
                disabled={loading}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3.5 text-base font-semibold text-[#070b14] transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#070b14]/30 border-t-[#070b14]" />
            Writing calm replies…
          </>
        ) : (
          "Get 3 calm replies →"
        )}
      </button>
    </form>
  );
}
