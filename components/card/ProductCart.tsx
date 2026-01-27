"use client";

import Image from "next/image";
import { TbCurrencyTaka } from "react-icons/tb";
import React from "react";
import Link from "next/link";
import { Star } from "lucide-react";

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
    return (
        <div className="w-full max-w-[280px] sm:max-w-[220px] md:max-w-[250px] lg:max-w-[300px] bg-white border border-gray-200 shadow-md rounded-md overflow-hidden flex flex-col relative transition-transform duration-300 hover:scale-[1.02]">
            {/* Discount Badge */}
            <div className="absolute top-2 left-2 bg-[#F27D31] text-white text-xs font-semibold w-[38px] h-[24px] rounded-full flex items-center justify-center z-10">
                -{discount}%
            </div>

            {/* Inactive Badge */}
            {!isActive && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full z-10">
                    Out of Stock
                </div>
            )}

            {/* Image Section */}
            <Link href={forwardUrl}>
                <div className="relative w-full aspect-[1/1.1] z-0">
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover rounded-t-md"
                    />
                </div>
            </Link>

            {/* Product Info */}
            <div className="flex flex-col items-center text-center p-3 flex-grow">
                <h1 className="text-sm sm:text-base font-semibold truncate w-full">
                    {name}
                </h1>

                {/* Brand and Category */}
                <div className="flex flex-col items-center gap-1 mt-1">
                    {brand && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                            {brand}
                        </span>
                    )}
                    <h3 className="text-xs sm:text-sm text-gray-500">{category}</h3>
                </div>

                {/* Rating Display */}
                {rating > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={14}
                                    className={`${
                                        star <= rating
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-300"
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-gray-600 ml-1">({rating}/5)</span>
                    </div>
                )}

                {/* No Rating Display */}
                {rating === 0 && (
                    <div className="flex items-center gap-1 mt-2">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={14}
                                    className="text-gray-300"
                                />
                            ))}
                        </div>
                        <span className="text-xs text-gray-400 ml-1">(No ratings)</span>
                    </div>
                )}

                {/* Price */}
                <h2 className="text-sm sm:text-base font-semibold mt-2 flex items-center">
                    <TbCurrencyTaka />
                    {priceAfterDiscount}
                    {" /"}
                    <span className="text-red-500 line-through text-xs sm:text-sm flex items-center ml-1">
                        <TbCurrencyTaka />
                        {price}
                    </span>
                </h2>
            </div>

            {/* Button */}
            <div className="p-3 pt-0">
                <Link href={forwardUrl} className="cursor-pointer">
                    <button
                        className={`w-full text-xs sm:text-sm py-2 rounded-md transition cursor-pointer active:scale-95 duration-100 ease-in ${
                            isActive
                                ? "bg-black text-white hover:bg-gray-800"
                                : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                        disabled={!isActive}
                    >
                        {isActive ? "View Details" : "Out of Stock"}
                    </button>
                </Link>
            </div>
        </div>
    );
}

export default ProductCart;