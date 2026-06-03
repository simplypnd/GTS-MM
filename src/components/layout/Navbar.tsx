"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function NavLinks({
  user,
  onNavigate,
  onSignOut,
  className,
}: {
  user: User | null;
  onNavigate?: () => void;
  onSignOut: () => Promise<void>;
  className?: string;
}) {
  const linkClass =
    "block rounded-lg px-3 py-3 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 md:inline md:rounded-none md:px-0 md:py-0 md:text-zinc-600 md:hover:bg-transparent md:hover:text-zinc-900";

  if (user) {
    return (
      <>
        <Link href="/dashboard" className={cn(linkClass, className)} onClick={onNavigate}>
          Dashboard
        </Link>
        <Link href="/deals/new" className={cn(linkClass, className)} onClick={onNavigate}>
          New deal
        </Link>
        <Link href="/settings/payouts" className={cn(linkClass, className)} onClick={onNavigate}>
          Payouts
        </Link>
        <Link href="/disputes" className={cn(linkClass, className)} onClick={onNavigate}>
          Disputes
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start md:w-auto md:justify-center"
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
      <Link href="/login" onClick={onNavigate} className="md:inline">
        <Button variant="ghost" size="sm" className="w-full justify-start md:w-auto md:justify-center">
          Log in
        </Button>
      </Link>
      <Link href="/register" onClick={onNavigate} className="md:inline">
        <Button size="sm" className="w-full md:w-auto">
          Register
        </Button>
      </Link>
    </>
  );
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={user ? "/dashboard" : "/"} className="font-semibold text-zinc-900">
          GTS Escrow
        </Link>

        <nav className="hidden items-center gap-4 text-sm md:flex">
          <NavLinks user={user} onSignOut={handleSignOut} />
        </nav>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 md:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav className="border-t border-zinc-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1 text-sm">
            <NavLinks
              user={user}
              onNavigate={() => setMenuOpen(false)}
              onSignOut={handleSignOut}
            />
          </div>
        </nav>
      )}
    </header>
  );
}
