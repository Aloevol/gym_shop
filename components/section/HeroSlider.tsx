"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { getHeroSlidesServerSide } from '@/server/functions/admin.fun';

interface HeroSlide {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
}

function HeroSlider() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const res = await getHeroSlidesServerSide();
      if (res.data) {
        setSlides(res.data as HeroSlide[]);
      }
    } catch (error) {
      console.error("Error fetching hero slides:", error);
    }
  };

  useEffect(() => {
    if (slides.length === 0 || !isAutoPlaying) return;

    const interval = setInterval(() => {
      goToNextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [slides, currentSlide, isAutoPlaying]);

  const goToSlide = useCallback((index: number) => {
    if (index === currentSlide || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentSlide(index);
    
    // Reset transition state
    setTimeout(() => setIsTransitioning(false), 500);
  }, [currentSlide, isTransitioning]);

  const goToNextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides, goToSlide]);

  const goToPrevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides, goToSlide]);

  if (slides.length === 0) {
    return (
      <div className='w-full h-[70svh] flex items-center justify-center'>
        <p className='text-white text-2xl'>No slides available</p>
      </div>
    );
  }

  return (
    <div className='relative w-full h-[45svh] md:min-h-full overflow-hidden mt- md:mt-10'>
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide._id}
          className={`absolute inset-0 transition-all duration-500 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ zIndex: index === currentSlide ? 10 : 1 }}
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <Image
              src={slide.imageUrl}
              alt={slide.title}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-opacity-40" />
          </div>

          {/* Slide Content */}
          <div className='relative h-full flex flex-col md:flex-row items-center justify-between px-6 md:px-12 lg:px-20 max-w-[1540px] mx-auto py-10 md:py-16 z-20'>
            <div className='text-center md:text-left space-y-4 md:mb-20 md:w-[500px]'>
              <h1 className='text-xl sm:text-3xl md:text-4xl xl:text-6xl font-bold text-white'>
                {slide.title}
              </h1>
              <p className='text-sm md:text-base xl:text-xl text-white/90'>
                {slide.description}
              </p>
              <Link href={slide.buttonLink || '/shop'}>
                <button className='bg-white cursor-pointer text-black px-6 py-3 rounded-full hover:bg-[#FFD700] transition-colors duration-300 font-semibold mt-4'>
                  {slide.buttonText || 'Shop Now'}
                </button>
              </Link>
            </div>

            {/* Optional decorative element */}
            <div className='hidden md:block relative w-[400px] h-[400px] lg:w-[500px] lg:h-[500px]'>
              <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full z-30 transition-colors backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full z-30 transition-colors backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Play/Pause Button */}
      {slides.length > 1 && (
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full z-30 transition-colors backdrop-blur-sm"
          aria-label={isAutoPlaying ? 'Pause auto-play' : 'Play auto-play'}
        >
          {isAutoPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-white w-8' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 bg-black/30 text-white px-3 py-1 rounded-full text-sm z-30 backdrop-blur-sm">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
}

export default HeroSlider;