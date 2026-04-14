"use client";

import React, { useState } from "react";
import { X, Package, CreditCard, Truck, CheckCircle, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { createOrder } from "@/server/functions/order.fun";
import Image from "next/image";

interface OrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOrderSuccess?: () => void;
    items: Array<{
        product?: string;
        package?: string;
        quantity: number;
        price: number;
        title: string;
        image: string;
        type: "product" | "package";
    }>;
    userId?: string; // Make userId optional
    shippingInfo?: {
        provider: string;
        area: string;
        district: string;
        cost: number;
        deliveryTime: string;
    };
    orderSummary?: {
        subtotal: number;
        shipping: number;
        total: number;
    };
}

interface ShippingArea {
    id: string;
    name: string;
    cost: number;
    deliveryTime: string;
}

interface ShippingFormData {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
}

export default function OrderModal({
                                       isOpen,
                                       onClose,
                                       onOrderSuccess,
                                       items,
                                       userId,
                                       shippingInfo,
                                       orderSummary
                                   }: OrderModalProps) {
    const [step, setStep] = useState<"details" | "confirmation">("details");
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"card" | "cashOnDelivery" | "bankTransfer">("cashOnDelivery");

    const shippingAreas: ShippingArea[] = [
        { id: "dhaka", name: "Dhaka City", cost: 60, deliveryTime: "1-2 days" },
        { id: "outside-dhaka", name: "Outside Dhaka", cost: 120, deliveryTime: "3-5 days" },
        { id: "remote", name: "Remote Areas", cost: 180, deliveryTime: "5-7 days" },
    ];

    const [selectedArea, setSelectedArea] = useState<string>("dhaka");
    const [formData, setFormData] = useState<ShippingFormData>({
        fullName: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        postalCode: "",
        country: "Bangladesh"
    });

    if (!isOpen) return null;

    // Calculate base values
    const selectedShippingArea = shippingAreas.find(area => area.id === selectedArea);
    
    // Use provided order summary or calculate from items
    const subtotal = orderSummary?.subtotal || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = orderSummary ? orderSummary.shipping : (selectedShippingArea?.cost || 60);
    const tax = orderSummary ? (orderSummary.subtotal * 0.05) : (subtotal * 0.05);
    const total = orderSummary?.total || (subtotal + shippingFee + tax);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const validateForm = (): boolean => {
        // Check required fields
        if (!formData.fullName.trim()) {
            toast.error("Please enter your full name");
            return false;
        }

        if (!formData.phone.trim()) {
            toast.error("Please enter your phone number");
            return false;
        }

        // Validate phone number format (Bangladeshi)
        const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
        if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
            toast.error("Please enter a valid Bangladeshi phone number (e.g., 01712345678)");
            return false;
        }

        if (!formData.email.trim()) {
            toast.error("Please enter your email address");
            return false;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address");
            return false;
        }

        if (!formData.address.trim()) {
            toast.error("Please enter your address");
            return false;
        }

        if (!formData.city.trim()) {
            toast.error("Please enter your city");
            return false;
        }

        return true;
    };

    const initiateSSLCommerzPayment = async (orderId: string, amount: number) => {
        try {
            const response = await fetch('/api/payment/sslcommerz/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    amount,
                    customerInfo: {
                        name: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        postalCode: formData.postalCode || '1200',
                    }
                }),
            });

            const result = await response.json();

            if (result.success && result.paymentUrl) {
                // Redirect to SSL Commerz payment page
                window.location.href = result.paymentUrl;
            } else {
                toast.error(result.error || 'Payment initiation failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            toast.error('Failed to connect to payment gateway');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Format phone number
            const formattedPhone = formData.phone.replace(/\s+/g, '');

            const orderData = {
                userId: userId || "guest", // Use "guest" if no user ID
                items: items,
                shippingAddress: {
                    ...formData,
                    phone: formattedPhone,
                    district: shippingInfo?.district || selectedShippingArea?.name || formData.city
                },
                paymentMethod,
                paymentStatus: paymentMethod === "card" ? "pending" : "pending",
                notes: `Order from cart with ${items.length} items - Redx Delivery (${selectedShippingArea?.name})`
            };

            // Call server action to create order
            const result = await createOrder(orderData);

            if (result.success && result.order) {
                // If card payment, initiate SSL Commerz
                if (paymentMethod === "card") {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    await initiateSSLCommerzPayment(result.order._id, total);
                    return;
                }

                // For cash on delivery, show success
                toast.success("Order created successfully! 🎉");
                setStep("confirmation");

                if (onOrderSuccess) {
                    onOrderSuccess();
                }
            } else {
                toast.error(result.error || "Failed to create order");
            }

        } catch (error) {
            console.error("Error creating order:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSelection = (method: "card" | "cashOnDelivery" | "bankTransfer") => {
        setPaymentMethod(method);
    };

    const handleClose = () => {
        setStep("details");
        setFormData({
            fullName: "",
            phone: "",
            email: "",
            address: "",
            city: "",
            postalCode: "",
            country: "Bangladesh"
        });
        setSelectedArea("dhaka");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="bg-black border border-white/10 rounded-[3rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl shadow-primary/5">
                {/* Header */}
                <div className="flex items-center justify-between p-10 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                    <h2 className="text-2xl font-custom font-bold text-white uppercase tracking-widest">
                        {step === "details" ? "COMPLETE ORDER" : "ORDER CONFIRMED"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"
                        disabled={loading}
                    >
                        <X size={24} />
                    </button>
                </div>

                {step === "details" ? (
                    <form onSubmit={handleSubmit} className="p-10">
                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Order Summary */}
                            <div className="space-y-8">
                                <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest">SUMMARY</h3>

                                {/* Selected Items */}
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {items.map((item, index) => (
                                        <div key={index} className="flex gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-primary/30 transition-all">
                                            <div className="w-16 h-16 bg-black rounded-xl overflow-hidden shrink-0 relative border border-white/10">
                                                <Image
                                                    src={item.image}
                                                    alt={item.title}
                                                    fill
                                                    className="object-contain p-2"
                                                    sizes="64px"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-white font-black uppercase tracking-tight text-xs mb-1 line-clamp-1">{item.title}</h4>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                                    QTY: {item.quantity} × ৳{item.price.toLocaleString()}
                                                </p>
                                                <p className="text-primary font-black text-xs mt-1">
                                                    ৳ {(item.price * item.quantity).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-4 p-8 bg-white/5 rounded-[2rem] border border-white/5">
                                    <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                        <span>SUBTOTAL</span>
                                        <span className="text-white">৳ {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                        <span>SHIPPING</span>
                                        <span className="text-white">{shippingFee === 0 ? "FREE" : `৳ ${shippingFee.toLocaleString()}`}</span>
                                    </div>
                                    <div className="flex justify-between text-2xl font-black text-primary uppercase tracking-tighter pt-4 border-t border-white/5">
                                        <span>TOTAL</span>
                                        <span>৳ {total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping & Payment */}
                            <div className="space-y-10">
                                {/* Shipping Information */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest">DELIVERY</h3>
                                    <div className="grid gap-4">
                                        <input
                                            type="text"
                                            name="fullName"
                                            placeholder="FULL NAME *"
                                            required
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:border-primary outline-none"
                                            disabled={loading}
                                        />
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="PHONE NUMBER *"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:border-primary outline-none"
                                            disabled={loading}
                                        />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="EMAIL ADDRESS *"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:border-primary outline-none"
                                            disabled={loading}
                                        />
                                        <textarea
                                            name="address"
                                            placeholder="FULL ADDRESS *"
                                            required
                                            value={formData.address}
                                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            className="w-full bg-black border border-white/10 rounded-[2rem] px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:border-primary outline-none resize-none"
                                            rows={3}
                                            disabled={loading}
                                        />
                                        <input
                                            type="text"
                                            name="city"
                                            placeholder="CITY *"
                                            required
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full bg-black border border-white/10 rounded-full px-6 py-4 text-white text-xs font-bold uppercase tracking-widest focus:border-primary outline-none"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest">PAYMENT</h3>
                                    <div className="grid gap-4">
                                        <label className={`flex items-center gap-4 p-6 border rounded-[2rem] cursor-pointer transition-all ${
                                            paymentMethod === "cashOnDelivery" ? "border-primary bg-primary/5" : "border-white/10 bg-black hover:border-white/30"
                                        }`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cashOnDelivery"
                                                checked={paymentMethod === "cashOnDelivery"}
                                                onChange={() => handlePaymentSelection("cashOnDelivery")}
                                                className="hidden"
                                                disabled={loading}
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cashOnDelivery" ? "border-primary bg-primary" : "border-white/20"}`}>
                                                {paymentMethod === "cashOnDelivery" && <div className="w-2 h-2 rounded-full bg-black" />}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs font-black text-white uppercase tracking-widest">Cash on Delivery</span>
                                                <p className="text-[9px] text-white/40 uppercase mt-1 tracking-wider">Pay upon gear arrival</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-4 p-6 border rounded-[2rem] cursor-pointer transition-all ${
                                            paymentMethod === "card" ? "border-primary bg-primary/5" : "border-white/10 bg-black hover:border-white/30"
                                        }`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={paymentMethod === "card"}
                                                onChange={() => handlePaymentSelection("card")}
                                                className="hidden"
                                                disabled={loading}
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "card" ? "border-primary bg-primary" : "border-white/20"}`}>
                                                {paymentMethod === "card" && <div className="w-2 h-2 rounded-full bg-black" />}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-xs font-black text-white uppercase tracking-widest">Online Payment</span>
                                                <p className="text-[9px] text-white/40 uppercase mt-1 tracking-wider">Secure encrypted checkout</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-10 border-t border-white/5">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-10 py-5 border border-white/10 text-white font-custom font-bold uppercase tracking-widest rounded-full hover:bg-white/5 transition-all text-xs"
                                disabled={loading}
                            >
                                ABORT
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-10 py-5 bg-primary text-black font-custom font-bold uppercase tracking-widest rounded-full hover:bg-white transition-all text-xs shadow-xl shadow-primary/10 disabled:opacity-20"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        PROCESSING...
                                    </div>
                                ) : (
                                    `FINALIZE - ৳ ${total.toLocaleString()}`
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Confirmation Step */
                    <div className="p-20 text-center">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-2xl shadow-primary/10">
                            <CheckCircle className="w-12 h-12 text-primary" />
                        </div>

                        <h3 className="text-3xl font-custom font-bold text-white uppercase tracking-widest mb-4">
                            ORDER SUCCESS!
                        </h3>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-xs mb-12">
                            WELCOME TO THE COMMUNITY. GEAR PREPARATION HAS COMMENCED.
                        </p>

                        <button
                            onClick={handleClose}
                            className="bg-primary text-black font-custom font-bold px-12 py-5 rounded-full hover:bg-white transition-all uppercase text-sm tracking-widest shadow-xl shadow-primary/10"
                        >
                            CONTINUE SHOPPING
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}