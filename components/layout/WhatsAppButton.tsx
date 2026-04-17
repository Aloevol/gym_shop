"use client";

import React, { useEffect, useState } from 'react';
import { getSiteSettingsServerSide } from '@/server/functions/admin.fun';
import { ISite } from '@/server/models/site/site.interface';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await getSiteSettingsServerSide();
      if (!res.isError && res.data) {
        const data = res.data as ISite;
        if (data.socialLinks?.whatsapp) {
          setWhatsappLink(data.socialLinks.whatsapp);
        }
      }
    };
    fetchSettings();
  }, []);

  // Use the saved link or a placeholder so it shows up as requested
  const finalLink = whatsappLink || "#";

  return (
    <a
      href={finalLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center group"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle size={28} fill="currentColor" className="text-white" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 font-bold uppercase text-xs tracking-widest whitespace-nowrap">
        Contact Us
      </span>
    </a>
  );
};

export default WhatsAppButton;
