"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag, MapPin } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/server/helper/jwt.helper";
import { getCartItems, removeFromCart, updateCartQuantity } from "@/server/functions/cart.fun";
import { IProduct } from "@/server/models/product/product.interface";
import { IPackage } from "@/server/models/package/package.interface";
import imageUrl from "@/const/imageUrl";
import CartItem from "@/components/card/CartItem";
import OrderModal from "@/components/modal/OrderModal";
import { removeCartItemsAfterOrder } from "@/server/functions/order.fun";
import { calculateOrderTotals, getAllDistricts, getDeliveryAreaForDistrict } from "@/lib/delivery";
import type { DeliveryArea } from "@/lib/delivery";

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
}

// Item quantity state interface
interface ItemQuantityState {
    [itemId: string]: {
        quantity: number;
        totalPrice: number;
    };
}

// Helper function to convert MongoDB objects to plain objects
const convertToPlainObject = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj.toISOString();
    
    const mongoObj = obj as any;
    if (mongoObj._id && typeof mongoObj._id === 'object') {
        const convertedObj: Record<string, unknown> = {};
        for (const key in mongoObj) {
            if (Object.prototype.hasOwnProperty.call(mongoObj, key) && !key.startsWith('$')) {
                const value = mongoObj[key];
                if (key === '_id' && mongoObj._id?.toString) {
                    convertedObj[key] = mongoObj._id.toString();
                } else {
                    convertedObj[key] = convertToPlainObject(value);
                }
            }
        }
        return convertedObj;
    }

    if (Array.isArray(mongoObj)) return mongoObj.map(item => convertToPlainObject(item));

    const plainObj: Record<string, unknown> = {};
    for (const key in mongoObj) {
        if (Object.prototype.hasOwnProperty.call(mongoObj, key) && !key.startsWith('$')) {
            if (!['__v', '$__', '$isNew', '$errors', '$locals'].includes(key)) {
                plainObj[key] = convertToPlainObject(mongoObj[key]);
            }
        }
    }
    return plainObj;
};

function CartPage() {
    const router = useRouter();
    const [cartState, setCartState] = useState<CartState>({
        items: [], selectedItems: [], loading: true, updatingItems: []
    });
    const [itemQuantities, setItemQuantities] = useState<ItemQuantityState>({});
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [userId, setUserId] = useState("");

    const uniqueDistricts = getAllDistricts();
    const selectedDeliveryArea: DeliveryArea | null = selectedDistrict ? getDeliveryAreaForDistrict(selectedDistrict) : null;

    const getItemData = (item: CartItemType) => {
        if (item.product) {
            const plainProduct = convertToPlainObject(item.product) as IProduct;
            return { type: "product" as const, data: plainProduct, image: plainProduct.images?.[0] || imageUrl.packageImage.image1, maxStock: plainProduct.stock };
        } else if (item.package) {
            const plainPackage = convertToPlainObject(item.package) as IPackage;
            return { type: "package" as const, data: plainPackage, image: plainPackage.imageUrl?.[0] || imageUrl.packageImage.image1, maxStock: Infinity };
        }
        return null;
    };

    const getItemQuantity = (itemId: string) => itemQuantities[itemId]?.quantity || cartState.items.find(item => item._id === itemId)?.quantity || 0;
    const getItemTotalPrice = (itemId: string) => itemQuantities[itemId]?.totalPrice || 0;

    useEffect(() => {
        if (cartState.items.length > 0) {
            const initialQuantities: ItemQuantityState = {};
            cartState.items.forEach(item => {
                const itemData = getItemData(item);
                const price = itemData?.data?.price || 0;
                const quantity = item.quantity || 1;
                initialQuantities[item._id] = { quantity: quantity, totalPrice: price * quantity };
            });
            setItemQuantities(initialQuantities);
        }
    }, [cartState.items]);

    const summary = useMemo(() => {
        const selectedCartItems = cartState.items.filter(item => cartState.selectedItems.includes(item._id));
        const subtotal = selectedCartItems.reduce((sum, item) => {
            const itemQuantity = itemQuantities[item._id]?.quantity || item.quantity || 1;
            const price = item.product?.price || item.package?.price || 0;
            return sum + (price * itemQuantity);
        }, 0);

        const totals = calculateOrderTotals(subtotal, selectedDistrict);
        return {
            subtotal: totals.subtotal,
            shipping: totals.shipping,
            total: totals.total,
            selectedCount: selectedCartItems.length
        };
    }, [cartState.items, cartState.selectedItems, itemQuantities, selectedDistrict]);

    const fetchCartItems = useCallback(async () => {
        try {
            setCartState(prev => ({ ...prev, loading: true }));
            
            let allItems: CartItemType[] = [];
            
            // 1. Load from Database if logged in
            const cookie = await getCookie("user");
            if (cookie) {
                const userCookie = JSON.parse(cookie);
                setUserId(userCookie._id);
                const response = await getCartItems({ userId: userCookie._id });
                if (!response.isError && response.data) {
                    allItems = JSON.parse(JSON.stringify(response.data));
                }
            }

            // 2. Load from LocalStorage (Guest items)
            const guestCart = JSON.parse(localStorage.getItem("gym-shop-cart") || "[]");
            const localItems: CartItemType[] = guestCart.map((item: any) => ({
                _id: `local-${item.id}-${item.type}`, // Prefix to identify local items
                product: item.type === "product" ? { 
                    _id: item.id, title: item.name, price: item.price, images: [item.image], category: item.category, stock: 999, isActive: true 
                } : undefined,
                package: item.type === "package" ? { 
                    _id: item.id, title: item.name, price: item.price, imageUrl: [item.image], category: item.category, isActive: true 
                } : undefined,
                quantity: item.quantity,
                isActive: true,
                isLocal: true // Custom flag
            }));

            // 3. Merge (Optional: you could avoid duplicates here if needed)
            const finalItems = [...allItems, ...localItems];

            setCartState(prev => ({ 
                ...prev, 
                items: finalItems, 
                selectedItems: [] 
            }));

        } catch (error) { 
            console.error(error); 
        } finally { 
            setCartState(prev => ({ ...prev, loading: false })); 
        }
    }, []);

    useEffect(() => { fetchCartItems(); }, [fetchCartItems]);

    const handleRemoveItem = async (itemId: string) => {
        const item = cartState.items.find(i => i._id === itemId);
        
        // Handle Local Item
        if (item && (item as any).isLocal) {
            const guestCart = JSON.parse(localStorage.getItem("gym-shop-cart") || "[]");
            const productId = item.product?._id || item.package?._id;
            const type = item.product ? "product" : "package";
            const newGuestCart = guestCart.filter((i: any) => !(i.id === productId && i.type === type));
            localStorage.setItem("gym-shop-cart", JSON.stringify(newGuestCart));
            
            setCartState(prev => ({ ...prev, items: prev.items.filter(i => i._id !== itemId), selectedItems: prev.selectedItems.filter(id => id !== itemId) }));
            setItemQuantities(prev => { const n = { ...prev }; delete n[itemId]; return n; });
            window.dispatchEvent(new Event("cart-updated"));
            toast.success("Removed from guest cart");
            return;
        }

        // Handle DB Item
        try {
            setCartState(prev => ({ ...prev, updatingItems: [...prev.updatingItems, itemId] }));
            const response = await removeFromCart({ cartId: itemId });
            if (!response.isError) {
                setCartState(prev => ({ ...prev, items: prev.items.filter(item => item._id !== itemId), selectedItems: prev.selectedItems.filter(id => id !== itemId) }));
                setItemQuantities(prev => { const n = { ...prev }; delete n[itemId]; return n; });
                window.dispatchEvent(new Event("cart-updated"));
                toast.success("Removed");
            }
        } finally { setCartState(prev => ({ ...prev, updatingItems: prev.updatingItems.filter(id => id !== itemId) })); }
    };

    const handleQuantityChange = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        const item = cartState.items.find(i => i._id === itemId);

        // Handle Local Item
        if (item && (item as any).isLocal) {
            const guestCart = JSON.parse(localStorage.getItem("gym-shop-cart") || "[]");
            const productId = item.product?._id || item.package?._id;
            const type = item.product ? "product" : "package";
            const itemIndex = guestCart.findIndex((i: any) => i.id === productId && i.type === type);
            
            if (itemIndex > -1) {
                guestCart[itemIndex].quantity = newQuantity;
                localStorage.setItem("gym-shop-cart", JSON.stringify(guestCart));
                
                const itemData = getItemData(item);
                setItemQuantities(prev => ({ ...prev, [itemId]: { quantity: newQuantity, totalPrice: (itemData?.data?.price || 0) * newQuantity } }));
                setCartState(prev => ({ ...prev, items: prev.items.map(i => i._id === itemId ? { ...i, quantity: newQuantity } : i) }));
                window.dispatchEvent(new Event("cart-updated"));
            }
            return;
        }

        // Handle DB Item
        try {
            setCartState(prev => ({ ...prev, updatingItems: [...prev.updatingItems, itemId] }));
            const response = await updateCartQuantity({ cartId: itemId, quantity: newQuantity });
            if (!response.isError) {
                const item = cartState.items.find(i => i._id === itemId);
                if (item) {
                    const itemData = getItemData(item);
                    setItemQuantities(prev => ({ ...prev, [itemId]: { quantity: newQuantity, totalPrice: (itemData?.data?.price || 0) * newQuantity } }));
                }
                setCartState(prev => ({ ...prev, items: prev.items.map(i => i._id === itemId ? { ...i, quantity: newQuantity } : i) }));
                window.dispatchEvent(new Event("cart-updated"));
            }
        } finally { setCartState(prev => ({ ...prev, updatingItems: prev.updatingItems.filter(id => id !== itemId) })); }
    };

    const updateQuantityLocal = (itemId: string, newQuantity: number) => {
        const item = cartState.items.find(i => i._id === itemId);
        if (!item) return;
        const itemData = getItemData(item);
        if (newQuantity < 1 || newQuantity > (itemData?.maxStock || 999)) return;
        setItemQuantities(prev => ({ ...prev, [itemId]: { quantity: newQuantity, totalPrice: (itemData?.data?.price || 0) * newQuantity } }));
    };

    const toggleSelection = (id: string) => setCartState(prev => ({ ...prev, selectedItems: prev.selectedItems.includes(id) ? prev.selectedItems.filter(i => i !== id) : [...prev.selectedItems, id] }));
    const selectAllItems = () => setCartState(prev => ({ ...prev, selectedItems: prev.selectedItems.length === prev.items.length ? [] : prev.items.map(i => i._id) }));
    
    const getSelectedItemsForOrder = () => cartState.items.filter(item => cartState.selectedItems.includes(item._id)).map(item => {
        const itemData = getItemData(item);
        if (!itemData) return null;
        const productId = item.product?._id ? String(item.product._id) : undefined;
        const packageId = item.package?._id ? String(item.package._id) : undefined;
        return { product: productId, package: packageId, quantity: getItemQuantity(item._id) || item.quantity || 1, price: itemData.data.price as number, title: itemData.data.title as string, image: itemData.image as string, type: itemData.type };
    }).filter(i => i !== null);

    const handleCheckout = () => {
        if (summary.selectedCount === 0) return toast.error("Select items first");
        if (!selectedDistrict) return toast.error("Select district");
        setIsOrderModalOpen(true);
    };

    const handleOrderSuccess = async () => {
        // Clear local items if they were ordered
        const selectedLocalItems = cartState.items.filter(item => cartState.selectedItems.includes(item._id) && (item as any).isLocal);
        if (selectedLocalItems.length > 0) {
            const guestCart = JSON.parse(localStorage.getItem("gym-shop-cart") || "[]");
            const remainingGuestCart = guestCart.filter((gi: any) => 
                !selectedLocalItems.some(li => (li.product?._id === gi.id || li.package?._id === gi.id) && (li.product ? "product" : "package") === gi.type)
            );
            localStorage.setItem("gym-shop-cart", JSON.stringify(remainingGuestCart));
            window.dispatchEvent(new Event("cart-updated"));
        }

        if (!userId) { setIsOrderModalOpen(false); router.push("/"); return; }
        
        try {
            setCartState(prev => ({ ...prev, loading: true }));
            const dbItemIds = cartState.selectedItems.filter(id => !id.startsWith('local-'));
            if (dbItemIds.length > 0) {
                await removeCartItemsAfterOrder({ userId, itemIds: dbItemIds });
            }
            setIsOrderModalOpen(false);
            router.push("/");
        } catch (error) { console.error(error); }
    };

    if (cartState.loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <section className="w-full min-h-screen bg-black py-24 px-4 md:px-8 lg:px-16">
            <div className="text-center mb-16">
                <h1 className="text-3xl md:text-6xl font-custom font-bold text-white uppercase tracking-widest mb-4">YOUR <span className="text-primary">CART</span></h1>
                <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Review performance essentials and proceed.</p>
            </div>

            {cartState.items.length === 0 ? (
                <div className="w-full max-w-6xl mx-auto text-center py-20 bg-white/5 border border-white/10 rounded-[3rem]">
                    <ShoppingBag className="w-24 h-24 text-white/5 mx-auto mb-8" />
                    <h2 className="text-2xl font-custom font-bold text-white mb-8 uppercase tracking-widest">Your cart is empty</h2>
                    <button onClick={() => router.push("/shop")} className="bg-primary text-black font-custom font-bold py-4 px-12 rounded-full hover:bg-white transition-all uppercase text-sm">Start Training</button>
                </div>
            ) : (
                <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8 p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <div className="flex items-center gap-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${cartState.selectedItems.length === cartState.items.length ? "bg-primary border-primary" : "border-white/20 bg-black"}`} onClick={selectAllItems}>
                                    {cartState.selectedItems.length === cartState.items.length && <Check className="text-black w-4 h-4" strokeWidth={4} />}
                                </div>
                                <span className="text-white font-custom font-bold text-sm tracking-widest uppercase">Select all ({cartState.items.length})</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {cartState.items.map((item) => (
                                <CartItem key={item._id} item={item} getItemData={getItemData} isItemSelected={(id) => cartState.selectedItems.includes(id)} toggleSelection={toggleSelection} isItemUpdating={(id) => cartState.updatingItems.includes(id)} handleQuantityChange={handleQuantityChange} handleRemoveItem={handleRemoveItem} quantity={getItemQuantity(item._id)} totalPrice={getItemTotalPrice(item._id)} updateQuantityLocal={updateQuantityLocal} />
                            ))}
                        </div>
                    </div>

                    <div className="w-full lg:w-[400px] bg-white/5 border border-white/10 p-6 md:p-10 rounded-[3rem] h-fit sticky top-24">
                        <h2 className="text-2xl font-custom font-bold text-white mb-10 uppercase tracking-widest text-center">ORDER <span className="text-primary">SUMMARY</span></h2>
                        {summary.selectedCount > 0 ? (
                            <>
                                <div className="mb-10 space-y-6">
                                    <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 ml-2"><MapPin size={14} className="text-primary" />District</label>
                                    <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:border-primary outline-none">
                                        <option value="">Select District</option>
                                        {uniqueDistricts.map(d => <option key={d} value={d} className="bg-black">{d}</option>)}
                                    </select>
                                    {selectedDistrict && (
                                        <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-primary uppercase">{selectedDeliveryArea?.name}</p>
                                                <p className="text-[9px] text-white/40 uppercase">{selectedDeliveryArea?.deliveryTime}</p>
                                            </div>
                                            <p className="text-white font-black">{summary.shipping === 0 ? "FREE" : `৳ ${summary.shipping}`}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4 pt-6 border-t border-white/5">
                                    <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase"><span>Subtotal</span><span className="text-white">৳ {summary.subtotal.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase"><span>Shipping</span><span className="text-white">{summary.shipping === 0 ? "FREE" : `৳ ${summary.shipping.toLocaleString()}`}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase"><span>Tax</span><span className="text-white">৳ {(summary.total - summary.subtotal - summary.shipping).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-2xl font-black text-primary uppercase pt-4 border-t border-white/5"><span>Total</span><span>৳ {summary.total.toLocaleString()}</span></div>
                                </div>
                                <button onClick={handleCheckout} disabled={!selectedDistrict} className="mt-10 w-full bg-primary text-black font-custom font-bold py-5 rounded-full hover:bg-white transition-all uppercase text-sm disabled:opacity-20">Proceed Checkout</button>
                            </>
                        ) : <p className="text-center text-white/20 text-xs uppercase font-bold py-10 tracking-widest">Select items to proceed</p>}
                    </div>
                </div>
            )}

            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onOrderSuccess={handleOrderSuccess}
                items={getSelectedItemsForOrder() as any}
                userId={userId}
                shippingInfo={{
                    district: selectedDistrict,
                    area: selectedDeliveryArea?.name || "",
                    cost: summary.shipping,
                    deliveryTime: selectedDeliveryArea?.deliveryTime || "",
                    provider: "Redx"
                }}
                orderSummary={{
                    ...summary,
                    tax: summary.total - summary.subtotal - summary.shipping
                }}
            />
        </section>
    );
}

export default CartPage;
