"use client";

import ProductCart from "@/components/card/ProductCart";
import imageUrl from "@/const/imageUrl";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import React, {useEffect, useLayoutEffect, useState, useCallback} from "react";
import { FaStar, FaStarHalfAlt, FaRegStar, FaCheck } from "react-icons/fa";
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

    // Calculate discount percentage and main image
    const discountPercentage = packageData?.originalPrice && packageData?.price
        ? Math.round(((packageData.originalPrice - packageData.price) / packageData.originalPrice) * 100)
        : 0;

    const mainImage = packageData?.imageUrl?.[selectedImageIndex] || imageUrl.packageImage.image1;

    // Fetch main package with useCallback to prevent infinite re-renders
    const fetchPackage = useCallback(async () => {
        if (!id) return;
        setLoading(true);

        try {
            const packageResponse = await getAPackageServerSide(id);

            if (packageResponse.data) {
                setPackageData(packageResponse.data as IPackage);
            }

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

    // Fetch related packages when packageData updates
    const fetchRelatedPackages = useCallback(async (category: string, packageId: string) => {
        try {
            const relatedResponse = await getRelatedPackagesServerSide(
                category,
                packageId
            );

            if (!relatedResponse.isError && relatedResponse.data) {
                setRelatedPackages(relatedResponse.data as IPackage[]);
            }
        } catch (error) {
            console.error("Error fetching related packages:", error);
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
            fetchPackage();
        }
    }, [id, fetchPackage]);

    // Fetch related packages when packageData is available
    useEffect(() => {
        if (packageData?.category && packageData?._id) {
            fetchRelatedPackages(packageData.category, packageData._id);
        }
    }, [packageData?.category, packageData?._id, fetchRelatedPackages]);

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
        const newQuantity = quantity + change;
        if (newQuantity >= 1) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = async () => {
        const cookie = await getCookie("user");
        if (!cookie) {
            toast.error("Please login to add items to cart");
            return;
        }

        const userCookie = JSON.parse(cookie);

        const response = await addToCart({
            userId: userCookie._id,
            packageId: packageData?._id
        });

        if (response.isError) {
            toast.error(response.message);
            return;
        }

        toast.success(response.message);
        router.push("/cart");
    };

    const directBuy = () => {
        // if (!user){
        //     return toast.warning("Please login to buy a product");
        // }
        setIsOrderModalOpen(true);
    }

    // Prepare items for OrderModal
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

    if (loading) {
        return <Loader />;
    }

    if (!packageData && !loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700">Package Not Found</h2>
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

    // Only render the main content when we're on the client side and have data
    if (!isClient || !packageData) {
        return <Loader />;
    }

    return (
        <div className="w-full min-h-screen bg-white">
            {loading && <Loader />}

            {/* --- Title Section --- */}
            <section className="w-full text-center p-5 max-w-[800px] mx-auto">
                <h1 className="text-2xl md:text-3xl font-semibold text-[#F27D31] mb-3">
                    Package Details
                </h1>
                <p className="text-gray-700 text-sm md:text-base font-light leading-relaxed">
                    {packageData.description || "Explore the features and benefits of our premium package."}
                </p>
            </section>

            {/* --- Package Section --- */}
            <section className="w-full flex flex-col md:flex-row justify-center items-start gap-10 px-5 lg:px-20 py-6">
                {/* --- Left: Image Gallery --- */}
                <div className="flex flex-col items-center md:items-start gap-4 mx-auto">
                    {/* Main Image */}
                    <div className="relative w-[280px] sm:w-[350px] md:w-[400px] xl:w-[500px] aspect-square bg-gray-100 rounded-md overflow-hidden shadow-md">
                        <Image
                            src={mainImage}
                            alt={packageData.title}
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
                    {packageData.imageUrl && packageData.imageUrl.length > 1 && (
                        <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                            {packageData.imageUrl.map((image, index) => (
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
                                        alt={`${packageData.title} ${index + 1}`}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- Right: Package Info --- */}
                <div className="flex-1 max-w-[500px] space-y-5 mx-auto">
                    {/* Category */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded">Category: {packageData.category}</span>
                        {packageData.isFeatured && (
                            <span className="bg-[#F27D31] text-white px-2 py-1 rounded">Featured</span>
                        )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1 text-xl">
                            {renderStars(packageData.rating)}
                        </div>
                        <p className="text-gray-700 text-sm font-light">
                            ({packageData.rating.toFixed(1)} Rating)
                        </p>
                    </div>

                    {/* Package Name */}
                    <h1 className="text-2xl md:text-3xl font-semibold text-[#F27D31]">
                        {packageData.title}
                    </h1>

                    {/* Description */}
                    <p className="text-gray-700 leading-relaxed">
                        {packageData.description}
                    </p>

                    {/* Price */}
                    <div className="flex items-center gap-3">
                        <p className="text-2xl font-semibold text-[#242222]">
                            ৳ {packageData.price.toLocaleString()}
                        </p>
                        {packageData.originalPrice && packageData.originalPrice > packageData.price && (
                            <p className="text-lg font-light line-through text-gray-500">
                                ৳ {packageData.originalPrice.toLocaleString()}
                            </p>
                        )}
                    </div>

                    {/* Features */}
                    {packageData.features && packageData.features.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-700">Package Includes:</h3>
                            <div className="space-y-2">
                                {packageData.features.map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <FaCheck className="text-green-500 flex-shrink-0" />
                                        <span className="text-gray-600">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Availability Status */}
                    <div className={`text-sm font-medium ${packageData.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {packageData.isActive ? 'Available' : 'Currently Unavailable'}
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
                                        if (value >= 1) {
                                            setQuantity(value);
                                        }
                                    }}
                                    className="w-12 text-center border-x focus:outline-none"
                                    min="1"
                                />
                                <button
                                    className="p-2 hover:bg-gray-100 transition"
                                    onClick={() => handleQuantityChange(1)}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleAddToCart}
                                className="w-full cursor-pointer bg-[#F27D31] text-white text-lg font-semibold py-3 rounded-md hover:bg-[#e36e20] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!packageData.isActive}
                            >
                                {packageData.isActive ? 'Add to Cart' : 'Unavailable'}
                            </button>
                            <button
                                onClick={directBuy}
                                className="w-full cursor-pointer bg-transparent border border-[#F27D31] text-[#F27D31] text-lg font-semibold py-3 rounded-md hover:bg-[#F27D31] hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!packageData.isActive}
                            >
                                Buy Now
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Related Packages --- */}
            {relatedPackages.length > 0 && (
                <section className="w-full text-center p-5 md:py-10 max-w-[1200px] mx-auto">
                    <h2 className="text-2xl font-semibold text-[#F27D31] mb-6">
                        Related Packages
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 justify-items-center">
                        {relatedPackages.map((pkg) => (
                            <ProductCart
                                key={pkg._id}
                                id={pkg._id}
                                image={pkg.imageUrl?.[0] || imageUrl.packageImage.image1}
                                name={pkg.title}
                                price={pkg.price}
                                discount={pkg.originalPrice ?
                                    Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100) : 0}
                                rating={pkg.rating}
                                forwardUrl={`/package/${pkg._id.toString()}`}
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
            />
        </div>
    );
}

export default PackageViewPage;