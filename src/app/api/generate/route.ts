import { NextResponse } from "next/server";
import { generateReply } from "@/lib/generate-reply";
import { isUnlocked } from "@/lib/unlock";
import type { ContextRole, ReplyGoal, ReplyInput, ReplyPack } from "@/lib/types";

const GOALS: ReplyGoal[] = ["resolve", "decline", "delay", "clarify"];
const CONTEXTS: ContextRole[] = ["boss", "client", "vendor", "colleague", "other"];

function redactForFree(pack: ReplyPack): ReplyPack {
  const preview = pack.replies.find((r) => r.tone === pack.previewTone) ?? pack.replies[1];
  return {
    ...pack,
    // Free: show issues + one full reply (warm) without subject; lock others
    replies: pack.replies.map((r) => {
      if (r.tone === preview.tone) {
        return { ...r, subject: "" }; // subjects are unlock-only
      }
      return {
        ...r,
        subject: "",
        body: "",
      };
    }),
    dontSayThis: "",
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<ReplyInput>;
    const message = (body.message ?? "").trim();
    if (message.length < 8) {
      return NextResponse.json(
        { error: "Paste a bit more of the email or message (at least a sentence)." },
        { status: 400 }
      );
    }

    const goal = (body.goal ?? "resolve") as ReplyGoal;
    if (!GOALS.includes(goal)) {
      return NextResponse.json({ error: "Invalid goal." }, { status: 400 });
    }

    let context: ContextRole | undefined;
    if (body.context) {
      if (!CONTEXTS.includes(body.context as ContextRole)) {
        return NextResponse.json({ error: "Invalid context." }, { status: 400 });
      }
      context = body.context as ContextRole;
    }

    const pack = await generateReply({ message, context, goal });
    const unlocked = await isUnlocked();
    const publicPack = unlocked ? pack : redactForFree(pack);

    return NextResponse.json({ pack: publicPack, unlocked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
