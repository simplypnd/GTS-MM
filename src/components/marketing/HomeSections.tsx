import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";

const FEATURES = [
  {
    title: "QR Ph payments",
    description: "Pay deals with dynamic QR codes via PayMongo. Status updates when payment is confirmed.",
  },
  {
    title: "Pay with balance",
    description: "Use your GTS MM wallet balance when you have enough funds—no QR needed.",
  },
  {
    title: "In-app wallet",
    description: "Completed deals credit your balance. Track funds in one place before cashing out.",
  },
  {
    title: "InstaPay & PESONet",
    description: "Withdraw on your schedule—fast InstaPay (₱10 fee) or free PESONet (~1 business day).",
  },
  {
    title: "Per-deal roles",
    description: "Be buyer or seller on each deal. Invite your counterparty by email.",
  },
  {
    title: "Deal chat & disputes",
    description: "Message on every deal. Mediators resolve disputes and credit balances fairly.",
  },
];

const STEPS = [
  "Create a deal as buyer or seller and invite your counterparty.",
  "Buyer pays via QR Ph or wallet balance—funds held by MidMan.",
  "Seller marks the order delivered.",
  "Buyer confirms received—seller is credited to their balance.",
  "Withdraw to your bank via InstaPay or PESONet.",
];

export function HomeHero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm sm:px-12">
      <p className="text-sm font-medium text-zinc-500">GTS MM</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
        Secure peer deals with MidMan
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-zinc-600">
        Pay with QR Ph or your balance. Funds stay protected by MidMan until you
        confirm delivery—or a mediator steps in. Cash out on your terms.
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
                Withdraw
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
              <Button size="lg" className="w-full sm:w-auto">
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
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900">How it works</h2>
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
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900">Features</h2>
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
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-zinc-900">FAQ</h2>
      <FaqAccordion />
    </section>
  );
}

export function HomeCta({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="rounded-2xl bg-zinc-900 px-6 py-10 text-center text-white sm:px-12">
      <h2 className="text-xl font-bold sm:text-2xl">Ready to trade with MidMan?</h2>
      <p className="mx-auto mt-2 max-w-lg text-zinc-300">
        Create your account and start your first deal in minutes.
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
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Register free
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}

export function HomeFooter({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <footer className="border-t border-zinc-200 pt-8 text-sm text-zinc-600">
      <p className="font-semibold text-zinc-900">GTS MM</p>
      <p className="mt-1">Peer deals with MidMan fund protection.</p>
      <nav className="mt-4 flex flex-wrap gap-4">
        <Link href="/login" className="hover:text-zinc-900">
          Log in
        </Link>
        <Link href="/register" className="hover:text-zinc-900">
          Register
        </Link>
        {isLoggedIn && (
          <Link href="/dashboard" className="hover:text-zinc-900">
            Dashboard
          </Link>
        )}
      </nav>
      <p className="mt-6 text-xs text-zinc-500">
        © {new Date().getFullYear()} GTS MM. MVP prototype—not financial advice.
      </p>
    </footer>
  );
}
