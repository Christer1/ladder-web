# Ladder Web — Scope & Implementation Rules

Read this before writing any code in `ladder-web`. If something here is wrong or out of date, fix this file in the same change.

---

## 1. What we are building

Ladder Web is a **responsive web application** (not a mobile app) where a user creates a Ladder account, verifies their identity once (BVN / NIN / Government ID + liveness), and receives a reusable **Ladder ID** they can use with participating companies.

- The designs in `../ladder-screens` are the **mobile breakpoint** of this web app. On small screens the web app must look like those screenshots.
- **Desktop and tablet layouts are not designed yet.** We build mobile-first and keep the layout swappable so desktop can be added without rewriting screens (see §6).
- The backend lives in `../ladder-backend` and is not built yet. Until it is, we develop against MSW mocks (see §11).

## 2. Scope (v1)

| # | Screen | Route | Design reference (`../ladder-screens/`) |
|---|--------|-------|------------------------------------------|
| 1 | Welcome | `/` | `Screenshot 2026-10-21 at 20.41.37.png` |
| 2 | Create your account (email + DOB) | `/signup` | `… 20.41.49.png` |
| 3 | Enter the OTP (6 digits, 00:45 resend timer) | `/verify-otp` | `… 20.42.00.png` |
| 4 | Create your PIN (6 digits + confirm) | `/create-pin` | `… 20.42.11.png` |
| 5 | Verify your credentials: BVN / NIN / Government ID | `/credentials` | default `… 20.43.54.png`, `… 20.44.38.png` · expanded `… 20.44.03.png` · typing `… 20.44.12.png` · verifying `… 20.44.21.png` · verified `… 20.44.29.png` |
| 6 | Upload your ID (type select, PNG/JPG/PDF, max 5 MB) | `/upload-id` | `… 20.44.45.png` |
| 7 | Liveness check | `/liveness` | idle `… 20.44.54.png` · camera active `… 20.45.09.png` |
| 8 | You're Verified + Ladder ID (copy) | `/verified` | `… 20.45.15.png` |
| 9 | Profile | `/profile` | **not designed** |

**Flow:** Welcome → Signup → OTP → PIN → Credentials → (Upload ID if Government ID chosen) → Liveness → Verified → Profile.

### Out of scope for now
- Desktop/tablet visual design (structure only, see §6)
- Login for returning users (no design yet)
- Profile screen content (no design yet)
- Forgot PIN, account settings, partner/company integrations

### Open questions (resolve before building the affected screen)
1. Is one credential (e.g. BVN only) enough to continue, or are several required? The design enables Continue after BVN alone.
2. Is Government ID an alternative to BVN/NIN or an extra step? Which ID types go in the "Select ID" dropdown?
3. Liveness: which provider/SDK (e.g. Smile ID, Youverify, Dojah), and what instructions are shown?
4. Error states (wrong OTP, BVN mismatch, failed liveness, upload rejected) are not designed.
5. Copy fix: the NIN card says "Bank National Identification Number". It should say "National Identification Number".

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

Bootstrap (when implementation starts): `pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"`, then keep the folders already in `src/`.

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
│       └── index.ts     public exports; other code imports from here only
├── components/
│   ├── ui/          Generic building blocks (Button, Input, …). Presentational only.
│   └── layout/      ScreenShell, BackButton, Logo, RouteGuard
├── lib/
│   ├── api/         client.ts, endpoints.ts, errors.ts, query-client.ts
│   └── utils/       pure helpers
├── store/           Zustand stores
├── config/          env.ts (validated env), routes.ts (route constants + step order)
├── mocks/           MSW handlers mirroring the backend contract
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

- **Mobile first.** Unprefixed Tailwind classes target mobile and must reproduce `ladder-screens` exactly: spacing, radius, font sizes, colours, button states.
- Breakpoints (Tailwind defaults):
  - `< md` (below 768px): mobile, full-screen, pixel-match to designs.
  - `md` to `lg` (768–1023px): tablet, the mobile screen centred in a card (max-width ~430px).
  - `≥ lg` (1024px+): desktop, **layout TBD**. Until it is designed, use the tablet treatment.
- Every page renders inside `components/layout/ScreenShell`. **All breakpoint-specific framing lives in ScreenShell**, so feature components stay layout-agnostic. When desktop is designed (e.g. a split view with a brand panel beside the form), we change ScreenShell, not each screen.
- Do not recreate the phone status bar (9:41, signal, battery) from the screenshots. That is device chrome, not part of the app.
- Primary CTA stays pinned near the bottom on mobile where the design shows it (Upload ID, Welcome), and inline elsewhere.

## 7. Design tokens

Extract once into `globals.css` / Tailwind theme and never hard-code hex values in components. Names to use (values to be sampled from the screens):

`--color-brand-900` (dark teal: headings, primary button), `--color-brand-500` (green: active OTP border, links, success), `--color-mint-300` (Welcome CTA, logo accent), `--color-surface-success` (Verified background), `--color-text-muted` (subtitles), `--color-border` (input/card borders), `--color-disabled-bg` / `--color-disabled-text` (disabled Continue), `--radius-input`, `--radius-card`, `--radius-pill` (buttons).

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
| POST | `/auth/signup` | `{ email, dateOfBirth }` (ISO `YYYY-MM-DD`) | `{ otpExpiresIn }` |
| POST | `/auth/otp/verify` | `{ email, code }` | session established |
| POST | `/auth/otp/resend` | `{ email }` | `{ otpExpiresIn }` |
| POST | `/auth/pin` | `{ pin, confirmPin }` | `{}` |
| POST | `/verification/bvn` | `{ bvn }` | `{ status }` |
| POST | `/verification/nin` | `{ nin }` | `{ status }` |
| POST | `/verification/government-id` | `multipart/form-data`: `idType`, `file` | `{ status }` |
| POST | `/verification/liveness` | `multipart/form-data`: `selfie` (or provider token) | `{ status, ladderId? }` |
| GET | `/verification/status` | — | `{ bvn, nin, governmentId, liveness, ladderId }` |
| GET | `/profile/me` | — | `UserProfile` |

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
- `RouteGuard` uses `/verification/status` to send the user to their next incomplete step.

### 8.7 File uploads

- Validate on the client before upload: type `image/png`, `image/jpeg`, `application/pdf`; size ≤ 5 MB (`idUploadSchema`).
- Send as `FormData`; let Axios set the `Content-Type` boundary.
- Show upload progress via Axios `onUploadProgress`.

## 9. Forms

- Each form = Zod schema in `schemas/` + `useForm({ resolver: zodResolver(schema) })`.
- Continue buttons are **disabled until the form is valid** (matches designs).
- Input rules: email, a valid email; DOB, a past date and the user is at least 18 (confirm with product); OTP, 6 digits; PIN, 6 digits, both fields match; BVN, 11 digits; NIN, 11 digits.
- Numeric fields use `inputMode="numeric"` and `autoComplete="one-time-code"` for OTP.

## 10. State rules

| Data | Lives in |
|---|---|
| Anything from the server | TanStack Query cache |
| Flow progress across screens (email, chosen credential, completed steps) | `store/onboarding.store.ts` (Zustand) |
| Form input | React Hook Form (local to the form) |
| UI toggles (accordion open, etc.) | component `useState` |

## 11. Mocking

- `NEXT_PUBLIC_USE_MOCKS=true` starts MSW in `app/providers.tsx` (development only).
- `src/mocks/handlers/*` must return the same envelope as §8.3 and cover success and error cases for each endpoint.
- BVN/NIN handlers add an artificial delay so the "verifying" spinner state can be built and tested.
- When a real endpoint ships, flip the flag and fix any contract mismatch in **types + handlers together**.

## 12. Security and privacy

This app handles identity data. These rules are non-negotiable:

- Never log PIN, OTP, BVN, NIN, ID images or selfies (no `console.log`, no analytics events, no error-tracker payloads).
- Never persist them on the client (no localStorage/sessionStorage/IndexedDB, not in Zustand persist).
- Mask BVN/NIN when displayed after submission (e.g. `*******8901`).
- PIN inputs use `type="password"` and `autoComplete="new-password"`.
- Camera access is requested only on `/liveness`, and the stream is stopped on unmount.
- All env vars exposed to the browser are prefixed `NEXT_PUBLIC_` and contain no secrets.

## 13. Accessibility

- Every input has a label (visually hidden if the design shows only a placeholder).
- OTP boxes support paste of the full code and keyboard navigation.
- Credential cards are buttons with `aria-expanded`; status changes (verifying/verified) are announced via `aria-live`.
- Colour contrast ≥ WCAG AA; the disabled button style is the only exception.
- Visible focus ring on all interactive elements.

## 14. Definition of done (per screen)

- [ ] Matches the mobile design at 375px and 390px widths
- [ ] Renders correctly at tablet and desktop widths using ScreenShell
- [ ] Loading, success and error states handled
- [ ] Works against MSW mocks; API calls follow §8
- [ ] Form validation follows §9
- [ ] No sensitive data logged or persisted (§12)
- [ ] Keyboard and screen-reader usable (§13)
- [ ] `pnpm lint` and `pnpm typecheck` pass
