"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getInstagramGalleryServerSide, getSiteSettingsServerSide } from '@/server/functions/admin.fun';

const InstagramGallery = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const [res, settingsRes] = await Promise.all([
        getInstagramGalleryServerSide(),
        getSiteSettingsServerSide(),
      ]);
      if (!res.isError && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setPosts(res.data);
      }
      if (!settingsRes.isError && settingsRes.data) {
        setSiteSettings(settingsRes.data);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const displayPosts = posts.length > 0 ? posts : [
    { imageUrl: "https://thryve.b-cdn.net/Gemini_Generated_Image_z119npz119npz119_gtxnnc.webp" },
    { imageUrl: "https://thryve.b-cdn.net/higaeb3symwqomyitmpc_ogevss.webp" },
    { imageUrl: "https://thryve.b-cdn.net/vakqpglxg0mojdctbfyc_nuhep3.webp" },
    { imageUrl: "https://thryve.b-cdn.net/axctrjvbjsorxjybpl61_uekhht.webp" },
    { imageUrl: "https://thryve.b-cdn.net/yfl5b5bnnysrf5nhvebb_bia7kw.webp" },
    { imageUrl: "https://thryve.b-cdn.net/lw9rma75zkaihko6b0hz_rkz3jm.webp" },
  ];

  if (loading) return <div className="w-full h-96 bg-black animate-pulse" />;

  return (
    <section className="bg-black py-20">
      <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="text-center md:text-left">
          <h2 className="text-2xl md:text-4xl font-custom font-bold text-white tracking-widest uppercase mb-4 leading-tight">
            COMMUNITY <span className="text-primary">SNAPSHOTS</span>
          </h2>
          <p className="text-primary font-custom tracking-widest uppercase text-xs font-black">
            Join the elite movement today
          </p>
        </div>
        <a
          href={siteSettings?.socialLinks?.instagram || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-white/10 bg-white/5 text-white px-12 py-5 rounded-full font-custom text-[10px] font-black tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all shadow-xl"
        >
          {siteSettings?.socialLinks?.instagram ? "FOLLOW ON INSTAGRAM" : "@THRYVE"}
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 px-2">
        {displayPosts.map((post, i) => (
          <div key={i} className="aspect-square relative overflow-hidden group border border-white/5">
            <Image
              src={post.imageUrl}
              alt={`Gallery ${i}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default InstagramGallery;
