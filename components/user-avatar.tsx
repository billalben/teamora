"use client";

import Image from "next/image";
import * as React from "react";

import { getAvatar } from "@/lib/getAvatar";
import { cn } from "@/lib/utils";

// Keep in sync with `images.remotePatterns` in next.config.ts.
// Unknown hosts fall back to `unoptimized` so they can never crash the page.
const OPTIMIZED_HOSTS = [
  "ik.imagekit.io",
  "avatars.githubusercontent.com",
  "avatar.vercel.sh",
  "gravatar.com",
  "github.com",
];

function canOptimize(src: string) {
  try {
    const { hostname } = new URL(src);
    return (
      OPTIMIZED_HOSTS.includes(hostname) ||
      hostname.endsWith(".googleusercontent.com") ||
      hostname.endsWith(".gravatar.com") ||
      hostname.endsWith(".ufs.sh")
    );
  } catch {
    return false;
  }
}

type UserAvatarProps = {
  picture?: string | null;
  email?: string | null;
  name?: string | null;
  className?: string;
  children?: React.ReactNode;
};

export function UserAvatar({ picture, email, name, className, children }: UserAvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  const src = getAvatar({ picture, email });
  const initial = name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <span
      className={cn(
        "relative flex size-8 shrink-0 select-none rounded-full bg-muted after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten",
        className
      )}
    >
      {hasError ? (
        <span className="flex size-full items-center justify-center bg-muted text-sm text-muted-foreground">
          {initial}
        </span>
      ) : (
        <Image
          src={src}
          alt={name ?? "User avatar"}
          width={64}
          height={64}
          unoptimized={!canOptimize(src)}
          onError={() => setHasError(true)}
          className="aspect-square size-full rounded-full object-cover"
        />
      )}

      {children}
    </span>
  );
}
