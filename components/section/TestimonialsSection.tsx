"use client";

import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { getTestimonialsServerSide } from "@/server/functions/admin.fun";
import type { ITestimonial } from "@/server/models/site/site.interface";

const fallbackTestimonials: ITestimonial[] = [
  {
    name: "Akash Wazhir",
    role: "Fitness Trainer",
    quote: "Thryve played a key role in my fat-loss phase, helping me reduce body fat while preserving lean muscle.",
    stars: 5,
  },
  {
    name: "Faiyaz R.",
    role: "Strength & Conditioning Coach",
    quote: "No bloat, no nonsense. Just a solid creatine that I can actually trust. I recommend it to all my clients who want real, sustainable progress.",
    stars: 5,
  },
  {
    name: "Imran H.",
    role: "Semi-Pro Footballer",
    quote: "From training to game day, Thryve gives me the confidence that my supplementation is dialed in. The quality control and transparency are what sold me.",
    stars: 5,
  },
];

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const normalizeQuote = (quote: string) => quote.replace(/^["“]+|["”]+$/g, "");

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<ITestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const res = await getTestimonialsServerSide();
      if (!res.isError && Array.isArray(res.data) && res.data.length > 0) {
        setTestimonials(res.data as ITestimonial[]);
      }
      setLoading(false);
    };

    fetchTestimonials();
  }, []);

  const displayTestimonials = testimonials.length > 0 ? testimonials : fallbackTestimonials;
  const activeTestimonial = displayTestimonials[activeIndex];

  const goToPrev = () => {
    setActiveIndex((prev) => (prev === 0 ? displayTestimonials.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === displayTestimonials.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return <div className="h-96 w-full animate-pulse bg-black" />;
  }

  return (
    <section className="bg-black px-6 py-20 text-white md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-primary">
              Athlete Feedback
            </p>
            <h2 className="text-3xl font-custom font-bold uppercase leading-tight tracking-[0.18em] md:text-5xl">
              WHAT ATHLETES <span className="text-primary">SAY</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 md:text-base">
              Real feedback from athletes who trust Thryve for performance. The section now keeps the main story in focus while still making every testimonial easy to browse.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 text-center">
            <div className="rounded-[1.25rem] bg-black px-5 py-4">
              <p className="text-2xl font-black text-primary">{displayTestimonials.length}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Stories</p>
            </div>
            <div className="rounded-[1.25rem] bg-black px-5 py-4">
              <p className="text-2xl font-black text-primary">5.0</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Focus</p>
            </div>
            <div className="rounded-[1.25rem] bg-black px-5 py-4">
              <p className="text-2xl font-black text-primary">24/7</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/35">Trust</p>
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute right-6 top-6 rounded-full border border-primary/20 bg-primary/10 p-3 text-primary">
              <Quote size={18} />
            </div>

            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-black uppercase tracking-widest text-primary">
                {getInitials(activeTestimonial.name)}
              </div>
              <div>
                <h4 className="font-custom text-lg font-bold uppercase tracking-[0.16em] text-white">
                  {activeTestimonial.name}
                </h4>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35">
                  {activeTestimonial.role}
                </p>
              </div>
            </div>

            <div className="mb-6 flex gap-1 text-primary">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  size={14}
                  fill={index < activeTestimonial.stars ? "currentColor" : "none"}
                  className={index < activeTestimonial.stars ? "" : "text-white/10"}
                />
              ))}
            </div>

            <p className="mb-8 text-base font-bold leading-8 tracking-tight text-white">
              &quot;{normalizeQuote(activeTestimonial.quote)}&quot;
            </p>

            <div className="flex items-end justify-between gap-4">
              <div className="rounded-full border border-white/10 bg-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
                Review {activeIndex + 1} / {displayTestimonials.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={goToPrev}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black text-white/70 transition-all hover:border-primary hover:text-primary"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={goToNext}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black text-white/70 transition-all hover:border-primary hover:text-primary"
                  aria-label="Next testimonial"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              {displayTestimonials.map((item, index) => (
                <button
                  key={`${item.name}-${index}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-8 bg-primary" : "w-2 bg-white/20"}`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="hidden gap-6 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-12 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute right-8 top-8 rounded-full border border-primary/15 bg-primary/10 p-4 text-primary">
              <Quote size={20} />
            </div>

            <div className="mb-10 flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-2xl font-black uppercase tracking-[0.2em] text-primary">
                {getInitials(activeTestimonial.name)}
              </div>
              <div>
                <h3 className="font-custom text-2xl font-bold uppercase tracking-[0.18em] text-white">
                  {activeTestimonial.name}
                </h3>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.26em] text-white/35">
                  {activeTestimonial.role}
                </p>
                <div className="mt-4 flex gap-1 text-primary">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      size={16}
                      fill={index < activeTestimonial.stars ? "currentColor" : "none"}
                      className={index < activeTestimonial.stars ? "" : "text-white/10"}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="max-w-3xl text-2xl font-bold leading-10 tracking-tight text-white">
              &quot;{normalizeQuote(activeTestimonial.quote)}&quot;
            </p>

            <div className="mt-10 flex items-center justify-between gap-4">
              <div className="rounded-full border border-white/10 bg-black px-5 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
                Highlighted Athlete Story
              </div>
              <div className="flex gap-2">
                <button
                  onClick={goToPrev}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black text-white/70 transition-all hover:border-primary hover:text-primary"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={goToNext}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black text-white/70 transition-all hover:border-primary hover:text-primary"
                  aria-label="Next testimonial"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {displayTestimonials.map((testimonial, index) => (
              <button
                key={`${testimonial.name}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`group rounded-[2rem] border p-6 text-left transition-all duration-300 ${
                  index === activeIndex
                    ? "border-primary/35 bg-primary/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
                    : "border-white/10 bg-white/[0.03] hover:border-primary/20 hover:bg-white/[0.05]"
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-black uppercase tracking-[0.2em] ${
                        index === activeIndex
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-white/10 bg-black text-white/70"
                      }`}
                    >
                      {getInitials(testimonial.name)}
                    </div>
                    <div>
                      <h4 className="font-custom text-base font-bold uppercase tracking-[0.14em] text-white">
                        {testimonial.name}
                      </h4>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <Quote size={16} className={index === activeIndex ? "text-primary" : "text-white/20"} />
                </div>

                <p className="line-clamp-3 text-sm leading-7 text-white/70">
                  {normalizeQuote(testimonial.quote)}
                </p>

                <div className="mt-4 flex gap-1 text-primary">
                  {[...Array(5)].map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      size={14}
                      fill={starIndex < testimonial.stars ? "currentColor" : "none"}
                      className={starIndex < testimonial.stars ? "" : "text-white/10"}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
