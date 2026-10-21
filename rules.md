# Ladder Web — Scope & Implementation Rules

Read this before writing any code in `ladder-web`. If something here is wrong or out of date, fix this file in the same change.

---

## 1. What we are building

Ladder Web is a **responsive web application** (not a mobile app) where a user creates a Ladder account, verifies their identity once (BVN / NIN / Government ID + liveness), and receives a reusable **Ladder ID** they can use with participating companies.

- The designs in `../ladder-screens` are the **mobile breakpoint** of this web app. On small screens the web app must look like those screenshots.
- Tablet and desktop have no designs; their layouts are defined in §6 (centred column on tablet, split view with a brand panel on desktop). We build mobile-first and keep that framing in one place so it can change without rewriting screens.
- The backend lives in `../ladder-backend` and is not built yet. Until it is, we develop against MSW mocks (see §11).

## 2. Scope (v1)

| # | Screen | Route | Design reference (`../ladder-screens/`) |
|---|--------|-------|------------------------------------------|
| 1 | Welcome | `/` | `Screenshot 2026-10-21 at 20.41.37.png` |
| 2 | Create your account (email + password) | `/signup` | `… 20.41.49.png` (the design shows Date of Birth; it is replaced by a Password field, see note below) |
| 3 | Enter the OTP (6 digits, 00:45 resend timer) | `/verify-otp` | `… 20.42.00.png` |
| 4 | Create your PIN (6 digits + confirm) | `/create-pin` | `… 20.42.11.png` |
| 5 | Verify your credentials: **Date of Birth first**, then BVN / NIN / Government ID | `/credentials` | default `… 20.43.54.png`, `… 20.44.38.png` · expanded `… 20.44.03.png` · typing `… 20.44.12.png` · verifying `… 20.44.21.png` · verified `… 20.44.29.png` |
| 6 | Upload your ID (type select, PNG/JPG/PDF, max 5 MB) | `/upload-id` | `… 20.44.45.png` |
| 7 | Liveness check | `/liveness` | idle `… 20.44.54.png` · camera active `… 20.45.09.png` |
| 8 | You're Verified + Ladder ID (copy) | `/verified` | `… 20.45.15.png` |
| 9 | Profile | `/profile` | **not designed**: minimal placeholder (email, Ladder ID card, verified credentials list) so "Go To Profile" has somewhere to go |

**Flow:** Welcome → Signup → OTP → PIN → Credentials (Date of Birth, then BVN / NIN / Government ID) → (Upload ID if Government ID chosen) → Liveness → Verified → Profile.

**Signup change (2026-10-21):** the second signup field is **Password** (with a show/hide toggle and a requirements hint), not Date of Birth. It keeps the Date of Birth field's position, size and left-icon style (a lock icon instead of the calendar). Date of birth is no longer collected at signup.

**Date of birth is a credential (2026-10-21).** It is the **first** card on `/credentials`, above BVN, NIN and Government ID, and must be verified before the others unlock:
- The Date of Birth card is open by default until it is verified. The user picks a date and presses **Confirm**; it is sent to `POST /verification/date-of-birth`.
- BVN, NIN and Government ID cards are **locked** (dimmed, not expandable, hint "Verify your date of birth first") until `status.dateOfBirth === 'verified'`.
- The backend matches BVN/NIN/ID records against the saved date of birth. A mismatch comes back as a field error (`DOB_MISMATCH`) on the BVN/NIN input.
- Client-side rule: a real past date, year ≥ 1900, user at least 18 (`MIN_AGE`, confirm with product). The backend enforces the same (`UNDERAGE`).
- The card uses a calendar icon instead of the person icon; it follows the same card states as the others (no separate design).

### Out of scope for now
- Login for returning users (no design yet; signup now sets a password, so login will be email + password)
- Profile screen design (only a minimal placeholder exists)
- Forgot PIN, account settings, partner/company integrations

### Open questions (resolve before building the affected screen)
1. Is one credential (e.g. BVN only) enough to continue, or are several required? **Built as:** date of birth + any one of BVN, NIN or Government ID enables Continue (matches the design).
2. Is Government ID an alternative to BVN/NIN or an extra step? Which ID types go in the "Select ID" dropdown? **Built as:** an alternative; the card opens a panel with an "Upload ID" button to `/upload-id`, and after upload the flow goes straight to `/liveness`. Placeholder ID types: National ID Card, International Passport, Driver’s Licence, Voter’s Card (`GOVERNMENT_ID_OPTIONS`).
3. Liveness: which provider/SDK (e.g. Smile ID, Youverify, Dojah), and what instructions are shown? **Built as:** a provider-neutral placeholder: Verify Face → camera → "Centre your face" → 3-second "Hold still" countdown → one JPEG frame uploaded as `selfie`. Swap the capture step for the SDK; the screen states stay.
4. Error states (wrong OTP, BVN mismatch, failed liveness, upload rejected) are not designed. **Built as:** red border + red message under the affected field, `Try again` for camera/liveness failures.
5. ~~Copy fix: the NIN card says "Bank National Identification Number".~~ Done: the app says "National Identification Number".
6. ~~Where is date of birth collected now?~~ Resolved: it is the first credential on `/credentials` (see above).
7. Upload ID design shows "National ID Card" pre-filled in grey. Built as an empty select with the placeholder "Select your ID type" so the user must choose. Confirm with design.
8. The camera-active liveness design shows no button. Built with a secondary **Cancel** button while the camera runs, so users are never stuck. Confirm with design.

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router), React, TypeScript (`strict: true`) |
| Styling | Tailwind CSS; design tokens in `src/styles/globals.css` |
| Forms & validation | React Hook Form + Zod (`@hookform/resolvers/zod`) |
| HTTP | Axios (one instance, `src/lib/api/client.ts`) |
| Server state | TanStack Query |
| Client/flow state | Zustand |
| API mocking | MSW |
| Lint/format | ESLint (next config) + Prettier |
| Package manager | pnpm |

The project is bootstrapped (Next.js 16, Tailwind v4, `cacheComponents` on). If pnpm isn't installed globally, use `npx pnpm@10 <command>`; `npm run dev` also works for running scripts, but don't `npm install` (it creates a second, separate dependency tree).

Dev notes:
- `next dev` writes `AGENTS.md` into the project. Leave it; it is regenerated anyway.
- With `cacheComponents`, Next.js keeps previously visited pages mounted but hidden. Tests and scripts must target visible elements only.
- If newly added Tailwind classes or tokens don't show up in `next dev` (stale Turbopack cache), stop the dev server and start it again. `next build` is the source of truth.

## 4. Folder structure and what belongs where

```
src/
├── app/            Routes only. A page imports one feature component and renders it. No API calls, no business logic.
│   ├── (auth)/         signup, verify-otp, create-pin
│   ├── (verification)/ credentials, upload-id, liveness, verified  (guarded)
│   └── (app)/          profile                                       (guarded)
├── features/       One folder per domain: onboarding, auth, verification, profile.
│   └── <feature>/
│       ├── api/         <feature>.api.ts: typed functions that call apiClient
│       ├── hooks/       useXxx.ts: TanStack Query wrappers around the api functions
│       ├── components/  feature UI (may use hooks, ui components, store)
│       ├── schemas/     Zod schemas for forms and payloads
│       ├── types/       request/response types
│       ├── utils/       pure, feature-specific helpers (e.g. verification/utils/progress.ts: next step, route access)
│       └── index.ts     public exports; other code imports from here only
├── components/
│   ├── ui/          Generic building blocks (Button, Input, …). Presentational only.
│   └── layout/      ScreenShell, BrandPanel, BrandIllustration, BackButton, Logo, RouteGuard
├── lib/
│   ├── api/         client.ts, endpoints.ts, errors.ts, query-client.ts
│   └── utils/       pure helpers
├── store/           Zustand stores
├── config/          env.ts (validated env), routes.ts (route constants + step order)
├── mocks/           MSW handlers mirroring the backend contract; db.ts holds mock state; handlers/http.ts the envelope helpers
├── types/           cross-feature types (API envelope)
└── styles/          globals.css + tokens
```

**Import rules**
- `app/` → `features/*` (via `index.ts`), `components/`
- `features/x` → `components/`, `lib/`, `store/`, `config/`, `types/`. A feature **must not** import another feature's internals; use its `index.ts`.
- `components/ui` → nothing feature-specific. No API calls, no store.
- Always use the `@/` alias. No `../../..` imports.

## 5. Naming conventions

| Thing | Convention | Example |
|---|---|---|
| React component file | PascalCase `.tsx` | `CredentialCard.tsx` |
| Hook | `useCamelCase.ts` | `useVerifyBvn.ts` |
| API module | `<feature>.api.ts` | `verification.api.ts` |
| Schema module | `<feature>.schema.ts` | `auth.schema.ts` |
| Types module | `<feature>.types.ts` | `auth.types.ts` |
| Route folder | kebab-case | `verify-otp/` |
| Types/interfaces | PascalCase, no `I` prefix | `VerifyBvnRequest` |
| Constants | UPPER_SNAKE_CASE | `ROUTES.CREDENTIALS` |
| Booleans | `is/has/can` prefix | `isVerifying` |

One component per file. Named exports everywhere except Next.js `page.tsx` / `layout.tsx` (which need default exports).

## 6. Responsive and layout rules

The app must work well at every width from 320px to large desktop monitors, with no horizontal scrolling.

- **Mobile first.** Unprefixed Tailwind classes target mobile and must reproduce `ladder-screens` exactly: spacing, radius, font sizes, colours, button states.
- Breakpoints (Tailwind defaults):
  - `< md` (below 768px): **mobile**, full-screen, pixel-match to designs.
  - `md` to `lg` (768–1023px): **tablet**, full-width page (no phone-shaped card). Content sits in a centred column, max-width 480px, with extra top spacing. Welcome centres its content vertically, and the CTA follows the content instead of being pinned to the bottom.
  - `≥ lg` (1024px+): **desktop**.
    - Form screens (light tone): **split view**. `BrandPanel` on the left (44% of the width, 50% from `xl`), with the logo, the brand headline and the illustration. It is sticky and fills the viewport height. The form column is on the right (max-width 480px) and the form is centred vertically. The form's own logo is hidden (`lg:hidden`) because the panel already shows it.
    - Welcome (brand tone): full-bleed gradient, content up to `max-w-6xl`, two columns: headline, copy, benefits and an inline "Get started" button on the left; a larger illustration on the right.
- Every page renders inside `components/layout/ScreenShell` (`tone="light"` for form screens, `tone="brand"` for Welcome). **Page framing lives in ScreenShell**: backgrounds, the BrandPanel, column widths and centring. Changing the tablet/desktop frame means changing ScreenShell, not each screen.
- Feature components may use `md:`/`lg:` classes **only to reflow their own content**: the Welcome grid, hiding the duplicated logo, centring the form group, larger heading sizes. They must not add page backgrounds, side panels or outer widths.
- Shared brand art lives in `components/layout` (`BrandIllustration`, `BrandPanel`, `Logo`) so both layouts and features can use it.
- Do not recreate the phone status bar (9:41, signal, battery) from the screenshots. That is device chrome, not part of the app.
- The primary CTA stays pinned near the bottom on **mobile** where the design shows it (Upload ID, Welcome), and is inline everywhere else and on larger screens.
- Check every screen at 375, 390, 820 (tablet) and 1440 (desktop) widths before calling it done.

## 7. Design tokens

Extract once into `globals.css` / Tailwind theme and never hard-code hex values in components. Names to use (values to be sampled from the screens):

`--color-brand-900` (dark teal: headings, primary button), `--color-brand-500` (green: active OTP border, links, success), `--color-mint-300` (Welcome CTA, logo accent), `--color-surface-success` (Verified background), `--color-text-muted` (subtitles), `--color-border` (input/card borders), `--color-disabled-bg` / `--color-disabled-text` (disabled Continue), `--radius-input`, `--radius-card`, `--radius-pill` (buttons).

Sampled values now live in `src/styles/globals.css` (Tailwind v4 `@theme`, so each token is also a utility, e.g. `bg-brand-900`, `rounded-input`). Two sampled text colours fail WCAG AA (§13) and were darkened for text only: `--color-text-muted` is `#64788a` (design `#738696`, 3.8:1), and green link text uses `--color-brand-600` `#367d6b` (design `#4ea38d`, 3.0:1; `brand-500` is still used for borders and icons). Extra tokens added: `brand-950` (credential card icon circle), `brand-600`, `brand-550` (Verified badge), `mint-100`, `mint-400`, `success` (verified check on cards), `surface-mint` (Ladder ID card), `surface-subtle` (upload dropzone), `face-placeholder` (liveness frame), `radius-tile` (cards, dropzone), `radius-panel` (Ladder ID card), `surface-brand-top/bottom` (Welcome gradient), `text-on-brand`, `canvas` (page background behind the app), `danger` (error states, not designed), `radius-otp`, `radius-cta`.

## 8. API rules

### 8.1 The call chain (mandatory)

```
page.tsx → Feature component → useXxx hook → xxx.api.ts function → lib/api/client.ts → backend
```

- Components never import `axios` or `apiClient`.
- Hooks never build URLs.
- API functions never touch React (no hooks, no toasts, no navigation).
- Only `client.ts` knows the base URL, credentials and interceptors.

### 8.2 Endpoints

All URLs live in `src/lib/api/endpoints.ts`:

```ts
export const ENDPOINTS = {
  auth: {
    signup: '/auth/signup',
    verifyOtp: '/auth/otp/verify',
    resendOtp: '/auth/otp/resend',
    createPin: '/auth/pin',
  },
  verification: {
    dateOfBirth: '/verification/date-of-birth',
    bvn: '/verification/bvn',
    nin: '/verification/nin',
    governmentId: '/verification/government-id',
    liveness: '/verification/liveness',
    status: '/verification/status',
  },
  profile: {
    me: '/profile/me',
  },
} as const;
```

> These paths are a **proposal**. Confirm them with `ladder-backend` and update this table and the MSW handlers together.

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/signup` | `{ email, password }` | `{ otpExpiresIn }` |
| POST | `/auth/otp/verify` | `{ email, code }` | session established |
| POST | `/auth/otp/resend` | `{ email }` | `{ otpExpiresIn }` |
| POST | `/auth/pin` | `{ pin, confirmPin }` | `{}` |
| POST | `/verification/date-of-birth` | `{ dateOfBirth }` (ISO `YYYY-MM-DD`) | `{ status }`. Must succeed before BVN/NIN/ID (`409 DOB_REQUIRED` otherwise) |
| POST | `/verification/bvn` | `{ bvn }` | `{ status }`; `DOB_MISMATCH` if the record's date of birth differs |
| POST | `/verification/nin` | `{ nin }` | `{ status }`; `DOB_MISMATCH` as above |
| POST | `/verification/government-id` | `multipart/form-data`: `idType`, `file` | `{ status }` |
| POST | `/verification/liveness` | `multipart/form-data`: `selfie` (or provider token) | `{ status, ladderId? }` |
| GET | `/verification/status` | — | `{ dateOfBirth, bvn, nin, governmentId, liveness, ladderId }`. Each step is `'not_started' \| 'pending' \| 'verified' \| 'failed'` |
| GET | `/profile/me` | — | `UserProfile`: `{ email, ladderId, verifiedItems }` |

### 8.3 Response contract

Every response uses one envelope (`src/types/api.types.ts`):

```ts
type ApiSuccess<T> = { success: true; message: string; data: T };
type ApiErrorBody = {
  success: false;
  message: string;          // safe to show to the user
  code: string;             // machine-readable, e.g. 'OTP_INVALID'
  errors?: Record<string, string[]>; // field-level validation errors
};
```

API functions unwrap the envelope and return `data` only:

```ts
// features/verification/api/verification.api.ts
export async function verifyBvn(payload: VerifyBvnRequest): Promise<VerifyBvnResponse> {
  const res = await apiClient.post<ApiSuccess<VerifyBvnResponse>>(ENDPOINTS.verification.bvn, payload);
  return res.data.data;
}
```

### 8.4 Hooks

```ts
// features/verification/hooks/useVerifyBvn.ts
export function useVerifyBvn() {
  return useMutation({ mutationFn: verifyBvn });
}
```

- Reads use `useQuery` with keys from a per-feature `queryKeys` object (e.g. `['verification', 'status']`).
- Writes use `useMutation`. After success, invalidate the affected queries. Do not refetch by hand.
- Navigation after success happens in the component (`onSuccess` → `router.push(ROUTES.X)`), not in the hook.

### 8.5 Errors

- `client.ts` response interceptor turns every failure into an `ApiError` (`message`, `code`, `status`, `fieldErrors`) via `normalizeError()`.
- Field errors are mapped to React Hook Form with `setError`. Other errors show inline under the form or next to the affected card (e.g. the BVN card).
- Network/timeout errors show a generic retry message. Never show raw server text or stack traces.
- `401` → clear session state and redirect to `/signup` (or login, once designed).

### 8.6 Auth and session

- Preferred: backend sets an **httpOnly, Secure, SameSite cookie** on OTP verify. The client sends it with `withCredentials: true` and never reads or stores the token.
- If the backend must return a bearer token instead, keep it **in memory only** (Zustand, not persisted) and attach it in the request interceptor. Do not use localStorage/sessionStorage for tokens.
- `RouteGuard` (in the `(verification)` and `(app)` layouts) uses `/verification/status` to send the user to their next incomplete step. Access rules live in `features/verification/utils/progress.ts`:
  - `/credentials`: any signed-in user. `/upload-id`: date of birth verified.
  - `/liveness`: date of birth verified **and** one of BVN / NIN / Government ID verified (Government ID may be `pending`).
  - `/verified`, `/profile`: liveness verified and a Ladder ID exists.
  - Earlier steps stay reachable so users can go back.
- `RouteGuard` always keeps its children mounted (hidden until allowed) and shows a spinner or a retry message on top. Never return `null` instead of `{children}` in a layout: Next.js 16 instant-navigation validation fails on dropped segments.
- Because the guarded layouts can't know a page's tone, guarded pages render their own `ScreenShell` (`/verified` uses `tone="success"`). `(auth)` pages get theirs from the group layout.
- `(auth)` screens after signup need flow state from the store (email for OTP, `verify-otp` completed for PIN). Without it they redirect to `/signup`.

### 8.7 File uploads

- Validate on the client before upload: type `image/png`, `image/jpeg`, `application/pdf`; size ≤ 5 MB (`idUploadSchema`).
- Send as `FormData`; let Axios set the `Content-Type` boundary.
- Show upload progress via Axios `onUploadProgress`.

## 9. Forms

- Each form = Zod schema in `schemas/` + `useForm({ resolver: zodResolver(schema) })`.
- Continue buttons are **disabled until the form is valid** (matches designs).
- Input rules: email, a valid email; password, 8–128 characters with at least one letter and one number (hint shown under the field until there is an error; confirm the policy with backend); OTP, 6 digits; PIN, 6 digits, both fields match; BVN, 11 digits; NIN, 11 digits.
- Numeric fields use `inputMode="numeric"` and `autoComplete="one-time-code"` for OTP.

## 10. State rules

| Data | Lives in |
|---|---|
| Anything from the server | TanStack Query cache |
| Flow progress across screens (email, chosen credential, completed steps) | `store/onboarding.store.ts` (Zustand) |
| Form input | React Hook Form (local to the form) |
| UI toggles (which credential card is open, camera phase, etc.) | component `useState` |
| Verification progress (which credentials are done) | TanStack Query (`verificationQueryKeys.status`); mutations invalidate it. Never mirrored into Zustand |

## 11. Mocking

- `NEXT_PUBLIC_USE_MOCKS=true` starts MSW in `app/providers.tsx` (development only).
- `src/mocks/handlers/*` must return the same envelope as §8.3 and cover success and error cases for each endpoint.
- BVN/NIN handlers add an artificial delay (~1.8 s) so the "verifying" spinner state can be built and tested.
- Mock state (session flag, email, step statuses, Ladder ID) lives in `src/mocks/db.ts` and is mirrored to `sessionStorage` so a reload keeps progress in development. It must never hold PIN, DOB, BVN, NIN, files or selfies.
- Test values (also listed at the top of each handler file):

| Input | Result |
|---|---|
| OTP `123456` | success; any other code → `OTP_INVALID` |
| Email `taken@ladder.test` / `down@ladder.test` | `EMAIL_TAKEN` / 500 |
| Password `password1` | `PASSWORD_WEAK` |
| PIN `123456`, `000000`, `111111`, `654321` | `PIN_TOO_SIMPLE` |
| Date of birth under 18 | `UNDERAGE` |
| BVN/NIN `00000000000` | `*_NOT_FOUND` |
| BVN/NIN `11111111111` | `DOB_MISMATCH` |
| Any other 11-digit BVN/NIN | verified |
| ID file over 5 MB | `FILE_TOO_LARGE` |
- When a real endpoint ships, flip the flag and fix any contract mismatch in **types + handlers together**.

## 12. Security and privacy

This app handles identity data. These rules are non-negotiable:

- Never log passwords, PIN, OTP, BVN, NIN, ID images or selfies (no `console.log`, no analytics events, no error-tracker payloads).
- Never persist them on the client (no localStorage/sessionStorage/IndexedDB, not in Zustand persist).
- Mask BVN/NIN when displayed after submission (e.g. `*******8901`). Currently they are not displayed at all after verification: the card collapses and shows a check.
- Date of birth is personal data: it is sent to the backend and kept only in the form while typing. Never in Zustand, URLs, query keys or logs.
- Password and PIN inputs use `type="password"` and `autoComplete="new-password"`. The password show/hide toggle is a real `<button>` with `aria-pressed` and a "Show password" / "Hide password" label.
- The password is sent only in the signup request body. It is never put in the Zustand store, the URL, query keys or error messages; only the email moves on to the OTP screen.
- Camera access is requested only on `/liveness`, only after the user presses **Verify Face**, and the stream is stopped right after capture, on cancel, on error and on unmount (`useCamera`). Only the one captured frame leaves the device.
- All env vars exposed to the browser are prefixed `NEXT_PUBLIC_` and contain no secrets.

## 13. Accessibility

- Every input has a label (visually hidden if the design shows only a placeholder).
- OTP boxes support paste of the full code and keyboard navigation.
- Credential cards are buttons with `aria-expanded` / `aria-controls`; locked and verified cards are disabled buttons with the reason in their text. Status changes (verifying/verified) are announced via `aria-live`.
- The upload checklist: format and size are read-only indicators that tick themselves (with "met / not met yet" for screen readers); "Valid government issued ID" is a real checkbox the user must tick.
- Liveness instructions and the countdown are announced via `aria-live`; camera errors use `role="alert"`.
- Colour contrast ≥ WCAG AA; the disabled button style is the only exception.
- Visible focus ring on all interactive elements.

## 14. Definition of done (per screen)

- [ ] Matches the mobile design at 375px and 390px widths
- [ ] Matches the tablet (820px) and desktop (1440px) layouts in §6, using ScreenShell
- [ ] Loading, success and error states handled
- [ ] Works against MSW mocks; API calls follow §8
- [ ] Form validation follows §9
- [ ] No sensitive data logged or persisted (§12)
- [ ] Keyboard and screen-reader usable (§13)
- [ ] `pnpm lint` and `pnpm typecheck` pass
