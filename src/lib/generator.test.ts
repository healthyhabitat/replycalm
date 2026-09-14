import { describe, it, expect } from "vitest";
import {
  generateReplyPack,
  packToMarkdown,
  hashSeed,
  extractIssues,
} from "./generator";
import type { ReplyInput, ReplyPack } from "./types";

const angryClient: ReplyInput = {
  message: `This is unacceptable. You missed the Friday deadline for the homepage redesign and the client is furious. The invoice for $4,200 is also still unpaid from last month. Can you please send the revised files by Wednesday EOD and confirm when payment will clear? This is urgent.`,
  context: "client",
  goal: "resolve",
};

const declineBoss: ReplyInput = {
  message: `Hey — can you take on the Q3 vendor audit this week? I know you're slammed but I need someone reliable. Please confirm by tomorrow.`,
  context: "boss",
  goal: "decline",
};

const delayVendor: ReplyInput = {
  message: `Just checking in on the shipment. We need the parts by next Monday for our production run. What's the status?`,
  context: "vendor",
  goal: "delay",
};

const clarifyColleague: ReplyInput = {
  message: `Can you update the shared roadmap and also fix the login bug before the demo? Which one is the priority?`,
  context: "colleague",
  goal: "clarify",
};

function blob(pack: ReplyPack): string {
  return [
    ...pack.issues,
    ...pack.replies.map((r) => `${r.subject}\n${r.body}`),
    pack.dontSayThis,
  ].join("\n");
}

describe("hashSeed", () => {
  it("is deterministic", () => {
    expect(hashSeed("abc")).toBe(hashSeed("abc"));
    expect(hashSeed("abc")).not.toBe(hashSeed("abd"));
  });
});

describe("extractIssues", () => {
  it("pulls deadline, money, urgency, and questions from angry client email", () => {
    const issues = extractIssues(angryClient.message);
    const kinds = issues.map((i) => i.kind);
    expect(kinds).toEqual(expect.arrayContaining(["deadline", "money"]));
    const text = issues.map((i) => i.detail.toLowerCase()).join(" ");
    expect(text).toMatch(/friday|wednesday|deadline|\$4|4200|invoice|unpaid|urgent/i);
  });

  it("extracts request from boss ask", () => {
    const issues = extractIssues(declineBoss.message);
    expect(issues.length).toBeGreaterThan(0);
    const text = issues.map((i) => i.detail.toLowerCase()).join(" ");
    expect(text).toMatch(/audit|confirm|tomorrow|vendor/i);
  });

  it("never returns empty for a real paragraph", () => {
    const issues = extractIssues(
      "We should sync sometime about the partnership. Looking forward to hearing from you."
    );
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe("generateReplyPack", () => {
  it("is deterministic for same inputs", () => {
    const a = generateReplyPack(angryClient);
    const b = generateReplyPack(angryClient);
    expect(a.seed).toBe(b.seed);
    expect(a.replies.map((r) => r.body)).toEqual(b.replies.map((r) => r.body));
    expect(a.replies.map((r) => r.subject)).toEqual(
      b.replies.map((r) => r.subject)
    );
  });

  it("returns firm, warm, and brief tones", () => {
    const pack = generateReplyPack(angryClient);
    expect(pack.replies.map((r) => r.tone)).toEqual(["firm", "warm", "brief"]);
    for (const r of pack.replies) {
      expect(r.body.length).toBeGreaterThan(40);
      expect(r.subject.length).toBeGreaterThan(3);
    }
  });

  it("addresses actual content themes — not generic fluff", () => {
    const pack = generateReplyPack(angryClient);
    const text = blob(pack).toLowerCase();
    // Must reference concrete themes from the paste
    expect(
      /friday|wednesday|deadline|invoice|4,?200|payment|unpaid|urgent|homepage|redesign/.test(
        text
      )
    ).toBe(true);
    // Must not lecture or use meta fluff
    expect(text).not.toMatch(
      /as an ai|i understand you're angry but you should|calm down|take a deep breath|emotional intelligence lecture/i
    );
  });

  it("decline goal produces a clear no path", () => {
    const pack = generateReplyPack(declineBoss);
    const text = blob(pack).toLowerCase();
    expect(text).toMatch(/can'?t|unable|decline|no |not (?:able|going)/i);
    expect(pack.dontSayThis.toLowerCase()).toMatch(/fake yes|soft-pedal|maybe|clear no/i);
  });

  it("delay goal avoids vague soon-only language in dont-say", () => {
    const pack = generateReplyPack(delayVendor);
    expect(pack.dontSayThis.toLowerCase()).toMatch(/soon|asap|date/i);
    const text = blob(pack).toLowerCase();
    expect(text).toMatch(/monday|shipment|parts|date|time/i);
  });

  it("clarify goal asks for detail", () => {
    const pack = generateReplyPack(clarifyColleague);
    const text = blob(pack).toLowerCase();
    expect(text).toMatch(/clarif|criteria|priority|bug|roadmap|demo/i);
  });

  it("rejects tiny pastes", () => {
    expect(() =>
      generateReplyPack({ message: "hi", goal: "resolve" })
    ).toThrow(/Paste a bit more/i);
  });

  it("packToMarkdown includes all tones and dont-say", () => {
    const pack = generateReplyPack(angryClient);
    const md = packToMarkdown(pack);
    expect(md).toMatch(/## Firm reply/);
    expect(md).toMatch(/## Warm reply/);
    expect(md).toMatch(/## Brief reply/);
    expect(md).toMatch(/Don't say this/);
    expect(md).toMatch(/ReplyCalm/);
  });

  it("brief body is shorter than firm", () => {
    const pack = generateReplyPack(angryClient);
    const firm = pack.replies.find((r) => r.tone === "firm")!;
    const brief = pack.replies.find((r) => r.tone === "brief")!;
    expect(brief.body.length).toBeLessThan(firm.body.length);
  });
});
