// Welcome screen content: headline, illustration, feature checklist, "Get started" CTA.
// Mobile: one column, CTA pinned to the bottom. Tablet: same column, centred. Desktop: copy left, illustration right.
import Link from 'next/link';
import { BrandIllustration } from '@/components/layout/BrandIllustration';
import { Logo } from '@/components/layout/Logo';
import { buttonClasses } from '@/components/ui';
import { ROUTES } from '@/config/routes';

const BENEFITS = ['Quick and secure', 'You’re in control'] as const;

function CheckBadge() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="shrink-0">
      <circle cx="10" cy="10" r="10" className="fill-mint-300/60" />
      <path
        d="m6 10.2 2.7 2.7L14 7.6"
        fill="none"
        className="stroke-surface-brand-bottom"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WelcomeHero() {
  return (
    <div className="flex flex-1 flex-col px-4 pt-9 pb-8 md:px-6 lg:px-12 lg:pt-10 lg:pb-12">
      <Logo variant="light" className="ml-4 md:ml-0" />

      {/* Explicit grid placement on desktop; plain flex column below lg keeps the mobile order. */}
      <div className="flex flex-1 flex-col md:my-auto md:flex-none lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-16 lg:py-12">
        <h1 className="mt-9 text-[32px] leading-[1.5] font-medium tracking-[-0.01em] md:text-4xl lg:col-start-1 lg:row-start-1 lg:mt-0 lg:text-5xl lg:leading-[1.2] xl:text-[56px]">
          Verify your identity.
          <span className="block text-mint-300">Use everywhere.</span>
        </h1>

        <p className="mt-4 text-base leading-[34px] text-text-on-brand lg:col-start-1 lg:row-start-2 lg:mt-6 lg:max-w-md lg:text-lg lg:leading-8">
          Open accounts faster, access more financial services and keep your identity in one secure
          place.
        </p>

        <div className="mt-6 flex justify-center lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mt-0">
          <BrandIllustration className="md:max-w-[400px] lg:max-w-[520px]" />
        </div>

        <ul className="mt-4 flex flex-col gap-3.5 lg:col-start-1 lg:row-start-3 lg:mt-8">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3 text-base text-white">
              <CheckBadge />
              {benefit}
            </li>
          ))}
        </ul>

        {/* Pinned to the bottom on mobile; inline below the content from tablet up (rules.md §6). */}
        <div className="mt-auto pt-7 md:mt-0 md:pt-10 lg:col-start-1 lg:row-start-4">
          <Link href={ROUTES.SIGNUP} className={buttonClasses('mint', 'lg:w-auto lg:min-w-60')}>
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}
