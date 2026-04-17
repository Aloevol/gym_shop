"use client";

import ProductCart from "@/components/card/ProductCart";
import imageUrl from "@/const/imageUrl";
import { Minus, Plus, ShoppingCart, Zap, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import Image from "next/image";
import React, {useEffect, useLayoutEffect, useState, useCallback, useRef} from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { getAProductsServerSide, getRelatedProductsServerSide } from "@/server/functions/product.fun";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Loader from "@/components/loader/Loader";
import { IProduct } from "@/server/models/product/product.interface";
import {toast} from "sonner";
import {addToCart} from "@/server/functions/cart.fun";
import {getCookie, setCookie} from "@/server/helper/jwt.helper";
import OrderModal from "@/components/modal/OrderModal";
import {IUser} from "@/server/models/user/user.interfce";
import {isAuthenticatedAndGetUser} from "@/server/functions/auth.fun";
import { motion } from "framer-motion";

export default function ProductContent() {
    const [productData, setProductData] = useState<IProduct | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isClient, setIsClient] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [user, setUser] = useState<IUser | null>(null);

    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (productData && searchParams.get("checkout") === "true") {
            setIsOrderModalOpen(true);
        }
    }, [productData, searchParams]);

    const discountPercentage = productData?.originalPrice && productData?.price
        ? Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100)
        : 0;

    const mainImage = productData?.images?.[selectedImageIndex] || imageUrl.packageImage.image1;

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);

        try {
            const productResponse = await getAProductsServerSide(id);
            if (productResponse.data) setProductData(productResponse.data as IProduct);
            if (productResponse.isError || !productResponse.data) {
                router.back();
                return;
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            router.back();
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    const fetchRelatedProducts = useCallback(async (category: string, productId: string) => {
        try {
            const relatedResponse = await getRelatedProductsServerSide(category, productId);
            if (!relatedResponse.isError && relatedResponse.data) setRelatedProducts(relatedResponse.data as IProduct[]);
        } catch (error) {
            console.error("Error fetching related products:", error);
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
        if (id) fetchProduct();
    }, [id, fetchProduct]);

    useEffect(() => {
        if (productData?.category && productData?._id) fetchRelatedProducts(productData.category, productData._id);
    }, [productData?.category, productData?._id, fetchRelatedProducts]);

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
        if (!productData) return;
        const newQuantity = quantity + change;
        if (newQuantity >= 1 && newQuantity <= productData.stock) setQuantity(newQuantity);
    };

    const handleAddToCart = async () => {
        if (productData?.stock === 0) {
            toast.warning("This product is out of stock.");
            return;
        }
        const cookie = await getCookie("user");
        
        // GUEST ADD TO CART
        if (!cookie) {
            const guestCart = JSON.parse(localStorage.getItem("gym-shop-cart") || "[]");
            const existingItemIndex = guestCart.findIndex((item: any) => item.id === productData?._id && item.type === "product");

            if (existingItemIndex > -1) {
                guestCart[existingItemIndex].quantity += quantity;
            } else {
                guestCart.push({
                    id: productData?._id,
                    type: "product",
                    quantity: quantity,
                    name: productData?.title,
                    price: productData?.price,
                    image: productData?.images?.[0],
                    category: productData?.category
                });
            }

            localStorage.setItem("gym-shop-cart", JSON.stringify(guestCart));
            toast.success("Added to guest cart!");
            window.dispatchEvent(new Event("cart-updated"));
            return;
        }

        // LOGGED IN
        const userCookie = JSON.parse(cookie);
        const response = await addToCart({ userId: userCookie._id, productId: productData?._id });
        if (response.isError) {
            toast.error(response.message);
            return;
        }
        toast.success(response.message);
        window.dispatchEvent(new Event("cart-updated"));
        router.push("/cart")
    };

    const directBuy = () => setIsOrderModalOpen(true);
    const handleOrderSuccess = () => {
        setIsOrderModalOpen(false);
        router.push("/");
    };

    const getOrderModalItems = () => {
        if (!productData) return [];
        return [{
            product: productData._id as string,
            package: undefined,
            quantity: quantity,
            price: productData.price,
            title: productData.title,
            image: productData.images?.[0] || imageUrl.packageImage.image1,
            type: "product" as const
        }];
    };

    if (loading || !isClient || !productData) return <Loader />;

    return (
        <div className="w-full min-h-screen bg-black pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                
                {/* Product Layout */}
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
                    
                    {/* Left: Image Section */}
                    <div className="flex-1 space-y-6">
                        <div className="relative aspect-square bg-white/5 rounded-3xl overflow-hidden border border-white/10 group">
                            <Image
                                src={mainImage}
                                alt={productData.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
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
                        {productData.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {productData.images.map((image, index) => (
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
                                    {productData.category}
                                </span>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">
                                    Brand: {productData.brand}
                                </span>
                            </div>
                            
                            <h1 className="text-3xl md:text-5xl font-custom font-bold text-white tracking-widest uppercase mb-4 leading-tight">
                                {productData.title}
                            </h1>

                            <div className="flex items-center gap-4">
                                <div className="flex gap-1">
                                    {renderStars(productData.rating)}
                                </div>
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest pt-1">
                                    {productData.rating.toFixed(1)} Rating
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <p className="text-4xl font-black text-white">
                                ৳ {productData.price.toLocaleString()}
                            </p>
                            {productData.originalPrice && productData.originalPrice > productData.price && (
                                <p className="text-xl font-bold line-through text-white/20">
                                    ৳ {productData.originalPrice.toLocaleString()}
                                </p>
                            )}
                        </div>

                        <p className="text-white/60 leading-relaxed text-lg">
                            {productData.description}
                        </p>

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
                                        disabled={quantity >= productData.stock}
                                        className="p-2 text-white hover:text-primary transition disabled:opacity-20"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                                    {productData.stock > 0 ? `${productData.stock} In Stock` : 'Sold Out'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={productData.stock === 0}
                                    className="flex-1 h-14 bg-white/5 border border-white/10 text-white font-custom text-sm tracking-widest uppercase rounded-full hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 disabled:opacity-20"
                                >
                                    <ShoppingCart size={20} />
                                    Add to Cart
                                </button>
                                <button
                                    onClick={directBuy}
                                    disabled={productData.stock === 0}
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

                {/* Specs Section */}
                {productData.specifications && Object.keys(productData.specifications).length > 0 && (
                    <div className="mt-20 pt-20 border-t border-white/5">
                        <h2 className="text-2xl md:text-4xl font-custom font-bold text-white tracking-widest uppercase mb-12 text-center">
                            Specifications
                        </h2>
                        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            {Object.entries(productData.specifications).map(([key, value]) => (
                                <div key={key} className="flex justify-between py-4 border-b border-white/5">
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20 pt-20 border-t border-white/5">
                        <h2 className="text-2xl md:text-4xl font-custom font-bold text-white tracking-widest uppercase mb-12 text-center">
                            Related Products
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedProducts.slice(0, 4).map((product) => (
                                <ProductCart
                                    key={product._id}
                                    id={product._id}
                                    image={product.images[0] || imageUrl.packageImage.image1}
                                    name={product.title}
                                    price={product.price}
                                    discount={product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0}
                                    rating={product.rating}
                                    category={product.category}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onOrderSuccess={handleOrderSuccess}
                items={getOrderModalItems()}
                userId={user?._id ?? ""}
            />
        </div>
    );
}
