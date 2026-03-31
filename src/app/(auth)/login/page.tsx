import { Suspense } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

function LoginFormFallback() {
  return (
    <p className="text-center text-sm text-muted-foreground">Loading…</p>
  );
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Sign in with your work email to continue to your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        By continuing you agree to your organization&apos;s data policies.
      </p>
      <div className="text-center">
        <Link
          href="/"
          className="inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
