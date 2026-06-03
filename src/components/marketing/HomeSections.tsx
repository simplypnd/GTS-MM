import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { staggerChild } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    title: "QR Ph payments Philippines",
    description:
      "Pay secure online deals with dynamic QR Ph codes. Payment status updates automatically when confirmed.",
  },
  {
    title: "Pay with wallet balance",
    description:
      "Use your GTS MM balance when funds are sufficient—fast checkout without scanning a QR code.",
  },
  {
    title: "In-app wallet",
    description:
      "Completed deals credit your balance. Track buyer and seller payouts in one place before cashing out.",
  },
  {
    title: "InstaPay and PESONet withdrawals",
    description:
      "Withdraw to your bank on your schedule—InstaPay (₱10 fee, minutes) or PESONet (free, ~1 business day).",
  },
  {
    title: "Flexible buyer and seller roles",
    description:
      "Choose your role per deal. Invite your counterparty by email for peer-to-peer transactions.",
  },
  {
    title: "Deal chat and dispute resolution",
    description:
      "Message on every deal. Mediators resolve disputes and credit balances fairly.",
  },
];

const STEPS = [
  "Create a secure online deal as buyer or seller and invite your counterparty.",
  "Buyer pays via QR Ph payment or wallet balance—funds held by MidMan.",
  "Seller marks the order delivered.",
  "Buyer confirms receipt—seller is credited to their GTS MM balance.",
  "Withdraw to your bank via InstaPay or PESONet.",
];

export function HomeHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm sm:px-12",
        staggerChild(0)
      )}
      aria-labelledby="hero-heading"
    >
      <p className="text-sm font-medium text-zinc-500">GTS MM</p>
      <h1
        id="hero-heading"
        className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
      >
        Secure online deals with MidMan protection
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-zinc-600">
        Pay with QR Ph or your GTS MM balance. Funds stay protected by MidMan until
        you confirm delivery—or a mediator resolves a dispute. Withdraw on your terms.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Go to dashboard
              </Button>
            </Link>
            <Link href="/withdraw" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Withdraw funds
              </Button>
            </Link>
            <Link href="/deals/new" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Create deal
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                aria-label="Register for GTS MM"
              >
                Get started
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Log in
              </Button>
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export function HomeHowItWorks() {
  return (
    <section
      className={cn("space-y-6", staggerChild(1))}
      aria-labelledby="how-it-works-heading"
    >
      <h2 id="how-it-works-heading" className="text-2xl font-bold text-zinc-900">
        How MidMan deals work
      </h2>
      <ol className="space-y-4">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <p className="pt-1 text-zinc-700">{step}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function HomeFeatures() {
  return (
    <section
      className={cn("space-y-6", staggerChild(2))}
      aria-labelledby="features-heading"
    >
      <h2 id="features-heading" className="text-2xl font-bold text-zinc-900">
        Features for secure buyer–seller deals
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <CardTitle className="text-base">{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-600">
              {f.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function HomeFaq() {
  return (
    <section
      className={cn("space-y-6", staggerChild(3))}
      aria-labelledby="faq-heading"
    >
      <h2 id="faq-heading" className="text-2xl font-bold text-zinc-900">
        Frequently asked questions
      </h2>
      <FaqAccordion />
    </section>
  );
}

export function HomeCta({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section
      className={cn(
        "rounded-2xl bg-zinc-900 px-6 py-10 text-center text-white sm:px-12",
        staggerChild(4)
      )}
      aria-labelledby="cta-heading"
    >
      <h2 id="cta-heading" className="text-xl font-bold sm:text-2xl">
        Start secure deals with MidMan today
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-zinc-300">
        Create your GTS MM account and fund your first deal in minutes.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {isLoggedIn ? (
          <Link href="/deals/new">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Create a deal
            </Button>
          </Link>
        ) : (
          <Link href="/register">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              aria-label="Register for GTS MM"
            >
              Create free account
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}

export function HomeFooter({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50/80 pt-12 pb-8">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3">
        <div>
          <p className="font-semibold text-zinc-900">GTS MM</p>
          <p className="mt-2 text-sm text-zinc-600">
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
                <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900">
                  Dashboard
                </Link>
                <Link href="/withdraw" className="text-zinc-600 hover:text-zinc-900">
                  Withdraw
                </Link>
                <Link href="/settings/payouts" className="text-zinc-600 hover:text-zinc-900">
                  Payout accounts
                </Link>
                <Link href="/deals/new" className="text-zinc-600 hover:text-zinc-900">
                  New deal
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="text-zinc-600 hover:text-zinc-900">
                  Register
                </Link>
                <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
                  Log in
                </Link>
              </>
            )}
          </nav>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Account
          </p>
          <nav className="mt-3 flex flex-col gap-2 text-sm">
            <Link href="/login" className="text-zinc-600 hover:text-zinc-900">
              Log in
            </Link>
            <Link href="/register" className="text-zinc-600 hover:text-zinc-900">
              Register
            </Link>
          </nav>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} GTS MM. All rights reserved.
      </p>
    </footer>
  );
}
