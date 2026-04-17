"use client";
import React, { useState, useEffect } from 'react';
import { getSiteSettingsServerSide, updateSiteSettingsServerSide } from '@/server/functions/admin.fun';
import { toast } from 'sonner';
import { Save, Globe, Mail, Phone, MapPin, FileText } from 'lucide-react';
import type { ISite } from '@/server/models/site/site.interface';

type EditableSiteField = 'siteName' | 'siteDescription' | 'contactEmail' | 'contactPhone' | 'contactAddress';
type EditableSocialField = 'facebook' | 'instagram' | 'twitter' | 'whatsapp';

const Settings = () => {
  const [settings, setSettings] = useState<ISite | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await getSiteSettingsServerSide();
    if (!res.isError && res.data) {
      const data = res.data as ISite;
      if (!data.socialLinks) data.socialLinks = {};
      if (!data.siteDescription) data.siteDescription = "";
      setSettings(data);
    }
    setLoading(false);
  };

  const handleInputChange = (field: EditableSiteField, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSocialChange = (field: EditableSocialField, value: string) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            socialLinks: { ...(prev.socialLinks || {}), [field]: value }
          }
        : prev
    );
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const res = await updateSiteSettingsServerSide(settings);
    if (!res.isError && res.data) {
      setSettings(res.data as ISite);
      toast.success("Global performance settings committed");
    } else if (res.isError) {
      toast.error(res.message || "Failed to save settings");
    }
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
        {/* Identity */}
        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8">
          <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-4">IDENTITY</h3>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">SITE NAME</label>
              <div className="relative">
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  value={settings.siteName || ''}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-full pl-16 pr-6 py-4 text-white focus:border-primary outline-none uppercase font-bold text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">SITE DESCRIPTION</label>
              <div className="relative">
                <FileText className="absolute left-6 top-6 text-white/20" size={18} />
                <textarea
                  value={settings.siteDescription || ""}
                  onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                  rows={4}
                  className="w-full bg-black border border-white/10 rounded-[2rem] pl-16 pr-6 py-5 text-white focus:border-primary outline-none font-bold text-xs resize-none leading-relaxed"
                  placeholder="Short SEO description for browser title cards and search previews"
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
                  value={settings.contactEmail || ''}
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
                  value={settings.contactPhone || ''}
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
                  value={settings.contactAddress || ''}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">FACEBOOK</label>
              <input
                value={settings.socialLinks?.facebook || ''}
                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs"
                placeholder="HTTPS://FACEBOOK.COM/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">INSTAGRAM</label>
              <input
                value={settings.socialLinks?.instagram || ''}
                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs"
                placeholder="HTTPS://INSTAGRAM.COM/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">TWITTER / X</label>
              <input
                value={settings.socialLinks?.twitter || ''}
                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs"
                placeholder="HTTPS://X.COM/..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">WHATSAPP</label>
              <input
                value={settings.socialLinks?.whatsapp || ''}
                onChange={(e) => handleSocialChange('whatsapp', e.target.value)}
                className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none text-xs"
                placeholder="HTTPS://WA.ME/..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
