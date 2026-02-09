"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag, Truck, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/server/helper/jwt.helper";
import { getCartItems, removeFromCart, updateCartQuantity } from "@/server/functions/cart.fun";
import { IProduct } from "@/server/models/product/product.interface";
import { IPackage } from "@/server/models/package/package.interface";
import imageUrl from "@/const/imageUrl";
import CartItem from "@/components/card/CartItem";
import OrderModal from "@/components/modal/OrderModal";
import { removeCartItemsAfterOrder } from "@/server/functions/order.fun";

// Unified cart item type
interface CartItemType {
    _id: string;
    product?: IProduct & { _id: unknown };
    package?: IPackage & { _id: unknown };
    quantity: number;
    isActive: boolean;
}

// Cart state interface
interface CartState {
    items: CartItemType[];
    selectedItems: string[];
    loading: boolean;
    updatingItems: string[];
    summary: {
        subtotal: number;
        shipping: number;
        total: number;
        selectedCount: number;
    };
}

// Item quantity state interface
interface ItemQuantityState {
    [itemId: string]: {
        quantity: number;
        totalPrice: number;
    };
}

// Delivery areas and prices
interface DeliveryArea {
    name: string;
    price: number;
    deliveryTime: string;
    districts: string[];
}

const DELIVERY_AREAS: DeliveryArea[] = [
    {
        name: "Dhaka Metropolitan",
        price: 60,
        deliveryTime: "1-2 days",
        districts: ["Dhaka", "Gazipur", "Narayanganj", "Savar"]
    },
    {
        name: "Dhaka Suburbs",
        price: 80,
        deliveryTime: "2-3 days",
        districts: ["Tangail", "Manikganj", "Munshiganj", "Narsingdi"]
    },
    {
        name: "Chittagong City",
        price: 100,
        deliveryTime: "2-3 days",
        districts: ["Chittagong", "Cox's Bazar"]
    },
    {
        name: "Other Divisional Cities",
        price: 120,
        deliveryTime: "3-4 days",
        districts: ["Rajshahi", "Khulna", "Sylhet", "Barisal", "Rangpur", "Mymensingh"]
    },
    {
        name: "District Areas",
        price: 150,
        deliveryTime: "4-5 days",
        districts: ["Comilla", "Noakhali", "Jessore", "Bogra", "Dinajpur"]
    },
    {
        name: "Remote Areas",
        price: 200,
        deliveryTime: "5-7 days",
        districts: ["Bandarban", "Rangamati", "Khagrachari", "Patuakhali", "Bagerhat"]
    }
];

// Define proper types for the helper function
interface MongoObject {
    _id?: { toString?: () => string; buffer?: unknown };
    [key: string]: unknown;
}

// Helper function to convert MongoDB objects to plain objects
const convertToPlainObject = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    // Handle Date objects
    if (obj instanceof Date) return obj.toISOString();

    const mongoObj = obj as MongoObject;

    // Handle MongoDB ObjectId - comprehensive check
    if (mongoObj._id && typeof mongoObj._id === 'object') {
        // Convert ObjectId to string
        const convertedObj: Record<string, unknown> = {};
        for (const key in mongoObj) {
            if (Object.prototype.hasOwnProperty.call(mongoObj, key) && !key.startsWith('$')) {
                const value = mongoObj[key];
                if (key === '_id' && mongoObj._id?.toString) {
                    convertedObj[key] = mongoObj._id.toString();
                } else if (typeof value === 'object' && value !== null && 'toString' in value && 'buffer' in value) {
                    // Handle nested ObjectIds
                    convertedObj[key] = (value as { toString: () => string }).toString();
                } else {
                    convertedObj[key] = convertToPlainObject(value);
                }
            }
        }
        return convertedObj;
    }

    // Handle arrays
    if (Array.isArray(mongoObj)) {
        return mongoObj.map(item => convertToPlainObject(item));
    }

    // Handle regular objects
    const plainObj: Record<string, unknown> = {};
    for (const key in mongoObj) {
        if (Object.prototype.hasOwnProperty.call(mongoObj, key) && !key.startsWith('$')) {
            // Skip Mongoose internal properties
            if (!['__v', '$__', '$isNew', '$errors', '$locals'].includes(key)) {
                plainObj[key] = convertToPlainObject(mongoObj[key]);
            }
        }
    }

    return plainObj;
};

function CartPage() {
    const router = useRouter();

    // Initial state
    const initialState: CartState = {
        items: [],
        selectedItems: [],
        loading: true,
        updatingItems: [],
        summary: {
            subtotal: 0,
            shipping: 0,
            total: 0,
            selectedCount: 0
        }
    };

    const [cartState, setCartState] = useState<CartState>(initialState);
    const [itemQuantities, setItemQuantities] = useState<ItemQuantityState>({});
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedDeliveryArea, setSelectedDeliveryArea] = useState<DeliveryArea>(DELIVERY_AREAS[0]);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [userId, setUserId] = useState("");

    // Get all unique districts from all delivery areas
    const allDistricts = DELIVERY_AREAS.flatMap(area => area.districts);
    const uniqueDistricts = [...new Set(allDistricts)].sort();

    useEffect(() => {
        if (cartState.items.length > 0) {
            const initialQuantities: ItemQuantityState = {};
            cartState.items.forEach(item => {
                const itemData = getItemData(item);
                const price = itemData?.data?.price || 0;
                const quantity = item.quantity || 1;
                initialQuantities[item._id] = {
                    quantity: quantity,
                    totalPrice: price * quantity
                };
            });
            setItemQuantities(initialQuantities);
        }
    }, [cartState.items]);

    // Calculate cart summary with dynamic shipping
    const calculateSummary = useCallback(() => {
        const selectedCartItems = cartState.items.filter(item =>
            cartState.selectedItems.includes(item._id)
        );

        const subtotal = selectedCartItems.reduce((sum, item) => {
            const itemQuantity = itemQuantities[item._id]?.quantity || item.quantity || 1;
            const itemData = cartState.items.find(i => i._id === item._id);
            const price = itemData?.product?.price || itemData?.package?.price || 0;
            return sum + (price * itemQuantity);
        }, 0);

        // Calculate shipping only if district is selected
        const shipping = selectedDistrict 
            ? (subtotal > 2000 ? 0 : selectedDeliveryArea.price) 
            : 0;
            
        // Calculate tax (5%)
        const tax = subtotal * 0.05;
        const total = subtotal + shipping + tax;
        const selectedCount = selectedCartItems.length;

        setCartState(prev => ({
            ...prev,
            summary: { subtotal, shipping, total, selectedCount }
        }));
    }, [cartState.items, cartState.selectedItems, itemQuantities, selectedDeliveryArea, selectedDistrict]);

    useEffect(() => {
        calculateSummary();
    }, [calculateSummary]);

    // Get delivery area based on selected district
    const getDeliveryAreaForDistrict = (district: string): DeliveryArea => {
        const area = DELIVERY_AREAS.find(area =>
            area.districts.includes(district)
        );
        return area || DELIVERY_AREAS[0]; // Default to first area if not found
    };

    // Update delivery area when district changes
    useEffect(() => {
        if (selectedDistrict) {
            const area = getDeliveryAreaForDistrict(selectedDistrict);
            setSelectedDeliveryArea(area);
        }
    }, [selectedDistrict]);

    // Get user info on component mount
    useEffect(() => {
        const getUserInfo = async () => {
            const cookie = await getCookie("user");
            if (cookie) {
                const userCookie = JSON.parse(cookie);
                setUserId(userCookie._id);
            }
        };
        getUserInfo();
    }, []);

    // Update specific state properties
    const updateCartState = (updates: Partial<CartState>) => {
        setCartState(prev => ({ ...prev, ...updates }));
    };

    const fetchCartItems = useCallback(async () => {
        try {
            updateCartState({ loading: true });

            const cookie = await getCookie("user");
            if (!cookie) {
                toast.error("Please login to view your cart");
                router.push("/auth/signin");
                return;
            }

            const userCookie = JSON.parse(cookie);
            setUserId(userCookie._id);

            const response = await getCartItems({ userId: userCookie._id });

            if (response.isError) {
                toast.error(response.message);
                return;
            }

            if (response.data) {
                // Use JSON methods to ensure plain objects
                const plainItems = JSON.parse(JSON.stringify(response.data)) as CartItemType[];

                updateCartState({
                    items: plainItems,
                    selectedItems: []
                });
            }
        } catch (error) {
            console.error("Error fetching cart items:", error);
            toast.error("Failed to load cart items");
        } finally {
            updateCartState({ loading: false });
        }
    }, [router]);

    // Remove item from cart
    const handleRemoveItem = async (itemId: string) => {
        try {
            updateCartState({
                updatingItems: [...cartState.updatingItems, itemId]
            });

            const response = await removeFromCart({ cartId: itemId });

            if (response.isError) {
                toast.error(response.message);
                return;
            }

            toast.success("Item removed from cart");

            // Remove from local state
            updateCartState({
                items: cartState.items.filter(item => item._id !== itemId),
                selectedItems: cartState.selectedItems.filter(id => id !== itemId)
            });

            // Remove from quantities state
            setItemQuantities(prev => {
                const newQuantities = { ...prev };
                delete newQuantities[itemId];
                return newQuantities;
            });

        } catch (error) {
            console.error("Error removing item:", error);
            toast.error("Failed to remove item");
        } finally {
            updateCartState({
                updatingItems: cartState.updatingItems.filter(id => id !== itemId)
            });
        }
    };

    // Update quantity
    const handleQuantityChange = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            updateCartState({
                updatingItems: [...cartState.updatingItems, itemId]
            });

            const response = await updateCartQuantity({
                cartId: itemId,
                quantity: newQuantity
            });

            if (response.isError) {
                toast.error(response.message);
                return;
            }

            // Update local quantities state
            const item = cartState.items.find(item => item._id === itemId);
            if (item) {
                const itemData = getItemData(item);
                const price = itemData?.data?.price || 0;

                setItemQuantities(prev => ({
                    ...prev,
                    [itemId]: {
                        quantity: newQuantity,
                        totalPrice: price * newQuantity
                    }
                }));
            }

            // Also update the main cart state
            updateCartState({
                items: cartState.items.map(item =>
                    item._id === itemId ? { ...item, quantity: newQuantity } : item
                )
            });

        } catch (error) {
            console.error("Error updating quantity:", error);
            toast.error("Failed to update quantity");
        } finally {
            updateCartState({
                updatingItems: cartState.updatingItems.filter(id => id !== itemId)
            });
        }
    };

    // Update quantity locally (for immediate UI updates)
    const updateQuantityLocal = (itemId: string, newQuantity: number) => {
        const item = cartState.items.find(item => item._id === itemId);
        if (!item) return;

        const itemData = getItemData(item);
        const price = itemData?.data?.price || 0;
        const maxQuantity = itemData?.maxStock || 999;

        // Validate quantity bounds
        if (newQuantity < 1 || newQuantity > maxQuantity) return;

        setItemQuantities(prev => ({
            ...prev,
            [itemId]: {
                quantity: newQuantity,
                totalPrice: price * newQuantity
            }
        }));
    };

    // Toggle item selection
    const toggleSelection = (id: string) => {
        const newSelectedItems = cartState.selectedItems.includes(id)
            ? cartState.selectedItems.filter(item => item !== id)
            : [...cartState.selectedItems, id];

        updateCartState({ selectedItems: newSelectedItems });
    };

    // Select all items
    const selectAllItems = () => {
        const allSelected = cartState.selectedItems.length === cartState.items.length;

        updateCartState({
            selectedItems: allSelected ? [] : cartState.items.map(item => item._id)
        });
    };

    // Check if all items are selected
    const isAllSelected = cartState.items.length > 0 &&
        cartState.selectedItems.length === cartState.items.length;

    // Check if an item is selected
    const isItemSelected = (id: string) => cartState.selectedItems.includes(id);

    // Check if an item is being updated
    const isItemUpdating = (id: string) => cartState.updatingItems.includes(id);

    // Get item data with proper typing and convert to plain objects
    const getItemData = (item: CartItemType) => {
        if (item.product) {
            const plainProduct = convertToPlainObject(item.product) as IProduct;
            return {
                type: "product" as const,
                data: plainProduct,
                image: plainProduct.images?.[0] || imageUrl.packageImage.image1,
                maxStock: plainProduct.stock
            };
        } else if (item.package) {
            const plainPackage = convertToPlainObject(item.package) as IPackage;
            return {
                type: "package" as const,
                data: plainPackage,
                image: plainPackage.imageUrl?.[0] || imageUrl.packageImage.image1,
                maxStock: Infinity // Packages don't have stock limits
            };
        }
        return null;
    };

    // Get item quantity and total price from state
    const getItemQuantity = (itemId: string) => {
        return itemQuantities[itemId]?.quantity || cartState.items.find(item => item._id === itemId)?.quantity || 0;
    };

    const getItemTotalPrice = (itemId: string) => {
        return itemQuantities[itemId]?.totalPrice || 0;
    };

    // Get selected items for order modal - ensure plain objects
    const getSelectedItemsForOrder = () => {
        return cartState.items
            .filter(item => cartState.selectedItems.includes(item._id))
            .map(item => {
                const itemData = getItemData(item);
                const quantity = getItemQuantity(item._id) || item.quantity || 1;

                if (!itemData) return null;

                // Simple and safe conversion using String()
                const productId = item.product?._id ? String(item.product._id) : undefined;
                const packageId = item.package?._id ? String(item.package._id) : undefined;

                return {
                    product: productId,
                    package: packageId,
                    quantity: quantity,
                    price: itemData.data.price as number,
                    title: itemData.data.title as string,
                    image: itemData.image as string,
                    type: itemData.type
                };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    };

    // Checkout handler - opens order modal
    const handleCheckout = () => {
        if (cartState.summary.selectedCount === 0) {
            toast.error("Please select items to checkout");
            return;
        }

        if (!userId) {
            toast.error("Please login to proceed with checkout");
            router.push("/auth/signin");
            return;
        }

        if (!selectedDistrict) {
            toast.error("Please select your district to calculate delivery charge");
            return;
        }

        setIsOrderModalOpen(true);
    };

    // Continue shopping
    const handleContinueShopping = () => {
        router.push("/shop");
    };

    // Clear all selected items
    const clearSelection = () => {
        updateCartState({ selectedItems: [] });
    };

    // Handle successful order placement
    const handleOrderSuccess = async () => {
        try {
            // Show loading state
            updateCartState({ loading: true });

            // Remove ordered items from cart on server
            const removeResult = await removeCartItemsAfterOrder({
                userId: userId,
                itemIds: cartState.selectedItems
            });

            if (removeResult.success) {
                // Remove from local state
                const remainingItems = cartState.items.filter(
                    item => !cartState.selectedItems.includes(item._id)
                );

                updateCartState({
                    items: remainingItems,
                    selectedItems: [],
                    loading: false
                });

                setIsOrderModalOpen(false);

                // Show success message
                toast.success(`🎉 Order created successfully! ${removeResult.deletedCount} items removed from cart.`);

                // Refresh cart items to get updated data
                await fetchCartItems();
            } else {
                toast.error("Failed to remove items from cart. Please try again.");
                updateCartState({ loading: false });
            }

        } catch (error) {
            console.error("Error in order success handler:", error);
            toast.error("Something went wrong. Please check your cart.");
            updateCartState({ loading: false });
        }
    };

    // Load cart items on component mount
    useEffect(() => {
        fetchCartItems();
    }, [fetchCartItems]);

    if (cartState.loading) {
        return (
            <section className="w-full min-h-screen bg-white py-16 px-6 md:px-12 lg:px-20">
                <div className="w-full max-w-6xl mx-auto flex items-center justify-center">
                    <div className="text-center">
                        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">Loading your cart...</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full min-h-screen bg-white py-16 px-6 md:px-12 lg:px-20">
            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-gray-800 mb-3">Your Cart</h1>
                <p className="text-gray-600">
                    Select one or more products to proceed with your purchase.
                </p>
            </div>

            {cartState.items.length === 0 ? (
                <div className="w-full max-w-6xl mx-auto text-center py-20">
                    <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your cart is empty</h2>
                    <p className="text-gray-600 mb-8">Add some products to get started!</p>
                    <button
                        onClick={handleContinueShopping}
                        className="bg-[#F27D31] text-white font-semibold py-3 px-8 rounded-full hover:bg-[#e66d1f] transition-all"
                    >
                        Continue Shopping
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
                    {/* Product List */}
                    <div className="flex-1">
                        {/* Select All Header */}
                        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                        isAllSelected
                                            ? "bg-[#F27D31] border-[#F27D31]"
                                            : "border-gray-300 bg-white"
                                    }`}
                                    onClick={selectAllItems}
                                >
                                    {isAllSelected && <Check className="text-white w-4 h-4" />}
                                </div>
                                <span className="text-gray-700 font-medium">
                                    Select all items ({cartState.items.length})
                                </span>
                            </div>
                            {cartState.selectedItems.length > 0 && (
                                <button
                                    onClick={clearSelection}
                                    className="text-sm text-[#F27D31] hover:text-[#e66d1f] transition-all"
                                >
                                    Clear selection
                                </button>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="space-y-6">
                            {cartState.items.map((item) => (
                                <CartItem
                                    key={item._id}
                                    item={item}
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    getItemData={getItemData}
                                    isItemSelected={isItemSelected}
                                    toggleSelection={toggleSelection}
                                    isItemUpdating={isItemUpdating}
                                    handleQuantityChange={handleQuantityChange}
                                    handleRemoveItem={handleRemoveItem}
                                    quantity={getItemQuantity(item._id)}
                                    totalPrice={getItemTotalPrice(item._id)}
                                    updateQuantityLocal={updateQuantityLocal}
                                />
                            ))}
                        </div>

                        {/* Cart Actions */}
                        {cartState.items.length > 0 && (
                            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-gray-600 text-sm">
                                    <span className="font-medium">{cartState.items.length}</span> items in cart
                                    {cartState.selectedItems.length > 0 && (
                                        <span className="text-[#F27D31] ml-2">
                                            ({cartState.selectedItems.length} selected)
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={handleContinueShopping}
                                    className="text-[#F27D31] font-semibold hover:text-[#e66d1f] transition-all"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="w-full lg:w-96 bg-gray-50 p-6 rounded-2xl shadow-md h-fit sticky top-20">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                            Order Summary
                        </h2>

                        {cartState.summary.selectedCount > 0 ? (
                            <>
                                {/* Location Selection */}
                                <div className="mb-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <MapPin className="w-4 h-4 inline mr-1" />
                                            Select Your District
                                        </label>
                                        <select
                                            value={selectedDistrict}
                                            onChange={(e) => setSelectedDistrict(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31] text-sm"
                                            required
                                        >
                                            <option value="">Choose your district</option>
                                            {uniqueDistricts.map((district) => (
                                                <option key={district} value={district}>
                                                    {district}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Delivery Information */}
                                    {selectedDistrict && (
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                            <div className="flex items-center justify-between text-sm">
                                                <div>
                                                    <Truck className="w-4 h-4 inline mr-1 text-blue-600" />
                                                    <span className="font-medium text-blue-800">
                                                        {selectedDeliveryArea.name}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold text-blue-800">
                                                        ৳ {selectedDeliveryArea.price}
                                                    </div>
                                                    <div className="text-blue-600 text-xs">
                                                        {selectedDeliveryArea.deliveryTime}
                                                    </div>
                                                </div>
                                            </div>
                                            {cartState.summary.subtotal > 2000 && (
                                                <div className="text-green-600 text-xs mt-1 font-medium">
                                                    🎉 Free shipping applied! (Order above ৳2,000)
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Items List */}
                                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                    {cartState.items
                                        .filter(item => isItemSelected(item._id))
                                        .map((item) => {
                                            const itemData = getItemData(item);
                                            if (!itemData) return null;

                                            const itemQuantity = getItemQuantity(item._id);
                                            const itemTotal = getItemTotalPrice(item._id);

                                            return (
                                                <div key={item._id} className="flex justify-between items-start text-gray-700 text-sm pb-2 border-b border-gray-200">
                                                    <div className="flex-1">
                                                        <p className="font-medium truncate">{itemData.data.title}</p>
                                                        <p className="text-gray-500">
                                                            {itemQuantity} × ৳{itemData.data.price.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold whitespace-nowrap ml-2">
                                                        ৳ {itemTotal.toLocaleString()}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                </div>

                                <hr className="my-4" />

                                {/* Price Breakdown */}
                                <div className="space-y-3 text-gray-700">
                                    <div className="flex justify-between">
                                        <p>Subtotal ({cartState.summary.selectedCount} items)</p>
                                        <p>৳ {cartState.summary.subtotal.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between">
                                        <p>
                                            Shipping
                                            {selectedDistrict ? (selectedDeliveryArea.price === 0 || cartState.summary.subtotal > 2000 ? ' (Free)' : ` (${selectedDeliveryArea.deliveryTime})`) : ' (Select district)'}
                                        </p>
                                        <p>৳ {cartState.summary.shipping.toLocaleString()}</p>
                                    </div>
                                    <div className="flex justify-between">
                                        <p>Tax (5%)</p>
                                        <p>৳ {(cartState.summary.subtotal * 0.05).toLocaleString()}</p>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between font-semibold text-gray-800 text-lg">
                                        <p>Total</p>
                                        <p>৳ {cartState.summary.total.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Checkout Button */}
                                <button
                                    onClick={handleCheckout}
                                    disabled={!selectedDistrict}
                                    className="mt-6 w-full bg-[#F27D31] text-white font-semibold py-3 rounded-full hover:bg-[#e66d1f] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {!selectedDistrict ? (
                                        "Select District to Checkout"
                                    ) : (
                                        `Proceed to Checkout (${cartState.summary.selectedCount} items)`
                                    )}
                                </button>

                                {/* Security Notice */}
                                <div className="mt-4 text-center">
                                    <p className="text-xs text-gray-500">
                                        🔒 Secure checkout · Free returns
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">No items selected</p>
                                <p className="text-sm text-gray-500 mb-6">
                                    Select items from your cart to see the order summary and proceed to checkout.
                                </p>
                                <button
                                    onClick={handleContinueShopping}
                                    className="text-[#F27D31] font-semibold hover:text-[#e66d1f] transition-all"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Order Modal */}
            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onOrderSuccess={handleOrderSuccess}
                items={getSelectedItemsForOrder()}
                userId={userId}
                shippingInfo={{
                    provider: "Redx",
                    area: selectedDeliveryArea.name,
                    district: selectedDistrict,
                    cost: cartState.summary.shipping,
                    deliveryTime: selectedDeliveryArea.deliveryTime
                }}
                orderSummary={{
                    subtotal: cartState.summary.subtotal,
                    shipping: cartState.summary.shipping,
                    total: cartState.summary.total
                }}
            />
        </section>
    );
}

export default CartPage;