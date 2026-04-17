import type { Metadata } from "next";
import AutoSlider from "@/components/section/AutoSlider";

export const metadata: Metadata = {
    title: "Home",
    description: "Shop premium fitness equipment, supplements, and personal training programs. Your ultimate fitness destination.",
    openGraph: {
        title: "Home",
        description: "Shop premium fitness equipment, supplements, and personal training programs.",
        type: "website",
    },
};
import HeroSection from "@/components/section/HeroSection";
import FeaturesSection from "@/components/section/FeaturesSection";
import TestimonialsSection from "@/components/section/TestimonialsSection";
import InstagramGallery from "@/components/section/InstagramGallery";
import SpecialProducts from "@/components/ui/SpecialProducts";

export default function Home() {
  return (
    <div className="w-full bg-black min-h-screen">
      <HeroSection />
      <AutoSlider />
      <FeaturesSection />
      <SpecialProducts />
      <TestimonialsSection />
      <InstagramGallery />
    </div>
  );
}
