import { cn } from "@/lib/utils";

export const pageEnter =
  "motion-safe:animate-fade-in-up motion-reduce:animate-none";

export const sectionEnter =
  "motion-safe:animate-fade-in motion-reduce:animate-none";

export function staggerChild(index: number): string {
  const delay = Math.min(index * 80, 400);
  return cn(
    "motion-safe:animate-fade-in-up motion-reduce:animate-none",
    delay > 0 && `motion-safe:[animation-delay:${delay}ms]`
  );
}

export const interactiveCard =
  "motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md";

export const interactivePress =
  "motion-safe:transition-transform motion-safe:duration-150 motion-safe:active:scale-[0.98]";
