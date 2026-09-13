"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedGroup } from "@/components/ui/animated-group";

const faqs = [
  {
    question: "How do I sign up?",
    answer:
      "Teamora uses Kinde for authentication. Create an account or sign in, and you'll be guided straight into creating your workspace.",
  },
  {
    question: "How is my team's data kept separate?",
    answer:
      "Every workspace is fully isolated. Channels, messages, and members are scoped to your workspace, and access is checked on every single request.",
  },
  {
    question: "What does the AI actually do?",
    answer:
      "Two things: it summarizes long threads into a short recap with the key takeaways, and it can rewrite your drafts to be clearer. Summaries are grounded in the thread itself, so it never invents facts.",
  },
  {
    question: "What can I attach to a message?",
    answer:
      "Images — one per message, up to 1MB. They show inline and open in a built-in lightbox when you want a closer look.",
  },
  {
    question: "Are messages delivered in realtime?",
    answer:
      "Yes. Messages, replies, and reactions sync the instant they happen, and presence indicators show you who's online right now.",
  },
  {
    question: "Can I work across multiple teams?",
    answer:
      "Absolutely. Create or switch between workspaces, and each one keeps its own channels, members, and conversations.",
  },
];

const itemVariants = {
  container: { visible: { transition: { staggerChildren: 0.08 } } },
  item: {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, bounce: 0.3, duration: 1 },
    },
  },
};

export function FaqSection() {
  return (
    <section id="faq" className="bg-background py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-primary text-sm font-medium">FAQ</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">Everything you need to know before you get started.</p>
        </div>

        <AnimatedGroup variants={itemVariants} className="mt-12">
          <Accordion className="bg-card divide-border w-full divide-y rounded-2xl border px-6">
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="py-5 text-base">{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground max-w-2xl pb-1">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedGroup>
      </div>
    </section>
  );
}
