"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, X, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { 
    createCouponServerSide, 
    getAllCouponsServerSide, 
    updateCouponServerSide, 
    deleteCouponServerSide 
} from "@/server/functions/coupon.fun";
import { toast } from "sonner";
import type { ICoupon } from "@/server/models/coupon/coupon.interface";

interface FormData {
    code: string;
    description: string;
    discountType: "percentage" | "fixed";
    discountValue: string;
    isActive: boolean;
    minPurchaseAmount: string;
    maxDiscountAmount: string;
    usageLimit: string;
    expiresAt: string;
}

const initialFormData: FormData = {
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    isActive: true,
    minPurchaseAmount: "",
    maxDiscountAmount: "",
    usageLimit: "",
    expiresAt: ""
};

export default function Coupons() {
    const [coupons, setCoupons] = useState<ICoupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        const result = await getAllCouponsServerSide();
        if (!result.isError && result.data) {
            setCoupons(result.data as ICoupon[]);
        }
        setLoading(false);
    };

    const handleAddNew = () => {
        setEditingCoupon(null);
        setFormData(initialFormData);
        setIsModalOpen(true);
    };

    const handleEdit = (coupon: ICoupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            description: coupon.description || "",
            discountType: coupon.discountType,
            discountValue: coupon.discountValue.toString(),
            isActive: coupon.isActive,
            minPurchaseAmount: coupon.minPurchaseAmount?.toString() || "",
            maxDiscountAmount: coupon.maxDiscountAmount?.toString() || "",
            usageLimit: coupon.usageLimit?.toString() || "",
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : ""
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (couponId: string) => {
        if (!confirm("Delete this coupon?")) return;
        const result = await deleteCouponServerSide(couponId);
        if (!result.isError) {
            toast.success("Coupon deleted");
            loadCoupons();
        } else {
            toast.error(result.message);
        }
    };

    const handleToggleActive = async (coupon: ICoupon) => {
        const result = await updateCouponServerSide(coupon._id.toString(), { isActive: !coupon.isActive });
        if (!result.isError) {
            loadCoupons();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        const data = {
            code: formData.code,
            description: formData.description || undefined,
            discountType: formData.discountType,
            discountValue: parseFloat(formData.discountValue),
            isActive: formData.isActive,
            minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : 0,
            maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : undefined,
            usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
            expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined
        };

        let result;
        if (editingCoupon) {
            result = await updateCouponServerSide(editingCoupon._id.toString(), data);
        } else {
            result = await createCouponServerSide(data);
        }

        setFormLoading(false);

        if (!result.isError) {
            toast.success(`Coupon ${editingCoupon ? 'updated' : 'created'}`);
            setIsModalOpen(false);
            loadCoupons();
        } else {
            toast.error(result.message);
        }
    };

    const handleInputChange = (field: keyof FormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const filteredCoupons = coupons.filter(coupon => 
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="w-full min-h-full flex flex-col items-center justify-center pt-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white/20 font-black uppercase tracking-widest text-xs">LOADING COUPONS...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full">
            <div className="w-full h-full bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
                <div className="w-full flex flex-col sm:flex-row justify-between items-center p-10 border-b border-white/5 bg-black">
                    <div>
                        <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">COUPON <span className="text-primary">SYSTEM</span></h1>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Manage discount codes ({coupons.length})</p>
                    </div>
                    <div className="flex gap-4 mt-6 sm:mt-0">
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-3 text-white text-xs font-bold uppercase tracking-widest focus:border-primary outline-none transition-all"
                                placeholder="SEARCH COUPONS..."
                            />
                        </div>
                        <button onClick={handleAddNew} className="bg-primary text-black font-custom font-bold px-10 py-4 rounded-full hover:bg-white transition-all uppercase text-xs shadow-xl shadow-primary/10 flex items-center gap-2">
                            <Plus size={20} /> INITIALIZE
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-black p-10 custom-scrollbar">
                    <div className="grid gap-4">
                        {filteredCoupons.length === 0 ? (
                            <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
                                <p className="text-white/20 font-black uppercase tracking-widest text-sm mb-2">NO COUPONS FOUND</p>
                                <p className="text-white/40 text-xs uppercase tracking-wider">Create your first coupon code</p>
                            </div>
                        ) : filteredCoupons.map((coupon) => (
                            <div key={coupon._id.toString()} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-primary/30 transition-all group">
                                <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-primary/20">
                                            <span className="text-primary font-black text-xl">{coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '৳'}</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-black uppercase tracking-widest text-lg mb-1">{coupon.code}</p>
                                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">
                                                {coupon.discountType === 'percentage' ? 'Percentage' : 'Fixed'} Discount
                                                {coupon.minPurchaseAmount ? ` • Min ৳${coupon.minPurchaseAmount}` : ''}
                                                {coupon.maxDiscountAmount ? ` • Max ৳${coupon.maxDiscountAmount}` : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-10 justify-center">
                                        <div className="text-center">
                                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">USAGE</p>
                                            <p className="text-white font-black text-lg">{coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : '∞'}</p>
                                        </div>

                                        <button onClick={() => handleToggleActive(coupon)} className={`p-2 rounded-full transition-all ${coupon.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                            {coupon.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        </button>

                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(coupon)} className="p-3 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all"><Edit size={18} /></button>
                                            <button onClick={() => handleDelete(coupon._id.toString())} className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-500">
                    <div className="bg-black border border-white/10 rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-10 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                            <div><h2 className="text-2xl font-custom font-bold text-white uppercase tracking-widest">{editingCoupon ? "UPDATE COUPON" : "INITIALIZE COUPON"}</h2></div>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-10 overflow-auto max-h-[70vh] custom-scrollbar space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">COUPON CODE *</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={formData.code} 
                                        onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())} 
                                        className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none transition-all uppercase font-bold text-sm"
                                        placeholder="SAVE20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">DISCOUNT TYPE</label>
                                    <select 
                                        value={formData.discountType} 
                                        onChange={(e) => handleInputChange("discountType", e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none font-bold text-sm"
                                    >
                                        <option value="percentage">PERCENTAGE (%)</option>
                                        <option value="fixed">FIXED (৳)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">DISCOUNT VALUE *</label>
                                    <input 
                                        type="number" 
                                        required 
                                        value={formData.discountValue} 
                                        onChange={(e) => handleInputChange("discountValue", e.target.value)} 
                                        className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none font-bold text-sm"
                                        placeholder={formData.discountType === "percentage" ? "20" : "500"}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">USAGE LIMIT</label>
                                    <input 
                                        type="number" 
                                        value={formData.usageLimit} 
                                        onChange={(e) => handleInputChange("usageLimit", e.target.value)} 
                                        className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none font-bold text-sm"
                                        placeholder="100 (leave empty for unlimited)"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">MIN PURCHASE AMOUNT</label>
                                    <input 
                                        type="number" 
                                        value={formData.minPurchaseAmount} 
                                        onChange={(e) => handleInputChange("minPurchaseAmount", e.target.value)} 
                                        className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none font-bold text-sm"
                                        placeholder="500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">MAX DISCOUNT (for %)</label>
                                    <input 
                                        type="number" 
                                        value={formData.maxDiscountAmount} 
                                        onChange={(e) => handleInputChange("maxDiscountAmount", e.target.value)} 
                                        className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none font-bold text-sm"
                                        placeholder="1000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">EXPIRES AT</label>
                                <input 
                                    type="date" 
                                    value={formData.expiresAt} 
                                    onChange={(e) => handleInputChange("expiresAt", e.target.value)} 
                                    className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white focus:border-primary outline-none font-bold text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">DESCRIPTION</label>
                                <textarea 
                                    value={formData.description} 
                                    onChange={(e) => handleInputChange("description", e.target.value)} 
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-6 py-4 text-white focus:border-primary outline-none resize-none text-sm"
                                    placeholder="Summer sale discount code"
                                />
                            </div>

                            <div className="flex items-center gap-4 pt-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">ACTIVE</label>
                                <button
                                    type="button"
                                    onClick={() => handleInputChange("isActive", !formData.isActive)}
                                    className={`w-14 h-8 rounded-full transition-all ${formData.isActive ? "bg-primary" : "bg-white/10"}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full transition-all ${formData.isActive ? "translate-x-6" : "translate-x-1"}`} />
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/5">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-10 py-5 border border-white/10 text-white font-custom font-bold uppercase rounded-full hover:bg-white/5 transition-all text-xs">DISCARD</button>
                                <button type="submit" disabled={formLoading} className="flex-[2] bg-primary text-black font-custom font-bold uppercase rounded-full hover:bg-white transition-all text-xs shadow-xl shadow-primary/10">
                                    {formLoading ? "COMMITTING..." : editingCoupon ? "UPDATE COUPON" : "CREATE COUPON"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}