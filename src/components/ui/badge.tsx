import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
        success:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
        warning:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
