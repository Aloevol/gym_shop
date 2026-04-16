"use client";

import React from "react";
import Image from "next/image";
import { Check, Trash2, Plus, Minus } from "lucide-react";

// Define proper interfaces instead of using 'any'
interface ProductData {
    _id: string;
    title: string;
    price: number;
    images: string[];
    description: string;
    stock: number;
}

interface PackageData {
    _id: string;
    title: string;
    price: number;
    imageUrl: string[];
    description: string;
}

interface CartItemData {
    data: ProductData | PackageData;
    image: string;
    type: "product" | "package";
    maxStock?: number;
}

interface CartItemProps {
    item: {
        _id: string;
        product?: ProductData;
        package?: PackageData;
        quantity: number;
        isActive: boolean;
    };
    getItemData: (item: any) => CartItemData | null;
    isItemSelected: (id: string) => boolean;
    toggleSelection: (id: string) => void;
    isItemUpdating: (id: string) => boolean;
    handleQuantityChange: (itemId: string, newQuantity: number) => Promise<void>;
    handleRemoveItem?: (itemId: string) => Promise<void>;
    quantity: number;
    totalPrice: number;
    updateQuantityLocal: (itemId: string, newQuantity: number) => void;
}

function CartItem({
                      item,
                      getItemData,
                      isItemSelected,
                      toggleSelection,
                      isItemUpdating,
                      handleQuantityChange,
                      handleRemoveItem,
                      quantity,
                      totalPrice,
                      updateQuantityLocal
                  }: CartItemProps) {
    const itemData = getItemData(item);
    const selected = isItemSelected(item._id);
    const isUpdating = isItemUpdating(item._id);

    // Handle quick quantity changes with optimistic updates
    const handleQuickQuantityChange = async (change: number) => {
        if (!itemData?.data?.price) return;

        const newQuantity = quantity + change;
        const maxQuantity = itemData.maxStock || 999;

        // Validate quantity bounds
        if (newQuantity < 1 || newQuantity > maxQuantity) return;

        // Optimistic update - update local state immediately
        updateQuantityLocal(item._id, newQuantity);

        // Then update on server
        try {
            await handleQuantityChange(item._id, newQuantity);
        } catch (error) {
            // Revert on error - parent will handle this through the original quantity
            console.error("Failed to update quantity:", error);
        }
    };

    // Handle increment
    const handleIncrement = () => handleQuickQuantityChange(1);

    // Handle decrement
    const handleDecrement = () => handleQuickQuantityChange(-1);

    // Handle remove item
    const handleRemove = async () => {
        if (handleRemoveItem) {
            await handleRemoveItem(item._id);
        }
    };

    // Early return if no item data
    if (!itemData || !itemData.data) {
        return (
            <div className="border rounded-2xl p-6 flex items-center justify-center">
                <div className="text-gray-500">Loading item...</div>
            </div>
        );
    }

    const isDisabled = isUpdating;
    const maxQuantity = itemData.maxStock || 999;
    const canIncrement = quantity < maxQuantity;
    const canDecrement = quantity > 1;
    const unitPrice = itemData.data.price || 0;

    return (
        <div
            className={`relative border rounded-3xl p-6 flex flex-col md:flex-row gap-8 items-center transition-all duration-500 ${
                selected ? "border-primary bg-primary/5 shadow-xl shadow-primary/5" : "border-white/10 bg-white/5 hover:border-white/20"
            } ${isDisabled ? "opacity-20 cursor-not-allowed" : ""}`}
        >
            {/* Selection Checkbox */}
            <div
                className={`absolute top-6 right-6 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                    selected
                        ? "bg-primary border-primary"
                        : "border-white/20 bg-black"
                } ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                onClick={() => !isDisabled && toggleSelection(item._id)}
            >
                {selected && <Check className="text-black w-4 h-4" strokeWidth={4} />}
            </div>

            {/* Item Image */}
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-black/40 border border-white/5 flex-shrink-0 group">
                <Image
                    src={itemData.image}
                    alt={itemData.data.title || "Product image"}
                    fill
                    className="object-contain p-4 transition-transform duration-700 group-hover:scale-110"
                />
            </div>

            {/* Item Info */}
            <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col gap-4">
                    <div className="flex-1">
                        <h2 className="font-custom font-bold text-white text-xl uppercase tracking-widest mb-2">
                            {itemData.data.title || "Untitled Product"}
                        </h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                            {itemData.type === "product" ? "Product" : "Performance Package"}
                        </p>

                        {/* Price Information */}
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <p className="text-2xl font-black text-white">
                                ৳ {totalPrice.toLocaleString()}
                            </p>
                            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
                                (৳ {unitPrice.toLocaleString()} × {quantity})
                            </p>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-black/40 border border-white/10 rounded-full px-2 py-1">
                            <button
                                onClick={handleDecrement}
                                disabled={isDisabled || !canDecrement}
                                className="p-2 text-white hover:text-primary transition disabled:opacity-20"
                            >
                                <Minus size={18} />
                            </button>
                            
                            <div className="relative">
                                <input
                                    type="number"
                                    value={quantity}
                                    readOnly
                                    className="w-12 bg-transparent text-center font-bold text-white focus:outline-none"
                                />
                                {isUpdating && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded">
                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleIncrement}
                                disabled={isDisabled || !canIncrement}
                                className="p-2 text-white hover:text-primary transition disabled:opacity-20"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* Remove Action */}
                        <button
                            onClick={handleRemove}
                            disabled={isDisabled}
                            className="text-[10px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-[0.2em] transition-all flex items-center gap-2"
                        >
                            <Trash2 size={14} />
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

}

export default CartItem;