// Ladder logo; variants: light (on dark bg), dark (on light bg).
import { cn } from '@/lib/utils/cn';

type LogoProps = {
  variant?: 'light' | 'dark';
  className?: string;
};

export function Logo({ variant = 'dark', className }: LogoProps) {
  const isLight = variant === 'light';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" aria-hidden="true">
        <rect
          x="12"
          y="0"
          width="22"
          height="42"
          rx="2"
          className={isLight ? 'fill-mint-300/60' : 'fill-brand-500'}
        />
        <rect x="0" y="22" width="16" height="20" rx="2" className="fill-mint-300" />
        <rect
          x="11"
          y="13"
          width="13"
          height="17"
          rx="3.5"
          transform="rotate(-18 17.5 21.5)"
          className="fill-mint-100"
        />
      </svg>
      <span
        className={cn(
          'text-[32px] leading-none font-bold',
          isLight ? 'text-white' : 'text-brand-900',
        )}
      >
        Ladder
      </span>
    </div>
  );
}
