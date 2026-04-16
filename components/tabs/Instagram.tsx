"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getInstagramGalleryServerSide, addInstagramPostServerSide, deleteInstagramPostServerSide } from '@/server/functions/admin.fun';
import { toast } from 'sonner';
import { Plus, Trash2, Camera, Link as LinkIcon, X } from 'lucide-react';
import Image from 'next/image';

const Instagram = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await getInstagramGalleryServerSide();
    if (!res.isError && Array.isArray(res.data)) setPosts(res.data);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddPost = async () => {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('imageFile', selectedFile);
    formData.append('link', link);

    const res = await addInstagramPostServerSide(formData);
    if (!res.isError) {
      toast.success("Post added to gallery");
      resetForm();
      fetchPosts();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this visual?")) return;
    setLoading(true);
    const res = await deleteInstagramPostServerSide(id);
    if (!res.isError) {
      toast.success("Post removed");
      fetchPosts();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setLink('');
    setIsAdding(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">INSTAGRAM <span className="text-primary">GALLERY</span></h1>
        <button 
          onClick={() => setIsAdding(true)} 
          className="bg-primary text-black px-10 py-4 rounded-full font-bold uppercase text-xs flex items-center gap-2 hover:bg-white transition-all shadow-xl shadow-primary/10"
        >
          <Plus size={18} strokeWidth={3} /> ADD NEW VISUAL
        </button>
      </div>

      {isAdding && (
        <div className="mb-12 p-10 border border-primary/20 rounded-[2.5rem] bg-primary/5 animate-in slide-in-from-top duration-500">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-custom font-bold text-white uppercase tracking-widest">INITIALIZE INSTA POST</h2>
            <button onClick={resetForm} className="text-white/20 hover:text-white transition-colors"><X size={24} /></button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="h-[300px] bg-black border border-white/10 rounded-[2rem] overflow-hidden flex items-center justify-center relative group">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                ) : (
                  <Camera size={48} className="text-white/5" />
                )}
              </div>
              <div className="h-[64px] bg-white/5 border border-dashed border-white/10 rounded-full relative flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <p className="text-xs font-black text-primary uppercase tracking-widest">SELECT CAPTURE</p>
              </div>
            </div>

            <div className="flex flex-col gap-8 justify-center">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-2">EXTERNAL LINK (OPTIONAL)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-full pl-16 pr-6 py-4 text-white focus:border-primary outline-none"
                    placeholder="HTTPS://INSTAGRAM.COM/P/..."
                  />
                </div>
              </div>
              <button 
                onClick={handleAddPost} 
                disabled={!selectedFile || loading}
                className="w-full bg-primary text-black font-custom font-bold py-5 rounded-full hover:bg-white transition-all uppercase text-sm shadow-xl shadow-primary/10 disabled:opacity-20"
              >
                {loading ? "UPLOADING..." : "DEPLOY TO GALLERY"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {posts.map((post) => (
          <div key={post._id} className="aspect-square relative rounded-[2rem] overflow-hidden border border-white/10 group bg-black">
            <Image src={post.imageUrl} alt="Insta" fill className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button 
                onClick={() => handleDelete(post._id)}
                className="p-4 bg-red-500 rounded-2xl text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <div className="text-center py-24 bg-black rounded-[3rem] border border-dashed border-white/10">
          <p className="text-white/20 font-black uppercase tracking-widest text-sm">GALLERY IS CURRENTLY EMPTY</p>
        </div>
      )}
    </div>
  );
};

export default Instagram;
