import { Hash, MessagesSquare, SquarePen, SmilePlus, Image as ImageIcon, Zap, type LucideIcon } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Hash,
    title: "Channels",
    description: "Organize conversations by team, project, or topic so context never gets lost.",
  },
  {
    icon: MessagesSquare,
    title: "Threads & replies",
    description: "Keep side discussions out of the way. Reply in a thread and follow it through to resolution.",
  },
  {
    icon: SquarePen,
    title: "Rich composer",
    description: "Write with formatting, lists, and syntax-highlighted code blocks. Your message, your way.",
  },
  {
    icon: SmilePlus,
    title: "Reactions",
    description: "React with emoji to give quick feedback and keep decisions moving without the noise.",
  },
  {
    icon: ImageIcon,
    title: "Image sharing",
    description: "Drop in screenshots and images, then view them full size in a built-in lightbox.",
  },
  {
    icon: Zap,
    title: "Realtime",
    description: "Messages, replies, and reactions appear instantly for everyone in the channel.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-primary text-sm font-medium">Features</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Everything your team needs to stay in sync
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            Teamora brings your conversations, decisions, and the people behind them into one fast, focused place.
          </p>
        </div>

        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.08,
                },
              },
            },
            item: {
              hidden: {
                opacity: 0,
                y: 20,
              },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring" as const,
                  bounce: 0.3,
                  duration: 1,
                },
              },
            },
          }}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card hover:border-primary/40 hover:bg-accent/40 group relative h-full rounded-2xl border p-6 transition-colors"
            >
              <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                <feature.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm">{feature.description}</p>
            </div>
          ))}
        </AnimatedGroup>
      </div>
    </section>
  );
}
