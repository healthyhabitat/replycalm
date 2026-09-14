export type ContextRole = "boss" | "client" | "vendor" | "colleague" | "other";
export type ReplyGoal = "resolve" | "decline" | "delay" | "clarify";
export type Tone = "firm" | "warm" | "brief";

export interface ReplyInput {
  message: string;
  context?: ContextRole;
  goal: ReplyGoal;
}

export interface ReplyOption {
  tone: Tone;
  label: string;
  subject: string;
  body: string;
}

export interface ReplyPack {
  issues: string[];
  previewTone: Tone;
  replies: ReplyOption[];
  dontSayThis: string;
  generatedAt: string;
  seed: string;
}

export interface GenerateResult {
  pack: ReplyPack;
  unlocked: boolean;
}
