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
            if (!cookie) {
                toast.error("Please login to add items to cart");
                router.push("/auth/signin");
                return;
            }

            const user = JSON.parse(cookie);
            const response = await addToCart({
                userId: user._id,
                productId: id,
            });

            if (response.isError) {
                toast.error(response.message);
            } else {
                toast.success("Added to cart successfully!");
                // Optionally refresh the page or update cart count in navbar
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

        try {
            const cookie = await getCookie("user");
            if (!cookie) {
                toast.error("Please login to buy items");
                router.push("/auth/signin");
                return;
            }

            const user = JSON.parse(cookie);
            const response = await addToCart({
                userId: user._id,
                productId: id,
            });

            // Even if it's already in cart, we want to go to cart page
            router.push("/cart");
        } catch (error) {
            console.error("Error in buy now:", error);
            router.push("/cart");
        }
    };

    return (
        <div className="w-full bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col relative transition-all duration-300 hover:shadow-md group">
            {/* Discount Badge */}
            {discount > 0 && (
                <div className="absolute top-2 left-2 bg-[#F27D31] text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full flex items-center justify-center z-10 shadow-sm">
                    -{discount}% OFF
                </div>
            )}

            {/* Inactive Badge */}
            {!isActive && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full z-10 shadow-sm">
                    Out of Stock
                </div>
            )}

            {/* Image Section */}
            <Link href={forwardUrl} className="relative w-full aspect-square overflow-hidden bg-gray-50">
                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                />
            </Link>

            {/* Product Info */}
            <div className="flex flex-col p-3 flex-grow">
                <div className="mb-1">
                    <h3 className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{category}</h3>
                    <Link href={forwardUrl}>
                        <h1 className="text-sm sm:text-base font-bold text-gray-800 line-clamp-2 hover:text-[#F27D31] transition-colors min-h-[40px] leading-tight">
                            {name}
                        </h1>
                    </Link>
                </div>

                {/* Brand and Rating */}
                <div className="flex items-center justify-between mt-1">
                    {brand && (
                        <span className="text-[10px] text-gray-500 font-medium">
                            {brand}
                        </span>
                    )}
                    <div className="flex items-center gap-0.5">
                        <Star size={12} className={`${rating > 0 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                        <span className="text-[10px] text-gray-600 font-bold">{rating > 0 ? rating : "N/A"}</span>
                    </div>
                </div>

                {/* Price */}
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-[#125BAC] flex items-center">
                        <TbCurrencyTaka size={20} />
                        {priceAfterDiscount}
                    </span>
                    {discount > 0 && (
                        <span className="text-xs text-gray-400 line-through flex items-center font-medium">
                            <TbCurrencyTaka size={14} />
                            {price}
                        </span>
                    )}
                </div>

                {/* Quantity & Actions */}
                <div className="mt-4 space-y-2">
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 ml-2 uppercase">Qty</span>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => handleQuantity("dec")}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:border-[#F27D31] hover:text-[#F27D31] transition-colors"
                                disabled={!isActive}
                            >
                                <Minus size={14} />
                            </button>
                            <span className="text-sm font-bold w-4 text-center">{quantity}</span>
                            <button 
                                onClick={() => handleQuantity("inc")}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:border-[#F27D31] hover:text-[#F27D31] transition-colors"
                                disabled={!isActive}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={handleAddToCart}
                            disabled={!isActive || isAdding}
                            className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                                isActive 
                                ? "bg-white border-2 border-[#125BAC] text-[#125BAC] hover:bg-[#125BAC] hover:text-white" 
                                : "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 border-2"
                            }`}
                        >
                            <ShoppingCart size={14} />
                            {isAdding ? "..." : "ADD TO CART"}
                        </button>
                        <button
                            onClick={handleBuyNow}
                            disabled={!isActive}
                            className={`flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                                isActive 
                                ? "bg-[#F27D31] text-white hover:bg-[#e56f28] shadow-sm shadow-[#F27D31]/20" 
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                        >
                            <Zap size={14} className="fill-current" />
                            BUY NOW
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductCart;