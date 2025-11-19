import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function WorkspaceMembersList() {
  const MEMBERS = [
    {
      id: 1,
      name: "Alice Johnson",
      imageUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      email: "alice.johnson@example.com",
    },
    {
      id: 2,
      name: "Bob Smith",
      imageUrl: "https://avatars.githubusercontent.com/u/2?v=4",
      email: "bob.smith@example.com",
    },
  ];

  return (
    <div className="space-y-1 py-1">
      {MEMBERS.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 px-2 py-1 hover:bg-accent rounded-md cursor-pointer transition-colors"
        >
          <Avatar className="size-6 relative">
            <AvatarImage src={member.imageUrl} alt={member.name} className="object-cover" />
            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none">{member.name}</p>
            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
