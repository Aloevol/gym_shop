"use client";

import React from "react";
import { IPackage } from "@/server/models/package/package.interface";
import { Edit, Trash2, Star } from "lucide-react";
import ImageWithSkeleton from "../ui/ImageWIthSkeleton";

interface PackageCardProps {
    pkg: IPackage;
    onEdit: (pkg: IPackage) => void;
    onDelete: (id: string) => void;
    onToggleFeatured: (pkg: IPackage) => void;
    renderStars: (rating: number) => React.ReactNode;
}

const PackageCard = React.memo(({
                                    pkg,
                                    onEdit,
                                    onDelete,
                                    onToggleFeatured,
                                    renderStars
                                }: PackageCardProps) => (
    <div className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-6 relative group transition-all duration-500 hover:border-primary/30">
        {/* Status Badges */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
            {!pkg.isActive && (
                <span className="bg-red-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    OFFLINE
                </span>
            )}
            {pkg.isFeatured && (
                <span className="bg-primary text-black text-[8px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest shadow-lg">
                    <Star size={10} fill="currentColor" />
                    ELITE
                </span>
            )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2 z-10 translate-y-2 group-hover:translate-y-0">
            <button
                onClick={() => onToggleFeatured(pkg)}
                className={`h-10 w-10 border rounded-full flex items-center justify-center transition-all ${
                    pkg.isFeatured ? 'bg-primary border-primary text-black' : 'bg-white/10 border-white/10 text-white/40 hover:text-white'
                }`}
            >
                <Star size={16} fill={pkg.isFeatured ? "currentColor" : "none"} />
            </button>
            <button
                onClick={() => onEdit(pkg)}
                className="h-10 w-10 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
            >
                <Edit size={16} />
            </button>
            <button
                onClick={() => onDelete(pkg._id)}
                className="h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
                <Trash2 size={16} />
            </button>
        </div>

        {/* Package Images */}
        <div className="w-full aspect-square bg-black rounded-3xl mb-6 overflow-hidden relative border border-white/5">
            {pkg.imageUrl && pkg.imageUrl.length > 0 ? (
                <Image
                    src={pkg.imageUrl[0]}
                    alt={pkg.title}
                    fill
                    className="object-contain p-6 grayscale group-hover:grayscale-0 transition-all duration-700"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-white/5 font-black uppercase text-[10px]">NO VISUAL</div>
            )}
        </div>

        {/* Package Content */}
        <div>
            <h3 className="font-custom font-bold text-white text-lg uppercase tracking-tight mb-2 line-clamp-1 group-hover:text-primary transition-colors">{pkg.title}</h3>
            
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                    <span className="text-2xl font-black text-white tracking-tighter">
                        ৳ {pkg.price.toLocaleString()}
                    </span>
                    {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                        <span className="text-white/20 text-[10px] line-through font-bold uppercase tracking-widest">
                            ৳ {pkg.originalPrice.toLocaleString()}
                        </span>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">RATING</p>
                    {renderStars(pkg.rating || 0)}
                </div>
            </div>

            {/* Features */}
            {pkg.features && pkg.features.length > 0 && (
                <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-2">
                    {pkg.features.slice(0, 4).map((feature, index) => (
                        <span key={index} className="text-[8px] font-black text-white/40 uppercase tracking-widest truncate bg-white/5 px-2 py-1 rounded border border-white/5">• {feature}</span>
                    ))}
                </div>
            )}
        </div>
    </div>
));


PackageCard.displayName = 'PackageCard';

export default PackageCard;