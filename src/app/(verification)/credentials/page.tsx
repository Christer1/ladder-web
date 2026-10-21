// Route "/credentials" → Verify your credentials (Date of Birth first, then BVN / NIN / Government ID). Renders features/verification/components/CredentialList.
import type { Metadata } from 'next';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { CredentialList } from '@/features/verification';

export const metadata: Metadata = { title: 'Verify your credentials · Ladder' };

export default function CredentialsPage() {
  return (
    <ScreenShell>
      <CredentialList />
    </ScreenShell>
  );
}
