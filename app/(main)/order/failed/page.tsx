"use client";

import React, { useState, useEffect } from "react";
import { XCircle, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { getOrderById } from "@/server/functions/order.fun";
import {IOrder} from "@/server/models/order/order.interface";

export default function FailedPage() {
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

    if (loading) {
        return (
            <section className="w-full min-h-screen bg-black flex items-center justify-center pt-20 px-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-white/40 font-custom font-bold uppercase tracking-widest text-sm">FETCHING STATUS...</p>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full min-h-screen bg-black pt-24 pb-20 px-6 md:px-12 lg:px-20">
            <div className="max-w-4xl mx-auto text-center">
                {/* Failure Header */}
                <div className="mb-16">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-2xl shadow-red-500/10">
                        <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-3xl md:text-6xl font-custom font-bold text-white uppercase tracking-widest mb-6">
                        ORDER <span className="text-red-500">FAILED</span>
                    </h1>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-sm mb-4">
                        UNFORTUNATELY, YOUR TRANSACTION COULD NOT BE COMPLETED.
                    </p>
                    {order && (
                        <p className="text-red-500 font-black uppercase text-xs tracking-[0.2em] bg-red-500/5 border border-red-500/10 inline-block px-6 py-2 rounded-full">
                            ID: {order.orderNumber}
                        </p>
                    )}
                </div>

                {/* Error Details */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 max-w-2xl mx-auto mb-12">
                    <h2 className="text-sm font-custom font-bold text-white uppercase tracking-widest mb-8 text-center">POSSIBLE ISSUES</h2>
                    <div className="grid gap-4 text-left">
                        {['AUTHORIZATION FAILED', 'INSUFFICIENT BALANCE', 'NETWORK DISRUPTION', 'GATEWAY TIMEOUT'].map((issue, i) => (
                            <div key={i} className="flex items-center gap-4 bg-black p-4 rounded-2xl border border-white/5">
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{issue}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-10">
                    <div className="flex flex-wrap justify-center gap-6">
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-4 bg-primary text-black font-custom font-bold px-10 py-4 rounded-full hover:bg-white transition-all shadow-xl shadow-primary/10 uppercase text-xs"
                        >
                            <RotateCcw className="w-4 h-4" />
                            RETRY NOW
                        </button>
                        <Link
                            href="/cart"
                            className="inline-flex items-center gap-4 border border-white/20 text-white font-custom font-bold px-10 py-4 rounded-full hover:bg-white hover:text-black transition-all uppercase text-xs tracking-widest"
                        >
                            RETURN TO CART
                        </Link>
                    </div>

                    <div className="pt-12 border-t border-white/5 max-w-2xl mx-auto">
                        <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-8">NEED ELITE SUPPORT?</p>
                        <div className="flex flex-wrap justify-center gap-8">
                            <Link
                                href="/track-order"
                                className="inline-flex items-center gap-3 text-white/40 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest"
                            >
                                ORDER TRACKER
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-3 text-white/40 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest"
                            >
                                CONTACT SUPPORT
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}