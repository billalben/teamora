import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatar } from "@/lib/getAvatar";
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
          <Avatar className="size-8">
            <AvatarImage
              src={getAvatar({ picture: member.picture, email: member.email })}
              className="object-cover"
              alt="Member avatar"
            />

            <AvatarFallback>{member.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          {/* online/offline status indicator */}
          <div
            className={cn(
              "absolute bottom-0 right-0 size-3 rounded-full border border-background",
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
