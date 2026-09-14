import Link from "next/link";

const benefits = [
  {
    title: "Firm / warm / brief",
    body: "Three paste-ready replies tuned to the same facts — pick the tone that fits the room.",
  },
  {
    title: "Addresses what they wrote",
    body: "We extract deadlines, money, complaints, and asks from your paste — not generic fluff.",
  },
  {
    title: "Subject lines included",
    body: "Unlock gets a subject for each tone so you can send from the inbox without rewriting.",
  },
  {
    title: "Don't say this",
    body: "Short guardrails so you don't escalate, overpromise, or soft-pedal into a fake yes.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-300">
            <span aria-hidden>✉️</span> High-stakes email, calm replies
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-sky-50 sm:text-5xl sm:leading-[1.1]">
            Paste the rough email.
            <span className="block bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              Get 3 professional replies.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
            Angry boss. Awkward client. Vendor chasing payment. ReplyCalm turns
            the mess into firm, warm, and brief paste-ready options — plus
            subjects and a don&apos;t-say note.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-500 px-8 py-3.5 text-base font-semibold text-[#070b14] shadow-[0_0_40px_-8px_rgba(56,189,248,0.55)] transition hover:bg-sky-400 sm:w-auto"
            >
              Compose a reply — free →
            </Link>
            <p className="text-sm text-slate-400">
              Free preview · Full unlock{" "}
              <span className="font-semibold text-sky-300">$1</span>
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-[#0c1526]/50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-sky-50">
            Built for the email you dread sending
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-slate-400">
            No lectures. No therapy-speak. Just replies you can paste.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-white/8 bg-[#070b14]/60 p-5"
              >
                <h3 className="font-semibold text-sky-200">{b.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-sky-50">
            Three steps to a calmer send
          </h2>
          <ol className="mt-8 space-y-4">
            {[
              "Paste the email. Optionally pick who it's for and your goal (resolve, decline, delay, clarify).",
              "Get three tones that address the real issues in the paste — deadlines, money, asks, heat.",
              "Copy, tweak if you want, send. Unlock subjects + Markdown when you need the full pack.",
            ].map((step, i) => (
              <li
                key={step}
                className="flex gap-4 rounded-2xl border border-white/8 bg-[#0c1526]/60 p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-[#070b14]">
                  {i + 1}
                </span>
                <p className="pt-1 text-slate-200">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-transparent p-8 text-center">
          <h2 className="text-2xl font-bold text-sky-50">
            Free preview. $1 for the full pack.
          </h2>
          <p className="mt-3 text-slate-300 leading-relaxed">
            See one warm reply free. Unlock firm + brief, subject lines,
            don&apos;t-say guardrails, and Markdown download for a dollar.
          </p>
          <Link
            href="/create"
            className="mt-6 inline-flex rounded-xl bg-sky-500 px-8 py-3.5 text-base font-semibold text-[#070b14] hover:bg-sky-400"
          >
            Start free →
          </Link>
        </div>
      </section>
    </main>
  );
}
