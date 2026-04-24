"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Edit, Trash2, Star, Upload, X } from "lucide-react";
import {
    getAllProductsServerSide,
    createProductServerSide,
    updateProductServerSide,
    deleteProductServerSide,
} from "@/server/functions/product.fun";
import { toast } from "sonner";
import { IProduct } from "@/server/models/product/product.interface";
import { uploadMultipleToCloudinary } from "@/server/helper/cloudinary.helper";
import Image from "next/image";

interface FormData {
    title: string;
    description: string;
    price: string;
    originalPrice: string;
    images: string[];
    category: string;
    brand: string;
    stock: string;
    rating: number;
    tags: string[];
    specifications: Record<string, string>;
    isActive: boolean;
    isFeatured: boolean;
}

const convertToPlainObject = (doc: any): any => {
    if (doc && typeof doc === 'object') {
        if (doc.toJSON) return doc.toJSON();
        if (doc._id && typeof doc._id.toString === 'function') return { ...doc, _id: doc._id.toString() };
        if (Array.isArray(doc)) return doc.map(item => convertToPlainObject(item));
        const plainObj: any = {};
        for (const key in doc) {
            if (Object.prototype.hasOwnProperty.call(doc, key)) {
                plainObj[key] = convertToPlainObject(doc[key]);
            }
        }
        return plainObj;
    }
    return doc;
};

export default function ProductManagement() {
    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [newSpecKey, setNewSpecKey] = useState("");
    const [newSpecValue, setNewSpecValue] = useState("");
    const [newTag, setNewTag] = useState("");

    const [pagination, setPagination] = useState({ page: 1, limit: 12, hasNext: true });
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<FormData>({
        title: "", description: "", price: "", originalPrice: "", images: [], category: "", brand: "", stock: "", tags: [""], rating: 0, specifications: {}, isActive: true, isFeatured: false
    });

    const loadProducts = useCallback(async (page: number, initialLoad: boolean = false) => {
        try {
            if (initialLoad) setLoading(true);
            else setLoadingMore(true);

            const response = await getAllProductsServerSide({ filter: {}, page: page, limit: pagination.limit });

            if (!response.isError && response.data) {
                const { products: newProducts } = response.data as { products: IProduct[] };
                const plainProducts = newProducts.map(product => convertToPlainObject(product) as IProduct);

                if (page === 1) setProducts(plainProducts);
                else setProducts(prev => [...prev, ...plainProducts]);

                setPagination(prev => ({ ...prev, page: page, hasNext: newProducts.length === pagination.limit }));
            }
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [pagination.limit]);

    useEffect(() => {
        setIsMounted(true);
        loadProducts(1, true);
    }, [loadProducts]);

    const handleAddNew = () => {
        setEditingProduct(null);
        setFormData({ title: "", description: "", price: "", originalPrice: "", images: [], category: "", rating: 0, brand: "", stock: "", tags: [""], specifications: {}, isActive: true, isFeatured: false });
        setPreviewImages([]);
        setSelectedFiles([]);
        setIsModalOpen(true);
    };

    const handleEdit = (product: IProduct) => {
        setEditingProduct(product);
        setFormData({
            title: product.title, description: product.description, price: product.price.toString(), originalPrice: product.originalPrice?.toString() || "", images: product.images,
            rating: product.rating || 0, category: product.category, brand: product.brand, stock: product.stock.toString(), tags: product.tags, specifications: product.specifications || {}, isActive: product.isActive, isFeatured: product.isFeatured
        });
        setPreviewImages(product.images);
        setSelectedFiles([]);
        setIsModalOpen(true);
    };

    const handleDelete = async (productId: string) => {
        if (!confirm("Delete this product?")) return;
        try {
            const response = await deleteProductServerSide(productId);
            if (!response.isError) {
                toast.success("Product deleted");
                setProducts(prev => prev.filter(p => p._id.toString() !== productId));
            }
        } catch (error) { console.error(error); }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        const newFiles = Array.from(files);
        setSelectedFiles(prev => [...prev, ...newFiles]);
        setPreviewImages(prev => [...prev, ...newFiles.map(file => URL.createObjectURL(file))]);
    };

    const removeImage = (index: number) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            let finalImages = formData.images;
            if (selectedFiles.length > 0) {
                setImageUploading(true);
                const uploadedUrls = await uploadMultipleToCloudinary(selectedFiles);
                finalImages = [...formData.images, ...uploadedUrls];
                setImageUploading(false);
            }

            const productData = { 
            ...formData, 
            price: parseFloat(formData.price), 
            originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined, 
            stock: parseInt(formData.stock), 
            images: finalImages
        };

            const response = editingProduct ? await updateProductServerSide(editingProduct._id.toString(), productData) : await createProductServerSide(productData);

            if (!response.isError) {
                toast.success(`Product ${editingProduct ? 'updated' : 'created'}`);
                setIsModalOpen(false);
                loadProducts(1, true);
            }
        } catch (error) { console.error(error); } finally { setFormLoading(false); }
    };

    const handleInputChange = (field: keyof FormData, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

    const handleScroll = () => {
        if (!scrollContainerRef.current || loadingMore || !pagination.hasNext) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        if (scrollHeight - scrollTop <= clientHeight + 100) loadProducts(pagination.page + 1);
    };

    if (!isMounted) return null;

    return (
        <div className="w-full min-h-full">
            <div className="w-full h-full bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="w-full flex flex-col sm:flex-row justify-between items-center p-10 border-b border-white/5">
                    <div>
                        <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">PRODUCT <span className="text-primary">CATALOG</span></h1>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Manage elite performance gear</p>
                    </div>
                    <button onClick={handleAddNew} className="bg-primary text-black font-custom font-bold px-10 py-4 rounded-full hover:bg-white transition-all uppercase text-xs shadow-xl shadow-primary/10 flex items-center gap-2 mt-6 sm:mt-0">
                        <Plus size={20} strokeWidth={3} /> INITIALIZE PRODUCT
                    </button>
                </div>

                {/* Grid */}
                <div ref={scrollContainerRef} className="w-full flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-10 overflow-auto custom-scrollbar bg-black" onScroll={handleScroll}>
                    {loading ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="w-full aspect-[4/5] bg-white/5 border border-white/10 rounded-[2.5rem] animate-pulse" />) : products.length === 0 ? (
                        <div className="col-span-full text-center py-32 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
                            <p className="text-white/20 font-black uppercase tracking-widest text-sm mb-8">CATALOG IS EMPTY</p>
                        </div>
                    ) : products.map((product) => (
                        <div key={product._id.toString()} className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-6 relative group transition-all duration-500 hover:border-primary/30">
                            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                                {!product.isActive && <span className="bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">OFFLINE</span>}
                                {product.isFeatured && <span className="bg-primary text-black text-[8px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest shadow-lg"><Star size={10} fill="currentColor" />ELITE</span>}
                            </div>
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2 z-10 translate-y-2 group-hover:translate-y-0">
                                <button onClick={() => handleEdit(product)} className="h-10 w-10 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(product._id.toString())} className="h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                            </div>
                            <div className="w-full aspect-square bg-black rounded-3xl mb-6 overflow-hidden relative border border-white/5">
                                <Image src={product.images[0] || "/placeholder.jpg"} alt={product.title} fill className="object-contain p-6 grayscale group-hover:grayscale-0 transition-all duration-700" />
                            </div>
                            <h3 className="font-custom font-bold text-white text-lg uppercase tracking-tight mb-2 line-clamp-1 group-hover:text-primary transition-colors">{product.title}</h3>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex flex-col"><span className="text-2xl font-black text-white tracking-tighter">৳ {product.price.toLocaleString()}</span></div>
                                <div className="text-right"><p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">STOCK</p><p className={`text-xs font-black ${product.stock > 0 ? 'text-primary' : 'text-red-500'}`}>{product.stock}</p></div>
                            </div>
                            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full border border-white/5">{product.category}</span>
                                <div className="flex text-primary gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < (product.rating || 0) ? "currentColor" : "none"} className={i < (product.rating || 0) ? "" : "text-white/10"} />)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-500">
                    <div className="bg-black border border-white/10 rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-10 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                            <div><h2 className="text-2xl font-custom font-bold text-white uppercase tracking-widest">{editingProduct ? "UPDATE GEAR" : "INITIALIZE NEW GEAR"}</h2></div>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 overflow-auto max-h-[70vh] custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">TITLE *</label><input type="text" required value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none transition-all uppercase font-bold text-sm" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">CATEGORY *</label><input type="text" required value={formData.category} onChange={(e) => handleInputChange("category", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none transition-all uppercase font-bold text-sm" placeholder="e.g., SUPPLEMENTS" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">BRAND *</label><input type="text" required value={formData.brand} onChange={(e) => handleInputChange("brand", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none transition-all uppercase font-bold text-sm" placeholder="e.g., OPTIMUM NUTRITION" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">DESCRIPTION</label><textarea value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={4} className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-6 py-4 text-white focus:border-primary outline-none resize-none transition-all text-sm" /></div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">PRICE *</label><input type="number" required value={formData.price} onChange={(e) => handleInputChange("price", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none font-black" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">STOCK *</label><input type="number" required value={formData.stock} onChange={(e) => handleInputChange("stock", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none font-black" /></div>
                                    </div>
                                </div>
                                <div className="space-y-10">
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-4">VISUAL ASSETS</h3>
                                        <div className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 bg-white/5">
                                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*" className="hidden" />
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-6 bg-black border border-white/10 rounded-full text-white font-custom font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3">{imageUploading ? "UPLOADING..." : "UPLOAD VISUALS"}</button>
                                            <div className="mt-8 grid grid-cols-4 gap-4">{previewImages.map((src, i) => (<div key={i} className="aspect-square relative rounded-2xl overflow-hidden border border-white/10 bg-black"><Image src={src} alt="P" fill className="object-contain p-2 grayscale group-hover:grayscale-0 transition-all" /><button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center scale-75"><X size={12} /></button></div>))}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-10 border-t border-white/5">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-10 py-5 border border-white/10 text-white font-custom font-bold uppercase rounded-full hover:bg-white/5 transition-all text-xs">DISCARD</button>
                                <button type="submit" disabled={formLoading} className="flex-[2] bg-primary text-black font-custom font-bold uppercase rounded-full hover:bg-white transition-all text-xs shadow-xl shadow-primary/10">{formLoading ? "COMMITTING..." : editingProduct ? "UPDATE GEAR" : "DEPLOY GEAR"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
