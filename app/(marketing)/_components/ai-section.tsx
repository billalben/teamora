import { Sparkles, Check, X, CornerDownRight, MessagesSquare, SquarePen, Send } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";

const transitionVariants = {
  item: {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, bounce: 0.3, duration: 1.2 },
    },
  },
};

const itemVariants = {
  container: { visible: { transition: { staggerChildren: 0.12 } } },
  ...transitionVariants,
};

function Avatar({ initials, className }: { initials: string; className: string }) {
  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br text-[11px] font-semibold text-white ${className}`}
    >
      {initials}
    </div>
  );
}

function ThreadSummaryMockup() {
  return (
    <div className="relative">
      <div className="bg-card rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessagesSquare className="text-muted-foreground size-4" />
            <span>#product-launch</span>
          </div>
          <span className="text-muted-foreground text-xs">6 replies</span>
        </div>

        <div className="mt-5 space-y-5">
          <div className="flex gap-3">
            <Avatar initials="MK" className="from-violet-500 to-fuchsia-500" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">Maya K.</span>
                <span className="text-muted-foreground text-xs">10:24</span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Should we hold the launch until the billing edge case is fixed?
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Avatar initials="JT" className="from-sky-500 to-cyan-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">Jon T.</span>
                <span className="text-muted-foreground text-xs">10:31</span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">Agreed. Let&apos;s ship Thursday once PR #482 lands.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background/95 ring-background relative z-10 -mt-6 ml-auto w-[90%] rounded-2xl border p-5 shadow-xl ring-1 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full">
            <Sparkles className="size-3.5" />
          </span>
          <span className="text-sm font-medium">AI summary</span>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          The team agreed to delay the launch for a billing edge case, targeting Thursday after PR #482 is merged.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex gap-2">
            <Check className="text-primary mt-0.5 size-4 shrink-0" />
            <span>Launch moved to Thursday.</span>
          </li>
          <li className="flex gap-2">
            <Check className="text-primary mt-0.5 size-4 shrink-0" />
            <span>Blocked on fixing the billing edge case (PR #482).</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ComposeMockup() {
  return (
    <div className="bg-card rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SquarePen className="text-muted-foreground size-4" />
          <span>New message</span>
        </div>
        <span className="text-muted-foreground text-xs">#engineering</span>
      </div>

      <div className="mt-5 rounded-xl border p-4">
        <p className="text-sm">
          hey team so basically the deploy is probably gonna be kinda late because we still need to fix that thing with
          auth before we can push it live
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Draft</span>
          <span className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
            <Send className="size-3" /> Send
          </span>
        </div>
      </div>

      <div className="bg-background relative z-10 mt-3 rounded-xl border p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full">
            <Sparkles className="size-3.5" />
          </span>
          <span className="text-sm font-medium">Suggested rewrite</span>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          Heads up team — the deploy will slip to tomorrow. We still need to resolve the auth issue before we can ship.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
            <Check className="size-3" /> Accept
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium">
            <X className="size-3" /> Decline
          </span>
        </div>
      </div>
    </div>
  );
}

function AiCopy({
  eyebrow,
  title,
  description,
  points,
}: {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <div>
      <p className="text-primary text-sm font-medium">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      <p className="text-muted-foreground mt-4 text-balance">{description}</p>
      <ul className="mt-6 space-y-3">
        {points.map((point) => (
          <li key={point} className="flex gap-3 text-sm">
            <span className="bg-primary/10 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
              <Check className="size-3" />
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AiSection() {
  return (
    <section id="ai" className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-primary text-sm font-medium">AI</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            AI that keeps your team moving
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            Not a chatbot bolted on the side — AI that works inside your conversations, where the context already lives.
          </p>
        </div>

        <AnimatedGroup variants={itemVariants} className="mt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <AiCopy
              eyebrow="AI thread summaries"
              title="Catch up on any thread in seconds"
              description="Teamora reads the root message and every reply, then streams back a short summary with the decisions and next steps — so nobody has to scroll to find them."
              points={[
                "Summaries are streamed as they're written.",
                "Keeps names, ticket IDs, and terminology intact.",
                "Grounded in the thread only — no invented facts.",
              ]}
            />
            <ThreadSummaryMockup />
          </div>
        </AnimatedGroup>

        <AnimatedGroup variants={itemVariants} className="mt-20">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="lg:order-2">
              <AiCopy
                eyebrow="AI compose assistant"
                title="Write clearer messages with a little help"
                description="Draft your message, then let Teamora rewrite and tighten it in place. The assistant leaves your links and code blocks exactly as they are, so nothing breaks."
                points={[
                  "Rewrite and improve drafts inline.",
                  "Preserves code blocks and links untouched.",
                  "Accept or decline the suggestion before sending.",
                ]}
              />
            </div>
            <div className="lg:order-1">
              <ComposeMockup />
            </div>
          </div>
        </AnimatedGroup>

        <p className="text-muted-foreground mt-12 flex items-center justify-center gap-2 text-center text-sm">
          <CornerDownRight className="size-4" />
          Powered by the model of your choice through OpenRouter.
        </p>
      </div>
    </section>
  );
}
