import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPHP(centavos: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(centavos / 100);
}

export function formatReviewCount(count: number): string {
  const formatted = new Intl.NumberFormat("en-PH").format(count);
  return count === 1 ? "1 review" : `${formatted} reviews`;
}

export function profilePath(displayName: string): string {
  return `/u/${encodeURIComponent(displayName)}`;
}

export function maskAccountNumber(num: string): string {
  if (num.length <= 4) return "****";
  return `****${num.slice(-4)}`;
}
