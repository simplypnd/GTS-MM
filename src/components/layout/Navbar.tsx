"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isRecoveryUser } from "@/lib/auth/recovery";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn, profilePath } from "@/lib/utils";

const drawerLinkClass =
  "block rounded-lg px-3 py-3 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

function NavLinks({
  user,
  isMediator,
  displayName,
  onNavigate,
  onSignOut,
  className,
}: {
  user: User | null;
  isMediator: boolean;
  displayName: string | null;
  onNavigate?: () => void;
  onSignOut: () => Promise<void>;
  className?: string;
}) {
  const linkClass = cn(drawerLinkClass, className);

  if (user) {
    return (
      <>
        {displayName ? (
          <Link
            href={profilePath(displayName)}
            className={linkClass}
            onClick={onNavigate}
          >
            Profile
          </Link>
        ) : null}
        <Link href="/dashboard" className={linkClass} onClick={onNavigate}>
          Dashboard
        </Link>
        <Link href="/deals/new" className={linkClass} onClick={onNavigate}>
          New deal
        </Link>
        <Link href="/withdraw" className={linkClass} onClick={onNavigate}>
          Withdraw
        </Link>
        <Link href="/settings/payouts" className={linkClass} onClick={onNavigate}>
          Payouts
        </Link>
        <Link
          href="/settings/appearance"
          className={linkClass}
          onClick={onNavigate}
        >
          Appearance
        </Link>
        {isMediator && (
          <Link href="/disputes" className={linkClass} onClick={onNavigate}>
            Disputes
          </Link>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            onNavigate?.();
            void onSignOut();
          }}
        >
          Sign out
        </Button>
      </>
    );
  }

  return (
    <>
      <Link href="/login" onClick={onNavigate}>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          Log in
        </Button>
      </Link>
      <Link href="/register" onClick={onNavigate}>
        <Button size="sm" className="w-full">
          Register
        </Button>
      </Link>
    </>
  );
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMediator, setIsMediator] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    async function loadUser(currentUser: User | null) {
      setUser(currentUser);
      if (!currentUser) {
        setIsMediator(false);
        setDisplayName(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_mediator, display_name")
        .eq("id", currentUser.id)
        .single();
      setIsMediator(!!profile?.is_mediator);
      setDisplayName(profile?.display_name ?? null);
    }

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      void loadUser(currentUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setIsMediator(false);
    setDisplayName(null);
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const isPasswordResetFlow =
    pathname.startsWith("/reset-password") && isRecoveryUser(user);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {isPasswordResetFlow ? (
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            GTS MM
          </span>
        ) : (
          <Link
            href="/"
            className="font-semibold text-zinc-900 dark:text-zinc-100"
          >
            GTS MM
          </Link>
        )}

        {!isPasswordResetFlow && (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        )}
      </div>

      {menuOpen && !isPasswordResetFlow && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-14 z-40 bg-black/20 dark:bg-black/40"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="fixed left-0 right-0 top-14 z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-zinc-200 bg-white shadow-md motion-safe:animate-fade-in motion-reduce:animate-none origin-top dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto max-w-5xl px-4 py-3">
              <div className="flex flex-col gap-1 text-sm">
                <NavLinks
                  user={user}
                  isMediator={isMediator}
                  displayName={displayName}
                  onNavigate={() => setMenuOpen(false)}
                  onSignOut={handleSignOut}
                />
              </div>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
