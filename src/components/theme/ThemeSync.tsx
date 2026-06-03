"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { setThemeCookie, type ThemePreference } from "@/lib/theme/constants";

export function ThemeSync() {
  const { setTheme, resolvedTheme } = useTheme();
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("theme_preference")
        .eq("id", user.id)
        .single();

      const pref = profile?.theme_preference as ThemePreference | undefined;
      if (pref === "light" || pref === "dark") {
        setTheme(pref);
        setThemeCookie(pref);
        synced.current = true;
      }
    }

    void load();
  }, [setTheme]);

  useEffect(() => {
    if (resolvedTheme === "light" || resolvedTheme === "dark") {
      setThemeCookie(resolvedTheme);
    }
  }, [resolvedTheme]);

  return null;
}
