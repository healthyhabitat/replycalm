# ReplyCalm — Morning brief for James

**Read this first.** Everything you need to go live and post is here.

| | |
|---|---|
| **Live app** | https://replycalm.vercel.app |
| **Repo** | https://github.com/healthyhabitat/replycalm |
| **OG image** | https://replycalm.vercel.app/og.png |

> If the Vercel URL differs (project slug suffix), use the URL from the deploy output / Vercel dashboard and update `NEXT_PUBLIC_APP_URL`.

---

## What shipped (done overnight)

- Next.js app: landing, `/create` composer, results (firm / warm / brief), Markdown download, print styles
- Deterministic rewrite engine that **extracts issues** from the paste (deadlines, money, complaints, asks) and addresses them — works **without** OpenAI
- Soft dark + cool blue brand
- Free: 1 warm reply preview · **$1 unlock**: all 3 + subjects + don’t-say + Markdown
- Stripe Checkout unlock + signed httpOnly cookie (`UNLOCK_COOKIE_SECRET`)
- Safe “payments being set up” UX when Stripe isn’t configured
- Marketing drafts in [MARKETING.md](./MARKETING.md)
- Open Graph / Twitter card image wired
- Deployed on Vercel (see live URL above)

---

## How to make the first $1 (ordered)

### 1. Stripe keys

1. Open [Stripe API keys](https://dashboard.stripe.com/apikeys).
2. Copy the **Secret key** (`sk_live_…` for real money, or `sk_test_…` to dry-run).
3. You do **not** need a publishable key for the current Checkout flow.

### 2. Unlock cookie secret

```bash
openssl rand -hex 32
```

### 3. Paste into Vercel

Project → **Settings → Environment Variables** (Production + Preview):

| Exact name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_…` (or `sk_test_…`) |
| `UNLOCK_COOKIE_SECRET` | long random string from step 2 |
| `NEXT_PUBLIC_APP_URL` | your production URL (e.g. `https://replycalm.vercel.app`) |

Optional: `OPENAI_API_KEY` for warm-reply polish.

**Redeploy** after saving env vars.

### 4. Test purchase

1. Open `/create`
2. Paste a tense email → generate
3. Click **Unlock** → Stripe Checkout ($1 or test card `4242…`)
4. Land on `/success` → full pack + Markdown visible
5. Confirm in [Stripe Dashboard](https://dashboard.stripe.com/payments)

### 5. Then post

Use [MARKETING.md](./MARKETING.md). Order: **X → IndieHackers → Reddit**, then a few personal DMs.

---

## Exact env vars (checklist)

```
STRIPE_SECRET_KEY=sk_live_...
UNLOCK_COOKIE_SECRET=<long-random>
NEXT_PUBLIC_APP_URL=https://replycalm.vercel.app
```

## Smoke test (no Stripe)

Paste this on `/create` (goal: Resolve, context: Client):

> This is unacceptable. You missed the Friday deadline for the homepage redesign and the client is furious. The invoice for $4,200 is also still unpaid. Can you send revised files by Wednesday EOD? This is urgent.

You should see issues mentioning deadline / invoice / urgency, and a warm preview that references those themes.
