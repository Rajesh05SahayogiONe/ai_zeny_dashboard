# Run Boss Bridge locally (Windows)

Needs Node.js 20+ (https://nodejs.org). In this folder, open PowerShell or Command Prompt and run:

    npm install
    npm run dev

Then open http://localhost:3000

The Boss Bridge assistant is UI only for now (same as Boss: disabled, "not connected yet"); no chat backend is wired.

Boss Bridge pages (Dashboard, Device, Pusher, Integrations, API tokens, Activity, Subscription, Profile) are UI only too:
routes are in `app/(workspace)/`, their components and sample data in `boss-bridge/` (import alias `@bridge/*`).
Buttons that would call a backend just show a "isn't connected yet" toast.

What was added around the original extract so it runs:
- `package.json`, `tsconfig.json` (path aliases), `next.config.mjs`, `postcss.config.mjs`
- `app/` - the Next.js entry (layout + home page rendering WorkspaceShell + DashboardPage, plus a /setup placeholder)
- `host/` and the small `utils/`, `constants/`, `api/`, `components/`, `routes.ts` files - stand-ins for the
  Boss-only code the extract left out (`@boss/sdk`, auth, data fetchers). They return static sample data
  (see `api/workspace.data.ts`); replace them with your real data layer.
- `public/` - copies of `brand/icons` and the robot/bot icons so the images load.
