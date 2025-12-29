import Image from "next/image";

type TProps = {
  id: number;
  message: string;
  date: Date;
  avatar: string;
  username: string;
};

export function MessageItem({ id, message, date, avatar, username }: TProps) {
  return (
    <div className="flex space-x-3 relative p-2 rounded-lg group hover:bg-muted/50">
      <Image src={avatar} alt={username} width={32} height={32} className="size-8 rounded-lg" />

      <div className="flex-1 space-y-1 min-w-0">
        <div className="flex items-center gap-x-2">
          <p className="font-medium">{username}</p>
          <p className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("en-GB", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }).format(date)}

            {", "}

            {new Intl.DateTimeFormat("en-GB", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            }).format(date)}
          </p>
        </div>

        <p className="text-sm wrap-break-word max-w-none">{message}</p>
      </div>
    </div>
  );
}
