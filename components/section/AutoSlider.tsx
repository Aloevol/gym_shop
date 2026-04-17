"use client";

import React, { useEffect, useState } from "react";
import { getAllBannerMessagesServerSide } from "@/server/functions/banner.fun";
import { getBannerIconOption } from "@/lib/banner-icons";

interface BannerMessage {
  _id: string;
  text: string;
  icon: string;
  isActive: boolean;
}

const AutoSlider = () => {
  const [messages, setMessages] = useState<BannerMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await getAllBannerMessagesServerSide();
      if (!response.isError && response.data) {
        const { messages: fetchedMessages } = response.data as { messages: BannerMessage[] };
        setMessages(fetchedMessages.filter(m => m.isActive) || []);
      }
    } catch (error) {
      console.error("Failed to fetch ticker messages:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || messages.length === 0) {
    // Return a placeholder or null during loading
    if (loading) return <div className="bg-black py-3 border-y border-white/5 h-12 animate-pulse"></div>;
    return null;
  }

  // Duplicate items for seamless loop
  const displayItems = [...messages, ...messages, ...messages, ...messages];

  return (
    <div className="bg-black text-white border-y border-white/5 overflow-hidden">
      <div className="flex whitespace-nowrap animate-ticker-scroll py-3">
        <div className="flex gap-12 px-6">
          {displayItems.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-3 font-custom text-sm md:text-lg tracking-widest uppercase shrink-0 font-bold"
            >
              {(() => {
                const Icon = getBannerIconOption(item.icon).Icon;
                return (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                    <Icon size={16} />
                  </span>
                );
              })()}
              {item.text}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-scroll {
          display: flex;
          width: max-content;
          animation: ticker-scroll 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AutoSlider;
