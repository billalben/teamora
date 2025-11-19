import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HashIcon } from "lucide-react";
import Link from "next/link";

export function ChannelList() {
  const CHANNELLIST = [
    { id: "1", name: "general" },
    { id: "2", name: "random" },
    { id: "3", name: "development" },
  ];
  return (
    <div className="space-x-0.5 py-1">
      {CHANNELLIST.map((channel) => (
        <Link
          key={channel.id}
          href="#"
          className={buttonVariants({
            variant: "ghost",
            className: cn("w-full justify-start px-2 py-1 text-sm text-muted-foreground hover:text-accent-foreground"),
          })}
        >
          <HashIcon size={16} />
          <span className="truncate">{channel.name}</span>
        </Link>
      ))}
    </div>
  );
}
