import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountBlockedPage() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Account blocked</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Your account has been blocked and you cannot use GTS MM at this time.
          Contact support if you believe this is a mistake.
        </p>
        <form action="/api/auth/signout" method="POST">
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
        <p>
          <Link href="/contact" className="font-medium text-zinc-900 dark:text-zinc-100">
            Contact support
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
