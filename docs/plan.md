# MVP Development Checklist – **Wordwise**

Each phase is ordered by *dependencies*: items in **Phase 1** have no prereqs; later phases depend on completion of the earlier ones.
Use the status notation `[ ]`, `[X]`, `[~]`, `[!]` exactly as shown.
All sub-items are **independent, testable, rollback-safe** sentences your AI developer can implement one at a time.

---

## [ ] Phase 1 – Foundation
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

## [ ] Phase 2 – Data Layer
*Database schema, security, and client-side data services.*

### [X] Feature 1 – Database Schema
- [X] Create a `documents` table (`id`, `user_id`, `title`, `content`, `updated_at`) with UUID PKs.
- [X] Create a `profiles` table (`id`, `full_name`, `avatar_url`) keyed by the Supabase auth UID.
- [X] Add helpful indexes on `documents.user_id` and `documents.updated_at` for fast queries.
- [X] Set up Drizzle ORM schema with full TypeScript type safety (replaces manual type generation).

### [ ] Feature 2 – Row-Level Security Policies
- [ ] Enable RLS on `documents` and `profiles`.
- [ ] Add policy: logged-in user can `select | insert | update | delete` rows where `auth.uid() = user_id`.
- [ ] Create a negative test that proves cross-account access is rejected with HTTP 401.
- [ ] Document the RLS rules in `docs/security.md`.

### [ ] Feature 3 – Document Service
- [ ] Implement CRUD helpers (`createDoc`, `renameDoc`, `deleteDoc`, `saveDoc`) in `lib/documentService.ts`.
- [ ] Wrap each helper with **Supabase Edge Functions** for minimal latency from the browser.
- [ ] Expose React Query hooks (`useDocuments`, `useDocument`) for cache-aware data fetching.
- [ ] Write unit tests with mocked Supabase calls ensuring each helper resolves the correct shape.

### [ ] Feature 4 – Autosave Engine
- [ ] Detect "dirty" editor state and schedule a debounced **10 s** autosave via `saveDoc`.
- [ ] Show a subtle `Saving… ✓ Saved` status in the editor footer.
- [ ] Retry failed autosaves with exponential back-off up to 3 attempts before surfacing an error toast.
- [ ] Emit a custom event (`doc:saved`) so other modules can react (e.g., token tracking).

---

## [ ] Phase 3 – Interface Layer
*Visible UI components and user journeys built atop the data layer.*

### [ ] Feature 1 – Editor Shell
- [ ] Render a distraction-free `contenteditable` area inside a shadcn `Card` component.
- [ ] Maintain editor state in React, syncing to the `documents.content` field.
- [ ] Display a placeholder "Start writing…" when the document is empty.
- [ ] Ensure keystroke handling keeps average frame time < 16 ms for docs up to 10 kB.

### [ ] Feature 2 – Document Management UI
- [ ] Add a sidebar list of documents with titles and last-edited timestamps.
- [ ] Provide `+` button for **create**, inline title rename on double-click, and a `Delete` trash-icon.
- [ ] Display a confirmation dialog before destructive deletes.
- [ ] Use skeleton loaders while documents are fetched.

### [ ] Feature 3 – Theme & Accessibility
- [ ] Implement a light/dark theme toggle stored in `localStorage` and respects OS preference on first load.
- [ ] Make the layout fully responsive, shifting the sidebar to a drawer on small screens.
- [ ] Meet **WCAG 2.1 AA**: color contrast, aria-labels, skip-to-content link, logical heading order.
- [ ] Add global keyboard shortcuts (`⌘/Ctrl + S` → manual save, `⌘/Ctrl + P` → command palette stub).

### [ ] Feature 4 – Profile Page
- [ ] Route `/profile` that shows and updates `full_name` and `avatar_url` from the `profiles` table.
- [ ] Allow avatar upload via a drag-and-drop component that stores the file in **Supabase Storage**.
- [ ] Validate image size ≤ 2 MB and display a cropped preview before upload.
- [ ] Persist profile changes and show a success toast on save.

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
