import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Standard shadcn/ui utility: merges Tailwind classes safely (handles conflicts)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
