"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type DateTimeStyle = "full" | "long" | "medium" | "short";

export function LocalizedTime({
  dateTime,
  className,
  dateStyle = "medium",
  timeStyle = "short",
}: {
  dateTime: string;
  className?: string;
  dateStyle?: DateTimeStyle;
  timeStyle?: DateTimeStyle;
}) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(
      new Date(dateTime).toLocaleString(undefined, { dateStyle, timeStyle })
    );
  }, [dateTime, dateStyle, timeStyle]);

  return (
    <time
      dateTime={dateTime}
      className={cn(className)}
      suppressHydrationWarning
    >
      {label || "…"}
    </time>
  );
}
