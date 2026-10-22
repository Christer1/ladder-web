# Ladder Web — Scope & Implementation Rules

Read this before writing any code in `ladder-web`. If something here is wrong or out of date, fix this file in the same change.

---

## 1. What we are building

Ladder Web is a **responsive web application** (not a mobile app) where a user creates a Ladder account, verifies their identity once (BVN / NIN / Government ID + liveness), and receives a reusable **Ladder ID** they can use with participating companies.

- The designs in `../ladder-screens` are the **mobile breakpoint** of this web app. On small screens the web app must look like those screenshots.
- Tablet and desktop have no designs; their layouts are defined in §6 (centred column on tablet, split view with a brand panel on desktop). We build mobile-first and keep that framing in one place so it can change without rewriting screens.
- The backend lives in `../ladder-backend` and serves **every** endpoint: auth, BVN/NIN, Government ID, liveness, status and profile. It is the single source of onboarding progress (see §11).

## 2. Scope (v1)

| # | Screen | Route | Design reference (`../ladder-screens/`) |
|---|--------|-------|------------------------------------------|
| 1 | Welcome | `/` | `Screenshot 2026-10-21 at 20.41.37.png` |
| 2 | Create your account (email + password + confirm password) | `/signup` | `… 20.41.49.png` (the design shows Date of Birth; it is replaced by Password and Confirm password, see note below) |
| 3 | Enter the OTP (6 digits, 00:45 resend timer) | `/verify-otp` | `… 20.42.00.png` |
| 4 | ~~Create your PIN~~ | — | `… 20.42.11.png`. **Removed (2026-10-22):** there is no PIN anywhere in the app or the database |
| 5 | Verify your credentials: **Date of Birth first**, then BVN / NIN / Government ID | `/credentials` | default `… 20.43.54.png`, `… 20.44.38.png` · expanded `… 20.44.03.png` · typing `… 20.44.12.png` · verifying `… 20.44.21.png` · verified `… 20.44.29.png` |
| 6 | Upload your ID (type select; **front + back** for cards, photo page for passports; upload a file **or take a photo**; PNG/JPG/PDF, max 5 MB each) | `/upload-id` | `… 20.44.45.png` |
| 7 | Liveness check | `/liveness` | idle `… 20.44.54.png` · camera active `… 20.45.09.png` |
| 8 | You're Verified + Ladder ID (copy) | `/verified` | `… 20.45.15.png` |
| 9 | Profile | `/profile` | **not designed**: minimal placeholder (email, Ladder ID card, verified credentials list) so "Go To Profile" has somewhere to go |
| 10 | Login (email + password) | `/login` | **not designed**: built from the Signup/OTP patterns, see **Returning users** below |

**Flow:** Welcome → Signup → OTP → Credentials (Date of Birth, then BVN / NIN / Government ID) → (Upload ID if Government ID chosen) → Liveness → Verified → Profile.

**Returning users (2026-10-22, no PIN).** A user who comes back signs in on `/login` with **email + password** and **continues where they stopped**:
- The last email that signed in on this device is remembered (`features/auth/utils/remembered-account.ts`, localStorage key `ladder:returning-account`, email only) and **pre-filled** on `/login`. Nothing redirects automatically: Welcome shows "Already have an account? Log in".
- **Resume** (`getResumeRoute` in `features/verification/utils/progress.ts`, used by `useResumeOnboarding` after sign-in and by `RouteGuard`) reads only `GET /verification/status`, so it gives the same answer on any device or browser:
  - **has a Ladder ID → `/profile`**, always. The Ladder ID means verification is complete (it is issued by the first verified BVN/NIN, or by liveness for a Government ID), even if liveness was never done.
  - otherwise → **the onboarding page they were last on** (`lastStep`: `/credentials`, `/upload-id` or `/liveness`), if they may still be there;
  - otherwise → the first step left (`/credentials`, then `/liveness`).
  - It never passes through `/verify-otp` or any other screen on the way.
- **Recording the last page:** `RouteGuard` saves the onboarding page a user without a Ladder ID opens (`PUT /verification/last-step`, once per change). `/profile` and `/verified` need a Ladder ID; an unfinished user who opens them is sent to their resume page.
- An email that was never verified (`EMAIL_NOT_VERIFIED`) gets a new code and continues on `/verify-otp`.
- An expired session on any protected call sends the user to `/login`.
- **Sign out** (`/profile`) ends the session and then does a **full page load** to `/login`. Never clear the query cache while a protected page is mounted: it refetches without a session, shows a 401 error and triggers a second redirect (the bug fixed on 2026-10-22).
- Links: Welcome and Signup have "Already have an account? Log in"; Login has "New to Ladder? Create an account".

**Signup (2026-10-22):** email, **Password** (show/hide, requirements hint) and **Confirm password** (show/hide, must match: "Passwords do not match"; re-checked when the password changes). The backend checks the match too (`PASSWORD_MISMATCH`). Password takes the Date of Birth field's position from the design; date of birth is collected on `/credentials`.

**Date of birth is a credential (2026-10-21).** It is the **first** card on `/credentials`, above BVN, NIN and Government ID, and must be verified before the others unlock:
- The backend has **no date of birth endpoint** (2026-10-22). The user picks a date and presses **Confirm**; nothing is sent. The date is kept in `CredentialList` state and sent with each BVN/NIN lookup (`{ bvn, dateOfBirth }`). The card then shows the chosen date and can be reopened to change it.
- The Date of Birth card is open by default until a date is entered (or a credential is already verified). It shows the verified check once a BVN/NIN with that date is verified.
- BVN, NIN and Government ID cards are **locked** (dimmed, not expandable, hint "Enter your date of birth first") until a date is entered. After a reload the date must be entered again to verify another credential (the backend requires the same date as the first one).
- The backend matches BVN/NIN records against the date. A mismatch comes back as `BVN_DOB_MISMATCH` / `NIN_DOB_MISMATCH` (no field errors; the message is shown under the BVN/NIN input).
- Client-side rule: a real past date, year ≥ 1900, user at least 18 (`MIN_AGE`, confirm with product). The backend only checks the format.
- The card uses a calendar icon instead of the person icon; it follows the same card states as the others (no separate design).

**Liveness check (2026-10-21).** After **Verify Face** and camera permission, the check runs fully on-device with MediaPipe Face Landmarker (`@mediapipe/tasks-vision`, loaded only on `/liveness`):
1. **Lighting and framing first.** Average frame brightness is sampled ~4×/s: below 60 → "It's too dark…", above 205 (0–255 luma) → "Too much light…". Also: no face, more than one face, too far, too close, off-centre. Problems are shown after 400 ms (no flicker), pause the check and don't count towards the timeout.
2. **Look straight** (neutral face held 400 ms) to start.
3. **Random challenges:** 3 of blink / smile / turn head left / turn head right, in random order, new set on every attempt. "Left/right" is the user's own left/right (the preview is mirrored, so it matches what they see). Each needs a short hold (350 ms); a blink must close and re-open within 1.5 s.
4. **Look straight again** between challenges and at the end, so one movement can't satisfy two instructions and the captured selfie is front-facing.
5. A **progress ring** around the oval fills clockwise from the top as challenges complete, turning green at the end. It is a `role="progressbar"` with "Step x of n".
6. Each challenge has 12 s of active time; otherwise the attempt fails with "Try again" and new instructions.
7. One JPEG frame + the list of completed challenges are uploaded. No other frames leave the device.

All thresholds live in `LIVENESS_THRESHOLDS` (`features/verification/utils/liveness.ts`). That file is pure and must stay testable without a camera. **This is a UX gate, not the security decision:** on-device checks can be spoofed, so the backend / provider must verify the selfie.

**Government ID front and back (2026-10-22).**
- Each ID type declares the images it needs in `GOVERNMENT_ID_OPTIONS[].sides`: National ID Card, Driver’s Licence and Voter’s Card need **front and back**; International Passport needs only the **photo page** (sent as `front`). Before a type is chosen, the screen assumes a card (front and back).
- Each side is an `IdSideField`: the design's dropzone (upload, drag-and-drop) plus a **Take a photo** button. Once a file is added: Replace / Remove / Take photo.
- **Take a photo** opens `IdCameraCapture`, a native `<dialog>` (full-screen on mobile, centred panel from `md`). It prefers the back camera (`facingMode: 'environment'`, falls back to any camera), shows a document-shaped guide (ID-1 card 85.6 × 54, passport page 125 × 88), then Retake / Use photo. The photo becomes a JPEG `File` like an upload. If the camera is unavailable or blocked: "Upload a file instead" / "Try again".
- Switching to a passport clears any back image. Continue needs every required side, valid type and size, and the confirmation checkbox. The format and size ticks cover all required sides.
- The upload design shows a single dropzone. The two-sided layout and the camera dialog are not designed (open question 11).

### Out of scope for now
- Login screen design (the screen exists, built from existing patterns; see **Returning users**)
- Forgot password / reset password
- Profile screen design (only a minimal placeholder exists)
- Account settings, partner/company integrations

### Open questions (resolve before building the affected screen)
1. Is one credential (e.g. BVN only) enough to continue, or are several required? **Built as:** date of birth + any one of BVN, NIN or Government ID enables Continue (matches the design).
2. Is Government ID an alternative to BVN/NIN or an extra step? Which ID types go in the "Select ID" dropdown, and which need a back image? **Built as:** an alternative; the card opens a panel with an "Upload ID" button to `/upload-id`, and after upload the flow goes straight to `/liveness`. Placeholder ID types: National ID Card, International Passport, Driver’s Licence, Voter’s Card (`GOVERNMENT_ID_OPTIONS`); all but the passport need front and back.
3. Liveness: which provider/SDK (e.g. Smile ID, Youverify, Dojah) makes the final decision? **Built as:** an on-device active check (see **Liveness check** below) followed by one front-facing JPEG uploaded as `selfie`. A provider SDK can replace the capture/upload step; keep the on-device guidance or use the provider's own.
4. Error states (wrong OTP, BVN mismatch, failed liveness, upload rejected) are not designed. **Built as:** red border + red message under the affected field, `Try again` for camera/liveness failures.
5. ~~Copy fix: the NIN card says "Bank National Identification Number".~~ Done: the app says "National Identification Number".
6. ~~Where is date of birth collected now?~~ Resolved: it is the first credential on `/credentials` (see above).
7. Upload ID design shows "National ID Card" pre-filled in grey. Built as an empty select with the placeholder "Select your ID type" so the user must choose. Confirm with design.
8. The camera-active liveness design shows no button and no progress ring. Built with a secondary **Cancel** button and a progress ring around the oval (product request, 2026-10-21). Confirm with design.
9. The face model (~3.6 MB) and MediaPipe WASM (~13 MB) load from public CDNs (jsDelivr, Google Storage), pinned in `src/config/liveness.ts`. Self-host them (e.g. under `public/`) before production for availability, privacy and CSP.
10. Accessibility: users who can't blink, smile or turn their head on request need another route (assisted or manual review). Not designed yet.
11. Upload ID: the two-sided layout (front/back headings, "Take a photo" button) and the camera dialog are built from existing patterns, not a design. Confirm with design.

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
| On-device face check | `@mediapipe/tasks-vision` (Face Landmarker), pinned; WASM version in `config/liveness.ts` must match |
| Lint/format | ESLint (next config) + Prettier |
| Package manager | npm (`package-lock.json`) |

The project is bootstrapped (Next.js 16, Tailwind v4, `cacheComponents` on). Use npm only (switched from pnpm on 2026-10-22); don't add another lockfile.

Dev notes:
- `AGENTS.md` generation is off (`agentRules: false` in `next.config.ts`). Don't commit one.
- With `cacheComponents`, Next.js keeps previously visited pages mounted but hidden. Tests and scripts must target visible elements only.
- If newly added Tailwind classes or tokens don't show up in `next dev` (stale Turbopack cache), stop the dev server and start it again. `next build` is the source of truth.

## 4. Folder structure and what belongs where

```
src/
├── app/            Routes only. A page imports one feature component and renders it. No API calls, no business logic.
│   ├── (auth)/         signup, verify-otp, login
│   ├── (verification)/ credentials, upload-id, liveness, verified  (guarded)
│   └── (app)/          profile                                       (guarded)
├── features/       One folder per domain: onboarding, auth, verification, profile.
│   └── <feature>/
│       ├── api/         <feature>.api.ts: typed functions that call apiClient
│       ├── hooks/       useXxx.ts: TanStack Query wrappers around the api functions
│       ├── components/  feature UI (may use hooks, ui components, store)
│       ├── schemas/     Zod schemas for forms and payloads
│       ├── types/       request/response types
│       ├── utils/       pure, feature-specific helpers (e.g. verification/utils/progress.ts: next step, route access; verification/utils/liveness.ts: liveness session)
│       └── index.ts     public exports; other code imports from here only
├── components/
│   ├── ui/          Generic building blocks (Button, Input, …). Presentational only.
│   └── layout/      ScreenShell, BrandPanel, BrandIllustration, BackButton, Logo, RouteGuard
├── lib/
│   ├── api/         client.ts, endpoints.ts, errors.ts, query-client.ts
│   └── utils/       pure helpers
├── store/           Zustand stores
├── config/          env.ts (validated env), routes.ts (route constants + step order), liveness.ts (face model / WASM URLs)
├── mocks/           MSW setup; no handlers today (the backend serves everything)
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
    login: '/auth/login',
    logout: '/auth/logout',
  },
  verification: {
    bvn: '/verification/bvn',
    nin: '/verification/nin',
    status: '/verification/status',
    lastStep: '/verification/last-step',
    governmentId: '/verification/government-id',
    liveness: '/verification/liveness',
  },
  profile: {
    me: '/profile/me',
  },
} as const;
```

The contract follows `ladder-backend` (`AIUsage.md` §5, DTOs in `src/modules/*/dto`). When the backend changes, update the types in `features/*/types` and this table together. The backend validates with `forbidNonWhitelisted`: send exactly the fields below, nothing extra.

| Method | Path | Body | Returns | Served by |
|---|---|---|---|---|
| POST | `/auth/signup` | `{ email, password, confirmPassword }` | `{ otpExpiresIn, resendAvailableIn }` (seconds; the 00:45 timer uses `resendAvailableIn`). `409 EMAIL_TAKEN`, `400 PASSWORD_MISMATCH` (field `confirmPassword`) | backend |
| POST | `/auth/otp/resend` | `{ email }` | same as signup. `429 OTP_RESEND_TOO_SOON` | backend |
| POST | `/auth/otp/verify` | `{ email, code }` | `{}`, sets the session cookie. `OTP_INVALID`, `OTP_EXPIRED`, `OTP_LOCKED` | backend |
| POST | `/auth/login` | `{ email, password }` | `{}`, sets the session cookie. `401 INVALID_CREDENTIALS`, `403 EMAIL_NOT_VERIFIED` | backend |
| POST | `/auth/logout` | — | `{}`, clears the cookie. **Sign out** on `/profile` | backend |
| POST | `/verification/bvn` | `{ bvn, dateOfBirth }` (`YYYY-MM-DD`) | `{ status, ladderId }`. `422 BVN_NOT_FOUND` / `BVN_INVALID` / `BVN_DOB_MISMATCH`, `409 ALREADY_VERIFIED` | backend |
| POST | `/verification/nin` | `{ nin, dateOfBirth }` | same, with `NIN_*` codes | backend |
| PUT | `/verification/last-step` | `{ step }` = `CREDENTIALS` / `UPLOAD_ID` / `LIVENESS` | `{}`. Called by `RouteGuard` (`useSaveLastStep`) | backend |
| GET | `/verification/status` | — | `{ bvn, nin, governmentId, liveness, ladderId, lastStep }`; each step `'NOT_STARTED' \| 'PENDING' \| 'VERIFIED' \| 'FAILED'`. The only source for resuming and for `RouteGuard` | backend |
| GET | `/profile/me` | — | `{ id, email, dateOfBirth, ladderId, status, verifications: [{ type, status, maskedValue, verifiedAt }] }` | backend |
| POST | `/verification/government-id` | `multipart/form-data`: `idType`, `front`, `back` (required for card IDs, omitted for passports) | `{ status, ladderId }`; `FILE_REQUIRED` / `FILE_TYPE_INVALID` with field errors keyed `front` / `back`, `413 FILE_TOO_LARGE`. **Placeholder** on the backend: files are checked, then discarded | backend |
| POST | `/verification/liveness` | `multipart/form-data`: `selfie` (JPEG), `challenges` (JSON array, e.g. `["smile","turnLeft","blink"]`) | `{ status, ladderId }`. `409 IDENTITY_REQUIRED` before a BVN/NIN/ID. Issues the Ladder ID for Government ID users. **Placeholder**: the selfie is checked, then discarded | backend |

The first verified BVN **or** NIN issues the Ladder ID. Only `VALIDATION_FAILED` (400) carries field errors (keyed by request field); every other error is a `code` + `message`.

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
- `401` → clear session state and redirect to `/login`. Excluded: public auth endpoints (signup, OTP, login), whose 401 means wrong credentials, and logout, which handles its own 401.

### 8.6 Auth and session

- Preferred: backend sets an **httpOnly, Secure, SameSite cookie** on OTP verify. The client sends it with `withCredentials: true` and never reads or stores the token.
- If the backend must return a bearer token instead, keep it **in memory only** (Zustand, not persisted) and attach it in the request interceptor. Do not use localStorage/sessionStorage for tokens.
- `RouteGuard` (in the `(verification)` and `(app)` layouts) uses `/verification/status` to send the user to their next incomplete step. Access rules live in `features/verification/utils/progress.ts`:
  - `/credentials`, `/upload-id`: any signed-in user (the date of birth is not a server step; the credentials screen gates it).
  - `/liveness`: one of BVN / NIN / Government ID verified (Government ID may be `PENDING`).
  - `/verified`, `/profile`: liveness verified and a Ladder ID exists.
  - Earlier steps stay reachable so users can go back.
- `RouteGuard` always keeps its children mounted (hidden until allowed) and shows a spinner or a retry message on top. Never return `null` instead of `{children}` in a layout: Next.js 16 instant-navigation validation fails on dropped segments.
- Because the guarded layouts can't know a page's tone, guarded pages render their own `ScreenShell` (`/verified` uses `tone="success"`). `(auth)` pages get theirs from the group layout.
- `/verify-otp` needs the email from the store (set by signup, or by sign-in for an unverified email). Without it, it redirects to `/signup`.

### 8.7 File uploads

- Validate on the client before upload: type `image/png`, `image/jpeg`, `application/pdf`; size ≤ 5 MB (`idUploadSchema`).
- Send as `FormData`; let Axios set the `Content-Type` boundary.
- Show upload progress via Axios `onUploadProgress`.

## 9. Forms

- Each form = Zod schema in `schemas/` + `useForm({ resolver: zodResolver(schema) })`.
- Continue buttons are **disabled until the form is valid** (matches designs).
- Input rules: email, a valid email; password, 8–128 characters with at least one letter and one number (hint shown under the field until there is an error; confirm the policy with backend); OTP, 6 digits; confirm password, must match the password; BVN, 11 digits; NIN, 11 digits.
- Numeric fields use `inputMode="numeric"` and `autoComplete="one-time-code"` for OTP.

## 10. State rules

| Data | Lives in |
|---|---|
| Anything from the server | TanStack Query cache |
| Flow progress across screens (email, chosen credential, completed steps) | `store/onboarding.store.ts` (Zustand). Sign-in rebuilds it (`useResumeOnboarding`) |
| Remembered account (email only), pre-filled on `/login` | localStorage `ladder:returning-account`, via `useRememberedAccount` (`useSyncExternalStore`, `undefined` until hydrated) |
| Form input | React Hook Form (local to the form) |
| Confirmed date of birth (sent with BVN/NIN) | `CredentialList` `useState` only |
| UI toggles (which credential card is open, camera phase, etc.) | component `useState` |
| Verification progress (which credentials are done) | TanStack Query (`verificationQueryKeys.status`); mutations invalidate it. Never mirrored into Zustand |

## 11. Mocking

- `ladder-backend` serves every endpoint, so **nothing is mocked** and `src/mocks/handlers/index.ts` is empty. Run the backend locally (`npm run dev`, port 4000).
- The MSW setup stays for the future: `NEXT_PUBLIC_USE_MOCKS=true` starts it in development. Add a handler only for an endpoint the backend does not have yet, and delete it when the backend ships it.
- Never keep onboarding progress in the browser (that caused the 2026-10-22 bug where a returning user was sent back to liveness): the backend's `GET /verification/status` is the source of truth.
- Test data: BVN/NIN numbers and their dates of birth come from the backend's seeded registry (`npm run db:seed` in `ladder-backend` prints them). OTPs are emailed through Brevo.

## 12. Security and privacy

This app handles identity data. These rules are non-negotiable:

- Never log passwords, OTPs, BVN, NIN, ID images or selfies (no `console.log`, no analytics events, no error-tracker payloads).
- Never persist them on the client (no localStorage/sessionStorage/IndexedDB, not in Zustand persist). The only personal data stored on the device is the remembered **email**, pre-filled on `/login`. Never store the password or session token.
- Mask BVN/NIN when displayed after submission (e.g. `*******8901`). Currently they are not displayed at all after verification: the card collapses and shows a check.
- Date of birth is personal data: it is sent to the backend only with BVN/NIN lookups and kept only in the form and `CredentialList` state. Never in Zustand, URLs, query keys or logs.
- Password inputs use `type="password"`, with `autoComplete="new-password"` on signup and `"current-password"` on login. The password show/hide toggle is a real `<button>` with `aria-pressed` and a "Show password" / "Hide password" label.
- The password (and its confirmation) is sent only in the signup or login request body. It is never put in the Zustand store, the URL, query keys or error messages; only the email moves on to the OTP screen.
- Camera access is requested only on `/liveness` (after **Verify Face**) and on `/upload-id` (after **Take a photo**, inside the camera dialog). On both, the stream is stopped right after capture, on cancel/close, on error and on unmount (`useCamera`, which also discards streams from superseded requests). Only frames the user submits leave the device: the liveness selfie, and ID photos the user chose to **Use**.
- Face analysis runs in the browser on the live video; frames are not stored or sent. Only the final selfie is uploaded. Never log landmark data or blendshape scores.
- All env vars exposed to the browser are prefixed `NEXT_PUBLIC_` and contain no secrets.

## 13. Accessibility

- Every input has a label (visually hidden if the design shows only a placeholder).
- OTP boxes support paste of the full code and keyboard navigation.
- Credential cards are buttons with `aria-expanded` / `aria-controls`; locked and verified cards are disabled buttons with the reason in their text. Status changes (verifying/verified) are announced via `aria-live`.
- The upload checklist: format and size are read-only indicators that tick themselves (with "met / not met yet" for screen readers); "Valid government issued ID" is a real checkbox the user must tick.
- The ID camera is a native `<dialog>` opened with `showModal()`: focus moves into it, Escape closes it, the page behind is inert, and focus returns to **Take a photo** afterwards. The shutter is a button labelled "Take photo".
- Liveness instructions, lighting/framing guidance and step changes are announced via `aria-live` (only when the text changes, not every frame); camera and check errors use `role="alert"`. The progress ring is a `progressbar` with `aria-valuetext` "Step x of n".
- Colour contrast ≥ WCAG AA; the disabled button style is the only exception.
- Visible focus ring on all interactive elements.

## 14. Definition of done (per screen)

- [ ] Matches the mobile design at 375px and 390px widths
- [ ] Matches the tablet (820px) and desktop (1440px) layouts in §6, using ScreenShell
- [ ] Loading, success and error states handled
- [ ] Works against the local ladder-backend; API calls follow §8
- [ ] Form validation follows §9
- [ ] No sensitive data logged or persisted (§12)
- [ ] Keyboard and screen-reader usable (§13)
- [ ] `npm run lint` and `npm run typecheck` pass
