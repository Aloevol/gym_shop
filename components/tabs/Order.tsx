"use client";

import { useState, useEffect } from "react";
import { getAllOrders, updateOrderStatus, updatePaymentStatus } from "@/server/functions/order.fun";
import { Eye, Search, Download, Package, Truck, CreditCard, Clock, X, CheckCircle2 } from "lucide-react";
import { IOrder } from "@/server/models/order/order.interface";
import {InvoiceData, PDFInvoiceGenerator} from "@/lib/pdfGenerator";
import Image from "next/image";

const statusSteps = [
    { value: "pending", label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" },
    { value: "confirmed", label: "Confirmed", color: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
    { value: "processing", label: "Processing", color: "bg-purple-500/10 text-purple-500 border border-purple-500/20" },
    { value: "shipped", label: "Shipped", color: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" },
    { value: "delivered", label: "Delivered", color: "bg-green-500/10 text-green-500 border border-green-500/20" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-500/10 text-red-500 border border-red-500/20" }
];

const paymentStatusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" },
    { value: "paid", label: "Paid", color: "bg-green-500/10 text-green-500 border border-green-500/20" },
    { value: "failed", label: "Failed", color: "bg-red-500/10 text-red-500 border border-red-500/20" },
    { value: "refunded", label: "Refunded", color: "bg-purple-500/10 text-purple-500 border border-purple-500/20" },
    { value: "cancelled", label: "Cancelled", color: "bg-white/10 text-white/40 border border-white/5" }
];

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
    const [isClient, setIsClient] = useState(false);
    const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
        loadOrders();
    }, []);

    const loadOrders = async () => {
        const result = await getAllOrders();
        if (result.success) {
            setOrders(JSON.parse(JSON.stringify(result.orders)));
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        const result = await updateOrderStatus(orderId, newStatus);
        if (result.success) {
            setOrders(prev => prev.map(order => (order as any)._id === orderId ? { ...order, status: newStatus } : order));
            if (selectedOrder && (selectedOrder as any)._id === orderId) {
                setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
            }
        }
    };

    const handlePaymentStatusUpdate = async (orderId: string, newPaymentStatus: string) => {
        setUpdatingPaymentStatus(orderId);
        try {
            const result = await updatePaymentStatus(orderId, newPaymentStatus);
            if (result.success) {
                setOrders(prev => prev.map(order => (order as any)._id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order));
                if (selectedOrder && (selectedOrder as any)._id === orderId) {
                    setSelectedOrder(prev => prev ? { ...prev, paymentStatus: newPaymentStatus } : null);
                }
            }
        } finally {
            setUpdatingPaymentStatus(null);
        }
    };

    const handlePrintInvoice = async (order: IOrder) => {
        try {
            const invoiceData: InvoiceData = {
                orderNumber: order.orderNumber,
                orderDate: new Date(order.createdAt).toLocaleDateString(),
                customer: {
                    name: order.shippingAddress.fullName,
                    email: (order.user as any)?.email || "no-email",
                    phone: order.shippingAddress.phone,
                    address: order.shippingAddress.address,
                    city: order.shippingAddress.city,
                    district: (order.shippingAddress as any).district || "",
                    postalCode: (order.shippingAddress as any).postalCode || "",
                    country: order.shippingAddress.country
                },
                items: order.items.map(item => ({
                    title: item.title, quantity: item.quantity, price: item.price, type: item.type, total: item.price * item.quantity
                })),
                summary: { subtotal: order.subtotal, shipping: order.shippingFee, tax: order.tax, total: order.total },
                payment: { method: order.paymentMethod, status: order.paymentStatus, transactionId: (order as any)._id },
                shipping: { method: "Performance Delivery", cost: order.shippingFee, estimatedDelivery: '3-5 business days' }
            };
            await PDFInvoiceGenerator.generateInvoice(invoiceData);
        } catch (error) { console.error(error); }
    };

    const openOrderDetails = (order: IOrder) => { setSelectedOrder(order); setIsModalOpen(true); };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || order.shippingAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || order.shippingAddress.phone.includes(searchTerm);
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        const matchesPaymentStatus = paymentStatusFilter === "all" || order.paymentStatus === paymentStatusFilter;
        return matchesSearch && matchesStatus && matchesPaymentStatus;
    });

    if (!isClient || loading) {
        return (
            <div className="w-full min-h-full flex flex-col items-center justify-center pt-20">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white/20 font-black uppercase tracking-widest text-xs">RETRIEVING ORDER REGISTRY...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full">
            <div className="w-full h-full bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="w-full flex flex-col sm:flex-row justify-between items-center p-10 border-b border-white/5 bg-black">
                    <div>
                        <h1 className="text-3xl font-custom font-bold text-white uppercase tracking-widest">ORDER <span className="text-primary">LOGISTICS</span></h1>
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Manage deployments and settlements ({orders.length})</p>
                    </div>
                    <div className="flex gap-4 mt-6 sm:mt-0">
                        <div className="relative w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4" />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-3 text-white text-xs font-bold uppercase tracking-widest focus:border-primary outline-none transition-all"
                                placeholder="SEARCH REGISTRY..."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-black p-10 custom-scrollbar">
                    <div className="grid gap-4">
                        {filteredOrders.map((order) => (
                            <div key={(order as any)._id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-primary/30 transition-all group">
                                <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-primary/20">
                                            <Package className="text-primary" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-white font-black uppercase tracking-widest text-sm mb-1">ORDER #{order.orderNumber}</p>
                                            <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">{new Date(order.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-10 justify-center">
                                        <div className="text-center">
                                            <p className="text-white font-black text-lg tracking-tighter">৳ {order.total.toLocaleString()}</p>
                                            <p className="text-white/20 text-[9px] uppercase font-black tracking-widest">SETTLEMENT</p>
                                        </div>

                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate((order as any)._id, e.target.value)}
                                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border focus:outline-none appearance-none cursor-pointer ${statusSteps.find(s => s.value === order.status)?.color || ""}`}
                                        >
                                            {statusSteps.map(step => <option key={step.value} value={step.value} className="bg-black">{step.label}</option>)}
                                        </select>

                                        <select
                                            value={order.paymentStatus}
                                            onChange={(e) => handlePaymentStatusUpdate((order as any)._id, e.target.value)}
                                            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border focus:outline-none appearance-none cursor-pointer ${paymentStatusOptions.find(s => s.value === order.paymentStatus)?.color || ""}`}
                                        >
                                            {paymentStatusOptions.map(opt => <option key={option.value} value={opt.value} className="bg-black">{opt.label}</option>)}
                                        </select>

                                        <div className="flex gap-2">
                                            <button onClick={() => openOrderDetails(order)} className="p-3 bg-white/5 border border-white/10 text-white rounded-full hover:bg-white hover:text-black transition-all"><Eye size={18} /></button>
                                            <button onClick={() => handlePrintInvoice(order)} className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-full hover:bg-primary hover:text-black transition-all"><Download size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isModalOpen && selectedOrder && (
                <OrderDetailsModal order={selectedOrder} onClose={() => setIsModalOpen(false)} onStatusUpdate={handleStatusUpdate} onPaymentStatusUpdate={handlePaymentStatusUpdate} updatingPaymentStatus={updatingPaymentStatus} onPrintInvoice={handlePrintInvoice} />
            )}
        </div>
    );
}

function OrderDetailsModal({ order, onClose, onStatusUpdate, onPaymentStatusUpdate, updatingPaymentStatus, onPrintInvoice }: any) {
    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <div className="bg-black border border-white/10 rounded-[3rem] max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
                <div className="flex items-center justify-between p-10 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                    <div>
                        <h2 className="text-2xl font-custom font-bold text-white uppercase tracking-widest">REGISTRY <span className="text-primary">#{order.orderNumber}</span></h2>
                        <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mt-1">LOGISTICS DATA FOR {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all"><X size={24} /></button>
                </div>

                <div className="p-10 space-y-12">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">LOGISTICS STATUS</p>
                            <select value={order.status} onChange={(e) => onStatusUpdate(order._id, e.target.value)} className="w-full bg-black border border-white/10 rounded-full px-6 py-3 text-white text-xs font-black uppercase tracking-widest focus:border-primary outline-none">
                                {statusSteps.map(step => <option key={step.value} value={step.value} className="bg-black">{step.label}</option>)}
                            </select>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">SETTLEMENT STATUS</p>
                            <select value={order.paymentStatus} onChange={(e) => onPaymentStatusUpdate(order._id, e.target.value)} className="w-full bg-black border border-white/10 rounded-full px-6 py-3 text-white text-xs font-black uppercase tracking-widest focus:border-primary outline-none">
                                {paymentStatusOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-black">{opt.label}</option>)}
                            </select>
                        </div>
                        <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 flex flex-col justify-center">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">METHOD</p>
                            <p className="text-white text-lg font-black uppercase tracking-widest">{order.paymentMethod}</p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">TARGET LOCATION</h3>
                            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 space-y-4">
                                <p className="text-white font-black uppercase tracking-tight text-xl">{order.shippingAddress.fullName}</p>
                                <div className="space-y-2 text-white/40 text-xs font-bold uppercase tracking-[0.2em] leading-loose">
                                    <p>{order.shippingAddress.address}</p>
                                    <p>{order.shippingAddress.city}, {order.shippingAddress.district}</p>
                                    <p className="text-primary">{order.shippingAddress.phone}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">GEAR CONTENT</h3>
                            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {order.items.map((item: any, i: number) => (
                                    <div key={i} className="flex items-center gap-6 p-4 bg-black rounded-3xl border border-white/5">
                                        <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden border border-white/10 shrink-0 relative p-2"><Image src={item.image} alt="G" fill className="object-contain" /></div>
                                        <div className="flex-1"><p className="text-white font-black uppercase tracking-tight text-xs mb-1 line-clamp-1">{item.title}</p><p className="text-white/20 text-[9px] font-black uppercase">{item.quantity} × ৳{item.price.toLocaleString()}</p></div>
                                        <p className="text-white font-black text-sm">৳ {(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                                <div className="border-t border-white/5 pt-6 space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest"><span>SUBTOTAL</span><span className="text-white text-xs">৳ {order.subtotal.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest"><span>LOGISTICS FEE</span><span className="text-white text-xs">৳ {order.shippingFee.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-2xl font-black text-primary uppercase tracking-tighter pt-4 border-t border-white/5"><span>TOTAL</span><span>৳ {order.total.toLocaleString()}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 border-t border-white/5 flex justify-end gap-4 bg-black/80 backdrop-blur-md sticky bottom-0">
                    <button onClick={onClose} className="bg-white/5 text-white px-10 py-4 rounded-full uppercase text-xs font-bold tracking-widest hover:bg-white hover:text-black transition-all">CLOSE REGISTRY</button>
                    <button onClick={() => onPrintInvoice(order)} className="bg-primary text-black px-10 py-4 rounded-full uppercase text-xs font-bold tracking-widest hover:bg-white transition-all shadow-xl shadow-primary/10">GENERATE INVOICE</button>
                </div>
            </div>
        </div>
    );
}
