"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from "next/link";
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { getHeroSlidesServerSide } from '@/server/functions/admin.fun';

interface HeroSlide {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
}

const HeroSlider = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await getHeroSlidesServerSide();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setSlides(res.data as HeroSlide[]);
        }
      } catch (error) {
        console.error("Error fetching hero slides:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  // Auto-play
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slides]);

  if (loading) {
    return <div className="w-full h-[60svh] md:h-screen bg-black animate-pulse" />;
  }

  // Fallback if no slides are found
  const displaySlides = slides.length > 0 ? slides : [
    {
      _id: 'fallback',
      imageUrl: "https://thryve.b-cdn.net/okjntc8hiafhmx4syqbj_sqqvkt.webp",
      title: "THRYVE PERFORMANCE",
      description: "Push your limits with elite supplementation.",
      buttonText: "Shop Now",
      buttonLink: "/shop"
    }
  ];

  return (
    <div className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={displaySlides[currentSlide]._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="relative w-full h-[60svh] md:h-screen min-h-[500px]"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={displaySlides[currentSlide].imageUrl}
              alt={displaySlides[currentSlide].title}
              fill
              priority
              sizes="100vw"
              className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            />
            {/* Subtle Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          </div>

          {/* Button and Info Positioning */}
          <div className="absolute top-[45%] left-1/2 -translate-x-1/2 md:top-[63%] md:left-[8%] md:translate-x-0 z-10 w-full max-w-xl px-6 md:px-0">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white font-custom font-bold text-4xl md:text-7xl uppercase tracking-tighter mb-4 leading-none"
            >
              {displaySlides[currentSlide].title}
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/60 font-bold uppercase tracking-widest text-xs md:text-sm mb-10 max-w-md"
            >
              {displaySlides[currentSlide].description}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link href={displaySlides[currentSlide].buttonLink || "/shop"}>
                <button className="bg-primary text-black px-12 py-4 md:px-0 md:w-[20rem] h-14 flex items-center justify-center gap-3 rounded-full font-custom text-sm md:text-lg tracking-widest hover:bg-white transition-all duration-300 shadow-2xl shadow-primary/20 uppercase font-bold">
                  <ShoppingBag size={20} />
                  {displaySlides[currentSlide].buttonText || "Shop Now"}
                </button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      {displaySlides.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {displaySlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-12 h-[2px] transition-all duration-500 ${i === currentSlide ? 'bg-primary' : 'bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;