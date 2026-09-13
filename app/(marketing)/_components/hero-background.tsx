import Image from "next/image";
import { AnimatedGroup } from "@/components/ui/animated-group";

export function HeroBackground() {
  return (
    <>
      <AnimatedGroup
        variants={{
          container: {
            visible: {
              transition: {
                delayChildren: 1,
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
                duration: 2,
              },
            },
          },
        }}
        className="mask-b-from-35% mask-b-to-90% absolute inset-0 top-56 -z-20 lg:top-32"
      >
        <Image
          src="https://ik.imagekit.io/lrigu76hy/tailark/night-background.jpg?updatedAt=1745733451120"
          alt="background"
          className="hidden size-full dark:block"
          width="3276"
          height="4095"
        />
      </AnimatedGroup>

      <div
        aria-hidden
        className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"
      />
    </>
  );
}
