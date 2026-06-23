import { JsonLd } from "@/components/JsonLd";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { RealLifeGoals } from "@/components/RealLifeGoals";
import { PiaSection } from "@/components/PiaSection";
import { TrustedInfrastructure } from "@/components/TrustedInfrastructure";
import { Features } from "@/components/Features";
import { SplitFeatureSection } from "@/components/SplitFeatureSection";
import { MissionSection } from "@/components/MissionSection";
import { PlatformBenefits } from "@/components/PlatformBenefits";
import { HowItWorks } from "@/components/HowItWorks";
import { SPLIT_FEATURES } from "@/lib/content";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { buildHomeJsonLd } from "@/lib/jsonld";

export default function HomePage() {
  return (
    <>
      <JsonLd data={buildHomeJsonLd()} />
      <Navigation />
      <main>
        <Hero />
        <RealLifeGoals />
        <PiaSection />
        <TrustedInfrastructure />
        <Features />
        <SplitFeatureSection
          headline={SPLIT_FEATURES.spend.headline}
          body={SPLIT_FEATURES.spend.body}
          variant="spend"
          layout="image-left"
          stageTone="gray"
          id="spend"
        />
        <SplitFeatureSection
          headline={SPLIT_FEATURES.ownership.headline}
          body={SPLIT_FEATURES.ownership.body}
          variant="transactions"
          layout="image-right"
          stageTone="plum"
          id="ownership"
        />
        <SplitFeatureSection
          headline={SPLIT_FEATURES.grow.headline}
          body={SPLIT_FEATURES.grow.body}
          variant="grow"
          layout="image-left"
          stageTone="gray"
          id="grow"
        />
        <MissionSection />
        <PlatformBenefits />
        <HowItWorks />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
