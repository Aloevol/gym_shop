"use client";

import React from "react";
import { IPackage } from "@/server/models/package/package.interface";
import { X, Star, Upload, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface FormData {
    title: string;
    description: string;
    price: string;
    originalPrice: string;
    features: string[];
    imageUrl: string[];
    rating: number;
    isActive: boolean;
    isFeatured: boolean;
    category: string;
}

interface PackageModalProps {
    editingPackage: IPackage | null;
    formData: FormData;
    setFormData: (formData: FormData) => void;
    previewImages: string[];
    selectedFiles: File[];
    imageUploading: boolean;
    formLoading: boolean;
    fileInputRef: React.RefObject<HTMLInputElement>;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onImageUpload: () => void;
    onRemoveImage: (index: number) => void;
    onAddFeature: () => void;
    onRemoveFeature: (index: number) => void;
    onUpdateFeature: (index: number, value: string) => void;
}

const PackageModal = React.memo(({
                                     editingPackage,
                                     formData,
                                     setFormData,
                                     previewImages,
                                     selectedFiles,
                                     imageUploading,
                                     formLoading,
                                     fileInputRef,
                                     onClose,
                                     onSubmit,
                                     onFileChange,
                                     onImageUpload,
                                     onRemoveImage,
                                     onAddFeature,
                                     onRemoveFeature,
                                     onUpdateFeature,
                                 }: PackageModalProps) => {
    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-500">
            <div className="bg-black border border-white/10 rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-10 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-2xl font-custom font-bold text-white uppercase tracking-widest">
                            {editingPackage ? "UPDATE PERFORMANCE BUNDLE" : "INITIALIZE NEW BUNDLE"}
                        </h2>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Configure curated athlete experience</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-10 overflow-auto max-h-[70vh] custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Basic Information */}
                        <div className="space-y-8">
                            <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-4">CORE DATA</h3>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">BUNDLE TITLE *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none transition-all uppercase font-bold text-sm tracking-tight"
                                    placeholder="ENTER BUNDLE NAME"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">DESCRIPTION</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-6 py-4 text-white focus:border-primary outline-none resize-none transition-all text-sm leading-relaxed"
                                    placeholder="DESCRIBE THE BUNDLE VALUE"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">BUNDLE PRICE *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none transition-all font-black"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">LIST PRICE</label>
                                    <input
                                        type="number"
                                        value={formData.originalPrice}
                                        onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none transition-all font-black"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">ELITE RATING</label>
                                <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-6 py-[14px]">
                                    <div className="flex text-primary">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFormData({...formData, rating: star})}
                                                className="p-0.5 hover:scale-125 transition-transform"
                                            >
                                                <Star
                                                    size={16}
                                                    fill={star <= formData.rating ? "currentColor" : "none"}
                                                    className={star <= formData.rating ? "" : "text-white/10"}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-xs font-black text-white">{formData.rating}/5</span>
                                </div>
                            </div>
                        </div>

                        {/* Images & Features */}
                        <div className="space-y-10">
                            {/* Image Upload */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-4">VISUAL ASSETS</h3>
                                <div className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 bg-white/5">
                                    <input type="file" ref={fileInputRef} onChange={onFileChange} multiple accept="image/*" className="hidden" />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-6 bg-black border border-white/10 rounded-full text-white font-custom font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
                                    >
                                        <Upload size={18} /> SELECT VISUALS
                                    </button>

                                    <div className="mt-8 grid grid-cols-4 gap-4">
                                        {formData.imageUrl.map((url, index) => (
                                            <div key={`saved-${index}`} className="aspect-square relative rounded-2xl overflow-hidden border border-white/10 bg-black group">
                                                <Image src={url} alt="P" fill className="object-contain p-2 grayscale group-hover:grayscale-0 transition-all" />
                                                <button type="button" onClick={() => onRemoveImage(index)} className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-75"><X size={12} /></button>
                                            </div>
                                        ))}
                                        {previewImages.map((src, index) => (
                                            <div key={`preview-${index}`} className="aspect-square relative rounded-2xl overflow-hidden border-2 border-primary bg-black">
                                                <Image src={src} alt="P" fill className="object-contain p-2 animate-pulse" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-4">BUNDLE FEATURES</h3>
                                <div className="space-y-3">
                                    {formData.features.map((feature, index) => (
                                        <div key={index} className="flex gap-3">
                                            <input
                                                type="text"
                                                value={feature}
                                                onChange={(e) => onUpdateFeature(index, e.target.value)}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-full px-6 py-3 text-white focus:border-primary outline-none uppercase font-bold text-xs"
                                                placeholder={`SPECIFICATION ${index + 1}`}
                                            />
                                            <button type="button" onClick={() => onRemoveFeature(index)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-full transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={onAddFeature} className="w-full py-3 border border-dashed border-white/10 rounded-full text-white/20 hover:text-primary hover:border-primary transition-all font-black uppercase text-[10px] flex items-center justify-center gap-2">
                                        <Plus size={14} /> ADD SPECIFICATION
                                    </button>
                                </div>
                            </div>

                            {/* Status Toggles */}
                            <div className="flex flex-wrap gap-8 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all ${
                                        formData.isActive ? 'border-green-500/50 bg-green-500/10 text-green-500' : 'border-white/10 bg-white/5 text-white/20'
                                    }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-white/20'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">LIVE STATUS</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, isFeatured: !formData.isFeatured})}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-all ${
                                        formData.isFeatured ? 'border-primary/50 bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-white/20'
                                    }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${formData.isFeatured ? 'bg-primary shadow-[0_0_8px_rgba(255,153,0,0.5)]' : 'bg-white/20'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">ELITE STATUS</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-10 border-t border-white/5">
                        <button type="button" onClick={onClose} className="flex-1 px-10 py-5 border border-white/10 text-white font-custom font-bold uppercase rounded-full hover:bg-white/5 transition-all text-xs">DISCARD</button>
                        <button type="submit" disabled={formLoading} className="flex-[2] bg-primary text-black font-custom font-bold uppercase rounded-full hover:bg-white transition-all text-xs shadow-xl shadow-primary/10">
                            {formLoading ? "COMMITTING..." : editingPackage ? "UPDATE BUNDLE" : "DEPLOY BUNDLE"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
});

PackageModal.displayName = 'PackageModal';

export default PackageModal;
