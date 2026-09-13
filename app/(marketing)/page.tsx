import { HeroHeader } from "@/app/(marketing)/_components/header";
import { HeroSection } from "@/app/(marketing)/_components/hero-section";
import { HeroBackground } from "@/app/(marketing)/_components/hero-background";
import { ScreenshotSection } from "@/app/(marketing)/_components/screenshot-section";
import { FeaturesSection } from "@/app/(marketing)/_components/features-section";
import { AiSection } from "@/app/(marketing)/_components/ai-section";
import { RealtimeSection } from "@/app/(marketing)/_components/realtime-section";
import { HowItWorksSection } from "@/app/(marketing)/_components/how-it-works-section";
import { FaqSection } from "@/app/(marketing)/_components/faq-section";
import { CustomersSection } from "@/app/(marketing)/_components/customers-section";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <HeroHeader />
      <div className="relative">
        <HeroBackground />
        <HeroSection />
        <ScreenshotSection />
      </div>
      <FeaturesSection />
      <AiSection />
      <RealtimeSection />
      <HowItWorksSection />
      <FaqSection />
      <CustomersSection />
    </main>
  );
}
