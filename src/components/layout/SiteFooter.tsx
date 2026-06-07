import Link from "next/link";
import { profilePath } from "@/lib/utils";

const linkClass =
  "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

export function SiteFooter({
  isLoggedIn,
  displayName,
}: {
  isLoggedIn: boolean;
  displayName: string | null;
}) {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/80 pt-12 pb-8 dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">GTS MM</p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Secure marketplace payments with MidMan fund protection for buyers
            and sellers in the Philippines.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Product
          </p>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className={linkClass}>
                  Dashboard
                </Link>
                <Link href="/deals/new" className={linkClass}>
                  New deal
                </Link>
                <Link href="/withdraw" className={linkClass}>
                  Withdraw
                </Link>
                <Link href="/referrals/about" className={linkClass}>
                  Referral program
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className={linkClass}>
                  Register
                </Link>
                <Link href="/login" className={linkClass}>
                  Log in
                </Link>
              </>
            )}
          </nav>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Legal
          </p>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/contact" className={linkClass}>
              Contact us
            </Link>
            <Link href="/refund-and-return-policy" className={linkClass}>
              Refund &amp; return policy
            </Link>
            <Link href="/dispute-policy" className={linkClass}>
              Dispute policy
            </Link>
          </nav>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {isLoggedIn ? "Settings" : "Account"}
          </p>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            {isLoggedIn ? (
              <>
                <Link href="/settings/appearance" className={linkClass}>
                  Appearance
                </Link>
                <Link href="/settings/security" className={linkClass}>
                  Security
                </Link>
                <Link href="/withdraw?tab=payouts" className={linkClass}>
                  Payout accounts
                </Link>
                {displayName ? (
                  <Link
                    href={profilePath(displayName)}
                    className={linkClass}
                  >
                    Public profile
                  </Link>
                ) : null}
              </>
            ) : (
              <>
                <Link href="/login" className={linkClass}>
                  Log in
                </Link>
                <Link href="/register" className={linkClass}>
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-5xl px-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} GTS MM. All rights reserved.
      </p>
    </footer>
  );
}
