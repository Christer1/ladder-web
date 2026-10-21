// Logged-in app layout: RouteGuard (requires authenticated session and a Ladder ID).
import { RouteGuard } from '@/components/layout/RouteGuard';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
