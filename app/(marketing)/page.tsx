import { HeroHeader } from "@/app/(marketing)/_components/header";
import { HeroSection } from "@/app/(marketing)/_components/hero-section";
import { HeroBackground } from "@/app/(marketing)/_components/hero-background";
import { ScreenshotSection } from "@/app/(marketing)/_components/screenshot-section";
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
      <CustomersSection />
    </main>
  );
}
