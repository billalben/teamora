"use client";

import { useState } from "react";
import { createQueryClient, isRateLimitError, type QueryClientErrorHandler } from "./query/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";

const handleQueryError: QueryClientErrorHandler = (error) => {
  if (isRateLimitError(error)) {
    toast.error("You're doing that too fast. Please wait a moment and try again.", {
      id: "rate-limit",
    });
  }
};

export function Providers(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient(handleQueryError));

  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>;
}
