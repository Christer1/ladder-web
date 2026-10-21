// Route "/upload-id" → Upload your ID. Renders features/verification/components/IdUploadForm.
import type { Metadata } from 'next';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { IdUploadForm } from '@/features/verification';

export const metadata: Metadata = { title: 'Upload your ID · Ladder' };

export default function UploadIdPage() {
  return (
    <ScreenShell>
      <IdUploadForm />
    </ScreenShell>
  );
}
