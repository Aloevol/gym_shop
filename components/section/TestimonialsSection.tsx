"use client";
import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { getTestimonialsServerSide } from '@/server/functions/admin.fun';

const TestimonialsSection = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const res = await getTestimonialsServerSide();
      if (!res.isError && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTestimonials(res.data);
      }
      setLoading(false);
    };
    fetchTestimonials();
  }, []);

  const displayTestimonials = testimonials.length > 0 ? testimonials : [
    {
      name: "Akash Wazhir",
      role: "Fitness Trainer",
      quote: "“Thryve played a key role in my fat-loss phase, helping me reduce body fat while preserving lean muscle.”",
      stars: 5
    },
    {
      name: "Faiyaz R.",
      role: "Strength & Conditioning Coach",
      quote: "“No bloat, no nonsense. Just a solid creatine that I can actually trust. I recommend it to all my clients who want real, sustainable progress.”",
      stars: 5
    },
    {
      name: "Imran H.",
      role: "Semi‑Pro Footballer",
      quote: "“From training to game day, Thryve gives me the confidence that my supplementation is dialed in. The quality control and transparency are what sold me.”",
      stars: 5
    }
  ];

  if (loading) return <div className="w-full h-96 bg-black animate-pulse" />;

  return (
    <section className="bg-black text-white py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-2xl md:text-4xl font-custom font-bold tracking-widest uppercase mb-4 leading-tight">
          WHAT ATHLETES <span className="text-primary">SAY</span>
        </h2>
        <p className="text-center text-white/40 font-bold tracking-widest uppercase text-[10px] mb-16">
          Real feedback from athletes who trust Thryve for performance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {displayTestimonials.map((t, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col justify-between hover:border-primary/30 transition-all duration-500 group">
              <p className="text-lg text-white font-bold leading-relaxed mb-10 italic uppercase tracking-tight">
                {t.quote}
              </p>
              <div>
                <div className="flex text-primary mb-4 gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} fill={j < t.stars ? "currentColor" : "none"} className={j < t.stars ? "" : "text-white/10"} />
                  ))}
                </div>
                <h4 className="font-custom font-bold text-primary tracking-widest uppercase mb-1">
                  {t.name}
                </h4>
                <p className="text-[9px] text-white/40 font-black tracking-[0.2em] uppercase">
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
