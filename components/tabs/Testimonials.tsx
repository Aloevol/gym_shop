"use client";
import React, { useState, useEffect } from 'react';
import { getTestimonialsServerSide, updateTestimonialsServerSide } from '@/server/functions/admin.fun';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Star } from 'lucide-react';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    const res = await getTestimonialsServerSide();
    if (!res.isError && Array.isArray(res.data)) setTestimonials(res.data);
    setLoading(false);
  };

  const handleAdd = () => {
    setTestimonials([...testimonials, { name: '', role: '', quote: '', stars: 5 }]);
  };

  const handleRemove = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index][field] = value;
    setTestimonials(newTestimonials);
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await updateTestimonialsServerSide(testimonials);
    if (!res.isError) toast.success("Testimonials updated");
    setLoading(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">ATHLETE <span className="text-primary">FEEDBACK</span></h1>
        <button onClick={handleSave} className="bg-primary text-black px-10 py-4 rounded-full font-bold uppercase text-xs flex items-center gap-2 hover:bg-white transition-all shadow-xl shadow-primary/10">
          <Save size={18} /> SAVE CHANGES
        </button>
      </div>

      <div className="grid gap-6">
        {testimonials.map((t, index) => (
          <div key={index} className="bg-black border border-white/5 p-8 rounded-[2rem] flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">ATHLETE NAME</label>
                <input
                  value={t.name}
                  onChange={(e) => handleChange(index, 'name', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none"
                  placeholder="NAME"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">POSITION / ROLE</label>
                <input
                  value={t.role}
                  onChange={(e) => handleChange(index, 'role', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none"
                  placeholder="ROLE"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">RATING (1-5)</label>
                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-6 py-3">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={t.stars}
                    onChange={(e) => handleChange(index, 'stars', parseInt(e.target.value))}
                    className="w-12 bg-transparent text-white font-black outline-none"
                  />
                  <div className="flex text-primary">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < t.stars ? "currentColor" : "none"} className={i < t.stars ? "" : "text-white/10"} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">PERFORMANCE QUOTE</label>
              <textarea
                value={t.quote}
                onChange={(e) => handleChange(index, 'quote', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-4 text-white focus:border-primary outline-none resize-none"
                placeholder="WHAT DID THEY SAY?"
                rows={3}
              />
            </div>
            <button onClick={() => handleRemove(index)} className="flex items-center gap-2 text-red-500/40 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest self-end mr-4">
              <Trash2 size={14} /> REMOVE ENTRY
            </button>
          </div>
        ))}
      </div>

      <button onClick={handleAdd} className="mt-10 w-full py-6 border-2 border-dashed border-white/10 rounded-[2rem] text-white/20 hover:text-primary hover:border-primary transition-all font-black uppercase tracking-widest flex items-center justify-center gap-3">
        <Plus size={24} /> INITIALIZE NEW FEEDBACK
      </button>
    </div>
  );
};

export default Testimonials;
