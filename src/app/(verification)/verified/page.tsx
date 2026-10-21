// Route "/verified" → You're Verified + Ladder ID. Renders features/verification/components/VerifiedSummary.
import type { Metadata } from 'next';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { VerifiedSummary } from '@/features/verification';

export const metadata: Metadata = { title: 'You’re verified · Ladder' };

export default function VerifiedPage() {
  return (
    <ScreenShell tone="success">
      <VerifiedSummary />
    </ScreenShell>
  );
}
