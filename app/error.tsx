"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error(error);

  return (
    <div className="flex h-dvh w-full items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this page. This can happen right after switching workspaces.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
