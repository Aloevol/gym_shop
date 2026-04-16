"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getAthletesServerSide, addAthleteServerSide, deleteAthleteServerSide } from '@/server/functions/admin.fun';
import { toast } from 'sonner';
import { Plus, Trash2, Camera, Facebook, Instagram, Twitter, X } from 'lucide-react';
import Image from 'next/image';

const Athletes = () => {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    facebook: '',
    instagram: '',
    twitter: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAthletes();
  }, []);

  const fetchAthletes = async () => {
    const res = await getAthletesServerSide();
    if (!res.isError) setAthletes(res.data);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddAthlete = async () => {
    if (!selectedFile || !formData.name || !formData.role) {
      toast.error("Name, role and image are required");
      return;
    }
    setLoading(true);
    const body = new FormData();
    body.append('name', formData.name);
    body.append('role', formData.role);
    body.append('bio', formData.bio);
    body.append('facebook', formData.facebook);
    body.append('instagram', formData.instagram);
    body.append('twitter', formData.twitter);
    body.append('imageFile', selectedFile);

    const res = await addAthleteServerSide(body);
    if (!res.isError) {
      toast.success("Athlete added successfully");
      resetForm();
      fetchAthletes();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this athlete?")) return;
    setLoading(true);
    const res = await deleteAthleteServerSide(id);
    if (!res.isError) {
      toast.success("Athlete removed");
      fetchAthletes();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ name: '', role: '', bio: '', facebook: '', instagram: '', twitter: '' });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsAdding(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">PERFORMANCE <span className="text-primary">ATHLETES</span></h1>
        <button 
          onClick={() => setIsAdding(true)} 
          className="bg-primary text-black px-10 py-4 rounded-full font-bold uppercase text-xs flex items-center gap-2 hover:bg-white transition-all shadow-xl shadow-primary/10"
        >
          <Plus size={18} strokeWidth={3} /> INITIALIZE ATHLETE
        </button>
      </div>

      {isAdding && (
        <div className="mb-12 p-10 border border-primary/20 rounded-[2.5rem] bg-primary/5 animate-in slide-in-from-top duration-500">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-custom font-bold text-white uppercase tracking-widest">NEW ATHLETE DATA</h2>
            <button onClick={resetForm} className="text-white/20 hover:text-white transition-colors"><X size={24} /></button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="h-[400px] bg-black border border-white/10 rounded-[2rem] overflow-hidden flex items-center justify-center relative group">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                ) : (
                  <Camera size={48} className="text-white/5" />
                )}
              </div>
              <div className="h-[64px] bg-white/5 border border-dashed border-white/10 rounded-full relative flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <p className="text-xs font-black text-primary uppercase tracking-widest">UPLOAD ATHLETE IMAGE</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">NAME *</label>
                  <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">ROLE *</label>
                  <input value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">BIO / MOTTO</label>
                <textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="w-full bg-black border border-white/10 rounded-[1.5rem] px-6 py-4 text-white focus:border-primary outline-none resize-none text-xs" rows={3} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">FACEBOOK</label>
                  <input value={formData.facebook} onChange={(e) => setFormData({...formData, facebook: e.target.value})} className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">INSTAGRAM</label>
                  <input value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-2">TWITTER</label>
                  <input value={formData.twitter} onChange={(e) => setFormData({...formData, twitter: e.target.value})} className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs" />
                </div>
              </div>

              <button 
                onClick={handleAddAthlete} 
                disabled={loading}
                className="w-full bg-primary text-black font-custom font-bold py-5 rounded-full hover:bg-white transition-all uppercase text-sm shadow-xl shadow-primary/10 disabled:opacity-20"
              >
                {loading ? "PROCESSING..." : "DEPLOY ATHLETE PROFILE"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {athletes.map((athlete) => (
          <div key={athlete._id} className="bg-black border border-white/10 rounded-[2.5rem] overflow-hidden group hover:border-primary/50 transition-all duration-500">
            <div className="aspect-[3/4] relative overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700">
              <Image src={athlete.image} alt={athlete.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button 
                  onClick={() => handleDelete(athlete._id)}
                  className="p-4 bg-red-500 rounded-2xl text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
            <div className="p-8 text-center">
              <h3 className="text-xl font-custom font-bold text-white uppercase tracking-widest mb-1">{athlete.name}</h3>
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">{athlete.role}</p>
            </div>
          </div>
        ))}
      </div>

      {athletes.length === 0 && !loading && (
        <div className="text-center py-24 bg-black rounded-[3rem] border border-dashed border-white/10">
          <p className="text-white/20 font-black uppercase tracking-widest text-sm">NO ATHLETES INITIALIZED</p>
        </div>
      )}
    </div>
  );
};

export default Athletes;
