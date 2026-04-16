"use client";
import React, { useState, useEffect } from 'react';
import { getFeaturesServerSide, updateFeaturesServerSide } from '@/server/functions/admin.fun';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Dumbbell, HeartPulse, ShieldCheck } from 'lucide-react';

const Features = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    const res = await getFeaturesServerSide();
    if (!res.isError && Array.isArray(res.data)) setFeatures(res.data);
    setLoading(false);
  };

  const handleAdd = () => {
    setFeatures([...features, { title: '', description: '', icon: 'Dumbbell' }]);
  };

  const handleRemove = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: string) => {
    const newFeatures = [...features];
    newFeatures[index][field] = value;
    setFeatures(newFeatures);
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await updateFeaturesServerSide(features);
    if (!res.isError) toast.success("Features updated");
    setLoading(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">FEATURES <span className="text-primary">SETUP</span></h1>
        <button onClick={handleSave} className="bg-primary text-black px-10 py-4 rounded-full font-bold uppercase text-xs flex items-center gap-2 hover:bg-white transition-all shadow-xl shadow-primary/10">
          <Save size={18} /> SAVE CHANGES
        </button>
      </div>

      <div className="grid gap-6">
        {features.map((feature, index) => (
          <div key={index} className="bg-black border border-white/5 p-8 rounded-[2rem] flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">TITLE</label>
                <input
                  value={feature.title}
                  onChange={(e) => handleChange(index, 'title', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none"
                  placeholder="FEATURE TITLE"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">ICON (Lucide Name)</label>
                <select
                  value={feature.icon}
                  onChange={(e) => handleChange(index, 'icon', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none"
                >
                  <option value="Dumbbell">Dumbbell</option>
                  <option value="HeartPulse">HeartPulse</option>
                  <option value="ShieldCheck">ShieldCheck</option>
                  <option value="Zap">Zap</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">DESCRIPTION</label>
                <textarea
                  value={feature.description}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-4 text-white focus:border-primary outline-none resize-none"
                  placeholder="FEATURE DESCRIPTION"
                  rows={2}
                />
              </div>
            </div>
            <button onClick={() => handleRemove(index)} className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all self-end md:self-center">
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={handleAdd} className="mt-10 w-full py-6 border-2 border-dashed border-white/10 rounded-[2rem] text-white/20 hover:text-primary hover:border-primary transition-all font-black uppercase tracking-widest flex items-center justify-center gap-3">
        <Plus size={24} /> ADD FEATURE COMPONENT
      </button>
    </div>
  );
};

export default Features;
