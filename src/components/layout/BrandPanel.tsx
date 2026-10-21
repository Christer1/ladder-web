// Desktop-only brand panel shown beside the form screens (ScreenShell, ≥ lg).
import { cn } from '@/lib/utils/cn';
import { BrandIllustration } from './BrandIllustration';
import { Logo } from './Logo';

export function BrandPanel({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'sticky top-0 h-dvh flex-col overflow-hidden bg-linear-to-b from-surface-brand-top to-surface-brand-bottom px-12 py-10 text-white xl:px-16',
        className,
      )}
    >
      <Logo variant="light" />

      <div className="my-auto flex flex-col py-10">
        <p className="text-4xl leading-[1.3] font-medium tracking-[-0.01em] xl:text-[44px]">
          Verify your identity.
          <span className="block text-mint-300">Use everywhere.</span>
        </p>
        <p className="mt-5 max-w-md text-base leading-7 text-text-on-brand">
          One secure Ladder ID for every company you work with. Verify once, then share it in a tap.
        </p>
        <BrandIllustration className="mt-12 max-w-[420px] self-center" />
      </div>
    </aside>
  );
}
