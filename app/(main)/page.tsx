import AutoSlider from "@/components/section/AutoSlider";
import HeroSection from "@/components/section/HeroSection";
import FeaturesSection from "@/components/section/FeaturesSection";
import TestimonialsSection from "@/components/section/TestimonialsSection";
import InstagramGallery from "@/components/section/InstagramGallery";
import ValuablePackages from "@/components/section/ValuablePackages";
import SpecialProducts from "@/components/ui/SpecialProducts";

export default function Home() {
  return (
    <div className="w-full bg-black min-h-screen">
      <HeroSection />
      <AutoSlider />
      <FeaturesSection />
      <ValuablePackages />
      <SpecialProducts />
      <TestimonialsSection />
      <InstagramGallery />
    </div>
  );
}
