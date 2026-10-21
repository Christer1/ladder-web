// Responsive page frame. All breakpoint-specific framing lives here (rules.md §6):
//   < md      full-screen, pixel-matched to ladder-screens
//   md – lg   full-width page, content in a centred column (max 480px)
//   ≥ lg      light/success screens: BrandPanel on the left, content column on the right
//             brand screens (Welcome): full-bleed gradient, content up to max-w-6xl
import { cn } from '@/lib/utils/cn';
import { BrandPanel } from './BrandPanel';

type ScreenShellProps = {
  children: React.ReactNode;
  /** light: white form screens. success: mint-white (Verified). brand: dark teal gradient (Welcome). */
  tone?: 'light' | 'success' | 'brand';
  className?: string;
};

export function ScreenShell({ children, tone = 'light', className }: ScreenShellProps) {
  if (tone === 'brand') {
    return (
      <main className="flex min-h-dvh w-full flex-col bg-linear-to-b from-surface-brand-top to-surface-brand-bottom text-white">
        <div
          className={cn(
            'mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl',
            className,
          )}
        >
          {children}
        </div>
      </main>
    );
  }

  return (
    <div
      className={cn(
        'flex min-h-dvh w-full',
        tone === 'success' ? 'bg-surface-success' : 'bg-surface',
      )}
    >
      <BrandPanel className="hidden lg:flex lg:w-[44%] xl:w-1/2" />
      <main className="flex min-h-dvh flex-1 flex-col">
        <div
          className={cn(
            'mx-auto flex w-full max-w-[480px] flex-1 flex-col md:pt-10 lg:pt-0',
            className,
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
