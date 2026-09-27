import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { isWorkspaceAdmin } from "@/app/schemas/member";
import { organization_user } from "@kinde/management-api-js";
import { MoreHorizontalIcon, UserMinusIcon } from "lucide-react";

type MemberItemProps = {
  member: organization_user;
  isOnline: boolean;
  canRemove?: boolean;
  onRemove?: (member: organization_user) => void;
};

export function MemberItem({ member, isOnline, canRemove, onRemove }: MemberItemProps) {
  const isAdmin = isWorkspaceAdmin(member.roles);
  const hasActions = canRemove;

  return (
    <div className="group flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors">
      <div className="relative">
        <UserAvatar className="size-8" picture={member.picture} email={member.email} name={member.full_name} />

        {/* online/offline status indicator */}
        <div
          className={cn(
            "absolute right-0 bottom-0 size-3 rounded-full border border-background",
            isOnline ? "bg-green-500" : "bg-gray-400"
          )}
        ></div>
      </div>

      {/* member info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{member.full_name}</p>
          {isAdmin && <Badge>Admin</Badge>}
        </div>

        <p className="text-sm text-muted-foreground truncate pt-0.5">{member.email}</p>
      </div>

      {hasActions && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-md:opacity-100"
                aria-label={`Actions for ${member.full_name ?? member.email ?? "member"}`}
              />
            }
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            {canRemove && (
              <DropdownMenuItem variant="destructive" onClick={() => onRemove?.(member)}>
                <UserMinusIcon />
                Remove from workspace
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
