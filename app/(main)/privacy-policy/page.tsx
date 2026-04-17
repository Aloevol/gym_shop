"use client";

import React, { useEffect, useState } from "react";
import { getPrivacyAndPolicyServerSide } from "@/server/functions/admin.fun";

function PrivacyAndReturnPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const response = await getPrivacyAndPolicyServerSide();
        if (!response.isError && typeof response.data === "string") {
          setContent(response.data);
        } else {
          setContent("");
        }
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, []);

  return (
    <section className="w-full min-h-screen bg-black pt-24 pb-20 px-6 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-custom font-bold text-white uppercase tracking-widest mb-12 text-center">
          PRIVACY <span className="text-primary">&</span> POLICY
        </h1>
        <div
          className="prose prose-invert prose-lg max-w-none bg-white/5 border border-white/10 p-10 rounded-[2rem]"
          dangerouslySetInnerHTML={{
            __html: loading
              ? "<p>Loading policy...</p>"
              : content || "<p>No privacy policy content available.</p>",
          }}
        />
      </div>
    </section>
  );
}

export default PrivacyAndReturnPage;
