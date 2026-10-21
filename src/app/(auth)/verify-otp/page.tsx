// Route "/verify-otp" → Enter the OTP. Renders features/auth/components/OtpForm.
import type { Metadata } from 'next';
import { OtpForm } from '@/features/auth';

export const metadata: Metadata = { title: 'Enter the OTP · Ladder' };

export default function VerifyOtpPage() {
  return <OtpForm />;
}
