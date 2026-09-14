# ReplyCalm

**Paste a rough, angry, awkward, or high-stakes email → get 3 professional reply options (firm / warm / brief) plus subject lines and a “don’t say this” note.**

- **Live:** https://replycalm.vercel.app *(update after first deploy)*
- **Repo:** https://github.com/healthyhabitat/replycalm
- **Stack:** Next.js App Router, TypeScript, Tailwind CSS, Stripe Checkout
- **Monetization:** Free preview (1 reply). Full pack unlock = **$1**.

## Features

- Landing page + `/create` composer
- Form: pasted message (required), optional context (boss/client/vendor/colleague), goal (resolve/decline/delay/clarify)
- Deterministic rewrite engine that **extracts issues** from the paste (deadlines, money, complaints, asks) and addresses them — no API key required
- Free: one warm reply preview · Unlock: all 3 tones + subjects + don’t-say + Markdown
- Stripe Checkout unlock + signed httpOnly cookie; dev mock unlock when Stripe unset
- Safe “payments being set up” UX when Stripe isn’t configured in production

## Run locally

```bash
npm install
cp .env.example .env.local
# Optional: add STRIPE_SECRET_KEY + UNLOCK_COOKIE_SECRET
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Stripe keys, unlock uses a **development-only mock** (`/api/unlock/mock`). In production with no Stripe key, the UI shows “Payments are being set up — check back shortly.”

## Scripts

| Command         | Description              |
|-----------------|--------------------------|
| `npm run dev`   | Local development server |
| `npm run build` | Production build         |
| `npm run start` | Serve production build   |
| `npm test`      | Unit tests (Vitest)      |
| `npm run lint`  | ESLint                   |

## Environment variables

See [`.env.example`](./.env.example). Never commit secrets.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Recommended | Canonical URL for redirects |
| `STRIPE_SECRET_KEY` | Prod payments | Creates $1 Checkout sessions |
| `UNLOCK_COOKIE_SECRET` | Recommended | Signs the unlock cookie |
| `OPENAI_API_KEY` | Optional | Light polish on warm reply |

## Deploy (Vercel)

```bash
npx vercel --prod --yes
# Set env vars in Vercel dashboard: STRIPE_SECRET_KEY, UNLOCK_COOKIE_SECRET, NEXT_PUBLIC_APP_URL
```

## Docs in this repo

- [PLAN.md](./PLAN.md) — problem, audience, GTM, metrics, risks
- [MARKETING.md](./MARKETING.md) — ready-to-post drafts
- [MORNING_BRIEF.md](./MORNING_BRIEF.md) — **read this first** when you wake
- [OPEN_ITEMS.md](./OPEN_ITEMS.md) — secondary checklist

## License

MIT — send the calm version.
