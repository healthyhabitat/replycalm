"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReplyForm, type FormValues } from "./ReplyForm";
import { ResultsView } from "./ResultsView";
import type { ReplyPack } from "@/lib/types";

const STORAGE_KEY = "rc_last_pack";
const FORM_KEY = "rc_last_form";

export function CreateApp({
  initialUnlocked = false,
}: {
  initialUnlocked?: boolean;
}) {
  const [pack, setPack] = useState<ReplyPack | null>(null);
  const [lastForm, setLastForm] = useState<FormValues | null>(null);
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const [paymentsConfigured, setPaymentsConfigured] = useState(false);
  const [canMock, setCanMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const refreshed = useRef(false);

  const persistPack = (p: ReplyPack) => {
    setPack(p);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  };

  const generate = useCallback(async (values: FormValues) => {
    setLoading(true);
    setError(null);
    setLastForm(values);
    try {
      sessionStorage.setItem(FORM_KEY, JSON.stringify(values));
    } catch {
      /* ignore */
    }
    try {
      const payload = {
        message: values.message,
        goal: values.goal,
        context: values.context || undefined,
      };
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        pack?: ReplyPack;
        unlocked?: boolean;
        error?: string;
      };
      if (!res.ok || !data.pack) {
        setError(data.error ?? "Generation failed.");
        setLoading(false);
        return;
      }
      persistPack(data.pack);
      if (typeof data.unlocked === "boolean") setUnlocked(data.unlocked);
    } catch {
      setError("Network error — check your connection and try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/unlock/status")
      .then((r) => r.json())
      .then(
        (d: {
          unlocked?: boolean;
          paymentsConfigured?: boolean;
          canMock?: boolean;
        }) => {
          if (d.unlocked) setUnlocked(true);
          setPaymentsConfigured(Boolean(d.paymentsConfigured));
          setCanMock(Boolean(d.canMock));
        }
      )
      .catch(() => {});

    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setPack(JSON.parse(raw) as ReplyPack);
      const formRaw = sessionStorage.getItem(FORM_KEY);
      if (formRaw) setLastForm(JSON.parse(formRaw) as FormValues);
    } catch {
      /* ignore */
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get("canceled") === "1")
      setBanner("Checkout canceled — no charge.");
    if (params.get("unlock_error") === "1")
      setBanner("Could not verify payment. Try again or contact support.");
    if (params.get("unlocked") === "1")
      setBanner("Welcome back — full pack unlocked.");
  }, []);

  useEffect(() => {
    if (!unlocked || refreshed.current) return;
    let form = lastForm;
    if (!form) {
      try {
        const formRaw = sessionStorage.getItem(FORM_KEY);
        if (formRaw) form = JSON.parse(formRaw) as FormValues;
      } catch {
        /* ignore */
      }
    }
    if (!form) return;
    refreshed.current = true;
    void generate(form);
  }, [unlocked, lastForm, generate]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
          ReplyCalm · Compose
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-sky-50 sm:text-4xl">
          Paste the hard email. Get calm replies.
        </h1>
        <p className="mt-2 text-slate-400">
          Free preview shows one paste-ready reply. Unlock all three tones,
          subjects, and Markdown for $1.
        </p>
      </header>

      {banner ? (
        <p
          className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-sm text-sky-100"
          role="status"
        >
          {banner}
        </p>
      ) : null}

      <div className="rounded-2xl border border-white/8 bg-[#0c1526]/80 p-5 sm:p-6">
        <ReplyForm
          onSubmit={generate}
          loading={loading}
          initial={lastForm ?? undefined}
        />
      </div>

      {error ? (
        <p
          className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading && !pack ? (
        <div
          className="mt-8 animate-pulse space-y-3"
          aria-busy="true"
          aria-label="Loading"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : null}

      {!loading && !pack && !error ? (
        <p className="mt-8 text-center text-sm text-slate-500">
          Your replies will show up here — firm, warm, and brief, tuned to what
          they actually wrote.
        </p>
      ) : null}

      {pack ? (
        <div className="mt-10">
          <ResultsView
            pack={pack}
            unlocked={unlocked}
            paymentsConfigured={paymentsConfigured}
            canMock={canMock}
          />
        </div>
      ) : null}
    </div>
  );
}

