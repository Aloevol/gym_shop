"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle, MapPin, Truck, X, Tag, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { createOrder } from "@/server/functions/order.fun";
import { calculateOrderTotals, getAllDistricts, getDeliveryAreaForDistrict, normalizeDistrictName } from "@/lib/delivery";
import { validateCouponServerSide, applyCouponByCode } from "@/server/functions/coupon.fun";

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
  userId?: string;
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

interface ShippingFormData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

const DELIVERY_PROVIDER = "Redx";

export default function OrderModal({
  isOpen,
  onClose,
  onOrderSuccess,
  items,
  userId,
  shippingInfo,
  orderSummary,
}: OrderModalProps) {
  const [step, setStep] = useState<"details" | "confirmation">("details");
  const [loading, setLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(shippingInfo?.district || "");
  const [formData, setFormData] = useState<ShippingFormData>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Bangladesh",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedDistrict(shippingInfo?.district || "");
      setCouponCode("");
      setAppliedCoupon(null);
      setCouponError("");
    }
  }, [isOpen, shippingInfo?.district]);

  const subtotalFromItems = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const districtOptions = useMemo(() => getAllDistricts(), []);
  const normalizedDistrict = normalizeDistrictName(selectedDistrict);
  const deliveryArea = normalizedDistrict ? getDeliveryAreaForDistrict(normalizedDistrict) : null;
  const deliveryProvider = shippingInfo?.provider || DELIVERY_PROVIDER;
  const derivedSummary = calculateOrderTotals(subtotalFromItems, normalizedDistrict);
  
  const discountAmount = appliedCoupon?.discount || 0;
  
  const summary = {
    subtotal: derivedSummary.subtotal,
    shipping: derivedSummary.shipping,
    total: derivedSummary.total - discountAmount,
    discount: discountAmount,
  };

  if (!isOpen) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    
    setCouponLoading(true);
    setCouponError("");
    
    try {
      const result = await validateCouponServerSide(couponCode.trim(), subtotalFromItems);
      
      if (result.isError) {
        setCouponError(result.message);
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: couponCode.toUpperCase(), discount: result.discount || 0 });
        toast.success(result.message);
      }
    } catch (error) {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }

    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }

    const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;
    if (!phoneRegex.test(formData.phone.replace(/\s+/g, ""))) {
      toast.error("Please enter a valid Bangladeshi phone number");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!formData.address.trim()) {
      toast.error("Please enter your full address");
      return false;
    }

    if (!formData.city.trim()) {
      toast.error("Please enter your city or upazila");
      return false;
    }

    if (!normalizedDistrict) {
      toast.error("Please select your delivery district");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const formattedPhone = formData.phone.replace(/\s+/g, "");
      const area = getDeliveryAreaForDistrict(normalizedDistrict);
      const result = await createOrder({
        userId: userId || "guest",
        items,
        shippingAddress: {
          ...formData,
          phone: formattedPhone,
          district: normalizedDistrict,
        },
        paymentMethod: "cashOnDelivery",
        paymentStatus: "pending",
        notes: `Checkout via ${deliveryProvider} | ${area.name} | ETA ${area.deliveryTime}`,
        couponCode: appliedCoupon?.code,
        couponDiscount: appliedCoupon?.discount,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to create order");
        return;
      }

      if (appliedCoupon?.code) {
        await applyCouponByCode(appliedCoupon.code);
      }

      toast.success("Order placed successfully");
      setStep("confirmation");
      if (onOrderSuccess) {
        onOrderSuccess();
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("details");
    setSelectedDistrict(shippingInfo?.district || "");
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      postalCode: "",
      country: "Bangladesh",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[3rem] border border-white/10 bg-black shadow-2xl shadow-primary/5">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-black/85 p-8 backdrop-blur-md">
          <h2 className="text-2xl font-custom font-bold uppercase tracking-widest text-white">
            {step === "details" ? "COMPLETE ORDER" : "ORDER CONFIRMED"}
          </h2>
          <button
            onClick={handleClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-primary hover:text-black"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {step === "details" ? (
          <form onSubmit={handleSubmit} className="p-8 md:p-10">
            <div className="grid gap-10 md:grid-cols-2">
              <div className="space-y-8">
                <h3 className="text-sm font-custom font-bold uppercase tracking-widest text-primary">SUMMARY</h3>

                <div className="max-h-[400px] space-y-4 overflow-y-auto pr-2">
                  {items.map((item, index) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="flex gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:border-primary/30"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
                        <Image src={item.image} alt={item.title} fill className="object-contain p-2" sizes="64px" />
                      </div>
                      <div className="flex-1">
                        <h4 className="mb-1 line-clamp-1 text-xs font-black uppercase tracking-tight text-white">
                          {item.title}
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          QTY: {item.quantity} x ৳{item.price.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs font-black text-primary">
                          ৳ {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[2rem] border border-white/5 bg-white/5 p-8">
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-5">
                    <Truck className="mt-0.5 text-primary" size={18} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                        {deliveryProvider} Delivery
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-white">
                        {deliveryArea?.name || shippingInfo?.area || "Select district to see delivery area"}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
                        {deliveryArea?.deliveryTime || shippingInfo?.deliveryTime || "Delivery time will appear after district selection"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Subtotal</span>
                      <span className="text-white">৳ {summary.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                      <span>Shipping</span>
                      <span className="text-white">৳ {summary.shipping.toLocaleString()}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-green-500">
                        <span>Discount</span>
                        <span>-৳ {summary.discount?.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-white/5 pt-4 text-2xl font-black uppercase tracking-tighter text-primary">
                      <span>Total</span>
                      <span>৳ {summary.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-custom font-bold uppercase tracking-widest text-primary">COUPON</h3>
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="ENTER COUPON CODE"
                          className="w-full rounded-full border border-white/10 bg-black pl-12 pr-6 py-4 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-primary"
                          disabled={loading}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-6 rounded-full bg-primary text-black font-bold uppercase text-xs tracking-widest hover:bg-white transition-all disabled:opacity-50"
                      >
                        {couponLoading ? "..." : "APPLY"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/10 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                          <Check size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-primary">{appliedCoupon.code}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white">-৳ {appliedCoupon.discount.toLocaleString()}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-white/40 hover:text-red-500 text-xs font-bold uppercase tracking-widest"
                      >
                        REMOVE
                      </button>
                    </div>
)}
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-6">
                  <h3 className="text-sm font-custom font-bold uppercase tracking-widest text-primary">DELIVERY</h3>
                  <div className="grid gap-4">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="FULL NAME *"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full rounded-full border border-white/10 bg-black px-6 py-4 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-primary"
                      disabled={loading}
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="PHONE NUMBER *"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-full border border-white/10 bg-black px-6 py-4 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-primary"
                      disabled={loading}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="EMAIL ADDRESS *"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full rounded-full border border-white/10 bg-black px-6 py-4 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-primary"
                      disabled={loading}
                    />
                    <textarea
                      name="address"
                      placeholder="FULL ADDRESS *"
                      required
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full resize-none rounded-[2rem] border border-white/10 bg-black px-6 py-4 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-primary"
                      rows={3}
                      disabled={loading}
                    />
                    <input
                      type="text"
                      name="city"
                      placeholder="CITY / UPAZILA *"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full rounded-full border border-white/10 bg-black px-6 py-4 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-primary"
                      disabled={loading}
                    />
                    <select
                      name="district"
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full rounded-full border border-white/10 bg-black px-6 py-4 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-primary"
                      disabled={loading || Boolean(shippingInfo?.district)}
                    >
                      <option value="">SELECT DISTRICT *</option>
                      {districtOptions.map((district) => (
                        <option key={district} value={district} className="bg-black">
                          {district}
                        </option>
                      ))}
                    </select>
                    {normalizedDistrict && deliveryArea && (
                      <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-5">
                        <MapPin size={18} className="mt-0.5 text-primary" />
                        <div className="text-[10px] font-bold uppercase tracking-widest">
                          <p className="text-primary">{deliveryArea.name}</p>
                          <p className="mt-1 text-white">{normalizedDistrict}</p>
                          <p className="mt-1 text-white/40">
                            Delivery charge ৳ {summary.shipping}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-custom font-bold uppercase tracking-widest text-primary">PAYMENT</h3>
                  <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-white">Cash on Delivery</p>
                    <p className="mt-2 text-[10px] uppercase tracking-wider text-white/40">
                      Online payment removed. You will pay after delivery is confirmed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-4 border-t border-white/5 pt-10 sm:flex-row">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-full border border-white/10 px-10 py-5 text-xs font-custom font-bold uppercase tracking-widest text-white transition-all hover:bg-white/5"
                disabled={loading}
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-primary px-10 py-5 text-xs font-custom font-bold uppercase tracking-widest text-black transition-all hover:bg-white disabled:opacity-20"
              >
                {loading ? "PROCESSING..." : `PLACE ORDER - ৳ ${summary.total.toLocaleString()}`}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-16 text-center md:p-20">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-primary/10 shadow-2xl shadow-primary/10">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <h3 className="mb-4 text-3xl font-custom font-bold uppercase tracking-widest text-white">ORDER SUCCESS</h3>
            <p className="mb-12 text-xs font-bold uppercase tracking-widest text-white/40">
              Your order is confirmed and queued for delivery.
            </p>
            <button
              onClick={handleClose}
              className="rounded-full bg-primary px-12 py-5 text-sm font-custom font-bold uppercase tracking-widest text-black transition-all hover:bg-white"
            >
              CONTINUE SHOPPING
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
