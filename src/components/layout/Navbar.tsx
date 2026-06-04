"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isRecoveryUser } from "@/lib/auth/recovery";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn, profilePath } from "@/lib/utils";

const dropdownLinkClass =
  "block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

function NavLinks({
  user,
  isMediator,
  isAdmin,
  displayName,
  onNavigate,
  onSignOut,
  className,
}: {
  user: User | null;
  isMediator: boolean;
  isAdmin: boolean;
  displayName: string | null;
  onNavigate?: () => void;
  onSignOut: () => Promise<void>;
  className?: string;
}) {
  const linkClass = cn(dropdownLinkClass, className);

  if (user) {
    return (
      <>
        {displayName ? (
          <Link
            href={profilePath(displayName)}
            className={linkClass}
            onClick={onNavigate}
            role="menuitem"
          >
            Profile
          </Link>
        ) : null}
        <Link
          href="/dashboard"
          className={linkClass}
          onClick={onNavigate}
          role="menuitem"
        >
          Dashboard
        </Link>
        <Link
          href="/deals/new"
          className={linkClass}
          onClick={onNavigate}
          role="menuitem"
        >
          New deal
        </Link>
        <Link
          href="/referrals"
          className={linkClass}
          onClick={onNavigate}
          role="menuitem"
        >
          Referrals
        </Link>
        <Link
          href="/withdraw"
          className={linkClass}
          onClick={onNavigate}
          role="menuitem"
        >
          Withdraw
        </Link>
        <Link
          href="/settings/payouts"
          className={linkClass}
          onClick={onNavigate}
          role="menuitem"
        >
          Payouts
        </Link>
        <Link
          href="/settings/appearance"
          className={linkClass}
          onClick={onNavigate}
          role="menuitem"
        >
          Appearance
        </Link>
        {isMediator && (
          <Link
            href="/disputes"
            className={linkClass}
            onClick={onNavigate}
            role="menuitem"
          >
            Disputes
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            className={linkClass}
            onClick={onNavigate}
            role="menuitem"
          >
            Admin
          </Link>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start rounded-md px-3 py-2"
          role="menuitem"
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
      <Link href="/login" onClick={onNavigate} role="menuitem">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start rounded-md px-3 py-2"
        >
          Log in
        </Button>
      </Link>
      <Link href="/register" onClick={onNavigate} role="menuitem">
        <Button size="sm" className="mx-3 w-[calc(100%-1.5rem)]">
          Register
        </Button>
      </Link>
    </>
  );
}

export function Navbar({
  initialUserId = null,
  initialDisplayName = null,
  initialIsMediator = false,
  initialIsAdmin = false,
}: {
  initialUserId?: string | null;
  initialDisplayName?: string | null;
  initialIsMediator?: boolean;
  initialIsAdmin?: boolean;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isMediator, setIsMediator] = useState(initialIsMediator);
  const [isAdmin, setIsAdmin] = useState(initialIsAdmin);
  const [displayName, setDisplayName] = useState<string | null>(
    initialDisplayName
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const profileUserIdRef = useRef<string | null>(initialUserId);

  useEffect(() => {
    const supabase = createClient();

    function applyProfile(
      userId: string,
      profile: {
        is_mediator: boolean;
        is_admin: boolean;
        display_name: string | null;
      }
    ) {
      profileUserIdRef.current = userId;
      setIsMediator(!!profile.is_mediator);
      setIsAdmin(!!profile.is_admin);
      setDisplayName(profile.display_name);
    }

    function clearProfile() {
      profileUserIdRef.current = null;
      setIsMediator(false);
      setIsAdmin(false);
      setDisplayName(null);
    }

    async function fetchProfile(userId: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_mediator, is_admin, display_name")
        .eq("id", userId)
        .single();
      applyProfile(userId, {
        is_mediator: !!profile?.is_mediator,
        is_admin: !!profile?.is_admin,
        display_name: profile?.display_name ?? null,
      });
    }

    async function handleAuthUser(
      currentUser: User | null,
      event: string
    ) {
      setUser(currentUser);

      if (!currentUser) {
        clearProfile();
        return;
      }

      const userId = currentUser.id;

      if (event === "TOKEN_REFRESHED" && profileUserIdRef.current === userId) {
        return;
      }

      if (profileUserIdRef.current === userId) {
        return;
      }

      if (
        userId === initialUserId &&
        (initialDisplayName !== null || initialIsMediator || initialIsAdmin)
      ) {
        applyProfile(userId, {
          is_mediator: initialIsMediator,
          is_admin: initialIsAdmin,
          display_name: initialDisplayName,
        });
        return;
      }

      await fetchProfile(userId);
    }

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      void handleAuthUser(currentUser, "INITIAL_SESSION");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      void handleAuthUser(session?.user ?? null, event);
    });

    return () => subscription.unsubscribe();
  }, [initialUserId, initialDisplayName, initialIsMediator, initialIsAdmin]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    profileUserIdRef.current = null;
    setIsMediator(false);
    setIsAdmin(false);
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
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
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
          <div ref={menuRef} className="relative flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {menuOpen && (
              <nav
                role="menu"
                className="absolute right-0 top-full z-50 mt-1 w-56 max-h-[min(70vh,24rem)] overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg motion-safe:animate-fade-in motion-reduce:animate-none origin-top dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-0.5 px-1">
                  <NavLinks
                    user={user}
                    isMediator={isMediator}
                    isAdmin={isAdmin}
                    displayName={displayName}
                    onNavigate={() => setMenuOpen(false)}
                    onSignOut={handleSignOut}
                  />
                </div>
              </nav>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
