import { Building2, UserPlus, MessagesSquare, type LucideIcon } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";

const steps: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Building2,
    title: "Create your workspace",
    description: "Sign up and spin up a workspace for your team in seconds. One place for every project and person.",
  },
  {
    icon: UserPlus,
    title: "Invite your team",
    description:
      "Bring in teammates by email. Everyone lands in the same workspace, with the right access from day one.",
  },
  {
    icon: MessagesSquare,
    title: "Start collaborating",
    description: "Create a channel, share an update, and keep the conversation — and its decisions — in one thread.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-primary text-sm font-medium">How it works</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Up and running in minutes
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            No setup marathon and no migration project. Three steps from signing up to your team&apos;s first message.
          </p>
        </div>

        <div className="relative mt-14">
          <div aria-hidden className="bg-border absolute top-7 left-[16.666%] right-[16.666%] hidden h-px md:block" />

          <AnimatedGroup
            variants={{
              container: { visible: { transition: { staggerChildren: 0.12 } } },
              item: {
                hidden: { opacity: 0, y: 24 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { type: "spring" as const, bounce: 0.3, duration: 1.2 },
                },
              },
            }}
            className="grid gap-12 md:grid-cols-3 md:gap-8"
          >
            {steps.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="bg-background relative flex size-14 items-center justify-center rounded-2xl border shadow-sm">
                  <step.icon className="text-primary size-6" />
                  <span className="bg-primary text-primary-foreground ring-background absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full text-xs font-semibold ring-4">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 max-w-xs text-sm">{step.description}</p>
              </div>
            ))}
          </AnimatedGroup>
        </div>
      </div>
    </section>
  );
}
