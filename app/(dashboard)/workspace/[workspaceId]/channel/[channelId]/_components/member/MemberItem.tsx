import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";
import { organization_user } from "@kinde/management-api-js";

type MemberItemProps = {
  member: organization_user;
  isOnline: boolean;
};

export function MemberItem({ member, isOnline }: MemberItemProps) {
  const isAdmin = member.roles?.includes("admin");

  return (
    <div className="px-3 py-2 hover:bg-accent cursor-pointer transition-colors">
      <div className="flex items-center space-x-3">
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
          {isAdmin && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{member.full_name}</p>
              <Badge>Admin</Badge>
            </div>
          )}

          <p className="text-sm text-muted-foreground truncate pt-0.5">{member.email}</p>
        </div>
      </div>
    </div>
  );
}
