import { generateReplyPack } from "./generator";
import type { ReplyInput, ReplyPack } from "./types";

/**
 * Generate a reply pack. Deterministic engine always.
 * Optional OPENAI_API_KEY can lightly polish the warm body (best-effort).
 */
export async function generateReply(input: ReplyInput): Promise<ReplyPack> {
  const pack = generateReplyPack(input);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return pack;

  try {
    const warm = pack.replies.find((r) => r.tone === "warm");
    if (!warm) return pack;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        max_tokens: 320,
        messages: [
          {
            role: "system",
            content:
              "You lightly polish a professional email reply. Keep the same meaning, facts, and structure. Never lecture the sender. Return ONLY the email body, no subject, no markdown fences.",
          },
          {
            role: "user",
            content: `Original message:\n${input.message}\n\nDraft reply:\n${warm.body}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return pack;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const polished = data.choices?.[0]?.message?.content?.trim();
    if (polished && polished.length > 40) {
      return {
        ...pack,
        replies: pack.replies.map((r) =>
          r.tone === "warm" ? { ...r, body: polished } : r
        ),
      };
    }
  } catch {
    // graceful fallback
  }
  return pack;
}
