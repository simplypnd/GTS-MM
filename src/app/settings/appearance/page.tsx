"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setThemeCookie, type ThemePreference } from "@/lib/theme/constants";

async function persistTheme(theme: ThemePreference) {
  setThemeCookie(theme);
  await fetch("/api/profile/theme", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ theme }),
  });
}

export default function AppearanceSettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = (theme ?? resolvedTheme ?? "light") as ThemePreference;

  async function select(next: ThemePreference) {
    setTheme(next);
    await persistTheme(next);
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Choose how GTS MM looks. Your preference is saved to your account.
        </p>
        {mounted && (
          <fieldset className="space-y-3">
            <legend className="sr-only">Theme</legend>
            {(["light", "dark"] as const).map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={current === value}
                  onChange={() => void select(value)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium capitalize text-zinc-900 dark:text-zinc-100">
                  {value} mode
                </span>
              </label>
            ))}
          </fieldset>
        )}
      </CardContent>
    </Card>
  );
}
