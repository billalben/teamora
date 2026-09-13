"use client";

import Link from "next/link";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { buttonVariants } from "@/components/ui/button";
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

const variants = {
  container: {
    visible: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.75,
      },
    },
  },
  ...transitionVariants,
};

export function HeroActions() {
  const { getUser } = useKindeBrowserClient();
  const user = getUser();

  const actions = user
    ? [
        <div key="dashboard" className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5">
          <Link href="/workspace" className={buttonVariants({ size: "lg", className: "rounded-xl px-5 text-base" })}>
            <span className="text-nowrap">Go to dashboard</span>
          </Link>
        </div>,
      ]
    : [
        <div key="register" className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5">
          <RegisterLink
            className={buttonVariants({ size: "lg", className: "rounded-xl px-5 text-base" })}
            authUrlParams={{
              is_create_org: "true",
              org_name: "teamora",
              pricing_table_key: "organization_plans",
            }}
          >
            <span className="text-nowrap">Get started</span>
          </RegisterLink>
        </div>,
        <LoginLink
          key="login"
          className={buttonVariants({
            size: "lg",
            variant: "ghost",
            className: "h-10.5 rounded-xl px-5",
          })}
        >
          <span className="text-nowrap">Log in</span>
        </LoginLink>,
      ];

  return (
    <AnimatedGroup variants={variants} className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
      {actions}
    </AnimatedGroup>
  );
}
