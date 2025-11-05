# Pulse AI

Pulse AI is an AI-driven productivity platform for real estate teams. It combines AI copilots, goal tracking, market insights, and marketing automation inside a single Supabase-backed application built with React and Vite. The app communicates with a suite of Supabase Edge Functions to deliver secure OAuth flows, CRM synchronization, AI content generation, and call automation.

## Table of contents
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Supabase Edge Functions](#supabase-edge-functions)
- [Available scripts](#available-scripts)
- [Testing & quality checks](#testing--quality-checks)
- [Additional documentation](#additional-documentation)

## Features
- **Unified agent workspace** – Dashboard, task lists, goal planning, personal advisor, and intelligence views are lazy-loaded routes protected by authenticated layout wrappers so users land on the dashboard after signing in.
- **AI copilot experiences** – Dedicated pages and components orchestrate role play simulations, copilot chat, and automated task generation powered by Supabase functions and Lovable AI Gateway models.
- **Marketing content studio** – Content Studio, Market, and Agents pages render AI-generated collateral, agent avatars, and market configuration data stored in Supabase tables.
- **Deep integrations** – OAuth callbacks for Google Workspace, Microsoft, Meta (Facebook & Instagram), LinkedIn, and Zoom plus CRM syncing, Twilio telephony, and ElevenLabs voice automation are implemented through Supabase edge functions.
- **Data-driven insights** – Pulse score computation, analytics snapshots, and business planning utilities pull from Supabase and persist metrics for longitudinal tracking.

## Tech stack
- **Frontend:** React 18, Vite, React Router v7, React Hook Form, TanStack Query, Framer Motion.
- **Styling:** Tailwind CSS with shadcn/ui component primitives and Radix UI.
- **State & data:** Context API (`UserContext`) layered on Supabase queries and mutations, plus Zod validators where needed.
- **Backend:** Supabase (PostgreSQL, Auth, Storage) with TypeScript edge functions deployed to the Deno runtime.
- **AI & comms integrations:** Lovable AI Gateway (Gemini + GPT models), ElevenLabs, Twilio, Zoom, Meta, LinkedIn, Microsoft 365, Google Workspace, Lofty CRM.

## Project structure
The repository is organized around feature areas and Supabase backend assets:

```
├── src
│   ├── api/                # REST + Supabase data helpers
│   ├── components/         # Shared UI, dialogs, forms, context providers
│   ├── hooks/              # Custom React hooks (queries, mutations, helpers)
│   ├── pages/              # Route-level screens (Dashboard, Goals, Agents, etc.)
│   ├── integrations/       # Supabase client and third-party integration helpers
│   ├── lib/                # Utility modules shared across the app
│   └── utils/              # Formatting, URL helpers, constants
├── public/                 # Static assets (logos, agent avatars, placeholders)
├── supabase/
│   ├── functions/          # Deno edge functions invoked by the frontend
│   ├── migrations/         # SQL migrations & schema history
│   └── config.toml         # Supabase function routing & auth settings
└── TECHNICAL-DEBT.md       # Prioritized backlog and follow-up tasks
```

## Getting started
1. **Install prerequisites**
   - Node.js 20+
   - npm 10+
   - Supabase CLI (`npm install -g supabase`)
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables** (see the next section) and store them in `.env` or `.env.local`.
4. **Start the Vite dev server**
   ```bash
   npm run dev
   ```
   The app is served at [http://localhost:5173](http://localhost:5173) by default.

## Environment variables
Create a `.env` file in the project root and populate the following keys:

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL used by the browser client. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon (publishable) key for the client SDK. |
| `VITE_SUPABASE_PROJECT_ID` | Project ID used by Supabase tooling. |

For Supabase Edge Functions and integration flows you will also need to configure secrets through the Supabase dashboard or CLI:

- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY`
- `ELEVEN_LABS_API_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- OAuth client IDs/secrets for Google Workspace, Microsoft, Meta, LinkedIn, and Zoom.

See [`MIGRATION-SUMMARY.md`](./MIGRATION-SUMMARY.md) for the complete list of secrets that were provisioned during the migration.

## Supabase Edge Functions
Edge functions live in `supabase/functions`. Each folder contains an `index.ts` entry point that you can test locally:

```bash
supabase functions serve computePulse --env-file supabase/.env
```

When serving functions locally you must provide all required secrets (service role key, Lovable API key, Twilio credentials, etc.) via an `.env` file or the Supabase secrets store. Many functions enforce JWT verification, so authenticate with `supabase login` and run `supabase start` to boot a local stack before invoking them.

Deploy updated functions with:

```bash
supabase functions deploy <function-name>
```

### Clerk → Supabase synchronization checklist

Use the following steps to connect Clerk authentication with the `pdbggzsmgcrguhscynnk` Supabase project and keep Lovable in sync:

1. **Confirm environment variables** – ensure your Lovable environment (local `.env`, Vercel, etc.) includes:
   - `VITE_SUPABASE_URL=https://pdbggzsmgcrguhscynnk.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key from the project>`
   - `VITE_SUPABASE_PROJECT_ID=pdbggzsmgcrguhscynnk`
2. **Store the Clerk signing secret** in Supabase so the webhook can verify inbound requests:
   ```bash
   supabase secrets set CLERK_WEBHOOK_SECRET=sk_live_or_test_value --project-ref pdbggzsmgcrguhscynnk
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key> --project-ref pdbggzsmgcrguhscynnk
   ```
3. **Deploy the edge function** that syncs Clerk users into Supabase:
   ```bash
   npm run deploy:clerk-webhook
   ```
   The script automatically targets the `pdbggzsmgcrguhscynnk` project unless you override `SUPABASE_PROJECT_REF`.
4. **Register the webhook endpoint** in Clerk with the deployed function URL (e.g., `https://<supabase-project>.functions.supabase.co/clerkWebhook`).
5. **Test the flow** – create a new user in Clerk and verify a matching record appears in the `profiles` table inside Supabase and that you can sign in to the Lovable app with those credentials.

## Available scripts
The following npm scripts are defined in `package.json`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot module replacement. |
| `npm run build` | Build the production bundle. |
| `npm run build:dev` | Generate a development-mode build (useful for staging). |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint across the project. |
| `npm run deploy:clerk-webhook` | Deploy the Clerk → Supabase synchronization edge function to the configured project. |

## Testing & quality checks
The project currently ships with an ESLint configuration for static analysis. Run it before submitting a pull request:

```bash
npm run lint
```

You can also add component or integration tests using your preferred tooling (e.g., Vitest, Testing Library) if the project expands.

## Additional documentation
- [`MIGRATION-SUMMARY.md`](./MIGRATION-SUMMARY.md) – exhaustive record of the Base44 → Lovable migration, including integration details and deployment checklist.
- [`TECHNICAL-DEBT.md`](./TECHNICAL-DEBT.md) – prioritized backlog of future enhancements (CRM integrations, AI improvements, call flows, etc.).

