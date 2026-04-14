"use client";

import React, { useCallback } from "react";
import { Plus, Loader2, Star } from "lucide-react";
import {usePackageManagement} from "@/hooks/usePackageManagement";
import {usePackageForm} from "@/hooks/usePackageForm";
import PackageGrid from "@/components/ui/PackageGrid";
import PackageModal from "@/components/ui/PackageModal";

export default function PackageManagement() {
    const { packages, loading, isMounted, loadPackages, handleDelete, handleToggleFeatured } = usePackageManagement();
    const { formData, setFormData, editingPackage, isModalOpen, formLoading, imageUploading, previewImages, selectedFiles, fileInputRef, handleAddNew, handleEdit, handleSubmit, handleFileChange, handleImageUpload, removeImage, addFeature, removeFeature, updateFeature, closeModal } = usePackageForm({ loadPackages });

    const renderStars = useCallback((rating: number) => (
        <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={14} fill={star <= rating ? "currentColor" : "none"} className={star <= rating ? "text-primary" : "text-white/10"} />
            ))}
        </div>
    ), []);

    if (!isMounted || loading) {
        return (
            <div className="w-full min-h-full flex flex-col items-center justify-center pt-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white/20 font-black uppercase tracking-widest text-xs">SYNCING PACKAGES...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full">
            <div className="w-full h-full bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="w-full flex flex-col sm:flex-row justify-between items-center p-10 border-b border-white/5">
                    <div>
                        <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">PERFORMANCE <span className="text-primary">PACKAGES</span></h1>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Manage curated elite bundles ({packages.length})</p>
                    </div>
                    <button
                        onClick={handleAddNew}
                        className="bg-primary text-black font-custom font-bold px-10 py-4 rounded-full hover:bg-white transition-all uppercase text-xs shadow-xl shadow-primary/10 flex items-center gap-2"
                    >
                        <Plus size={20} strokeWidth={3} />
                        INITIALIZE PACKAGE
                    </button>
                </div>

                <div className="flex-1 overflow-auto bg-black p-10 custom-scrollbar">
                    <PackageGrid
                        packages={packages}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggleFeatured={handleToggleFeatured}
                        renderStars={renderStars}
                    />
                </div>

                {isModalOpen && (
                    <PackageModal
                        editingPackage={editingPackage}
                        formData={formData}
                        setFormData={setFormData}
                        previewImages={previewImages}
                        selectedFiles={selectedFiles}
                        imageUploading={imageUploading}
                        formLoading={formLoading}
                        fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                        onClose={closeModal}
                        onSubmit={handleSubmit}
                        onFileChange={handleFileChange}
                        onImageUpload={handleImageUpload}
                        onRemoveImage={removeImage}
                        onAddFeature={addFeature}
                        onRemoveFeature={removeFeature}
                        onUpdateFeature={updateFeature}
                    />
                )}
            </div>
        </div>
    );
}
