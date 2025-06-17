# MVP Development Checklist – **Wordwise**

Each phase is ordered by *dependencies*: items in **Phase 1** have no prereqs; later phases depend on completion of the earlier ones.
Use the status notation `[ ]`, `[X]`, `[~]`, `[!]` exactly as shown.
All sub-items are **independent, testable, rollback-safe** sentences your AI developer can implement one at a time.

---

## [X] Phase 1 – Foundation
*Essential tooling, infrastructure, and scaffolding that all other work relies on.*

### [X] Feature 1 – Project Scaffolding
- [X] Generate a **Next.js 14** TypeScript project with the App Router and strict ESLint config.
- [X] Install and configure **Tailwind CSS** with a `tailwind.config.ts` extending shadcn/ui presets.
- [X] Add the **shadcn/ui** generator and seed the default theme tokens.
- [X] Create a shared ESLint + Prettier setup and CI check to enforce consistent formatting.

### [X] Feature 2 – Version Control & Deployment Pipeline
- [X] Initialize a Git repo, add a `.github/workflows/ci.yml` that lints, builds, and runs tests on each push.
- [X] Create a **Vercel** project, link the Git repo, and set automatic preview deployments.
- [X] Configure environment-variable placeholders on Vercel (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- [X] Add a deploy-status badge to the README that reflects Vercel production builds.

### [X] Feature 3 – Supabase Project & SDK Integration
- [X] Provision a **Supabase** project and Postgres database named `wordwise_prod`.
- [X] Install `@supabase/supabase-js` and expose a typed client factory (`lib/supabaseClient.ts`).
- [X] Store Supabase keys in `.env` and verify connectivity with a health-check Edge Function.

### [X] Feature 4 – Authentication (baseline)
- [X] Email/password sign-up, sign-in, and sign-out flows using **Supabase Auth**.
- [X] Persist the auth session in `localStorage` and auto-refresh on app reload—no user action required.
- [X] Protect all app routes with an HOC that redirects unauthenticated users to `/login`.
- [X] Expose a `useUser()` React hook that returns current user data or `null`.

---

## [X] Phase 2 – Data Layer
*Database schema, security, and client-side data services.*

### [X] Feature 1 – Database Schema
- [X] Create a `documents` table (`id`, `user_id`, `title`, `content`, `updated_at`) with UUID PKs.
- [X] Create a `profiles` table (`id`, `full_name`, `avatar_url`) keyed by the Supabase auth UID.
- [X] Add helpful indexes on `documents.user_id` and `documents.updated_at` for fast queries.
- [X] Set up Drizzle ORM schema with full TypeScript type safety (replaces manual type generation).

### [X] Feature 2 – Row-Level Security Policies
- [X] Enable RLS on `documents` and `profiles`.
- [X] Add policy: logged-in user can `select | insert | update | delete` rows where `auth.uid() = user_id`.
- [X] Create a negative test that proves cross-account access is rejected with HTTP 401.
- [X] Document the RLS rules in `docs/security.md`.

### [X] Feature 3 – Document Service
- [X] Implement CRUD helpers (`createDoc`, `renameDoc`, `deleteDoc`, `saveDoc`) in `lib/documentService.ts`.
- [X] Wrap each helper with **Next.js API Routes** for minimal latency from the browser.
- [X] Expose React Query hooks (`useDocuments`, `useDocument`) for cache-aware data fetching.
- [X] Write functional tests with real API calls ensuring each helper resolves the correct shape.

### [X] Feature 4 – Autosave Engine
- [X] Detect "dirty" editor state and schedule a debounced **10 s** autosave via `saveDoc`.
- [X] Show a subtle `Saving… ✓ Saved` status in the editor footer.
- [X] Retry failed autosaves with exponential back-off up to 3 attempts before surfacing an error toast.
- [X] Emit a custom event (`doc:saved`) so other modules can react (e.g., token tracking).

---

## [X] Phase 3 – Interface Layer
*Visible UI components and user journeys built atop the data layer.*

### [X] Feature 1 – Editor Shell
- [X] Render a distraction-free `contenteditable` area inside a shadcn `Card` component.
- [X] Maintain editor state in React, syncing to the `documents.content` field.
- [X] Display a placeholder "Start writing…" when the document is empty.
- [X] Ensure keystroke handling keeps average frame time < 16 ms for docs up to 10 kB.

### [X] Feature 2 – Document Management UI
- [X] Add a sidebar list of documents with titles and last-edited timestamps.
- [X] Provide `+` button for **create**, inline title rename on double-click, and a `Delete` trash-icon.
- [X] Display a confirmation dialog before destructive deletes.
- [X] Use skeleton loaders while documents are fetched.

### [X] Feature 3 – Theme & Accessibility
- [X] Implement a light/dark theme toggle stored in `localStorage` and respects OS preference on first load.
- [X] Make the layout fully responsive, shifting the sidebar to a drawer on small screens.
- [X] Meet **WCAG 2.1 AA**: color contrast, aria-labels, skip-to-content link, logical heading order.

### [X] Feature 4 – Profile Page
- [X] Route `/profile` that shows and updates `full_name` from the `profiles` table.

---

## [ ] Phase 4 – Implementation Layer
*Core writing-assistant functionality that delivers user value.*

### [ ] Feature 1 – Client-Side Spelling Check
- [ ] Install **`nspell` + `dictionary-en`** and load dictionaries at editor start-up.
- [ ] On every **spacebar** press, tokenize the previous word and check spelling locally.
- [ ] Wrap misspelled words in a span with a red underline CSS class.
- [ ] Show a custom right-click menu listing up to 5 correction suggestions; apply replacement on click.

### [ ] Feature 2 – Grammar & Style Suggestions
- [ ] Start a debounced timer (2 s idle) to gather the current sentence and send to **GPT-4o mini** via a Vercel Edge proxy.
- [ ] Throttle calls to **≥ 2 s apart** globally to respect the cost guardrail.
- [ ] Parse the diff JSON response and render inline suggestion chips with **Accept / Ignore** buttons.
- [ ] Maintain ≥ 85 % suggestion accuracy by sampling 20 test sentences in CI and asserting expected improvements.

### [ ] Feature 3 – Readability Score
- [ ] Extract `flesch_kincaid_grade` from the GPT response or compute locally as fallback.
- [ ] Display the grade in the editor footer, updating after each grammar check.
- [ ] Color-code the score: green (≤ 8), yellow (9-12), red (> 12) to aid quick interpretation.
- [ ] Unit-test the grade function with known sample texts to ensure correct output.

### [ ] Feature 4 – Performance & Cost Guardrails
- [ ] Measure and log spell-check execution; assert **< 100 ms** per word in CI performance tests.
- [ ] Measure first GPT suggestion latency; assert **< 2 s** end-to-end in the same tests.
- [ ] Hash each sentence after a GPT call and cache in `localStorage` so unchanged text is skipped.
- [ ] Track estimated OpenAI spend in `localStorage`; show a banner once cumulative cost > \$1 per month.

---

**End of checklist – proceed top-to-bottom, phase by phase.**
