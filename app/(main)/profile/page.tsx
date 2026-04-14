"use client";

import React, {useEffect, useState} from "react";
import Image from "next/image";
import {getCookie, setCookie} from "@/server/helper/jwt.helper";
import {isAuthenticatedAndGetUser} from "@/server/functions/auth.fun";
import {IUser} from "@/server/models/user/user.interfce";
import {USER_ROLE, USER_STATUS} from "@/enum/user.enum";
import {SquarePen, Save, X, Edit3, Eye, EyeOff, LogOut, Package, Truck, MapPin, CreditCard} from "lucide-react";
import {toast} from "sonner";
import { updateUserProfileServerSide, changeUserPasswordServerSide } from "@/server/functions/user.fun";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {uploadMultipleToCloudinary} from "@/server/helper/cloudinary.helper";
import { getUserOrders } from "@/server/functions/order.fun";

// Order interface matching your order model
interface OrderItem {
    _id: string;
    title: string;
    quantity: number;
    price: number;
    type: string;
    image: string;
    product?: string;
    package?: string;
}

interface ShippingAddress {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    district: string;
}

interface Order {
    _id: string;
    orderNumber: string;
    user: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    subtotal: number;
    shippingFee: number;
    tax: number;
    total: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    deliveredAt?: string;
}

const statusSteps = [
    { value: "pending", label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" },
    { value: "confirmed", label: "Confirmed", color: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
    { value: "processing", label: "Processing", color: "bg-purple-500/10 text-purple-500 border border-purple-500/20" },
    { value: "shipped", label: "Shipped", color: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" },
    { value: "delivered", label: "Delivered", color: "bg-green-500/10 text-green-500 border border-green-500/20" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-500/10 text-red-500 border border-red-500/20" }
];

function ProfilePage() {
    // ... rest of state remains same
    const [user, setUser] = useState<IUser>({
        name: "",
        image: "https://res.cloudinary.com/ddsnont4o/image/upload/v1760025348/jhkjjhk_iesrwh.png",
        email: "",
        password: "",
        status: USER_STATUS.ACTIVE,
        isVerified: true,
        role: USER_ROLE.USER,
        createdAt: new Date()
    });
    const [editMode, setEditMode] = useState<boolean>(false);
    const [passwordMode, setPasswordMode] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        contact: "",
        email: ""
    });

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            const cookie = await getCookie("user");
            if (typeof cookie == 'string' ) {
                const userData = JSON.parse(cookie);
                setUser(userData);
                setPreviewImage(userData.image);
                setFormData({
                    name: userData.name || "",
                    contact: userData.contact || "",
                    email: userData.email || ""
                });
                await loadUserOrders(userData._id);
            } else {
                const res = await isAuthenticatedAndGetUser();
                if ( typeof res != "string" && res.isError == true) {
                    setUser({
                        name: "Guest User",
                        image: "https://res.cloudinary.com/ddsnont4o/image/upload/v1760025348/jhkjjhk_iesrwh.png",
                        email: "guest@example.com",
                        password: "",
                        status: USER_STATUS.ACTIVE,
                        isVerified: true,
                        role: USER_ROLE.USER,
                        createdAt: new Date()
                    });
                } else if ( typeof res == "string" ) {
                    await setCookie({name:"user", value: res });
                    const userData = JSON.parse(res);
                    setUser(userData);
                    setPreviewImage(userData.image);
                    setFormData({
                        name: userData.name || "",
                        contact: userData.contact || "",
                        email: userData.email || ""
                    });
                    await loadUserOrders(userData._id);
                }
            }
        };
        loadUserData();
    }, []);

    const loadUserOrders = async (userId: string) => {
        try {
            setOrdersLoading(true);
            const result = await getUserOrders(userId);
            if (result.success && result.orders) setOrders(result.orders);
            else setOrders([]);
        } catch (error) {
            console.error("Error loading orders:", error);
            setOrders([]);
        } finally {
            setOrdersLoading(false);
        }
    };

    const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
        await handleImageUpload(file);
    };

    const handleImageUpload = async (file: File) => {
        setImageUploading(true);
        try {
            if (!user._id) return;
            const uploadedUrls = await uploadMultipleToCloudinary([file]);
            const newImageUrl = uploadedUrls[0];
            if (newImageUrl) {
                const response = await updateUserProfileServerSide(user._id, { image: newImageUrl });
                if (!response.isError && response.data) {
                    const updatedUser = { ...user, image: newImageUrl };
                    setUser(updatedUser);
                    await setCookie({name:"user", value: JSON.stringify(updatedUser) });
                    toast.success("Profile image updated");
                } else {
                    setPreviewImage(user.image);
                }
            }
        } catch (error) {
            setPreviewImage(user.image);
        } finally {
            setImageUploading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!user._id) return;
            const response = await updateUserProfileServerSide(user._id, {
                name: formData.name,
                contact: formData.contact
            });
            if (!response.isError && response.data) {
                const updatedUser = { ...user, name: formData.name, contact: formData.contact };
                setUser(updatedUser);
                await setCookie({name:"user", value: JSON.stringify(updatedUser) });
                toast.success("Profile updated");
                setEditMode(false);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!user._id) return;
            if (newPassword !== confirmPassword) {
                toast.error("Passwords do not match");
                return;
            }
            const response = await changeUserPasswordServerSide(user._id, { currentPassword, newPassword });
            if (!response.isError) {
                toast.success("Password changed");
                handleCancelPassword();
            } else {
                toast.error(response.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        const cookies = document.cookie.split(";");
        for (const cookie of cookies) {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
        localStorage.clear();
        sessionStorage.clear();
        toast.success("Logged out");
        setTimeout(() => window.location.href = "/", 1000);
    };

    const handleCancelEdit = () => {
        setFormData({ name: user.name || "", contact: user.contact || "", email: user.email || "" });
        setEditMode(false);
        setPreviewImage(user.image);
    };

    const handleCancelPassword = () => {
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false);
        setPasswordMode(false);
    };

    const openOrderDetails = (order: Order) => { setSelectedOrder(order); setIsOrderModalOpen(true); };
    const closeOrderDetails = () => { setIsOrderModalOpen(false); setSelectedOrder(null); };

    const getStatusStyles = (status: string) => {
        const step = statusSteps.find(s => s.value === status);
        return step ? step.color : "bg-white/10 text-white/40 border border-white/5";
    };

    return (
        <section className="w-full min-h-screen bg-black py-24 px-6 md:px-12 lg:px-20 font-bold">
            <div className="max-w-6xl mx-auto">
                {/* Header Profile Card */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 mb-12 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative group">
                        <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-primary shadow-2xl shadow-primary/20">
                            <Image src={previewImage || user.image} alt="profile" fill className="object-cover" />
                            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="profile-image-upload" />
                        </div>
                        <label htmlFor="profile-image-upload" className="absolute bottom-2 right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-all shadow-xl">
                            {imageUploading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <SquarePen size={20} className="text-black" />}
                        </label>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        {editMode ? (
                            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md mx-auto md:mx-0">
                                <Input value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} className="bg-black border-white/10 rounded-full px-6 py-6" placeholder="FULL NAME" />
                                <Input value={formData.contact} onChange={(e) => handleInputChange("contact", e.target.value)} className="bg-black border-white/10 rounded-full px-6 py-6" placeholder="CONTACT NUMBER" />
                                <div className="flex gap-3">
                                    <button type="submit" disabled={loading} className="bg-primary text-black px-8 py-3 rounded-full uppercase text-xs tracking-widest hover:bg-white transition-all">SAVE</button>
                                    <button type="button" onClick={handleCancelEdit} className="bg-white/10 text-white px-8 py-3 rounded-full uppercase text-xs tracking-widest hover:bg-white/20 transition-all">CANCEL</button>
                                </div>
                            </form>
                        ) : passwordMode ? (
                            <div className="space-y-4 max-w-md mx-auto md:mx-0">
                                <h3 className="text-primary uppercase tracking-[0.2em] text-xs mb-4">SECURITY UPDATE</h3>
                                <div className="flex gap-3">
                                    <button onClick={() => setPasswordMode(false)} className="bg-white/10 text-white px-8 py-3 rounded-full uppercase text-xs tracking-widest">CANCEL</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-custom font-bold text-white uppercase tracking-widest mb-2">{user.name}</h1>
                                    <p className="text-primary uppercase tracking-[0.3em] text-xs">{user.role}</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
                                    <div className="flex items-center gap-2 text-white/40">
                                        <MdEmail size={16} className="text-primary" />
                                        <span className="text-xs uppercase tracking-wider">{user.email}</span>
                                    </div>
                                    {user.contact && (
                                        <div className="flex items-center gap-2 text-white/40">
                                            <BsTelephone size={14} className="text-primary" />
                                            <span className="text-xs uppercase tracking-wider">{user.contact}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3 pt-4 justify-center md:justify-start">
                                    <button onClick={() => setEditMode(true)} className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-full text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">EDIT PROFILE</button>
                                    <button onClick={() => setPasswordMode(true)} className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-full text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">PASSWORD</button>
                                    <button onClick={handleLogout} className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-3 rounded-full text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">LOGOUT</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Orders Section */}
                <div className="mb-12">
                    <div className="flex justify-between items-end mb-8 px-4">
                        <div>
                            <h2 className="text-2xl md:text-4xl font-custom font-bold text-white uppercase tracking-widest">MY <span className="text-primary">ORDERS</span></h2>
                            <p className="text-white/20 text-[10px] uppercase tracking-[0.2em] mt-2">Track your fitness progress</p>
                        </div>
                        {orders.length > 0 && (
                            <div className="text-right">
                                <p className="text-primary font-black text-2xl tracking-tighter">৳ {orders.reduce((sum, order) => sum + order.total, 0).toLocaleString()}</p>
                                <p className="text-white/20 text-[9px] uppercase tracking-widest">TOTAL SPENT</p>
                            </div>
                        )}
                    </div>

                    {ordersLoading ? (
                        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-20 text-center">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-white/40 uppercase text-xs tracking-widest font-bold">Fetching Orders...</p>
                        </div>
                    ) : orders.length > 0 ? (
                        <div className="grid gap-4">
                            {orders.map((order) => (
                                <div key={order._id} onClick={() => openOrderDetails(order)} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-primary/50 transition-all cursor-pointer group">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-primary/30">
                                                <Package className="text-primary" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold uppercase tracking-widest text-sm mb-1">ORDER #{order.orderNumber}</p>
                                                <p className="text-white/40 text-[10px] uppercase tracking-wider">{new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-8 justify-center">
                                            <div className="text-center">
                                                <p className="text-white font-black text-lg">৳ {order.total.toLocaleString()}</p>
                                                <p className="text-white/20 text-[9px] uppercase tracking-widest">AMOUNT</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyles(order.status)}`}>
                                                {order.status}
                                            </div>
                                            <button className="bg-primary/10 text-primary p-3 rounded-full group-hover:bg-primary group-hover:text-black transition-all">
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-20 text-center">
                            <ShoppingBag className="w-16 h-16 text-white/5 mx-auto mb-6" />
                            <p className="text-white/40 uppercase text-xs tracking-widest font-bold mb-8">NO ORDERS FOUND</p>
                            <button onClick={() => window.location.href = "/shop"} className="bg-primary text-black px-10 py-4 rounded-full uppercase text-xs font-bold tracking-widest hover:bg-white transition-all">START SHOPPING</button>
                        </div>
                    )}
                </div>

                {/* Account Details */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
                    <h2 className="text-xl md:text-2xl font-custom font-bold text-white uppercase tracking-widest mb-10 text-center md:text-left">ACCOUNT <span className="text-primary">DATA</span></h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-2">
                            <p className="text-white/20 text-[9px] uppercase tracking-[0.2em]">STATUS</p>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${user.status === USER_STATUS.ACTIVE ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                <p className="text-white text-xs uppercase tracking-widest">{user.status}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-white/20 text-[9px] uppercase tracking-[0.2em]">VERIFIED</p>
                            <p className={`text-xs uppercase tracking-widest ${user.isVerified ? 'text-green-500' : 'text-yellow-500'}`}>{user.isVerified ? 'YES' : 'NO'}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-white/20 text-[9px] uppercase tracking-[0.2em]">ROLE</p>
                            <p className="text-white text-xs uppercase tracking-widest">{user.role}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-white/20 text-[9px] uppercase tracking-[0.2em]">SINCE</p>
                            <p className="text-white text-xs uppercase tracking-widest">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {isOrderModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
                    <div className="bg-black border border-white/10 rounded-[3rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                        <div className="flex items-center justify-between p-10 border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-10">
                            <div>
                                <h2 className="text-2xl font-custom font-bold text-white uppercase tracking-widest">ORDER <span className="text-primary">#{selectedOrder.orderNumber}</span></h2>
                                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mt-1">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={closeOrderDetails} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-10 space-y-12">
                            {/* Summary Grid */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                    <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em] mb-4">STATUS</p>
                                    <div className={`inline-block px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyles(selectedOrder.status)}`}>{selectedOrder.status}</div>
                                </div>
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                    <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em] mb-4">PAYMENT</p>
                                    <div className={`inline-block px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedOrder.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>{selectedOrder.paymentStatus}</div>
                                </div>
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                    <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.2em] mb-4">METHOD</p>
                                    <p className="text-white text-xs uppercase font-black tracking-widest pt-2">{selectedOrder.paymentMethod}</p>
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-12">
                                {/* Address */}
                                <div className="space-y-6">
                                    <h3 className="text-white font-custom font-bold uppercase tracking-widest flex items-center gap-3">
                                        <MapPin size={20} className="text-primary" /> DELIVERY ADDRESS
                                    </h3>
                                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-4">
                                        <p className="text-white font-black uppercase tracking-tight text-lg">{selectedOrder.shippingAddress.fullName}</p>
                                        <div className="space-y-2 text-white/40 text-sm font-bold uppercase tracking-widest">
                                            <p>{selectedOrder.shippingAddress.address}</p>
                                            <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.district}</p>
                                            <p>{selectedOrder.shippingAddress.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="space-y-6">
                                    <h3 className="text-white font-custom font-bold uppercase tracking-widest flex items-center gap-3">
                                        <Package size={20} className="text-primary" /> ORDER ITEMS
                                    </h3>
                                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6">
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="flex items-center gap-4 group">
                                                <div className="w-16 h-16 bg-black rounded-xl overflow-hidden border border-white/10 shrink-0">
                                                    <Image src={item.image} alt={item.title} width={64} height={64} className="w-full h-full object-contain p-2" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-black uppercase tracking-tight text-sm line-clamp-1">{item.title}</p>
                                                    <p className="text-white/40 text-[10px] font-bold uppercase mt-1">{item.quantity} × ৳{item.price.toLocaleString()}</p>
                                                </div>
                                                <p className="text-white font-black text-sm">৳ {(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        ))}
                                        <div className="border-t border-white/5 pt-6 space-y-3">
                                            <div className="flex justify-between text-xs font-bold text-white/40 uppercase tracking-widest"><span>SUBTOTAL</span><span className="text-white">৳ {selectedOrder.subtotal.toLocaleString()}</span></div>
                                            <div className="flex justify-between text-xs font-bold text-white/40 uppercase tracking-widest"><span>SHIPPING</span><span className="text-white">৳ {selectedOrder.shippingFee.toLocaleString()}</span></div>
                                            <div className="flex justify-between text-lg font-black text-primary uppercase tracking-tighter pt-4 border-t border-white/5"><span>TOTAL</span><span>৳ {selectedOrder.total.toLocaleString()}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 border-t border-white/5 flex justify-end gap-4">
                            <button onClick={closeOrderDetails} className="bg-white/5 text-white px-10 py-4 rounded-full uppercase text-xs font-bold tracking-widest hover:bg-white hover:text-black transition-all">CLOSE</button>
                            <button className="bg-primary text-black px-10 py-4 rounded-full uppercase text-xs font-bold tracking-widest hover:bg-white transition-all shadow-xl shadow-primary/10">INVOICE</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}