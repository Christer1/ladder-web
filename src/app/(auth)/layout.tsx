// Auth group layout: wraps pages in components/layout/ScreenShell.
import { ScreenShell } from '@/components/layout/ScreenShell';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <ScreenShell>{children}</ScreenShell>;
}
