"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { setThemeCookie, type ThemePreference } from "@/lib/theme/constants";

export function ThemeSync({
  initialThemePreference = null,
}: {
  initialThemePreference?: ThemePreference | null;
}) {
  const { setTheme, resolvedTheme } = useTheme();
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;

    if (initialThemePreference === "light" || initialThemePreference === "dark") {
      setTheme(initialThemePreference);
      setThemeCookie(initialThemePreference);
      synced.current = true;
    }
  }, [initialThemePreference, setTheme]);

  useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      setThemeCookie(resolvedTheme);
    }
  }, [resolvedTheme]);

  return null;
}
