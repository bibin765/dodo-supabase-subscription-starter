# Dodo Supabase Subscription Starter

<img src="./public/readme-banner.png" />

A **minimal subscription starter kit** built with **Next.js**, **Supabase**, and **Dodo Payments**.
This boilerplate helps you quickly set up a subscription-based SaaS with authentication, payments, and webhooks.

---

## 🚀 Features

- 🔑 **Authentication**: Google OAuth integration via Supabase
- 💳 **Payment Processing**: Complete subscription management with Dodo Payments
- 📦 **Dynamic Plans**: Products with configurable features via metadata
- 📡 **Webhook Integration**: Real-time subscription lifecycle events via Supabase functions
- 🗄️ **Database Management**: PostgreSQL with Drizzle ORM
- 🎨 **Modern UI**: Built with Next.js 15, React 19, and Tailwind CSS
- 📊 **Dashboard**: Comprehensive subscription and billing management
- 📜 **Invoice History**: Complete payment and billing tracking

---

## 📦 Getting Started

### 1. Create a Supabase Project

Go to [Supabase](https://app.supabase.com) and create a new project. Copy the **Project URL** and **Anon Key** from your project settings → API section. These will be used in your environment variables. Then, enable Google OAuth by adding the OAuth client ID and secret from the Google Cloud Console.

### 2. Install dependencies

```bash
bun i
# or
npm install
# or
pnpm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
DODO_PAYMENTS_API_KEY=
DODO_WEBHOOK_SECRET=
DODO_PAYMENTS_ENVIRONMENT= # "test_mode" or "live_mode"
```

### 4. Push database schema

```bash
bun db:push
# or
npm run db:push
# or
pnpm db:push
```

### 5. Deploy Supabase function (for handling webhooks)

```bash
bun deploy:webhook --project-ref [projectId]
# or
npm run deploy:webhook -- --project-ref [projectId]
# or
pnpm deploy:webhook --project-ref [projectId]
```

### 6. Create Products in Dodo Payments

In your **Dodo Payments dashboard**, create products with the following metadata structure:

```json
{
  "features": ["Feature 1", "Feature 2", "Feature 3"]
}
```

The `features` array in the product metadata will be dynamically fetched and displayed as plan features in your application. Each feature will be shown as a badge in the subscription management interface.

### 7. Add webhook in Dodo Payments

In your **Dodo Payments dashboard**, configure the webhook URL pointing to your deployed Supabase function.

---

## ▲ Deploy with Vercel

You can deploy this project instantly using the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/darshansrc/dodo-supabase-subscription-starter&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,DATABASE_URL,DODO_PAYMENTS_API_KEY,DODO_WEBHOOK_SECRET,DODO_PAYMENTS_ENVIRONMENT)

---

## 🔄 How It Works

### 1. **User Authentication**

Users sign in with Google OAuth through Supabase Auth, creating a secure session.

### 2. **Product Discovery**

The application fetches products from Dodo Payments API, including metadata with feature arrays.

### 3. **Plan Selection**

Users can view available plans with their features and pricing, dynamically rendered from product metadata.

### 4. **Subscription Flow**

- New users: Redirected to Dodo Payments checkout
- Existing users: Plan changes processed via Dodo Payments API

### 5. **Webhook Processing**

Real-time events from Dodo Payments are processed by Supabase functions:

- Payment events (succeeded, failed, cancelled)
- Subscription events (active, cancelled, expired, plan_changed)

### 6. **Database Updates**

All subscription and payment data is automatically synchronized with your PostgreSQL database via Drizzle ORM.

### 7. **User Dashboard**

Users can manage their subscriptions, view billing history, and access account settings.

---

## 📚 Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Dodo Payments Docs](https://docs.dodopayments.com)

---

## 🛠 Tech Stack

### Frontend & Framework

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React version
- **TypeScript** - Type safety and development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions

### Backend & Database

- **Supabase** - Backend-as-a-Service (Auth, Database, Functions)
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Type-safe database operations
- **Supabase Functions** - Serverless webhook handling

### Payments & Subscriptions

- **Dodo Payments** - Modern payment processing
- **Webhook Integration** - Real-time subscription events
- **Dynamic Plans** - Configurable product features via metadata

### UI Components

- **Radix UI** - Accessible component primitives
- **Lucide Icons** - Beautiful icon library
- **Sonner** - Toast notifications
- **shadcn/ui** - Pre-built component library

### Development Tools

- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Drizzle Kit** - Database migrations and management
