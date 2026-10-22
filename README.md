# Ladder Web

Ladder Web is a responsive web app for creating a Ladder account and verifying your identity once. After that you get a reusable **Ladder ID** that you can use with participating companies.

A user signs up with email and password and confirms an emailed OTP. They then verify their date of birth and one of **BVN**, **NIN** or a **Government ID** (front and back photos, or the passport photo page). Last comes an on-device **liveness check**. Once verified, they get a Ladder ID and a profile page. Returning users sign in and continue from where they stopped.

> Read [`rules.md`](rules.md) before writing code. It covers scope, architecture, API conventions, security and the definition of done.

## User flow

```
Welcome → Signup → Verify OTP → Credentials → (Upload ID) → Liveness → Verified → Profile
   /       /signup  /verify-otp  /credentials   /upload-id   /liveness  /verified   /profile
```

| Route | What happens |
|---|---|
| `/` | Welcome screen with links to sign up or log in |
| `/signup` | Email, password and confirm password |
| `/verify-otp` | 6-digit code sent by email, with a resend timer |
| `/login` | Email and password. The last email used on this device is pre-filled |
| `/credentials` | Date of birth first, then BVN, NIN or Government ID |
| `/upload-id` | Pick the ID type, then upload or take a photo of the front and back (passports need only the photo page) |
| `/liveness` | On-device face check with random challenges (blink, smile, turn left or right) |
| `/verified` | Success screen with a copyable Ladder ID |
| `/profile` | Email, Ladder ID and verified credentials. Sign out is here |

The backend (`GET /verification/status`) is the only source of onboarding progress. `RouteGuard` uses it to send each user to the right step, on any device.

## Tech stack

- **Next.js 16** (App Router, `cacheComponents`), **React 19**, **TypeScript** (strict)
- **Tailwind CSS v4** (design tokens in `src/styles/globals.css`)
- **TanStack Query** for server state, **Zustand** for flow state
- **React Hook Form** + **Zod** for forms and validation
- **Axios** with a single client in `src/lib/api/client.ts`
- **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision`) for the liveness check
- **MSW** for mocking endpoints the backend doesn't have yet
- **npm**, ESLint, Prettier

## Getting started

### Prerequisites

- Node.js 20+
- npm 10+
- [`ladder-backend`](../ladder-backend) running locally on port 4000

### Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000/api/v1` | Base URL of `ladder-backend` (no trailing slash) |
| `NEXT_PUBLIC_USE_MOCKS` | `false` | `true` starts MSW in development. No endpoints are mocked today |

### Test data

BVN and NIN numbers and their matching dates of birth come from the backend's seeded registry. Running `npm run db:seed` in `ladder-backend` prints them. OTPs are sent by email through Brevo.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (the source of truth if dev looks stale) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier |

## Project structure

```
src/
├── app/              Routes only: each page renders one feature component
│   ├── (auth)/           signup, verify-otp, login
│   ├── (verification)/   credentials, upload-id, liveness, verified (guarded)
│   └── (app)/            profile (guarded)
├── features/         One folder per domain: auth, onboarding, verification, profile
│   └── <feature>/        api/ · hooks/ · components/ · schemas/ · types/ · utils/ · index.ts
├── components/       Shared UI (ui/) and layout (layout/)
├── config/           env (Zod-validated), routes, liveness assets
├── lib/              API client, endpoints, utilities
├── mocks/            MSW setup and handlers
├── store/            Zustand stores
└── styles/           Global CSS and design tokens
```

Data always flows through the same chain:

```
page.tsx → feature component → useXxx hook → xxx.api.ts → lib/api/client.ts → backend
```

## Liveness check

The face check runs fully in the browser using MediaPipe Face Landmarker. It checks lighting and framing, asks the user to look straight, then gives them 3 random challenges with a progress ring. Only a single JPEG frame and the list of completed challenges are uploaded. All thresholds live in `LIVENESS_THRESHOLDS` (`src/features/verification/utils/liveness.ts`).

This is a UX gate, not the security decision. On-device checks can be spoofed, so the backend or the verification provider must verify the selfie.

The MediaPipe WASM and model are loaded from a CDN (`src/config/liveness.ts`). The WASM version must match the installed `@mediapipe/tasks-vision` version.

## Responsive layout

The designs are the mobile breakpoint. Tablet shows a centred column. Desktop is a split view with a brand panel. See `rules.md` §6.

## Security and privacy

This app handles identity data. Never log or store passwords, OTPs, BVN, NIN, ID images or selfies on the client. The only personal data kept on the device is the last signed-in email. See `rules.md` §12.
