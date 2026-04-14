"use client";

import React, { useState } from "react";
import { Search, Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react";
import { getOrderById } from "@/server/functions/order.fun";
import { IOrder, IOrderItem } from "@/server/models/order/order.interface";
import ImageWithSkeleton from "@/components/ui/ImageWIthSkeleton";

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState("");
    const [order, setOrder] = useState<IOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const trackOrder = async () => {
        if (!orderId.trim()) {
            setError("Please enter an order ID");
            return;
        }

        setLoading(true);
        setError("");
        setOrder(null);

        try {
            const result = await getOrderById(orderId.trim());
            if (result.success && result.order) {
                setOrder(result.order);
            } else {
                setError(result.error || "Order not found. Please check your Order ID.");
            }
        } catch (error) {
            console.error('Error tracking order:', error);
            setError("Failed to fetch order details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-yellow-600 bg-yellow-100';
            case 'confirmed': return 'text-blue-600 bg-blue-100';
            case 'processing': return 'text-purple-600 bg-purple-100';
            case 'shipped': return 'text-indigo-600 bg-indigo-100';
            case 'delivered': return 'text-green-600 bg-green-100';
            case 'cancelled': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return <CheckCircle className="w-5 h-5" />;
            case 'shipped': return <Truck className="w-5 h-5" />;
            case 'processing': return <Package className="w-5 h-5" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    const getStatusSteps = (currentStatus: string) => {
        const steps = [
            { status: 'pending', label: 'Order Placed', icon: <Package className="w-4 h-4" /> },
            { status: 'confirmed', label: 'Confirmed', icon: <CheckCircle className="w-4 h-4" /> },
            { status: 'processing', label: 'Processing', icon: <Package className="w-4 h-4" /> },
            { status: 'shipped', label: 'Shipped', icon: <Truck className="w-4 h-4" /> },
            { status: 'delivered', label: 'Delivered', icon: <CheckCircle className="w-4 h-4" /> },
        ];

        const currentIndex = steps.findIndex(step => step.status === currentStatus);

        return steps.map((step, index) => ({
            ...step,
            completed: index <= currentIndex,
            current: index === currentIndex,
        }));
    };

    return (
        <section className="w-full min-h-screen bg-black pt-24 pb-20 px-6 md:px-12 lg:px-20">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-6xl font-custom font-bold text-white uppercase tracking-widest mb-6">
                        TRACK <span className="text-primary">ORDER</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-sm max-w-2xl mx-auto">
                        Enter your order ID to check the current delivery status and performance journey of your gear.
                    </p>
                </div>

                {/* Search Form */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 mb-12">
                    <div className="flex flex-col sm:flex-row gap-6 max-w-2xl mx-auto">
                        <div className="flex-1 relative">
                            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="ORD-000000-XXXXXX"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && trackOrder()}
                                className="w-full bg-black border border-white/10 pl-16 pr-6 py-4 rounded-full text-white placeholder:text-white/10 focus:border-primary outline-none transition-all uppercase font-bold text-sm tracking-widest"
                            />
                        </div>
                        <button
                            onClick={trackOrder}
                            disabled={loading}
                            className="bg-primary text-black font-custom font-bold px-10 py-4 rounded-full hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase text-sm"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    TRACK
                                </>
                            )}
                        </button>
                    </div>
                    {error && (
                        <p className="text-red-500 text-center mt-6 text-[10px] font-black uppercase tracking-widest">{error}</p>
                    )}
                </div>

                {/* Order Details */}
                {order && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
                        {/* Order Status Card */}
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                            <h2 className="text-xl font-custom font-bold text-white uppercase tracking-widest mb-10 text-center">CURRENT PROGRESS</h2>

                            {/* Status Steps */}
                            <div className="mb-12">
                                <div className="flex items-center justify-between relative px-4">
                                    <div className="absolute top-5 left-0 w-full h-[2px] bg-white/5 -z-0" />
                                    {getStatusSteps(order.status).map((step) => (
                                        <div key={step.status} className="flex flex-col items-center flex-1 relative z-10">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-500 border-2 ${
                                                step.completed
                                                    ? 'bg-primary border-primary text-black'
                                                    : 'bg-black border-white/10 text-white/20'
                                            }`}>
                                                {step.icon}
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest text-center ${
                                                step.completed ? 'text-primary' : 'text-white/20'
                                            }`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Current Status Highlight */}
                            <div className="flex items-center gap-6 p-8 bg-black rounded-[2rem] border border-white/5">
                                <div className={`p-4 rounded-2xl ${getStatusColor(order.status).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                    {getStatusIcon(order.status)}
                                </div>
                                <div>
                                    <p className="font-custom font-bold text-white uppercase text-2xl tracking-widest mb-1">{order.status}</p>
                                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                        {order.status === 'pending' && 'YOUR PERFORMANCE GEAR IS BEING PROCESSED'}
                                        {order.status === 'confirmed' && 'ORDER HAS BEEN OFFICIALLY CONFIRMED'}
                                        {order.status === 'processing' && 'PREPARING YOUR ESSENTIALS FOR SHIPMENT'}
                                        {order.status === 'shipped' && 'YOUR GEAR IS CURRENTLY ON THE WAY'}
                                        {order.status === 'delivered' && 'GEAR HAS BEEN SUCCESSFULLY DELIVERED'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Information Grid */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
                                <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest mb-8">ORDER DATA</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between pb-4 border-b border-white/5">
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">ORDER ID</span>
                                        <span className="text-xs font-black text-white">{order.orderNumber}</span>
                                    </div>
                                    <div className="flex justify-between pb-4 border-b border-white/5">
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">DATE</span>
                                        <span className="text-xs font-black text-white">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between pb-4 border-b border-white/5">
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">TOTAL</span>
                                        <span className="text-xs font-black text-primary font-custom">৳ {order.total?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">PAYMENT</span>
                                        <span className={`text-xs font-black uppercase ${order.paymentStatus === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>{order.paymentStatus}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10">
                                <h3 className="text-sm font-custom font-bold text-primary uppercase tracking-widest mb-8">DELIVERY TARGET</h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
                                        <div className="space-y-2">
                                            <p className="text-sm font-black text-white uppercase tracking-tight">{order.shippingAddress?.fullName}</p>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                                                {order.shippingAddress?.address}<br/>
                                                {order.shippingAddress?.city}, {order.shippingAddress?.district}<br/>
                                                {order.shippingAddress?.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                            <h3 className="text-sm font-custom font-bold text-white uppercase tracking-widest mb-10 text-center">ORDER CONTENT</h3>
                            <div className="grid gap-6">
                                {order.items?.map((item: IOrderItem, index: number) => (
                                    <div key={index} className="flex items-center gap-6 p-6 bg-black rounded-3xl border border-white/5 hover:border-primary/30 transition-all group">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-2 shrink-0">
                                            <Image
                                                src={item.image}
                                                alt={item.title}
                                                width={80}
                                                height={80}
                                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">{item.title}</h4>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                                QTY: {item.quantity} × ৳{item.price.toLocaleString()}
                                            </p>
                                            <span className="inline-block bg-primary/10 text-primary text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full mt-2 border border-primary/20">
                                                {item.type}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-white tracking-tighter">
                                                ৳ {(item.price * item.quantity).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}