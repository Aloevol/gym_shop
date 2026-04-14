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

interface ProductCartProps {
    id: unknown;
    name?: string;
    category?: string;
    price?: number;
    discount?: number;
    priceAfterDiscount?: number;
    image: string;
    forwardUrl?: string;
    rating?: number;
    brand?: string;
    isActive?: boolean;
}

function ProductCart({
    id,
    forwardUrl = `/product/${id}`,
    name = "Product Name",
    category = "Category",
    price = 100,
    discount = 20,
    priceAfterDiscount = price - price * (discount / 100),
    image,
    rating = 0,
    brand,
    isActive = true,
}: ProductCartProps) {
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const router = useRouter();

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
                const existingItemIndex = guestCart.findIndex((item: any) => item.id === id && item.type === "product");

                if (existingItemIndex > -1) {
                    guestCart[existingItemIndex].quantity += 1;
                } else {
                    guestCart.push({
                        id,
                        type: "product",
                        quantity: 1,
                        // Store minimal data for immediate UI feedback
                        name,
                        price: priceAfterDiscount,
                        image,
                        category
                    });
                }

                localStorage.setItem("gym-shop-cart", JSON.stringify(guestCart));
                toast.success("Added to guest cart!");
                window.dispatchEvent(new Event("cart-updated")); // Notify navbar
                return;
            }

            // IF LOGGED IN USER
            const user = JSON.parse(cookie);
            const response = await addToCart({
                userId: user._id,
                productId: id,
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

        // Simplified for "Buy Now" - just open the modal directly or go to cart
        // We'll redirect to product page first to ensure full data or just trigger checkout
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

            {/* Image Section */}
            <Link href={forwardUrl} className="relative w-full aspect-square overflow-hidden bg-white/5 p-6">
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-contain p-4 transition-transform duration-700 group-hover:scale-110"
                />
            </Link>

            {/* Product Info */}
            <div className="flex flex-col p-5 flex-grow">
                <div className="mb-2">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-1">{category}</h3>
                    <Link href={forwardUrl}>
                        <h1 className="text-base font-bold text-white line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight">
                            {name}
                        </h1>
                    </Link>
                </div>

                {/* Brand and Rating */}
                <div className="flex items-center justify-between mb-4">
                    {brand && (
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                            {brand}
                        </span>
                    )}
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
}

export default ProductCart;