import { Navbar }           from "@/components/navbar";
import { Hero }             from "@/components/hero";
import { Features }         from "@/components/features";
import { Showcase }         from "@/components/showcase";
import { ClinicTypes }      from "@/components/clinic-types";
import { Pricing }          from "@/components/pricing";
import { FAQ }              from "@/components/faq";
import { CTA }              from "@/components/cta";
import { Footer }           from "@/components/footer";
import { ScrollAnimations } from "@/components/scroll-animations";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Showcase />
        <ClinicTypes />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
      <ScrollAnimations />
    </>
  );
}
