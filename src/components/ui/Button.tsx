// Shared Button. Presentational only: no API calls, no feature imports.
import { cn } from '@/lib/utils/cn';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'mint';

type ButtonProps = React.ComponentProps<'button'> & {
  /** primary: dark pill used for Continue. secondary: outlined pill. mint: Welcome "Get started" on the dark background. */
  variant?: ButtonVariant;
  isLoading?: boolean;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'rounded-pill bg-brand-900 text-white hover:bg-brand-900/90 disabled:bg-disabled-bg disabled:text-disabled-text',
  secondary:
    'rounded-pill border-[1.5px] border-brand-900 bg-transparent text-brand-900 hover:bg-brand-900/5 disabled:border-disabled-bg disabled:text-disabled-text',
  mint: 'rounded-cta bg-mint-300 text-brand-900 hover:bg-mint-400 disabled:opacity-60',
};

export const buttonClasses = (variant: ButtonVariant = 'primary', className?: string) =>
  cn(
    'inline-flex h-14 w-full items-center justify-center gap-2 px-6 text-lg font-semibold transition-colors disabled:cursor-not-allowed',
    VARIANT_CLASSES[variant],
    className,
  );

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClasses(variant, className)}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}
