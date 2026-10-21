// Route "/profile" → Profile (not designed yet). Renders features/profile/components/ProfileOverview.
import type { Metadata } from 'next';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { ProfileOverview } from '@/features/profile';

export const metadata: Metadata = { title: 'Your profile · Ladder' };

export default function ProfilePage() {
  return (
    <ScreenShell>
      <ProfileOverview />
    </ScreenShell>
  );
}
