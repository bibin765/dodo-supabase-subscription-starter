# Dodo Supabase Subscription Starter

<img src="./public/readme-banner.png" />

A **minimal subscription starter kit** built with **Next.js**, **Supabase**, and **Dodo Payments**.
This boilerplate helps you quickly set up a subscription-based SaaS with authentication, payments, and webhooks.

---

## 🚀 Features

- 🔑 Supabase google authentication
- 💳 Payment & Subscription management with Dodo Payments
- 📡 Webhook support for subscription lifecycle events via supabase functions

---

## 📦 Getting Started

### 1. Install dependencies

```bash
bun i
# or
npm install
# or
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
DODO_PAYMENTS_API_KEY=
DODO_WEBHOOK_SECRET=
DODO_PAYMENTS_ENVIRONMENT= # "test_mode" or "live_mode"
```

### 3. Push database schema

```bash
bun db:push
# or
npm run db:push
# or
pnpm db:push
```

### 4. Deploy Supabase function (for handling webhooks)

```bash
bun deploy:webhook --project-ref [projectId]
# or
npm run deploy:webhook -- --project-ref [projectId]
# or
pnpm deploy:webhook --project-ref [projectId]
```

### 5. Add webhook in Dodo Payments

In your **Dodo Payments dashboard**, configure the webhook URL pointing to your deployed Supabase function.

---

## 📚 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Dodo Payments Docs](https://docs.dodopayments.com)

---

## 🛠 Tech Stack

```yaml
- Next.js: https://nextjs.org/
- Supabase: https://supabase.com/
- Dodo Payments: https://dodopayments.com/
```
