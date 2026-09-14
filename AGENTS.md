# ReplyCalm — agent notes

- Product: email → 3 calm replies (firm/warm/brief) + subjects + don’t-say
- Engine: `src/lib/generator.ts` (deterministic; must address extracted issues)
- Unlock cookie: `rc_unlock`
- Free = 1 warm reply preview (no subjects); $1 = full pack + Markdown
- Never leak Stripe/env names in client errors — use `checkout-errors.ts`
