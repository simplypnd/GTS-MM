import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const POLICY_LINKS = [
  { href: "/contact", label: "Contact us" },
  { href: "/refund-and-return-policy", label: "Refund & return" },
  { href: "/dispute-policy", label: "Dispute policy" },
] as const;

function PolicyNav({
  currentPath,
  className,
}: {
  currentPath: string;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        "flex flex-wrap items-center gap-x-1 gap-y-2 text-sm",
        className
      )}
      aria-label="Related policies"
    >
      {POLICY_LINKS.map((link, index) => (
        <span key={link.href} className="inline-flex items-center gap-1">
          {index > 0 ? (
            <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              ·
            </span>
          ) : null}
          {link.href === currentPath ? (
            <span
              className="font-medium text-zinc-900 dark:text-zinc-100"
              aria-current="page"
            >
              {link.label}
            </span>
          ) : (
            <Link
              href={link.href}
              className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {link.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export function LegalPageShell({
  title,
  subtitle,
  lastUpdated,
  currentPath,
  variant = "legal",
  children,
}: {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  currentPath: string;
  variant?: "legal" | "support";
  children: ReactNode;
}) {
  const eyebrow = variant === "support" ? "Support" : "Legal";

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            Last updated: {lastUpdated}
          </span>
        </div>
        <PolicyNav currentPath={currentPath} className="mt-5" />
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10 dark:border-zinc-800 dark:bg-zinc-900">
        <article className="legal-document">{children}</article>

        <footer className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Questions or need help?
          </p>
          <PolicyNav currentPath={currentPath} />
        </footer>
      </div>
    </div>
  );
}
