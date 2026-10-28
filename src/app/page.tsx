import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">TradeLine</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          The AI phone agent for plumbers, electricians, and HVAC pros. Answers every call, books
          jobs on your calendar, and texts you the moment there&apos;s an emergency.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/login">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
