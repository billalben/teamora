import { HeroHeader } from "@/app/(marketing)/_components/header";
import { HeroSection } from "@/app/(marketing)/_components/hero-section";
import { ScreenshotSection } from "@/app/(marketing)/_components/screenshot-section";
import { CustomersSection } from "@/app/(marketing)/_components/customers-section";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <HeroHeader />
      <HeroSection />
      <ScreenshotSection />
      <CustomersSection />
    </main>
  );
}
