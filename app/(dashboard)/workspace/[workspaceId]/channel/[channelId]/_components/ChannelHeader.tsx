import ThemeToggle from "@/components/ui/theme-toggle";
import { InviteMember } from "./member/InviteMember";
import { MembersOverview } from "./member/MembersOverview";

type ChannelHeaderProps = {
  channelName?: string;
};

export function ChannelHeader({ channelName = "super cool channel" }: ChannelHeaderProps) {
  return (
    <div className="flex items-center justify-between h-14 px-4 border-b">
      <h1 className="text-lg font-semibold"># {channelName}</h1>

      <div className="flex items-center space-x-2">
        <MembersOverview />
        <InviteMember />
        <ThemeToggle />
      </div>
    </div>
  );
}
