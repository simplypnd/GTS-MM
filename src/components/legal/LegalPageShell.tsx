import type { ReactNode } from "react";

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <article className="prose prose-zinc max-w-3xl dark:prose-invert prose-headings:text-foreground prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-li:text-zinc-600 dark:prose-li:text-zinc-400 prose-strong:text-foreground">
      <h1>{title}</h1>
      <p className="text-sm text-zinc-500 not-prose">Last updated: {lastUpdated}</p>
      {children}
    </article>
  );
}
