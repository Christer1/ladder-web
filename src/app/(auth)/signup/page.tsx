// Route "/signup" → Create your account. Renders features/auth/components/SignupForm.
import type { Metadata } from 'next';
import { SignupForm } from '@/features/auth';

export const metadata: Metadata = { title: 'Create your account · Ladder' };

export default function SignupPage() {
  return <SignupForm />;
}
