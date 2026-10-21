// Route "/" → Welcome screen. Renders features/onboarding/components/WelcomeHero.
import { ScreenShell } from '@/components/layout/ScreenShell';
import { WelcomeHero } from '@/features/onboarding';

export default function WelcomePage() {
  return (
    <ScreenShell tone="brand">
      <WelcomeHero />
    </ScreenShell>
  );
}
