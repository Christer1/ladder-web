// Route "/liveness" → Liveness check. Renders features/verification/components/LivenessCamera.
import type { Metadata } from 'next';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { LivenessCamera } from '@/features/verification';

export const metadata: Metadata = { title: 'Liveness check · Ladder' };

export default function LivenessPage() {
  return (
    <ScreenShell>
      <LivenessCamera />
    </ScreenShell>
  );
}
