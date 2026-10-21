// Rounded progress ring drawn around the oval camera frame. Starts at the top centre and fills
// clockwise as the user completes the liveness challenges.
import { cn } from '@/lib/utils/cn';

type LivenessProgressRingProps = {
  /** 0 – 1. */
  progress: number;
  isComplete?: boolean;
  /** Spoken value, e.g. "Step 2 of 3". */
  valueText: string;
  className?: string;
};

export function LivenessProgressRing({
  progress,
  isComplete = false,
  valueText,
  className,
}: LivenessProgressRingProps) {
  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <svg
      viewBox="0 0 288 406"
      preserveAspectRatio="none"
      role="progressbar"
      aria-label="Face check progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={valueText}
      className={cn('pointer-events-none overflow-visible', className)}
    >
      {/* rx = half the width makes a stadium; its stroke starts at the top centre. */}
      <rect
        x="4"
        y="4"
        width="280"
        height="398"
        rx="140"
        fill="none"
        strokeWidth="6"
        vectorEffect="non-scaling-stroke"
        className="stroke-border"
      />
      <rect
        x="4"
        y="4"
        width="280"
        height="398"
        rx="140"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        pathLength={100}
        strokeDasharray="100 100"
        strokeDashoffset={100 - percent}
        className={cn(
          'transition-[stroke-dashoffset,stroke] duration-300 ease-out',
          isComplete ? 'stroke-success' : 'stroke-brand-500',
          percent === 0 && 'opacity-0',
        )}
      />
    </svg>
  );
}
