import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatar } from "@/lib/getAvatar";
import { organization_user } from "@kinde/management-api-js";

interface iAppProps {
  member: organization_user;
}

export default function MemberItem({ member }: iAppProps) {
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
        </div>

        {/* member info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{member.full_name}</p>
            <Badge>Admin</Badge>
          </div>

          <p className="text-sm text-muted-foreground truncate pt-0.5">{member.email}</p>
        </div>
      </div>
    </div>
  );
}
