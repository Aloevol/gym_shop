"use client";

import { useState, useEffect } from "react";
import { getAllOrders, updateOrderStatus, updatePaymentStatus } from "@/server/functions/order.fun";
import { Eye, Search, Download } from "lucide-react";
import { IOrder } from "@/server/models/order/order.interface";
import {InvoiceData, PDFInvoiceGenerator} from "@/lib/pdfGenerator";
import Image from "next/image";

const statusSteps = [
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    { value: "confirmed", label: "Confirmed", color: "bg-blue-100 text-blue-800" },
    { value: "processing", label: "Processing", color: "bg-purple-100 text-purple-800" },
    { value: "shipped", label: "Shipped", color: "bg-indigo-100 text-indigo-800" },
    { value: "delivered", label: "Delivered", color: "bg-green-100 text-green-800" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" }
];

const paymentStatusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
    { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
    { value: "failed", label: "Failed", color: "bg-red-100 text-red-800" },
    { value: "refunded", label: "Refunded", color: "bg-purple-100 text-purple-800" },
    { value: "cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-800" }
];

// Define a type for Mongoose documents with toObject method
interface MongooseDocument {
    toObject?: () => IOrder;
}

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: MongooseDocument | IOrder | null): IOrder | null => {
    if (!doc) return doc;

    // If it's a Mongoose document with toObject method, use it
    if (typeof (doc as MongooseDocument).toObject === 'function') {
        return (doc as MongooseDocument).toObject!();
    }

    // If it's already plain, return it as is
    return JSON.parse(JSON.stringify(doc)) as IOrder;
};

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

    // Set client-side flag to prevent hydration issues
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        const result = await getAllOrders();
        console.log("All orders:", result);

        if (result.success) {
            // Convert Mongoose documents to plain objects and filter out null values
            const plainOrders = result.orders
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((order: any) => toPlainObject(order))
                .filter((order: IOrder | null): order is IOrder => order !== null);
            setOrders(plainOrders);
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        const result = await updateOrderStatus(orderId, newStatus);
        if (result.success) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            setOrders(prev => prev.map(order =>
                order._id === orderId ? { ...order, status: newStatus } : order
            ));
            if (selectedOrder && selectedOrder._id === orderId) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
            }
        }
    };

    const handlePaymentStatusUpdate = async (orderId: string, newPaymentStatus: string) => {
        setUpdatingPaymentStatus(orderId);

        try {
            const result = await updatePaymentStatus(orderId, newPaymentStatus);
            if (result.success) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                setOrders(prev => prev.map(order =>
                    order._id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
                ));
                if (selectedOrder && selectedOrder._id === orderId) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    setSelectedOrder(prev => prev ? { ...prev, paymentStatus: newPaymentStatus } : null);
                }
            } else {
                console.error("Failed to update payment status:", result.error);
            }
        } catch (error) {
            console.error("Error updating payment status:", error);
        } finally {
            setUpdatingPaymentStatus(null);
        }
    };

    // Add the print invoice function here in the main component
    const handlePrintInvoice = async (order: IOrder) => {
        try {
            const invoiceData: InvoiceData = {
                orderNumber: order.orderNumber,
                orderDate: new Date(order.createdAt).toLocaleDateString(),
                customer: {
                    name: order.shippingAddress.fullName,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    email: order.user? order.user.email : "no-email-given",
                    phone: order.shippingAddress.phone,
                    address: order.shippingAddress.address,
                    city: order.shippingAddress.city,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    district: order.shippingAddress.district,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    postalCode: order.shippingAddress.postalCode,
                    country: order.shippingAddress.country
                },
                items: order.items.map(item => ({
                    title: item.title,
                    quantity: item.quantity,
                    price: item.price,
                    type: item.type,
                    total: item.price * item.quantity
                })),
                summary: {
                    subtotal: order.subtotal,
                    shipping: order.shippingFee,
                    tax: order.tax,
                    total: order.total
                },
                payment: {
                    method: order.paymentMethod,
                    status: order.paymentStatus,
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    transactionId: order._id
                },
                shipping: {
                    method: "Standard Delivery",
                    cost: order.shippingFee,
                    estimatedDelivery: order.status === 'delivered'
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        ? `Delivered on ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : 'N/A'}`
                        : '3-5 business days'
                }
            };

            await PDFInvoiceGenerator.generateInvoice(invoiceData);
        } catch (error) {
            console.error('Error generating invoice:', error);
            alert('Failed to generate invoice. Please try again.');
        }
    };

    const openOrderDetails = (order: IOrder) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const closeOrderDetails = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (order.user? order.user.email : "no-email-given").toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.shippingAddress.phone.includes(searchTerm);

        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        const matchesPaymentStatus = paymentStatusFilter === "all" || order.paymentStatus === paymentStatusFilter;

        return matchesSearch && matchesStatus && matchesPaymentStatus;
    });

    // Show loading state during initial hydration
    if (!isClient || loading) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F27D31]"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
                <div className="text-sm text-gray-500">
                    Total: {orders.length} orders
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by order number, customer name, email, or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                        >
                            <option value="all">All Status</option>
                            {statusSteps.map(step => (
                                <option key={step.value} value={step.value}>
                                    {step.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={paymentStatusFilter}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                        >
                            <option value="all">All Payment Status</option>
                            {paymentStatusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#F27D31] text-white rounded-lg hover:bg-orange-600 transition-colors">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Items & Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map((order) => (
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                            <tr key={order._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">
                                        {order.orderNumber}
                                    </div>
                                    <div className="text-sm text-gray-500 capitalize">
                                        {order.paymentMethod?.replace(/([A-Z])/g, ' $1').trim()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">
                                        {order.shippingAddress.fullName}
                                    </div>

                                    <div className="text-sm text-gray-500">{
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        order.user? order.user.email : "no-email-given"
                                    }</div>
                                    <div className="text-sm text-gray-500">{order.shippingAddress.phone}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900">
                                        {order.items.length} item(s)
                                    </div>
                                    <div className="text-sm text-gray-600 font-semibold">
                                        ৳ {order.total?.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {order.items[0]?.title}
                                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        value={order.status}
                                        onChange={
                                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                                        // @ts-ignore
                                            (e) => handleStatusUpdate(order._id, e.target.value)
                                    }
                                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                                    >
                                        {statusSteps.map(step => (
                                            <option key={step.value} value={step.value}>
                                                {step.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    {updatingPaymentStatus === order._id ? (
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F27D31]"></div>
                                        </div>
                                    ) : (
                                        <select
                                            value={order.paymentStatus}
                                            onChange={
                                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                                            (e) => handlePaymentStatusUpdate(order._id, e.target.value)}
                                            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                                        >
                                            {paymentStatusOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                                    <div className="text-xs">{new Date(order.createdAt).toLocaleTimeString()}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openOrderDetails(order)}
                                            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View
                                        </button>
                                        <button
                                            onClick={() => handlePrintInvoice(order)}
                                            className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Invoice
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-lg">No orders found</div>
                        <div className="text-gray-500 text-sm mt-2">
                            {searchTerm || statusFilter !== "all" || paymentStatusFilter !== "all"
                                ? "Try changing your search or filter criteria"
                                : "No orders have been placed yet"
                            }
                        </div>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {isModalOpen && selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={closeOrderDetails}
                    onStatusUpdate={handleStatusUpdate}
                    onPaymentStatusUpdate={handlePaymentStatusUpdate}
                    updatingPaymentStatus={updatingPaymentStatus}
                    onPrintInvoice={handlePrintInvoice}
                />
            )}
        </div>
    );
}

// Order Details Modal Component
interface OrderDetailsModalProps {
    order: IOrder;
    onClose: () => void;
    onStatusUpdate: (orderId: string, newStatus: string) => void;
    onPaymentStatusUpdate: (orderId: string, newPaymentStatus: string) => void;
    updatingPaymentStatus: string | null;
    onPrintInvoice: (order: IOrder) => void;
}

function OrderDetailsModal({ order, onClose, onStatusUpdate, onPaymentStatusUpdate, updatingPaymentStatus, onPrintInvoice }: OrderDetailsModalProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Order Details: {order.orderNumber}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Placed on {new Date(order.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Order Status & Actions */}
                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                            <select
                                value={order.status}
                                onChange={
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                                (e) => onStatusUpdate(order._id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                            >
                                {statusSteps.map(step => (
                                    <option key={step.value} value={step.value}>
                                        {step.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                            {updatingPaymentStatus === order._id ? (
                                <div className="flex items-center justify-center py-2">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#F27D31]"></div>
                                    <span className="ml-2 text-sm text-gray-600">Updating...</span>
                                </div>
                            ) : (
                                <select
                                    value={order.paymentStatus}
                                    onChange={
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                                    (e) => onPaymentStatusUpdate(order._id, e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                                >
                                    {paymentStatusOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Customer Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Customer Information</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                                        <p className="text-gray-900">{order.shippingAddress.fullName}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Email</label>
                                        <p className="text-gray-900">{
                                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                            // @ts-ignore
                                            order.user? order.user.email : "no-email-given"
                                        }</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Phone</label>
                                        <p className="text-gray-900">{order.shippingAddress.phone}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">User ID</label>
                                        <p className="text-gray-900">{(order.user? order.user._id : "ID-Not-founded").toString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Shipping Address</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Address</label>
                                        <p className="text-gray-900">{order.shippingAddress.address}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">City & District</label>
                                        <p className="text-gray-900">
                                            {order.shippingAddress.city}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Postal Code & Country</label>
                                        <p className="text-gray-900">
                                            {order.shippingAddress.postalCode}, {order.shippingAddress.country}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Order Items ({order.items.length})</h3>
                        <div className="border rounded-lg">
                            {order.items.map((item, index) => (
                                <div key={
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                                    item._id || index} className="flex items-center p-4 border-b last:border-b-0">
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                                        <Image
                                            src={item.image || "/images/placeholder.jpg"}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                            sizes="64px"
                                        />
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                            <span>Qty: {item.quantity}</span>
                                            <span>Price: ৳{item.price?.toLocaleString()}</span>
                                            <span className="capitalize bg-gray-100 px-2 py-1 rounded">
                                                {item.type}
                                            </span>
                                        </div>
                                        {item.product && (
                                            <p className="text-xs text-gray-500 mt-1">Product ID: {item.product.toString()}</p>
                                        )}
                                        {item.package && (
                                            <p className="text-xs text-gray-500 mt-1">Package ID: {item.package.toString()}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="font-semibold text-gray-900">
                                            ৳ {((item.price || 0) * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal ({order.items.length} items):</span>
                                <span>৳ {order.subtotal?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping Fee:</span>
                                <span>৳ {order.shippingFee?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (5%):</span>
                                <span>৳ {order.tax?.toLocaleString()}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between text-lg font-semibold">
                                <span>Total:</span>
                                <span className="text-[#F27D31]">৳ {order.total?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Payment Information</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Method</label>
                                        <p className="text-gray-900 capitalize">
                                            {order.paymentMethod?.replace(/([A-Z])/g, ' $1').trim()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Status</label>
                                        <div className="mt-1">
                                            {updatingPaymentStatus === order._id ? (
                                                <div className="flex items-center justify-center py-1">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#F27D31]"></div>
                                                    <span className="ml-2 text-sm text-gray-600">Updating...</span>
                                                </div>
                                            ) : (
                                                <select
                                                    value={order.paymentStatus}
                                                    onChange={
                                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
                                                    (e) => onPaymentStatusUpdate(order._id, e.target.value)}
                                                    className="w-full px-3 py-1 text-sm font-semibold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F27D31]"
                                                >
                                                    {paymentStatusOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Timeline</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Order Created</label>
                                        <p className="text-gray-900">{new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Last Updated</label>
                                        <p className="text-gray-900">{new Date(order.updatedAt).toLocaleString()}</p>
                                    </div>
                                    {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        order.deliveredAt && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Delivered At</label>
                                            <p className="text-gray-900">{new Date(
                                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                                // @ts-ignore
                                                order.deliveredAt).toLocaleString()}</p>
                                        </div>
                                    )}
                                    {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        order.cancelledAt && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Cancelled At</label>
                                            <p className="text-gray-900">{new Date(
                                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                                // @ts-ignore
                                                order.cancelledAt).toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Order Notes</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-900">{order.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => onPrintInvoice(order)}
                        className="flex items-center gap-2 px-6 py-2 bg-[#F27D31] text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}