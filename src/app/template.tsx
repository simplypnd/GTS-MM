"use client";

import { pageEnter } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return <div className={pageEnter}>{children}</div>;
}
