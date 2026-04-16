"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getAthletesServerSide, getSiteSettingsServerSide } from '@/server/functions/admin.fun';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';

const AthletesPage = () => {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAthletes = async () => {
      const [res, settingsRes] = await Promise.all([
        getAthletesServerSide(),
        getSiteSettingsServerSide(),
      ]);
      if (!res.isError && res.data) {
        setAthletes(res.data.filter((a: any) => a.isActive));
      }
      if (!settingsRes.isError && settingsRes.data) {
        setSiteSettings(settingsRes.data);
      }
      setLoading(false);
    };
    fetchAthletes();
  }, []);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <main className="w-full bg-black min-h-screen pt-24 pb-20">
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-7xl font-custom font-bold text-white uppercase tracking-tighter mb-6"
        >
          {siteSettings?.siteName || "THRYVE"} <span className="text-primary">ATHLETES</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/40 font-bold uppercase tracking-widest text-sm max-w-2xl mx-auto"
        >
          MEET THE ELITE PERFORMERS WHO PUSH THEIR LIMITS WITH THRYVE. 
          OUR AMBASSADORS EMBODY THE SPIRIT OF UNCOMPROMISING EXCELLENCE.
        </motion.p>
      </section>

      <section className="max-w-7xl mx-auto px-6">
        {athletes.length === 0 ? (
          <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[3rem]">
            <p className="text-white/20 font-black uppercase tracking-widest text-sm">RECRUITING ELITE ATHLETES...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {athletes.map((athlete, i) => (
              <motion.div 
                key={athlete._id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden group hover:border-primary/50 transition-all duration-500"
              >
                <div className="aspect-[4/5] relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-1000">
                  <Image src={athlete.image} alt={athlete.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  
                  {/* Social Overlay */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                    {athlete.socialLinks?.instagram && (
                      <a href={athlete.socialLinks.instagram} target="_blank" rel="noreferrer" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black hover:bg-white transition-all shadow-xl">
                        <Instagram size={20} strokeWidth={3} />
                      </a>
                    )}
                    {athlete.socialLinks?.facebook && (
                      <a href={athlete.socialLinks.facebook} target="_blank" rel="noreferrer" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black hover:bg-white transition-all shadow-xl">
                        <Facebook size={20} strokeWidth={3} />
                      </a>
                    )}
                    {athlete.socialLinks?.twitter && (
                      <a href={athlete.socialLinks.twitter} target="_blank" rel="noreferrer" className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-black hover:bg-white transition-all shadow-xl">
                        <Twitter size={20} strokeWidth={3} />
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="p-10 text-center">
                  <h3 className="text-2xl font-custom font-bold text-white uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">{athlete.name}</h3>
                  <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-6">{athlete.role}</p>
                  <p className="text-white/40 text-xs font-bold uppercase leading-relaxed tracking-widest">{athlete.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AthletesPage;
