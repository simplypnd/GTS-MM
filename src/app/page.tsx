import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Secure deals with pseudo-escrow
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-zinc-600">
          Buyers pay via QR Ph. Funds stay on the platform wallet until the buyer
          confirms or a mediator resolves a dispute. Sellers receive payouts to
          their bank account.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button size="lg">Go to dashboard</Button>
              </Link>
              <Link href="/deals/new">
                <Button variant="outline" size="lg">
                  Create deal
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/register">
                <Button size="lg">Get started</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Log in
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pay with QR Ph</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">
            Dynamic QR codes via PayMongo Payment Intents. Webhooks confirm
            payment instantly.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Realtime chat</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">
            Buyer, seller, and mediator communicate on each deal with role
            labels.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dispute resolution</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">
            Mediators release funds to the seller or refund the designated buyer
            based on deal roles.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
