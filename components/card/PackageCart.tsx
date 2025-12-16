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
    <div className="w-full border-2 rounded-2xl p-4 relative shadow-lg hover:shadow-xl transition-all duration-300 bg-white group">
        {/* Featured Badge */}
        {pkg.isFeatured && (
            <div className="absolute -top-2 -left-2 bg-[#F27D31] text-white px-3 py-1 rounded-full text-xs font-bold">
                Featured
            </div>
        )}

        {/* Inactive Badge */}
        {!pkg.isActive && (
            <div className="absolute -top-2 -left-2 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                Inactive
            </div>
        )}

        {/* Package Images */}
        {pkg.imageUrl && pkg.imageUrl.length > 0 && (
            <div className="w-full h-32 mb-3 rounded-lg overflow-hidden relative">
                <ImageWithSkeleton
                    src={pkg.imageUrl[0]}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                />
                {pkg.imageUrl.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                        +{pkg.imageUrl.length - 1} more
                    </div>
                )}
            </div>
        )}

        {/* Package Content */}
        <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">{pkg.title}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{pkg.description}</p>

            {renderStars(pkg.rating || 0)}

            <div className="mt-3 space-y-1">
                <p className="text-2xl font-bold text-[#125BAC]">${pkg.price}</p>
                {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                    <p className="text-sm text-gray-500 line-through">৳{pkg.originalPrice}</p>
                )}
                <p className="text-xs text-gray-400 capitalize">{pkg.category}</p>
            </div>

            {/* Features */}
            {pkg.features && pkg.features.length > 0 && (
                <div className="mt-3 text-left">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Features:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                        {pkg.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="line-clamp-1">• {feature}</li>
                        ))}
                        {pkg.features.length > 3 && (
                            <li className="text-gray-400">+{pkg.features.length - 3} more</li>
                        )}
                    </ul>
                </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
                onClick={() => onToggleFeatured(pkg)}
                className={`p-2 h-8 w-8 rounded ${
                    pkg.isFeatured
                        ? "bg-[#F27D31] hover:bg-[#e06d21]"
                        : "bg-gray-500 hover:bg-gray-600"
                } text-white transition-colors`}
                title={pkg.isFeatured ? "Remove from featured" : "Mark as featured"}
            >
                <Star size={14} fill={pkg.isFeatured ? "white" : "none"} />
            </button>
            <button
                onClick={() => onEdit(pkg)}
                className="bg-[#125BAC] hover:bg-[#0d4793] text-white p-2 h-8 w-8 rounded transition-colors"
                title="Edit package"
            >
                <Edit size={14} />
            </button>
            <button
                onClick={() => onDelete(pkg._id)}
                className="bg-red-600 hover:bg-red-700 text-white p-2 h-8 w-8 rounded transition-colors"
                title="Delete package"
            >
                <Trash2 size={14} />
            </button>
        </div>
    </div>
));

PackageCard.displayName = 'PackageCard';

export default PackageCard;