import type {
  ContextRole,
  ReplyGoal,
  ReplyInput,
  ReplyOption,
  ReplyPack,
  Tone,
} from "./types";

/** Deterministic hash for seeding template choices */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], seed: number, salt = 0): T {
  return arr[(seed + salt) % arr.length];
}

function cleanMessage(raw: string): string {
  return raw.trim().replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ");
}

function sentenceCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Issue extraction ───────────────────────────────────────────────────────

export type IssueKind =
  | "deadline"
  | "money"
  | "blame"
  | "request"
  | "question"
  | "urgency"
  | "schedule"
  | "quality"
  | "scope"
  | "apology_needed"
  | "info";

export interface ExtractedIssue {
  kind: IssueKind;
  label: string;
  detail: string;
}

const DEADLINE_RE =
  /\b(?:by|before|due|deadline|eod|eow|asap|end of (?:day|week|month)|no later than|must (?:be|have)|need(?:ed)? (?:by|before))\b[^.\n!?]{0,60}/gi;
const DATE_RE =
  /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tomorrow|tonight|this week|next week|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*\d{0,2}\b|\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/gi;
const MONEY_RE =
  /\b(?:\$[\d,]+(?:\.\d{2})?|\d+\s*(?:usd|dollars?)|invoice|payment|pay(?:ment)?|refund|budget|cost|fee|price|overdue|unpaid|billing|charge)\b[^.\n!?]{0,50}/gi;
const BLAME_RE =
  /\b(?:you (?:failed|missed|ignored|forgot|dropped|broke|didn't|did not|never)|unacceptable|frustrated|disappointed|upset|angry|concern(?:ed)?|complaint|issue with|problem with|not (?:okay|acceptable|good enough))\b[^.\n!?]{0,60}/gi;
const REQUEST_RE =
  /\b(?:please|can you|could you|would you|need you to|I need|we need|send|provide|share|confirm|approve|review|update|fix|complete|deliver)\b[^.\n!?]{0,70}/gi;
const QUESTION_RE = /[^.!?\n]*\?/g;
const URGENCY_RE =
  /\b(?:urgent|asap|immediately|right away|as soon as possible|critical|time[- ]sensitive|escalat(?:e|ion)|priority)\b[^.\n!?]{0,40}/gi;
const SCHEDULE_RE =
  /\b(?:meeting|call|zoom|calendar|reschedule|availability|free|slot|book|schedule|sync)\b[^.\n!?]{0,50}/gi;
const QUALITY_RE =
  /\b(?:bug|broken|error|wrong|incorrect|quality|mistake|typo|regression|not working|doesn't work|failed)\b[^.\n!?]{0,50}/gi;
const SCOPE_RE =
  /\b(?:scope|out of scope|extra|additional|change request|feature|requirement|spec)\b[^.\n!?]{0,50}/gi;

function clip(s: string, max = 90): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

function firstMatch(re: RegExp, text: string): string | null {
  re.lastIndex = 0;
  const m = re.exec(text);
  return m ? clip(m[0]) : null;
}

function allMatches(re: RegExp, text: string, limit = 3): string[] {
  re.lastIndex = 0;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) && out.length < limit) {
    const c = clip(m[0]);
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

/** Extract concrete themes from the pasted message — never invent fluff. */
export function extractIssues(message: string): ExtractedIssue[] {
  const text = cleanMessage(message);
  const issues: ExtractedIssue[] = [];
  const seen = new Set<string>();

  const add = (kind: IssueKind, label: string, detail: string) => {
    const key = `${kind}:${detail.toLowerCase().slice(0, 40)}`;
    if (seen.has(key) || !detail.trim()) return;
    seen.add(key);
    issues.push({ kind, label, detail: sentenceCase(detail) });
  };

  const deadlines = [
    ...allMatches(DEADLINE_RE, text),
    ...allMatches(DATE_RE, text),
  ];
  for (const d of deadlines.slice(0, 2)) {
    add("deadline", "Deadline / timing", d);
  }

  const money = allMatches(MONEY_RE, text, 2);
  for (const m of money) add("money", "Money / payment", m);

  const blame = allMatches(BLAME_RE, text, 2);
  for (const b of blame) add("blame", "Complaint / tension", b);

  const quality = allMatches(QUALITY_RE, text, 2);
  for (const q of quality) add("quality", "Quality / defect", q);

  const urgency = firstMatch(URGENCY_RE, text);
  if (urgency) add("urgency", "Urgency", urgency);

  const schedule = allMatches(SCHEDULE_RE, text, 2);
  for (const s of schedule) add("schedule", "Scheduling", s);

  const scope = firstMatch(SCOPE_RE, text);
  if (scope) add("scope", "Scope / change", scope);

  const questions = allMatches(QUESTION_RE, text, 3);
  for (const q of questions) {
    if (q.length > 8) add("question", "Question asked", q);
  }

  const requests = allMatches(REQUEST_RE, text, 3);
  for (const r of requests) {
    // skip if already captured as deadline/money-ish
    if (/by |before |due |invoice|payment|pay /i.test(r) && issues.some((i) => i.kind === "deadline" || i.kind === "money")) {
      continue;
    }
    add("request", "Ask / request", r);
  }

  // Fallback: first substantial sentence as "info"
  if (issues.length === 0) {
    const first = text.split(/[.!?\n]/).map((s) => s.trim()).find((s) => s.length > 20);
    add(
      "info",
      "Core topic",
      first ? clip(first, 100) : clip(text, 100) || "the points you raised"
    );
  }

  return issues.slice(0, 6);
}

export function issueLabels(issues: ExtractedIssue[]): string[] {
  return issues.map((i) => {
    const short = i.detail.length > 70 ? i.detail.slice(0, 67) + "…" : i.detail;
    return `${i.label}: ${short}`;
  });
}

// ─── Context / goal helpers ─────────────────────────────────────────────────

function roleLabel(ctx?: ContextRole): string {
  switch (ctx) {
    case "boss":
      return "your manager";
    case "client":
      return "the client";
    case "vendor":
      return "the vendor";
    case "colleague":
      return "your colleague";
    default:
      return "them";
  }
}

function greeting(ctx: ContextRole | undefined, seed: number): string {
  if (ctx === "boss") return pick(["Hi,", "Hello,", "Hi —"], seed, 1);
  if (ctx === "client") return pick(["Hi,", "Hello,", "Good morning,"], seed, 2);
  if (ctx === "vendor") return pick(["Hi,", "Hello,"], seed, 3);
  return pick(["Hi,", "Hello,", "Hey,"], seed, 4);
}

function signOff(ctx: ContextRole | undefined, tone: Tone, seed: number): string {
  if (tone === "brief") return pick(["Thanks", "Best", "—"], seed, 20);
  if (ctx === "boss") return pick(["Thanks", "Best regards", "Appreciate it"], seed, 21);
  if (ctx === "client") return pick(["Best regards", "Thank you", "Warm regards"], seed, 22);
  return pick(["Thanks", "Best", "Appreciate it"], seed, 23);
}

function goalVerb(goal: ReplyGoal): string {
  switch (goal) {
    case "resolve":
      return "resolve this";
    case "decline":
      return "decline politely but clearly";
    case "delay":
      return "buy a little time without going silent";
    case "clarify":
      return "clarify before committing";
  }
}

// ─── Reply body builders ────────────────────────────────────────────────────

function bulletIssues(issues: ExtractedIssue[], max = 3): string {
  return issues
    .slice(0, max)
    .map((i) => `• ${sentenceCase(i.detail.replace(/\?$/, ""))}`)
    .join("\n");
}

function acknowledgeLine(issues: ExtractedIssue[], seed: number): string {
  const top = issues[0];
  if (!top) return "Thanks for your note — I read it carefully.";
  const templates = [
    `Thanks for flagging this — I see the concern around ${clip(top.detail, 55).toLowerCase()}.`,
    `I've read your message about ${clip(top.detail, 55).toLowerCase()}.`,
    `Thanks for sending this over. I'm focusing on ${clip(top.detail, 55).toLowerCase()}.`,
  ];
  return pick(templates, seed, 10);
}

function addressBlock(
  issues: ExtractedIssue[],
  goal: ReplyGoal,
  tone: Tone
): string {
  const lines: string[] = [];
  const kinds = new Set(issues.map((i) => i.kind));

  for (const issue of issues.slice(0, 4)) {
    switch (issue.kind) {
      case "deadline":
        if (goal === "delay") {
          lines.push(
            tone === "brief"
              ? `On timing (${clip(issue.detail, 40)}): I need a short extension and will confirm a firm date today.`
              : `On the timing you mentioned (${clip(issue.detail, 50)}): I want to be realistic rather than optimistic. I'll confirm a revised date by end of day so you're not left guessing.`
          );
        } else if (goal === "decline") {
          lines.push(
            `I can't commit to ${clip(issue.detail, 45).toLowerCase()} as stated. Here's what I can do instead — see below.`
          );
        } else if (goal === "clarify") {
          lines.push(
            `Before I lock ${clip(issue.detail, 45).toLowerCase()}, I need one clarification so we don't miss the real constraint.`
          );
        } else {
          lines.push(
            tone === "brief"
              ? `Timing: I'll hit ${clip(issue.detail, 40).toLowerCase()} or flag a blocker before then.`
              : `On timing — I'll treat ${clip(issue.detail, 45).toLowerCase()} as the target and update you the moment anything threatens it.`
          );
        }
        break;
      case "money":
        if (goal === "decline") {
          lines.push(
            `On the payment / cost point (${clip(issue.detail, 40)}): I can't approve that as written. Happy to discuss a revised number or scope that fits.`
          );
        } else if (goal === "clarify") {
          lines.push(
            `On ${clip(issue.detail, 40).toLowerCase()}: can you confirm the exact amount, due date, and what it covers so I can act cleanly?`
          );
        } else {
          lines.push(
            tone === "brief"
              ? `Payment: I'll handle ${clip(issue.detail, 40).toLowerCase()} and confirm once done.`
              : `Regarding ${clip(issue.detail, 45).toLowerCase()}: I'll take care of my side and send confirmation when it's settled.`
          );
        }
        break;
      case "blame":
      case "quality":
        if (goal === "decline") {
          lines.push(
            `I hear the frustration on ${clip(issue.detail, 40).toLowerCase()}. I disagree with parts of that framing — happy to walk through facts, not heat.`
          );
        } else {
          lines.push(
            tone === "warm"
              ? `You're right to call out ${clip(issue.detail, 40).toLowerCase()}. Here's how I'll make it right without more back-and-forth.`
              : `Acknowledged on ${clip(issue.detail, 40).toLowerCase()}. I'll own the fix and keep you posted on progress.`
          );
        }
        break;
      case "question":
        lines.push(
          goal === "clarify" || goal === "delay"
            ? `On your question (“${clip(issue.detail, 50)}”): I need one more detail before I give you a precise answer.`
            : `On your question (“${clip(issue.detail, 50)}”): ${goal === "decline" ? "the short answer is no for now — here's the alternative." : "here's the straight answer."}`
        );
        break;
      case "request":
        if (goal === "decline") {
          lines.push(
            `I can't take on “${clip(issue.detail, 45)}” as requested. Alternative: I'll [state what you *can* do] so you're not stuck.`
          );
        } else if (goal === "delay") {
          lines.push(
            `On “${clip(issue.detail, 45)}”: I can do this, but not immediately. I'll send a date this afternoon.`
          );
        } else if (goal === "clarify") {
          lines.push(
            `Before I action “${clip(issue.detail, 45)}”, I need to confirm success criteria so we don't redo work.`
          );
        } else {
          lines.push(
            tone === "brief"
              ? `Request noted — I'll handle “${clip(issue.detail, 40)}” and confirm when done.`
              : `I'll take care of “${clip(issue.detail, 45)}” and reply once it's complete (or if I hit a blocker).`
          );
        }
        break;
      case "schedule":
        lines.push(
          goal === "delay"
            ? `On scheduling (${clip(issue.detail, 40)}): I can't lock a slot yet — I'll send 2–3 options within a day.`
            : `For ${clip(issue.detail, 40).toLowerCase()}: please send 2–3 times that work, or I'll propose options shortly.`
        );
        break;
      case "urgency":
        lines.push(
          tone === "firm"
            ? `I understand the urgency. Here's the plan so we move fast without creating new problems.`
            : `Got the urgency — prioritizing this accordingly.`
        );
        break;
      case "scope":
        lines.push(
          goal === "decline"
            ? `That looks like a scope change (${clip(issue.detail, 40)}). I need to decline adding it unpaid / unscheduled — we can quote it separately.`
            : `On scope (${clip(issue.detail, 40)}): let's confirm what's in vs out before I proceed.`
        );
        break;
      default:
        lines.push(
          `On ${clip(issue.detail, 50).toLowerCase()}: I'll address this directly in my next update.`
        );
    }
  }

  // Ensure goal-specific closer if not already covered
  if (goal === "resolve" && !kinds.has("request") && lines.length < 2) {
    lines.push(
      "Next step on my side: I'll close the loop and send a short confirmation when it's done."
    );
  }
  if (goal === "decline" && lines.length < 2) {
    lines.push(
      "I'm saying no to the ask as written — not to the relationship. Happy to discuss a workable alternative."
    );
  }
  if (goal === "delay" && !kinds.has("deadline")) {
    lines.push(
      "I need a bit more time to do this properly. I'll come back with a firm date rather than a vague 'soon'."
    );
  }
  if (goal === "clarify") {
    lines.push(
      "Once I have that answer, I can move immediately — without guessing."
    );
  }

  return lines.slice(0, tone === "brief" ? 2 : 4).join("\n\n");
}

function closingLine(goal: ReplyGoal, tone: Tone, seed: number): string {
  const map: Record<ReplyGoal, string[]> = {
    resolve: [
      "I'll follow through and keep you updated.",
      "Consider it on my list — I'll confirm when complete.",
      "Happy to jump on a quick call if anything's still unclear.",
    ],
    decline: [
      "Thanks for understanding — open to another path if useful.",
      "I wanted to be clear rather than overpromise.",
      "Let me know if a different scope would work.",
    ],
    delay: [
      "Appreciate your patience — you'll have a firm update soon.",
      "I'll protect the quality by taking the time, then move fast.",
      "You'll hear from me with a date, not radio silence.",
    ],
    clarify: [
      "Once clarified, I can execute without churn.",
      "Looking forward to the details so we can move.",
      "Reply with those answers and I'll turn it around quickly.",
    ],
  };
  if (tone === "brief") return pick(["Thanks.", "Appreciate it.", "Will do."], seed, 30);
  return pick(map[goal], seed, 31);
}

function buildBody(
  issues: ExtractedIssue[],
  goal: ReplyGoal,
  tone: Tone,
  ctx: ContextRole | undefined,
  seed: number
): string {
  const g = greeting(ctx, seed);
  const ack = acknowledgeLine(issues, seed);
  const mid = addressBlock(issues, goal, tone);
  const close = closingLine(goal, tone, seed);
  const sign = signOff(ctx, tone, seed);

  if (tone === "brief") {
    const firstIssue = issues[0]?.detail;
    const briefMid =
      goal === "decline"
        ? `I can't do that as requested${firstIssue ? ` (${clip(firstIssue, 40)})` : ""}. Happy to discuss an alternative.`
        : goal === "delay"
          ? `I need a bit more time${firstIssue ? ` on ${clip(firstIssue, 40).toLowerCase()}` : ""}. I'll send a firm date today.`
          : goal === "clarify"
            ? `Quick clarifier before I proceed${firstIssue ? ` on ${clip(firstIssue, 40).toLowerCase()}` : ""} — what's the success criteria / deadline?`
            : mid.split("\n\n")[0] || `I'll handle this and confirm when done.`;
    return `${g}\n\n${briefMid}\n\n${sign}`;
  }

  if (tone === "firm") {
    return `${g}\n\n${ack}\n\n${mid}\n\n${close}\n\n${sign}`;
  }

  // warm
  const warmAck = ack.replace(
    /^Thanks/,
    pick(["Really appreciate you sending this", "Thanks so much for writing", "Grateful you flagged this"], seed, 40)
  );
  return `${g}\n\n${warmAck}\n\n${mid}\n\n${close}\n\n${sign}`;
}

function buildSubject(
  issues: ExtractedIssue[],
  goal: ReplyGoal,
  tone: Tone,
  seed: number
): string {
  const top = issues[0];
  const topic = top
    ? clip(top.detail.replace(/^(please|can you|could you)\s+/i, ""), 42)
    : "your message";

  const firm = [
    `Re: ${topic}`,
    `Update on ${topic}`,
    `Clear next step — ${topic}`,
  ];
  const warm = [
    `Following up on ${topic}`,
    `Thanks — re: ${topic}`,
    `Quick note on ${topic}`,
  ];
  const brief = [
    `Re: ${topic}`,
    `Re: ${goal === "decline" ? "your request" : topic}`,
    `${goal === "delay" ? "Timing update" : goal === "clarify" ? "Quick clarifier" : "Update"} — ${clip(topic, 30)}`,
  ];

  const pool = tone === "firm" ? firm : tone === "warm" ? warm : brief;
  let s = pick(pool, seed, 50 + tone.charCodeAt(0));
  if (goal === "decline" && tone === "firm") {
    s = pick([`Can't commit as asked — alternative`, `Re: ${topic} (decline + option)`], seed, 55);
  }
  return s.replace(/\s+/g, " ").trim();
}

function buildDontSay(
  issues: ExtractedIssue[],
  goal: ReplyGoal,
  message: string,
  seed: number
): string {
  const lower = message.toLowerCase();
  const tips: string[] = [];

  if (/stupid|idiot|incompetent|hate|ridiculous|shut up|whatever/i.test(lower) || issues.some((i) => i.kind === "blame")) {
    tips.push(
      "Don't mirror their heat. Skip sarcasm, ALL CAPS, and 'as I already said'."
    );
  }
  if (goal === "decline") {
    tips.push(
      "Don't soft-pedal into a fake yes ('maybe', 'I'll try'). A clear no + alternative is kinder."
    );
  }
  if (goal === "delay") {
    tips.push(
      "Don't say 'soon' or 'ASAP' with no date — that creates another chase email."
    );
  }
  if (goal === "resolve" && issues.some((i) => i.kind === "deadline" || i.kind === "urgency")) {
    tips.push(
      "Don't overpromise a deadline you can't hit. Under-commit, then deliver."
    );
  }
  if (issues.some((i) => i.kind === "money")) {
    tips.push(
      "Don't discuss exact blame for money issues in writing without facts — stick to amounts, dates, and next steps."
    );
  }
  if (issues.some((i) => i.kind === "quality" || i.kind === "blame")) {
    tips.push(
      "Don't write 'not my fault' or name colleagues. Own the path forward."
    );
  }
  tips.push(
    pick(
      [
        "Don't lecture them about tone or process — just deliver the reply.",
        "Don't CC the world to 'cover yourself' unless necessary.",
        "Don't send while angry — if needed, wait 10 minutes, then paste one of these.",
      ],
      seed,
      70
    )
  );

  // Dedupe and format as one short note
  const unique = [...new Set(tips)].slice(0, 3);
  return unique.map((t, i) => `${i + 1}. ${t}`).join("\n");
}

const TONE_META: Record<Tone, string> = {
  firm: "Firm",
  warm: "Warm",
  brief: "Brief",
};

/**
 * Deterministic reply pack — no API required.
 * Same inputs → same outputs. Replies address extracted issues from the paste.
 */
export function generateReplyPack(input: ReplyInput): ReplyPack {
  const message = cleanMessage(input.message);
  if (!message || message.length < 8) {
    throw new Error("Paste a bit more of the email or message (at least a sentence).");
  }

  const goal = input.goal;
  const context = input.context;
  const issues = extractIssues(message);
  const seedStr = `${message}|${context ?? ""}|${goal}`;
  const seed = hashSeed(seedStr);

  const tones: Tone[] = ["firm", "warm", "brief"];
  const replies: ReplyOption[] = tones.map((tone, idx) => ({
    tone,
    label: TONE_META[tone],
    subject: buildSubject(issues, goal, tone, seed + idx * 17),
    body: buildBody(issues, goal, tone, context, seed + idx * 17),
  }));

  const dontSayThis = buildDontSay(issues, goal, message, seed);

  return {
    issues: issueLabels(issues),
    previewTone: "warm",
    replies,
    dontSayThis,
    generatedAt: new Date().toISOString(),
    seed: seed.toString(16),
  };
}

/** Markdown export of a full pack */
export function packToMarkdown(pack: ReplyPack): string {
  const sections = pack.replies
    .map(
      (r) => `## ${r.label} reply

**Subject:** ${r.subject}

${r.body}
`
    )
    .join("\n");

  return `# ReplyCalm — reply pack

## Issues detected
${pack.issues.map((i) => `- ${i}`).join("\n")}

${sections}
## Don't say this
${pack.dontSayThis}

---
Generated with ReplyCalm · ${pack.generatedAt}
`;
}

/** Public helper for tests / debugging */
export function summarizeForGoal(goal: ReplyGoal, context?: ContextRole): string {
  return `Goal: ${goalVerb(goal)} with ${roleLabel(context)}`;
}
