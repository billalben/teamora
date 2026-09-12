"use client";

import dynamic from "next/dynamic";

const ReactQueryDevtools = dynamic(
  () => import("@tanstack/react-query-devtools").then((mod) => mod.ReactQueryDevtools),
  { ssr: false }
);

export function QueryDevtools() {
  return <ReactQueryDevtools initialIsOpen={false} />;
}
