"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Package, Truck, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getOrderById } from "@/server/functions/order.fun";
import {IOrder} from "@/server/models/order/order.interface";

export default function OrderSuccessPage() {
    const [order, setOrder] = useState<IOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const orderId = urlParams.get('orderId');

            if (orderId) {
                try {
                    const result = await getOrderById(orderId);
                    if (result) {
                        setOrder(result.order);
                    }
                } catch (error) {
                    console.error('Error fetching order:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchOrder();
    }, []);

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

    if (loading) {
        return (
            <section className="w-full min-h-screen bg-black flex items-center justify-center pt-20 px-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/40 font-custom font-bold uppercase tracking-widest text-sm">FETCHING ORDER DATA...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full min-h-screen bg-black pt-24 pb-20 px-6 md:px-12 lg:px-20">
            <div className="max-w-4xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-16">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-2xl shadow-primary/10">
                        <CheckCircle className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-6xl font-custom font-bold text-white uppercase tracking-widest mb-6">
                        ORDER <span className="text-primary">CONFIRMED</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-sm mb-4">
                        THANK YOU FOR TRUSTING THRYVE. YOUR PERFORMANCE GEAR IS BEING PREPARED.
                    </p>
                    {order && (
                        <p className="text-primary font-black uppercase text-xs tracking-[0.2em] bg-primary/5 border border-primary/10 inline-block px-6 py-2 rounded-full">
                            ID: {order.orderNumber}
                        </p>
                    )}
                </div>

                {order ? (
                    <div className="grid md:grid-cols-2 gap-8 mb-16">
                        {/* Order Status */}
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                            <h2 className="text-sm font-custom font-bold text-white uppercase tracking-widest mb-8">PROGRESS</h2>
                            <div className="flex items-center gap-6 p-6 bg-black rounded-[2rem] border border-white/5 mb-8">
                                <div className={`p-3 rounded-xl ${getStatusColor(order.status).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                    {getStatusIcon(order.status)}
                                </div>
                                <div>
                                    <p className="font-custom font-bold text-white uppercase text-xl tracking-widest mb-1">{order.status}</p>
                                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                                        {order.status === 'pending' && 'YOUR GEAR IS BEING PROCESSED'}
                                        {order.status === 'confirmed' && 'OFFICIALLY CONFIRMED'}
                                        {order.status === 'processing' && 'PREPARING FOR SHIPMENT'}
                                        {order.status === 'shipped' && 'CURRENTLY ON THE WAY'}
                                        {order.status === 'delivered' && 'GEAR SUCCESSFULLY DELIVERED'}
                                    </p>
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">PAYMENT STATUS</h3>
                                <span className={`inline-flex items-center gap-3 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                    order.paymentStatus === 'paid'
                                        ? 'text-green-500 bg-green-500/10 border-green-500/20'
                                        : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                            <h2 className="text-sm font-custom font-bold text-white uppercase tracking-widest mb-8">SUMMARY</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between pb-4 border-b border-white/5">
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">SUBTOTAL</span>
                                    <span className="text-xs font-black text-white">৳ {order.subtotal?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pb-4 border-b border-white/5">
                                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">SHIPPING</span>
                                    <span className="text-xs font-black text-white">{order.shippingFee === 0 ? 'FREE' : `৳ ${order.shippingFee?.toLocaleString()}`}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="text-xs font-black text-white uppercase tracking-[0.2em]">TOTAL AMOUNT</span>
                                    <span className="text-2xl font-black text-primary tracking-tighter">৳ {order.total?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-10 pt-10 border-t border-white/5">
                                <h3 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">PAYMENT METHOD</h3>
                                <p className="text-xs font-black text-white uppercase tracking-widest">
                                    {order.paymentMethod?.replace(/([A-Z])/g, ' $1').trim()}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-10 text-center mb-16">
                        <p className="text-primary font-black uppercase text-xs tracking-widest">
                            ORDER DATA SYNCING... PLEASE REFRESH IN A MOMENT.
                        </p>
                    </div>
                )}

                {/* Track Another Order & Continue Shopping */}
                <div className="text-center space-y-10">
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 max-w-2xl mx-auto group hover:border-primary/30 transition-all duration-500">
                        <h3 className="text-sm font-custom font-bold text-white uppercase tracking-widest mb-8">
                            WANT TO TRACK PROGRESS?
                        </h3>
                        <Link
                            href="/track-order"
                            className="inline-flex items-center gap-4 bg-primary text-black font-custom font-bold px-10 py-4 rounded-full hover:bg-white transition-all shadow-xl shadow-primary/10 uppercase text-xs"
                        >
                            GO TO TRACKER
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-3 border border-white/20 text-white font-custom font-bold px-10 py-4 rounded-full hover:bg-white hover:text-black transition-all uppercase text-xs tracking-widest"
                        >
                            CONTINUE SHOPPING
                        </Link>
                        <Link
                            href="/profile"
                            className="inline-flex items-center gap-3 bg-white/5 border border-white/10 text-white font-custom font-bold px-10 py-4 rounded-full hover:bg-white/10 transition-all uppercase text-xs tracking-widest"
                        >
                            MY ACCOUNT
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}