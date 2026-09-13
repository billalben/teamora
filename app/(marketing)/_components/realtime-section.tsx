import { Hash, Check, Zap, Users, SmilePlus, CornerDownRight } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";

const itemVariants = {
  container: { visible: { transition: { staggerChildren: 0.12 } } },
  item: {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, bounce: 0.3, duration: 1.2 },
    },
  },
};

type Member = { initials: string; name: string; color: string; online: boolean };

const members: Member[] = [
  { initials: "MK", name: "Maya K.", color: "from-violet-500 to-fuchsia-500", online: true },
  { initials: "JT", name: "Jon T.", color: "from-sky-500 to-cyan-400", online: true },
  { initials: "AR", name: "Ana R.", color: "from-emerald-500 to-lime-400", online: true },
  { initials: "DL", name: "Dev L.", color: "from-amber-500 to-orange-400", online: false },
];

function Avatar({ member, size = "size-8" }: { member: Member; size?: string }) {
  return (
    <div className="relative shrink-0">
      <div
        className={`flex ${size} items-center justify-center rounded-full bg-linear-to-br text-[11px] font-semibold text-white ${member.color}`}
      >
        {member.initials}
      </div>
      <span
        className={`ring-card absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ${
          member.online ? "bg-emerald-500" : "bg-zinc-400"
        }`}
      />
    </div>
  );
}

function RealtimeMockup() {
  return (
    <div className="relative">
      <div className="bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Hash className="text-muted-foreground size-4" />
            <span>general</span>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((member) => (
              <div key={member.initials} className="ring-card rounded-full ring-2">
                <Avatar member={member} size="size-7" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-start gap-3">
            <Avatar member={members[0]} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">Maya K.</span>
                <span className="text-muted-foreground text-xs">just now</span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">Shipping the fix now — watch this channel.</p>
              <div className="bg-accent mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs">
                <SmilePlus className="size-3" /> 2
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Avatar member={members[1]} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">Jon T.</span>
                <span className="text-muted-foreground text-xs">just now</span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">Seeing it live on my end already.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center pb-5">
          <span className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium shadow-lg">
            <Zap className="size-3" /> 1 new message
          </span>
        </div>
      </div>

      <div className="bg-background/95 ring-background absolute -right-3 -bottom-6 z-10 hidden w-52 rounded-2xl border p-3 shadow-xl ring-1 backdrop-blur sm:block">
        <div className="flex items-center gap-2 px-1">
          <Users className="text-muted-foreground size-4" />
          <span className="text-xs font-medium">Online now</span>
        </div>
        <ul className="mt-2 space-y-1">
          {members.map((member) => (
            <li key={member.initials} className="flex items-center gap-2 rounded-lg px-1 py-1">
              <Avatar member={member} size="size-6" />
              <span className="flex-1 truncate text-xs">{member.name}</span>
              <span className="text-muted-foreground text-[10px]">{member.online ? "Active" : "Away"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function RealtimeSection() {
  return (
    <section id="realtime" className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <AnimatedGroup variants={itemVariants} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-primary text-sm font-medium">Realtime</p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Conversations that move the moment you do
            </h2>
            <p className="text-muted-foreground mt-4 text-balance">
              No refresh, no polling, no waiting. Messages, threads, and reactions land instantly for everyone in the
              channel — and presence shows you who&apos;s around.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Messages, replies, and reactions sync the instant they happen.",
                "Presence shows who's online, so you know who can reply.",
                "Your own sends appear immediately — no waiting on the server.",
              ].map((point) => (
                <li key={point} className="flex gap-3 text-sm">
                  <span className="bg-primary/10 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3" />
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <RealtimeMockup />
        </AnimatedGroup>

        <p className="text-muted-foreground mt-16 flex items-center justify-center gap-2 text-center text-sm">
          <CornerDownRight className="size-4" />
          Powered by Cloudflare Durable Objects for low-latency delivery.
        </p>
      </div>
    </section>
  );
}
