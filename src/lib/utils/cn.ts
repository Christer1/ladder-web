// className merge helper (clsx + tailwind-merge).
import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge about the custom radius tokens in globals.css.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['input', 'otp', 'cta', 'tile', 'panel', 'card', 'pill'],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
