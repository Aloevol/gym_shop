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

    // Calculate shipping fee based on selected area
    const selectedShippingArea = shippingAreas.find(area => area.id === selectedArea);
    const shippingFee = selectedShippingArea?.cost || 60;

    // Use provided order summary or calculate from items
    const subtotal = orderSummary?.subtotal || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
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
                    district: selectedShippingArea?.name || formData.city
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {step === "details" ? "Complete Your Order" : "Order Confirmed!"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {step === "details" ? (
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Order Summary */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>

                                {/* Selected Items */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShoppingBag className="w-5 h-5 text-[#F27D31]" />
                                        <span className="font-medium text-gray-700">
                                            Selected Items ({items.length})
                                        </span>
                                    </div>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {items.map((item, index) => (
                                            <div key={index} className="flex gap-3 border rounded-lg p-3 bg-gray-50">
                                                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                                                    <Image
                                                        src={item.image}
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="64px"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-800 text-sm">{item.title}</h4>
                                                    <p className="text-gray-600 text-xs">
                                                        Qty: {item.quantity} × ৳{item.price.toLocaleString()}
                                                    </p>
                                                    <p className="text-[#F27D31] font-semibold text-sm">
                                                        ৳ {(item.price * item.quantity).toLocaleString()}
                                                    </p>
                                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                                                        {item.type === "product" ? "Product" : "Package"}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Shipping Area Selection */}
                                <div className="mb-4">
                                    <h4 className="font-medium text-gray-700 mb-2">Delivery Area</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {shippingAreas.map((area) => (
                                            <button
                                                key={area.id}
                                                type="button"
                                                onClick={() => setSelectedArea(area.id)}
                                                className={`p-3 border rounded-lg text-center transition-all ${
                                                    selectedArea === area.id
                                                        ? 'border-[#F27D31] bg-orange-50'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="font-medium text-sm">{area.name}</div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                    ৳ {area.cost} • {area.deliveryTime}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between">
                                        <span>Subtotal ({items.length} items):</span>
                                        <span>৳ {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Shipping ({selectedShippingArea?.name}):</span>
                                        <span>{shippingFee === 0 ? "Free" : `৳ ${shippingFee.toLocaleString()}`}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax (5%):</span>
                                        <span>৳ {tax.toLocaleString()}</span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Total:</span>
                                        <span className="text-[#F27D31]">৳ {total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping & Payment */}
                            <div className="space-y-6">
                                {/* Shipping Information */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            name="fullName"
                                            placeholder="Full Name *"
                                            required
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                                            disabled={loading}
                                        />
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="Phone Number (e.g., 01712345678) *"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                                            disabled={loading}
                                        />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email Address *"
                                            required
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                                            disabled={loading}
                                        />
                                        <textarea
                                            name="address"
                                            placeholder="Full Address (House, Road, Area) *"
                                            required
                                            value={formData.address}
                                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31] resize-none"
                                            rows={3}
                                            disabled={loading}
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                name="city"
                                                placeholder="City *"
                                                required
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                                                disabled={loading}
                                            />
                                            <input
                                                type="text"
                                                name="postalCode"
                                                placeholder="Postal Code"
                                                value={formData.postalCode}
                                                onChange={handleInputChange}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                                                disabled={loading}
                                            />
                                        </div>
                                        <select
                                            name="country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                                            disabled={loading}
                                        >
                                            <option value="Bangladesh">Bangladesh</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                                    <div className="space-y-2">
                                        <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                            paymentMethod === "cashOnDelivery" ? "border-[#F27D31] bg-orange-50" : "border-gray-300 hover:bg-gray-50"
                                        }`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cashOnDelivery"
                                                checked={paymentMethod === "cashOnDelivery"}
                                                onChange={() => handlePaymentSelection("cashOnDelivery")}
                                                className="text-[#F27D31] focus:ring-[#F27D31]"
                                                disabled={loading}
                                            />
                                            <Package className="w-5 h-5" />
                                            <div className="flex-1">
                                                <span className="font-medium">Cash on Delivery</span>
                                                <p className="text-sm text-gray-600">Pay when you receive your order</p>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                            paymentMethod === "card" ? "border-[#F27D31] bg-orange-50" : "border-gray-300 hover:bg-gray-50"
                                        }`}>
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="card"
                                                checked={paymentMethod === "card"}
                                                onChange={() => handlePaymentSelection("card")}
                                                className="text-[#F27D31] focus:ring-[#F27D31]"
                                                disabled={loading}
                                            />
                                            <CreditCard className="w-5 h-5" />
                                            <div className="flex-1">
                                                <span className="font-medium">Online Payment</span>
                                                <p className="text-sm text-gray-600">Pay securely online</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3 mt-8 pt-6 border-t">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-[#F27D31] text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Creating Order...
                                    </div>
                                ) : paymentMethod === "cashOnDelivery" ? (
                                    `Place Order - ৳ ${total.toLocaleString()}`
                                ) : (
                                    `Confirm Order - ৳ ${total.toLocaleString()}`
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    /* Confirmation Step */
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>

                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            Order Placed Successfully!
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Thank you for your purchase. We&#39;ve sent a confirmation to your email.
                        </p>

                        {/* Order Details */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
                            <h4 className="font-semibold mb-3 text-center">Order Details</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Items:</span>
                                    <span>{items.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Delivery Area:</span>
                                    <span>{selectedShippingArea?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping Cost:</span>
                                    <span>৳ {shippingFee.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Payment Method:</span>
                                    <span className="capitalize">
                                        {paymentMethod === "cashOnDelivery" ? "Cash on Delivery" : "Online Payment"}
                                    </span>
                                </div>
                                <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                                    <span>Total Amount:</span>
                                    <span className="text-[#F27D31]">৳ {total.toLocaleString()}</span>
                                </div>
                                {paymentMethod === "cashOnDelivery" && (
                                    <div className="text-green-600 text-sm mt-2 text-center">
                                        💰 You&#39;ll pay when you receive your order
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-xl p-4 mb-6 max-w-md mx-auto">
                            <h4 className="font-semibold mb-2">What&#39;s Next?</h4>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    <span>Order Confirmation</span>
                                </div>
                                <div className="hidden sm:block">→</div>
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4" />
                                    <span>Processing</span>
                                </div>
                                <div className="hidden sm:block">→</div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Delivery ({selectedShippingArea?.deliveryTime})</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="px-8 py-3 bg-[#F27D31] text-white rounded-xl hover:bg-orange-600 transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}