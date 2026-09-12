"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error("global error: ", error);

  return (
    <html lang="en">
      <body>
        <div className="flex h-dvh w-full items-center justify-center p-6">
          <div className="flex max-w-sm flex-col items-center gap-4 text-center">
            <h2 className="text-lg font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or reload the page.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
