"use client";

import ProductCart from "@/components/card/ProductCart";
import imageUrl from "@/const/imageUrl";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import React, {useEffect, useLayoutEffect, useState, useCallback} from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { getAProductsServerSide, getRelatedProductsServerSide } from "@/server/functions/product.fun";
import { useParams, useRouter } from "next/navigation";
import Loader from "@/components/loader/Loader";
import { IProduct } from "@/server/models/product/product.interface";
import {toast} from "sonner";
import {addToCart} from "@/server/functions/cart.fun";
import {getCookie, setCookie} from "@/server/helper/jwt.helper";
import OrderModal from "@/components/modal/OrderModal";
import {IUser} from "@/server/models/user/user.interfce";
import {isAuthenticatedAndGetUser} from "@/server/functions/auth.fun";

function ProductViewPage() {
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

    // Calculate discount percentage and main image
    const discountPercentage = productData?.originalPrice && productData?.price
        ? Math.round(((productData.originalPrice - productData.price) / productData.originalPrice) * 100)
        : 0;

    const mainImage = productData?.images?.[selectedImageIndex] || imageUrl.packageImage.image1;

    // Fetch main product with useCallback to prevent infinite re-renders
    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setLoading(true);

        try {
            const productResponse = await getAProductsServerSide(id);

            if (productResponse.data) {
                // The data should now be properly serialized
                setProductData(productResponse.data as IProduct);
            }

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

    // Fetch related products when productData updates
    const fetchRelatedProducts = useCallback(async (category: string, productId: string) => {
        try {
            const relatedResponse = await getRelatedProductsServerSide(
                category,
                productId
            );

            if (!relatedResponse.isError && relatedResponse.data) {
                setRelatedProducts(relatedResponse.data as IProduct[]);
            }
        } catch (error) {
            console.error("Error fetching related products:", error);
        }
    }, []);

    // Get user authentication
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

    // Initial data fetch
    useEffect(() => {
        if (id) {
            fetchProduct();
        }
    }, [id, fetchProduct]);

    // Fetch related products when productData is available
    useEffect(() => {
        if (productData?.category && productData?._id) {
            fetchRelatedProducts(productData.category, productData._id);
        }
    }, [productData?.category, productData?._id, fetchRelatedProducts]);

    // Set client-side flag
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Render star ratings dynamically
    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(<FaStar key={i} className="text-[#F27D31]" />);
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars.push(<FaStarHalfAlt key={i} className="text-[#F27D31]" />);
            } else {
                stars.push(<FaRegStar key={i} className="text-[#F27D31]" />);
            }
        }
        return stars;
    };

    const handleQuantityChange = (change: number) => {
        if (!productData) return;

        const newQuantity = quantity + change;
        if (newQuantity >= 1 && newQuantity <= productData.stock) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = async () => {
        if (productData?.stock === 0) {
            toast.warning("This product is out of stock.");
            return;
        }

        const cookie = await getCookie("user");
        if (!cookie) {
            toast.error("Please login to add items to cart");
            return;
        }

        const userCookie = JSON.parse(cookie);

        const response = await addToCart({
            userId: userCookie._id,
            productId: productData?._id
        });

        if (response.isError) {
            toast.error(response.message);
            return;
        }

        toast.success(response.message);

        router.push("/cart")
    };

    const directBuy = () => {
        // if(!user){
        //     return toast.warning("Please login to buy a product");
        // }
        setIsOrderModalOpen(true);
    }

    // Prepare items for OrderModal
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

    if (loading) {
        return <Loader />;
    }

    if (!productData && !loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700">Product Not Found</h2>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 bg-[#F27D31] text-white px-6 py-2 rounded-md hover:bg-[#e36e20] transition"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!isClient || !productData) {
        return <Loader />;
    }

    return (
        <div className="w-full min-h-screen bg-white">
            { loading && <Loader /> }
            {/* --- Title Section --- */}
            <section className="w-full text-center p-5 max-w-[800px] mx-auto">
                <h1 className="text-2xl md:text-3xl font-semibold text-[#F27D31] mb-3">
                    Product Details
                </h1>
                <p className="text-gray-700 text-sm md:text-base font-light leading-relaxed">
                    {productData.description || "Explore the features and specifications of our premium product."}
                </p>
            </section>

            {/* --- Product Section --- */}
            <section className="w-full flex flex-col md:flex-row justify-center items-start gap-10 px-5 lg:px-20 py-6">
                {/* --- Left: Image Gallery --- */}
                <div className="flex flex-col items-center md:items-start gap-4 mx-auto">
                    {/* Main Image */}
                    <div className="relative w-[280px] sm:w-[350px] md:w-[400px] xl:w-[500px] aspect-square bg-gray-100 rounded-md overflow-hidden shadow-md">
                        <Image
                            src={mainImage}
                            alt={productData.title}
                            fill
                            className="object-cover"
                            priority
                            quality={90}
                        />
                        {discountPercentage > 0 && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                                -{discountPercentage}%
                            </div>
                        )}
                    </div>

                    {/* Sub Images */}
                    {productData.images.length > 1 && (
                        <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                            {productData.images.map((image, index) => (
                                <div
                                    key={index}
                                    className={`relative w-[80px] sm:w-[100px] aspect-square rounded-md overflow-hidden border-2 cursor-pointer transition-all ${
                                        selectedImageIndex === index
                                            ? 'border-[#F27D31]'
                                            : 'border-gray-200'
                                    }`}
                                    onClick={() => setSelectedImageIndex(index)}
                                >
                                    <Image
                                        src={image}
                                        alt={`${productData.title} ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- Right: Product Info --- */}
                <div className="flex-1 max-w-[500px] space-y-5 mx-auto">
                    {/* Category & Brand */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded">Category: {productData.category}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">Brand: {productData.brand}</span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 text-xl">
                            {renderStars(productData.rating)}
                        </div>
                        <p className="text-gray-700 text-sm font-light">
                            ({productData.rating.toFixed(1)} Rating)
                        </p>
                    </div>

                    {/* Product Name */}
                    <h1 className="text-2xl md:text-3xl font-semibold text-[#F27D31]">
                        {productData.title}
                    </h1>

                    {/* Description */}
                    <p className="text-gray-700 leading-relaxed">
                        {productData.description}
                    </p>

                    {/* Price */}
                    <div className="flex items-center gap-3">
                        <p className="text-2xl font-semibold text-[#242222]">
                            ৳ {productData.price.toLocaleString()}
                        </p>
                        {productData.originalPrice && productData.originalPrice > productData.price && (
                            <p className="text-lg font-light line-through text-gray-500">
                                ৳ {productData.originalPrice.toLocaleString()}
                            </p>
                        )}
                    </div>

                    {/* Stock Status */}
                    <div className={`text-sm font-medium ${
                        productData.stock > 10 ? 'text-green-600' :
                            productData.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                        {productData.stock > 10 ? 'In Stock' :
                            productData.stock > 0 ? `Only ${productData.stock} left` : 'Out of Stock'}
                    </div>

                    {/* Quantity + Buttons */}
                    <div className="space-y-4 mt-6">
                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4">
                            <span className="text-gray-700 font-medium">Quantity:</span>
                            <div className="flex items-center border rounded-lg">
                                <button
                                    className="p-2 hover:bg-gray-100 transition disabled:opacity-50"
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={quantity <= 1}
                                >
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        if (value >= 1 && value <= productData.stock) {
                                            setQuantity(value);
                                        }
                                    }}
                                    className="w-12 text-center border-x focus:outline-none"
                                    min="1"
                                    max={productData.stock}
                                />
                                <button
                                    className="p-2 hover:bg-gray-100 transition disabled:opacity-50"
                                    onClick={() => handleQuantityChange(1)}
                                    disabled={quantity >= productData.stock}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <span className="text-sm text-gray-500">
                                Max: {productData.stock}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={()=> handleAddToCart()}
                                className="w-full cursor-pointer bg-[#F27D31] text-white text-lg font-semibold py-3 rounded-md hover:bg-[#e36e20] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={productData.stock === 0}
                            >
                                {productData.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                            <button
                                onClick={()=> directBuy()}
                                className="w-full cursor-pointer bg-transparent border border-[#F27D31] text-[#F27D31] text-lg font-semibold py-3 rounded-md hover:bg-[#F27D31] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={productData.stock === 0}
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>

                    {/* Tags */}
                    {productData.tags && productData.tags.length > 0 && (
                        <div className="pt-4">
                            <h3 className="font-medium text-gray-700 mb-2">Tags:</h3>
                            <div className="flex flex-wrap gap-2">
                                {productData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* --- Specifications --- */}
            {productData.specifications && Object.keys(productData.specifications).length > 0 && (
                <section className="w-full max-w-[1200px] mx-auto px-5 py-8">
                    <h2 className="text-2xl font-semibold text-[#F27D31] mb-6 text-center">
                        Specifications
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(productData.specifications).map(([key, value]) => (
                                <div key={key} className="flex border-b pb-2">
                                    <span className="font-medium text-gray-700 w-1/3 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </span>
                                    <span className="text-gray-600 w-2/3">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* --- Related Products --- */}
            {relatedProducts.length > 0 && (
                <section className="w-full text-center p-5 md:py-10 max-w-[1200px] mx-auto">
                    <h2 className="text-2xl font-semibold text-[#F27D31] mb-6">
                        Related Products
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-items-center">
                        {relatedProducts.map((product) => (
                            <ProductCart
                                key={product._id}
                                id={product._id}
                                image={product.images[0] || imageUrl.packageImage.image1}
                                name={product.title}
                                price={product.price}
                                discount={product.originalPrice ?
                                    Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0}
                                rating={product.rating}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Order Modal */}
            <OrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                items={getOrderModalItems()}
                userId={user?._id ?? ""}
                shippingInfo={{
                    provider: "Redx",
                    area: "Standard",
                    district: "To be selected",
                    cost: 0,
                    deliveryTime: "3-5 days"
                }}
                orderSummary={{
                    subtotal: productData ? productData.price * quantity : 0,
                    shipping: 0,
                    total: productData ? productData.price * quantity : 0
                }}
            />
        </div>
    );
}

export default ProductViewPage;