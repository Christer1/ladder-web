// Verification group layout: RouteGuard (requires authenticated session).
// Each page renders its own ScreenShell because the tone differs (Verified uses "success").
import { RouteGuard } from '@/components/layout/RouteGuard';

export default function VerificationLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
