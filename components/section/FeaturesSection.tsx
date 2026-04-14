"use client";
import React, { useEffect, useState } from 'react';
import { Dumbbell, HeartPulse, ShieldCheck, Zap } from 'lucide-react';
import Image from 'next/image';
import { getFeaturesServerSide } from '@/server/functions/admin.fun';

const iconMap: { [key: string]: any } = {
  Dumbbell,
  HeartPulse,
  ShieldCheck,
  Zap
};

const FeaturesSection = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      const res = await getFeaturesServerSide();
      if (!res.isError && res.data && res.data.length > 0) {
        setFeatures(res.data);
      }
      setLoading(false);
    };
    fetchFeatures();
  }, []);

  const displayFeatures = features.length > 0 ? features : [
    { title: "Helps muscles grow faster", description: "Increases strength and training volume, creating a stronger muscle building signal.", icon: "Dumbbell" },
    { title: "Faster muscle recovery", description: "Reduces muscle damage and post-workout fatigue, allowing you to hit your next session.", icon: "HeartPulse" },
    { title: "Clean Formulation", description: "Manufactured in a GMP-certified facility, Thryve delivers clean formulation.", icon: "ShieldCheck" }
  ];

  if (loading) return <div className="w-full h-96 bg-black animate-pulse" />;

  return (
    <section className="w-full bg-black py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column: Features */}
          <div className="space-y-12">
            <h2 className="text-3xl md:text-5xl font-custom font-bold text-white leading-tight uppercase tracking-tight">
              PERFORMANCE<br /><span className="text-primary">CORE VALUES</span>
            </h2>

            <div className="space-y-8">
              {displayFeatures.map((feature, i) => {
                const Icon = iconMap[feature.icon] || Dumbbell;
                return (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="flex-shrink-0 w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-all duration-500 group-hover:bg-primary group-hover:text-black">
                      <Icon className="w-8 h-8 text-primary group-hover:text-black transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-custom font-bold text-white mb-2 uppercase tracking-tight group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-white/40 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full animate-pulse" />
            <Image
              src="https://thryve.b-cdn.net/WEB_3_oqvlrv.webp"
              alt="Thryve Performance"
              width={600}
              height={600}
              className="relative z-10 w-full max-w-lg object-contain grayscale hover:grayscale-0 transition-all duration-1000"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
