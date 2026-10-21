// 404 page.
import Link from 'next/link';
import { ScreenShell } from '@/components/layout/ScreenShell';
import { Logo } from '@/components/layout/Logo';
import { buttonClasses } from '@/components/ui';
import { ROUTES } from '@/config/routes';

export default function NotFound() {
  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col px-7 pt-14 pb-10">
        <Logo className="lg:hidden" />
        <h1 className="mt-12 text-2xl leading-8 font-bold text-brand-900 lg:mt-24">
          Page not found
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-text-muted">
          The page you’re looking for doesn’t exist or isn’t available yet.
        </p>
        <Link href={ROUTES.WELCOME} className={buttonClasses('primary', 'mt-8')}>
          Back to start
        </Link>
      </div>
    </ScreenShell>
  );
}
