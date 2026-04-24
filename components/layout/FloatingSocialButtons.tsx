"use client";

import React, { useEffect, useState } from 'react';
import { getSiteSettingsServerSide } from '@/server/functions/admin.fun';
import { ISite } from '@/server/models/site/site.interface';
import { MessageCircle } from 'lucide-react';
import { FaFacebookF } from 'react-icons/fa';
import { toast } from 'sonner';

const FloatingSocialButtons = () => {
  const [socialLinks, setSocialLinks] = useState<{ facebook?: string; whatsapp?: string }>({});
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await getSiteSettingsServerSide();
      if (!res.isError && res.data) {
        const data = res.data as ISite;
        setSocialLinks({
          facebook: data.socialLinks?.facebook,
          whatsapp: data.socialLinks?.whatsapp,
        });
      }
    };
    fetchSettings();
  }, []);

  const handleWhatsAppClick = () => {
    if (!socialLinks.whatsapp) {
      toast.error("WhatsApp link not configured. Please add it in dashboard settings.");
    }
  };

  const handleFacebookClick = () => {
    if (!socialLinks.facebook) {
      toast.error("Facebook link not configured. Please add it in dashboard settings.");
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      <div 
        className="relative"
        onMouseEnter={() => setHoveredBtn('whatsapp')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        <a
          href={socialLinks.whatsapp || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={!socialLinks.whatsapp ? handleWhatsAppClick : undefined}
          className={`bg-[#25D366] text-white w-12 h-12 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${!socialLinks.whatsapp ? 'pointer-events-auto opacity-50' : ''}`}
          aria-label="Contact on WhatsApp"
        >
          <MessageCircle size={28} fill="currentColor" className="text-white" />
        </a>
        {hoveredBtn === 'whatsapp' && socialLinks.whatsapp && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#25D366] text-white px-3 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap shadow-xl">
            WhatsApp
          </div>
        )}
      </div>
      <div 
        className="relative"
        onMouseEnter={() => setHoveredBtn('facebook')}
        onMouseLeave={() => setHoveredBtn(null)}
      >
        <a
          href={socialLinks.facebook || '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={!socialLinks.facebook ? handleFacebookClick : undefined}
          className={`bg-[#1877F2] text-white w-12 h-12 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${!socialLinks.facebook ? 'pointer-events-auto opacity-50' : ''}`}
          aria-label="Facebook"
        >
          <FaFacebookF size={28} />
        </a>
        {hoveredBtn === 'facebook' && socialLinks.facebook && (
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-[#1877F2] text-white px-3 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap shadow-xl">
            Facebook
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingSocialButtons;