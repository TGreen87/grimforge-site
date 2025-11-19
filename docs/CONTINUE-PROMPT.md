## Continuation Prompt (New Chat)

_Last updated: 2025-11-20_

Paste the following into a fresh Codex session whenever you need to resume work on grimforge-site with MCP tools enabled.

---

### 1. Project Overview & Analysis
- **Type**: Next.js 15 App Router e-commerce site with Supabase (Auth/DB), Stripe (Payments), and Refine/AntD (Admin).
- **State**: Transitional. Moving from a legacy SPA (in `src/`) to App Router (`app/`).
    - **Cleanup**: `src/__legacy_pages`, `src/App.tsx`, `src/main.tsx` were deleted on 2025-11-20.
    - **Migrations**: `supabase/migrations/20250122_rls_test_matrix.sql` was moved to `tests/sql/`.
- **Branch Strategy**:
    - `dev_stripe`: **Active feature branch** for payments and current development. Work here.
    - `main`: Production/Live.
    - **Workflow**: No PRs. Push directly to `dev_stripe` to trigger Netlify branch deploys.
- **Testing Strategy**: **Remote-first**.
    - Local environment is unstable for full e2e.
    - Rely on Netlify branch deploys (e.g., `https://dev-stripe--obsidianriterecords.netlify.app`) for verification.
    - Use the **Browser Tool** to verify the deployed site.

### 2. Current Status (2025-11-20)
- **Build**: `npm run build` **PASSES** on `dev_stripe` (Edge Runtime errors were resolved).
- **Lint/Type-Check**: **PASSES** (fixed `auspost.ts`, `useActiveSection.ts`, `checkout/route.ts`, `webhook/route.ts`).
- **Tests**: `npm test` **FAILS** (12+ files).
    - *Reason*: Known issues with admin typings and Stripe/AusPost mocks.
    - *Action*: Ignore local test failures unless specifically tasked to fix them.
- **Browser Tool**:
    - *Issue*: Failed repeatedly with `ECONNREFUSED` in the previous session.
    - *Status*: User stated they "fixed the browser" (profile/extension issue), so it *should* work now. **Verify this first.**

### 3. Integrations
- **Stripe**:
    - Configured in `lib/stripe.ts`.
    - Checkout flow: `app/api/checkout/route.ts` -> Stripe Hosted Checkout.
    - Webhook: `app/api/stripe/webhook/route.ts` handles `checkout.session.completed`.
    - Mode: Currently in **Test Mode**.
- **Supabase**:
    - Configured in `lib/supabase`.
    - RLS policies are active.

### 4. Immediate Goals (Next Session)
1.  **Verify Browser Tool**: Run a simple check (e.g., load google.com) to confirm the tool is active.
2.  **Remote Verification**:
    - Visit https://dev-stripe--obsidianriterecords.netlify.app.
    - Confirm site loads (200 OK).
3.  **Stripe Checkout Smoke Test**:
    - Add a product to cart -> Checkout -> Verify Stripe Test Mode page loads.
4.  **Admin Typings (Optional)**: If requested, address the remaining "admin typings" debt to get `npm test` green.

### 5. Playbook
1.  **Check Environment**: Run `git status` to confirm you are on `dev_stripe`.
2.  **Browser Check**: Run a simple browser task to confirm the tool is active.
3.  **Deploy Check**: Use the browser to visit the `dev_stripe` URL.
4.  **Code Health**: `npm run build` should pass. `npm run type-check` should pass.

---
