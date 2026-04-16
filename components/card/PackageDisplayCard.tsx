"use client";

import Image from "next/image";
import { TbCurrencyTaka } from "react-icons/tb";
import React, { useState } from "react";
import Link from "next/link";
import { Star, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { addToCart } from "@/server/functions/cart.fun";
import { getCookie } from "@/server/helper/jwt.helper";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { IPackage } from "@/server/models/package/package.interface";

interface PackageDisplayCardProps {
    pkg: IPackage;
}

const PackageDisplayCard = React.memo(({ pkg }: PackageDisplayCardProps) => {
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const router = useRouter();

    const id = pkg._id;
    const forwardUrl = `/package/${id}`;
    const name = pkg.title || "Package Name";
    const category = pkg.category || "Package";
    const price = pkg.originalPrice || pkg.price;
    const priceAfterDiscount = pkg.price;
    const discount = pkg.originalPrice && pkg.originalPrice > pkg.price 
        ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100) 
        : 0;
    const image = (Array.isArray(pkg.imageUrl) && pkg.imageUrl.length > 0) ? pkg.imageUrl[0] : "/placeholder.jpg";
    const rating = pkg.rating || 5;
    const isActive = pkg.isActive;

    const handleQuantity = (type: "inc" | "dec") => {
        if (type === "inc") {
            setQuantity((prev) => prev + 1);
        } else {
            setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
        }
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isActive) return;

        setIsAdding(true);
        try {
            const cookie = await getCookie("user");

            // IF GUEST USER
            if (!cookie) {
                const guestCart = JSON.parse(localStorage.getItem("gym-shop-cart") || "[]");
                const existingItemIndex = guestCart.findIndex((item: any) => item.id === id && item.type === "package");

                if (existingItemIndex > -1) {
                    guestCart[existingItemIndex].quantity += 1;
                } else {
                    guestCart.push({
                        id,
                        type: "package",
                        quantity: 1,
                        name,
                        price: priceAfterDiscount,
                        image,
                        category
                    });
                }

                localStorage.setItem("gym-shop-cart", JSON.stringify(guestCart));
                toast.success("Added to guest cart!");
                window.dispatchEvent(new Event("cart-updated"));
                return;
            }

            // IF LOGGED IN USER
            const user = JSON.parse(cookie);
            const response = await addToCart({
                userId: user._id,
                packageId: id,
            });

            if (response.isError) {
                toast.error(response.message);
            } else {
                toast.success("Added to cart successfully!");
                window.dispatchEvent(new Event("cart-updated"));
                router.refresh();
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            toast.error("Failed to add to cart");
        } finally {
            setIsAdding(false);
        }
    };

    const handleBuyNow = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isActive) return;

        router.push(forwardUrl + "?checkout=true");
    };

    return (
        <div className="w-full bg-white/5 border border-white/10 shadow-xl rounded-2xl overflow-hidden flex flex-col relative transition-all duration-500 hover:border-primary/30 group">
            {/* Discount Badge */}
            {discount > 0 && (
                <div className="absolute top-4 left-4 bg-primary text-black text-[10px] font-bold px-3 py-1 rounded-full z-10 shadow-lg uppercase tracking-wider">
                    -{discount}%
                </div>
            )}

            {/* Inactive Badge */}
            {!isActive && (
                <div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 uppercase tracking-wider">
                    Sold Out
                </div>
            )}

            {/* Featured Badge */}
            {pkg.isFeatured && isActive && (
                <div className="absolute top-4 right-4 bg-primary/20 backdrop-blur-md text-primary text-[10px] font-bold px-3 py-1 rounded-full z-10 border border-primary/30 uppercase tracking-wider">
                    Featured
                </div>
            )}

            {/* Image Section */}
            <Link href={forwardUrl} className="relative w-full aspect-square overflow-hidden bg-white/5 p-6">
                <Image
                    src={image}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
            </Link>

            {/* Package Info */}
            <div className="flex flex-col p-5 flex-grow">
                <div className="mb-2">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-1">{category}</h3>
                    <Link href={forwardUrl}>
                        <h1 className="text-base font-bold text-white line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight">
                            {name}
                        </h1>
                    </Link>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                        <Star size={10} className={`${rating > 0 ? "text-primary fill-primary" : "text-white/20"}`} />
                        <span className="text-[10px] text-white/60 font-bold">{rating > 0 ? rating : "0"}</span>
                    </div>
                </div>

                {/* Price */}
                <div className="mt-auto flex items-center gap-3">
                    <span className="text-xl font-black text-white flex items-center">
                        <TbCurrencyTaka size={22} className="text-primary" />
                        {priceAfterDiscount}
                    </span>
                    {discount > 0 && (
                        <span className="text-sm text-white/30 line-through flex items-center font-bold">
                            <TbCurrencyTaka size={16} />
                            {price}
                        </span>
                    )}
                </div>

                {/* Features (Mini List) */}
                {pkg.features && pkg.features.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {pkg.features.slice(0, 2).map((feature, i) => (
                            <span key={i} className="text-[9px] text-white/40 font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5">
                                • {feature}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-2">
                    <button
                        onClick={handleAddToCart}
                        disabled={!isActive || isAdding}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-bold tracking-[0.1em] transition-all uppercase ${
                            isActive 
                            ? "bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black" 
                            : "bg-white/5 text-white/20 cursor-not-allowed border-white/5"
                        }`}
                    >
                        <ShoppingCart size={14} />
                        {isAdding ? "Adding..." : "Add to Cart"}
                    </button>
                    <button
                        onClick={handleBuyNow}
                        disabled={!isActive}
                        className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-bold tracking-[0.1em] transition-all uppercase ${
                            isActive 
                            ? "bg-primary text-black hover:bg-white" 
                            : "bg-white/5 text-white/20 cursor-not-allowed"
                        }`}
                    >
                        <Zap size={14} className="fill-current" />
                        Buy It Now
                    </button>
                </div>
            </div>
        </div>
    );
});

PackageDisplayCard.displayName = 'PackageDisplayCard';

export default PackageDisplayCard;