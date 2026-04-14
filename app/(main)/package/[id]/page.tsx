"use client";

import ProductCart from "@/components/card/ProductCart";
import imageUrl from "@/const/imageUrl";
import { Minus, Plus, ShoppingCart, Zap, CheckCircle2, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import Image from "next/image";
import React, {useEffect, useLayoutEffect, useState, useCallback} from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/components/loader/Loader";
import { toast } from "sonner";
import { addToCart } from "@/server/functions/cart.fun";
import {getCookie, setCookie} from "@/server/helper/jwt.helper";
import { IPackage } from "@/server/models/package/package.interface";
import { getAPackageServerSide, getRelatedPackagesServerSide } from "@/server/functions/package.fun";
import OrderModal from "@/components/modal/OrderModal";
import {IUser} from "@/server/models/user/user.interfce";
import {isAuthenticatedAndGetUser} from "@/server/functions/auth.fun";
import { motion } from "framer-motion";

function PackageViewPage() {
    const [packageData, setPackageData] = useState<IPackage | null>(null);
    const [relatedPackages, setRelatedPackages] = useState<IPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isClient, setIsClient] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [user, setUser] = useState<IUser | null>(null);

    const { id } = useParams();
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

    useEffect(() => {
        if (packageData && searchParams?.get('checkout') === 'true') {
            setIsOrderModalOpen(true);
        }
    }, [packageData, searchParams]);

    const discountPercentage = packageData?.originalPrice && packageData?.price
        ? Math.round(((packageData.originalPrice - packageData.price) / packageData.originalPrice) * 100)
        : 0;

    const mainImage = packageData?.imageUrl?.[selectedImageIndex] || imageUrl.packageImage.image1;

    const fetchPackage = useCallback(async () => {
        if (!id) return;
        setLoading(true);

        try {
            const packageResponse = await getAPackageServerSide(id);
            if (packageResponse.data) setPackageData(packageResponse.data as IPackage);
            if (packageResponse.isError || !packageResponse.data) {
                router.back();
                return;
            }
        } catch (error) {
            console.error("Error fetching package:", error);
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    const fetchRelatedPackages = useCallback(async (category: string, packageId: string) => {
        try {
            const relatedResponse = await getRelatedPackagesServerSide(category, packageId);
            if (!relatedResponse.isError && relatedResponse.data) setRelatedPackages(relatedResponse.data as IPackage[]);
        } catch (error) {
            console.error("Error fetching related packages:", error);
        }
    }, []);

    useLayoutEffect(() => {
        ;( async ()=> {
            const cookie = await getCookie("user");
            if (typeof cookie == 'string' ) return setUser( JSON.parse(cookie) );
            else {
                const res = await isAuthenticatedAndGetUser();
                if ( typeof res != "string" && res.isError == true) {
                    setUser(null)
                    return;
                } else if ( typeof res == "string" ) {
                    await setCookie({name:"user", value: res });
                    setUser(JSON.parse(res));
                    return;
                }
            }
        })()
    },[]);

    useEffect(() => {
        if (id) fetchPackage();
    }, [id, fetchPackage]);

    useEffect(() => {
        if (packageData?.category && packageData?._id) fetchRelatedPackages(packageData.category, packageData._id);
    }, [packageData?.category, packageData?._id, fetchRelatedPackages]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) stars.push(<FaStar key={i} className="text-primary" />);
            else if (i === fullStars + 1 && hasHalfStar) stars.push(<FaStarHalfAlt key={i} className="text-primary" />);
            else stars.push(<FaRegStar key={i} className="text-white/20" />);
        }
        return stars;
    };

    const handleQuantityChange = (change: number) => {
        const newQuantity = quantity + change;
        if (newQuantity >= 1) setQuantity(newQuantity);
    };

    const handleAddToCart = async () => {
        const cookie = await getCookie("user");

        // GUEST ADD TO CART
        if (!cookie) {
            const guestCart = JSON.parse(localStorage.getItem("gym-shop-cart") || "[]");
            const existingItemIndex = guestCart.findIndex((item: any) => item.id === packageData?._id && item.type === "package");

            if (existingItemIndex > -1) {
                guestCart[existingItemIndex].quantity += quantity;
            } else {
                guestCart.push({
                    id: packageData?._id,
                    type: "package",
                    quantity: quantity,
                    name: packageData?.title,
                    price: packageData?.price,
                    image: packageData?.imageUrl?.[0],
                    category: packageData?.category
                });
            }

            localStorage.setItem("gym-shop-cart", JSON.stringify(guestCart));
            toast.success("Added to guest cart!");
            window.dispatchEvent(new Event("cart-updated"));
            return;
        }

        // LOGGED IN
        const userCookie = JSON.parse(cookie);
        const response = await addToCart({ userId: userCookie._id, packageId: packageData?._id });
        if (response.isError) {
            toast.error(response.message);
            return;
        }
        toast.success(response.message);
        window.dispatchEvent(new Event("cart-updated"));
        router.push("/cart");
    };

    const directBuy = () => setIsOrderModalOpen(true);

    const getOrderModalItems = () => {
        if (!packageData) return [];
        return [{
            package: packageData._id as string,
            product: undefined,
            quantity: quantity,
            price: packageData.price,
            title: packageData.title,
            image: packageData.imageUrl?.[0] || imageUrl.packageImage.image1,
            type: "package" as const
        }];
    };

    if (loading || !isClient || !packageData) return <Loader />;

    return (
        <div className="w-full min-h-screen bg-black pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                    
                    {/* Left: Image Section */}
                    <div className="flex-1 space-y-6">
                        <div className="relative aspect-square bg-white/5 rounded-3xl overflow-hidden border border-white/10 group">
                            <Image
                                src={mainImage}
                                alt={packageData.title}
                                fill
                                className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                            {discountPercentage > 0 && (
                                <div className="absolute top-6 left-6 bg-primary text-black px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-xl">
                                    -{discountPercentage}%
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {packageData.imageUrl && packageData.imageUrl.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {packageData.imageUrl.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={`relative min-w-[100px] aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                                            selectedImageIndex === index ? 'border-primary' : 'border-white/10 hover:border-white/30'
                                        }`}
                                    >
                                        <Image src={image} alt={`Thumb ${index}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Info Section */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                                    {packageData.category}
                                </span>
                                {packageData.isFeatured && (
                                    <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full border border-white/10">
                                        Featured
                                    </span>
                                )}
                            </div>
                            
                            <h1 className="text-3xl md:text-5xl font-custom font-bold text-white tracking-widest uppercase mb-4 leading-tight">
                                {packageData.title}
                            </h1>

                            <div className="flex items-center gap-4">
                                <div className="flex gap-1">
                                    {renderStars(packageData.rating)}
                                </div>
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest pt-1">
                                    {packageData.rating.toFixed(1)} Rating
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <p className="text-4xl font-black text-white">
                                ৳ {packageData.price.toLocaleString()}
                            </p>
                            {packageData.originalPrice && packageData.originalPrice > packageData.price && (
                                <p className="text-xl font-bold line-through text-white/20">
                                    ৳ {packageData.originalPrice.toLocaleString()}
                                </p>
                            )}
                        </div>

                        <p className="text-white/60 leading-relaxed text-lg italic border-l-4 border-primary pl-6 py-2 bg-white/5 rounded-r-2xl">
                            {packageData.description}
                        </p>

                        {/* Included Features */}
                        {packageData.features && packageData.features.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Package Includes:</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {packageData.features.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 group hover:border-primary/30 transition-colors">
                                            <CheckCircle2 size={18} className="text-primary" />
                                            <span className="text-sm font-bold text-white uppercase tracking-tight">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6 pt-4">
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-6">
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Quantity</span>
                                <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-2 py-1">
                                    <button
                                        onClick={() => handleQuantityChange(-1)}
                                        disabled={quantity <= 1}
                                        className="p-2 text-white hover:text-primary transition disabled:opacity-20"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        readOnly
                                        className="w-12 bg-transparent text-center font-bold text-white focus:outline-none"
                                    />
                                    <button
                                        onClick={() => handleQuantityChange(1)}
                                        className="p-2 text-white hover:text-primary transition"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${packageData.isActive ? 'text-green-500' : 'text-red-500'}`}>
                                    {packageData.isActive ? 'Available Now' : 'Currently Unavailable'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!packageData.isActive}
                                    className="flex-1 h-14 bg-white/5 border border-white/10 text-white font-custom text-sm tracking-widest uppercase rounded-full hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                                >
                                    <ShoppingCart size={20} />
                                    Add to Cart
                                </button>
                                <button
                                    onClick={directBuy}
                                    disabled={!packageData.isActive}
                                    className="flex-1 h-14 bg-primary text-black font-custom text-sm tracking-widest uppercase rounded-full hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                                >
                                    <Zap size={20} className="fill-current" />
                                    Buy It Now
                                </button>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-white/5">
                            <div className="flex items-center gap-3 text-white/60">
                                <Truck size={20} className="text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Fast Delivery</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/60">
                                <ShieldCheck size={20} className="text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Secure Checkout</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/60">
                                <RotateCcw size={20} className="text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Easy Returns</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Section */}
                {relatedPackages.length > 0 && (
                    <div className="mt-20 pt-20 border-t border-white/5">
                        <h2 className="text-2xl md:text-4xl font-custom font-bold text-white tracking-widest uppercase mb-12 text-center">
                            Related Packages
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedPackages.slice(0, 4).map((pkg) => (
                                <ProductCart
                                    key={pkg._id}
                                    id={pkg._id}
                                    image={pkg.imageUrl?.[0] || imageUrl.packageImage.image1}
                                    name={pkg.title}
                                    price={pkg.price}
                                    discount={pkg.originalPrice ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100) : 0}
                                    rating={pkg.rating}
                                    category={pkg.category}
                                    forwardUrl={`/package/${pkg._id.toString()}`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                items={getOrderModalItems()}
                userId={user?._id ?? ""}
            />
        </div>
    );
}

export default PackageViewPage;