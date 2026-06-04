import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/app/register/RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-500">Loading…</p>
          </CardContent>
        </Card>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
