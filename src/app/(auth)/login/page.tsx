// Route "/login" → Welcome back (email + password). Renders features/auth/components/LoginScreen.
import type { Metadata } from 'next';
import { LoginScreen } from '@/features/auth';

export const metadata: Metadata = { title: 'Sign in · Ladder' };

export default function LoginPage() {
  return <LoginScreen />;
}
