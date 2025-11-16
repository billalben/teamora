import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs";
import { PortalLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { CreditCard, LogOutIcon, UserIcon } from "lucide-react";

// fake user temp
const USER = {
  picture: "https://github.com/shadcn.png",
  given_name: "User Name",
  email: "test@example.com",
};

export function UserNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-xl hover:rounded-lg transition-all duration-200 bg-background/50 border-border/50 hover:bg-accent hover:text-accent-foreground"
        >
          <Avatar>
            <AvatarImage src={USER.picture} alt="User Avatar" className="object-cover" />
            <AvatarFallback className="uppercase">{USER.given_name.slice(0, 2)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="right" sideOffset={8} className="w-52">
        <DropdownMenuLabel className="flex items-center gap-3">
          <Avatar className="size-8 rounded-lg">
            <AvatarImage src={USER.picture} alt="User Avatar" className="object-cover" />
            <AvatarFallback className="uppercase">{USER.given_name.slice(0, 2)}</AvatarFallback>
          </Avatar>

          <div className="grid flex-1 text-left text-sm leading-tight">
            <p className="truncate font-medium">{USER.given_name}</p>
            <p className="text-xs truncate text-muted-foreground">{USER.email}</p>
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
