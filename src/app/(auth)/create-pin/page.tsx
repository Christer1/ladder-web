// Route "/create-pin" → Create your PIN. Renders features/auth/components/PinForm.
import type { Metadata } from 'next';
import { PinForm } from '@/features/auth';

export const metadata: Metadata = { title: 'Create your PIN · Ladder' };

export default function CreatePinPage() {
  return <PinForm />;
}
