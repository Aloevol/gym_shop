"use client";

import React, { useEffect, useState } from "react";
import { getTestimonialsServerSide, updateTestimonialsServerSide } from "@/server/functions/admin.fun";
import { toast } from "sonner";
import { MessageSquareQuote, Plus, Save, Star, Trash2 } from "lucide-react";
import type { ITestimonial } from "@/server/models/site/site.interface";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<ITestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const res = await getTestimonialsServerSide();
      if (!res.isError && Array.isArray(res.data)) {
        setTestimonials(res.data as ITestimonial[]);
      }
      setLoading(false);
    };

    fetchTestimonials();
  }, []);

  const handleAdd = () => {
    setTestimonials((prev) => [...prev, { name: "", role: "", quote: "", stars: 5 }]);
  };

  const handleRemove = (index: number) => {
    setTestimonials((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleChange = (index: number, field: keyof ITestimonial, value: string | number) => {
    setTestimonials((prev) =>
      prev.map((testimonial, itemIndex) =>
        itemIndex === index ? { ...testimonial, [field]: value } : testimonial,
      ),
    );
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await updateTestimonialsServerSide(testimonials);
    if (!res.isError) {
      toast.success("Testimonials updated");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-[3rem] border border-white/10 bg-white/5 p-10">
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-custom font-bold uppercase tracking-widest text-white">
            ATHLETE <span className="text-primary">FEEDBACK</span>
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/50">
            Keep each review short, specific, and believable. These entries power the featured feedback experience on the storefront.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="rounded-[1.5rem] border border-white/10 bg-black px-5 py-4 text-center">
            <p className="text-2xl font-black text-primary">{testimonials.length}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Entries</p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-10 py-4 text-xs font-bold uppercase text-black shadow-xl shadow-primary/10 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />
            {loading ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      </div>

      {testimonials.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-white/10 bg-black/40 px-8 py-16 text-center">
          <MessageSquareQuote size={28} className="mx-auto text-primary" />
          <h2 className="mt-5 text-xl font-custom font-bold uppercase tracking-[0.18em] text-white">
            No Feedback Yet
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/45">
            Add a few concise athlete quotes so the storefront can present a stronger, more trustworthy testimonial section.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(0,0,0,0.96),rgba(255,255,255,0.02))] p-8"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-black uppercase tracking-[0.2em] text-primary">
                    {getInitials(testimonial.name || "A")}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">
                      Feedback {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-2 font-custom text-xl font-bold uppercase tracking-[0.16em] text-white">
                      {testimonial.name || "Unnamed Athlete"}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(index)}
                  className="flex items-center gap-2 rounded-full border border-red-500/15 bg-red-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 transition-all hover:border-red-500/30 hover:bg-red-500/15"
                >
                  <Trash2 size={14} />
                  Remove Entry
                </button>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                        Athlete Name
                      </label>
                      <input
                        value={testimonial.name}
                        onChange={(e) => handleChange(index, "name", e.target.value)}
                        className="w-full rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-white outline-none transition-colors focus:border-primary"
                        placeholder="Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                        Position / Role
                      </label>
                      <input
                        value={testimonial.role}
                        onChange={(e) => handleChange(index, "role", e.target.value)}
                        className="w-full rounded-full border border-white/10 bg-white/[0.04] px-6 py-4 text-white outline-none transition-colors focus:border-primary"
                        placeholder="Role"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                        Rating
                      </label>
                      <div className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3">
                        <div className="flex gap-1 text-primary">
                          {[...Array(5)].map((_, starIndex) => (
                            <button
                              key={starIndex}
                              type="button"
                              onClick={() => handleChange(index, "stars", starIndex + 1)}
                              className="transition-transform hover:scale-110"
                              aria-label={`Set rating to ${starIndex + 1}`}
                            >
                              <Star
                                size={17}
                                fill={starIndex < testimonial.stars ? "currentColor" : "none"}
                                className={starIndex < testimonial.stars ? "" : "text-white/10"}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-sm font-black uppercase tracking-[0.2em] text-white/45">
                          {testimonial.stars}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                      Performance Quote
                    </label>
                    <textarea
                      value={testimonial.quote}
                      onChange={(e) => handleChange(index, "quote", e.target.value)}
                      className="min-h-[170px] w-full resize-none rounded-[1.75rem] border border-white/10 bg-white/[0.04] px-6 py-5 text-white leading-7 outline-none transition-colors focus:border-primary"
                      placeholder="What did they say about the product, delivery, or results?"
                      rows={5}
                    />
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/25">Live Preview</p>
                  <div className="mt-5 rounded-[1.75rem] border border-primary/15 bg-black p-6">
                    <div className="mb-5 flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-black uppercase tracking-[0.2em] text-primary">
                        {getInitials(testimonial.name || "A")}
                      </div>
                      <div>
                        <h3 className="font-custom text-lg font-bold uppercase tracking-[0.14em] text-white">
                          {testimonial.name || "Athlete Name"}
                        </h3>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/30">
                          {testimonial.role || "Role / Position"}
                        </p>
                      </div>
                    </div>
                    <div className="mb-4 flex gap-1 text-primary">
                      {[...Array(5)].map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          size={15}
                          fill={starIndex < testimonial.stars ? "currentColor" : "none"}
                          className={starIndex < testimonial.stars ? "" : "text-white/10"}
                        />
                      ))}
                    </div>
                    <p className="text-sm leading-7 text-white/80">
                      {testimonial.quote || "Your athlete quote preview appears here with a cleaner storefront-style presentation."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleAdd}
        className="mt-10 flex w-full items-center justify-center gap-3 rounded-[2rem] border-2 border-dashed border-white/10 py-6 font-black uppercase tracking-widest text-white/20 transition-all hover:border-primary hover:text-primary"
      >
        <MessageSquareQuote size={24} />
        <Plus size={20} />
        INITIALIZE NEW FEEDBACK
      </button>
    </div>
  );
};

export default Testimonials;
