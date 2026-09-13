"use client";

import Link from "next/link";
import Image from "next/image";
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import ThemeToggle from "@/components/ui/theme-toggle";

const productLinks = [
  { name: "Features", href: "#features" },
  { name: "AI", href: "#ai" },
  { name: "Realtime", href: "#realtime" },
  { name: "How it works", href: "#how-it-works" },
];

const resourceLinks = [
  { name: "Product preview", href: "#product" },
  { name: "FAQ", href: "#faq" },
];

const linkClass = "text-muted-foreground hover:text-foreground w-fit text-sm duration-150";

export function Footer() {
  const { getUser } = useKindeBrowserClient();
  const user = getUser();

  return (
    <footer className="bg-background border-t">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2">
            <Link href="/" aria-label="home" className="flex w-fit items-center space-x-2">
              <Image src="/logo.svg" alt="Logo" width={32} height={32} />
              <span className="text-md font-bold">
                Team<span className="text-primary">ora</span>
              </span>
            </Link>
            <p className="text-muted-foreground mt-4 max-w-xs text-sm">
              The AI-ready home for team communication. Channels, threads, and realtime messaging — with AI that keeps
              everyone in sync.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">Product</span>
            {productLinks.map((link) => (
              <Link key={link.name} href={link.href} className={linkClass}>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">Resources</span>
            {resourceLinks.map((link) => (
              <Link key={link.name} href={link.href} className={linkClass}>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium">Account</span>
            {user ? (
              <Link href="/workspace" className={linkClass}>
                Dashboard
              </Link>
            ) : (
              <>
                <RegisterLink
                  className={linkClass}
                  authUrlParams={{
                    is_create_org: "true",
                    org_name: "teamora",
                    pricing_table_key: "organization_plans",
                  }}
                >
                  Get started
                </RegisterLink>
                <LoginLink className={linkClass}>Log in</LoginLink>
              </>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} Teamora. All rights reserved.</p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
