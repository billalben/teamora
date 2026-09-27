"use client";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { orpc } from "@/lib/orpc";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import { PortalLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useQuery } from "@tanstack/react-query";
import { Check, CreditCard, LogOutIcon, Moon, Sun, UserIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

const themes = ["light", "dark", "system"] as const;

export function UserNav({ idPrefix = "user-nav" }: { idPrefix?: string }) {
  const { data, isPending } = useQuery(orpc.workspace.list.queryOptions());
  const { theme, setTheme } = useTheme();

  if (isPending || !data) {
    return <div className="size-12 animate-pulse rounded-xl bg-background/50" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={`${idPrefix}-trigger`}
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-12 rounded-xl hover:rounded-lg transition-all duration-200 bg-background/50 border-border/50 hover:bg-accent hover:text-accent-foreground"
          >
            <UserAvatar picture={data.user.picture} email={data.user.email} name={data.user.given_name} />
          </Button>
        }
      />

      <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3">
            <UserAvatar picture={data.user.picture} email={data.user.email} name={data.user.given_name} />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <p className="truncate font-medium">{data.user.given_name}</p>
              <p className="text-xs truncate text-muted-foreground">{data.user.email}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            render={
              <PortalLink>
                <UserIcon />
                Account
              </PortalLink>
            }
          />

          <DropdownMenuItem
            render={
              <PortalLink>
                <CreditCard />
                Billing
              </PortalLink>
            }
          />

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="size-4 dark:hidden" />
              <Moon className="hidden size-4 dark:block" />
              Theme
            </DropdownMenuSubTrigger>

            <DropdownMenuSubContent>
              {themes.map((value) => (
                <DropdownMenuItem key={value} closeOnClick onClick={() => setTheme(value)}>
                  <Check className={cn("size-4", theme === value ? "opacity-100" : "opacity-0")} />
                  <span className="capitalize">{value}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            render={
              <LogoutLink>
                <LogOutIcon />
                Logout
              </LogoutLink>
            }
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
