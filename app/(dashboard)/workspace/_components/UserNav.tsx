"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getAvatar } from "@/lib/getAvatar";
import { orpc } from "@/lib/orpc";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import { PortalLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CreditCard, LogOutIcon, UserIcon } from "lucide-react";
import Image from "next/image";

export function UserNav() {
  const { data, isError } = useSuspenseQuery(orpc.workspace.list.queryOptions());

  if (isError) {
    return <div>Error loading user data</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-xl hover:rounded-lg transition-all duration-200 bg-background/50 border-border/50 hover:bg-accent hover:text-accent-foreground"
        >
          <Avatar>
            <Image
              src={getAvatar({ picture: data.user.picture, email: data.user.email })}
              alt="User Avatar"
              fill
              className="object-cover"
            />
            src={}
            <AvatarFallback className="uppercase">{data.user.given_name?.slice(0, 2) || ""}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-52">
        <DropdownMenuLabel className="flex items-center gap-3">
          <Avatar className="size-8 rounded-lg">
            <Image
              src={getAvatar({ picture: data.user.picture, email: data.user.email })}
              alt="User Avatar"
              fill
              className="object-cover"
            />
            <AvatarFallback className="uppercase">{data.user.given_name?.slice(0, 2) || ""}</AvatarFallback>
          </Avatar>

          <div className="grid flex-1 text-left text-sm leading-tight">
            <p className="truncate font-medium">{data.user.given_name}</p>
            <p className="text-xs truncate text-muted-foreground">{data.user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <PortalLink>
              <UserIcon />
              Account
            </PortalLink>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <PortalLink>
              <CreditCard />
              Billing
            </PortalLink>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <LogoutLink>
            <LogOutIcon />
            Logout
          </LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
