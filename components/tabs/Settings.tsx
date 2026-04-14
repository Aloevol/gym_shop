"use client";
import React, { useState, useEffect } from 'react';
import { getSiteSettingsServerSide, updateSiteSettingsServerSide } from '@/server/functions/admin.fun';
import { toast } from 'sonner';
import { Save, Globe, Mail, Phone, MapPin, Camera } from 'lucide-react';
import Image from 'next/image';
import { uploadImageToCloudinary } from '@/server/helper/cloudinary.helper';

const Settings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await getSiteSettingsServerSide();
    if (!res.isError) setSettings(res.data);
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSocialChange = (field: string, value: string) => {
    setSettings({
      ...settings,
      socialLinks: { ...settings.socialLinks, [field]: value }
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      if (url) {
        setSettings({ ...settings, logoUrl: url.url });
        toast.success("Logo visual synced");
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateSiteSettingsServerSide(settings);
    if (!res.isError) toast.success("Global performance settings committed");
    setSaving(false);
  };

  if (loading || !settings) return <div className="animate-pulse bg-white/5 h-96 rounded-[3rem]" />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-12 px-4">
        <div>
          <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">GLOBAL <span className="text-primary">SETTINGS</span></h1>
          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Configure core performance identity</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-primary text-black px-10 py-4 rounded-full font-bold uppercase text-xs flex items-center gap-2 hover:bg-white transition-all shadow-xl shadow-primary/10 disabled:opacity-20"
        >
          {saving ? "COMMITTING..." : <><Save size={18} /> COMMIT CHANGES</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Identity & Logo */}
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8">
          <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-4">IDENTITY</h3>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-4 items-center">
              <div className="w-full aspect-video bg-black rounded-[2rem] border border-white/10 relative flex items-center justify-center group overflow-hidden">
                <Image 
                  src={settings.logoUrl || "/NavLogo.png"} 
                  alt="Logo" 
                  width={200} 
                  height={60} 
                  className="object-contain p-4 group-hover:scale-110 transition-transform duration-700" 
                />
                {logoUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="w-full relative">
                <input type="file" onChange={handleLogoUpload} className="hidden" id="logo-input" />
                <label htmlFor="logo-input" className="w-full py-4 border border-dashed border-white/10 rounded-full flex items-center justify-center gap-3 cursor-pointer hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary hover:border-primary">
                  <Camera size={16} /> REPLACE LOGO ASSET
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">SITE NAME</label>
              <div className="relative">
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  value={settings.siteName}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-full pl-16 pr-6 py-4 text-white focus:border-primary outline-none uppercase font-bold text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8">
          <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-4">COMMUNICATIONS</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">SUPPORT EMAIL</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  value={settings.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-full pl-16 pr-6 py-4 text-white focus:border-primary outline-none font-bold text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">PERFORMANCE HOTLINE</label>
              <div className="relative">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  value={settings.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-full pl-16 pr-6 py-4 text-white focus:border-primary outline-none font-bold text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">BASE LOCATION</label>
              <div className="relative">
                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  value={settings.contactAddress}
                  onChange={(e) => handleInputChange('contactAddress', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-full pl-16 pr-6 py-4 text-white focus:border-primary outline-none font-bold text-xs uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Matrix */}
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 lg:col-span-2 space-y-8">
          <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-4">SOCIAL MATRIX</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">FACEBOOK</label>
              <input
                value={settings.socialLinks?.facebook}
                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs"
                placeholder="HTTPS://FACEBOOK.COM/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">INSTAGRAM</label>
              <input
                value={settings.socialLinks?.instagram}
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs"
                placeholder="HTTPS://INSTAGRAM.COM/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">TWITTER / X</label>
              <input
                value={settings.socialLinks?.twitter}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs"
                placeholder="HTTPS://X.COM/..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
