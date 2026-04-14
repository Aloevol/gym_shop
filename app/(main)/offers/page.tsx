"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Search, X, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCart from "@/components/card/ProductCart";
import { getAllPackagesServerSide } from "@/server/functions/package.fun";
import { IPackage } from "@/server/models/package/package.interface";

// Utility function to convert MongoDB objects to plain objects
interface MongooseDocument {
    toJSON?: () => Record<string, unknown>;
}

interface ObjectIdLike {
    _id?: {
        toString?: () => string;
    };
}

type ConvertibleObject = Record<string, unknown> & MongooseDocument & ObjectIdLike;

const convertToPlainObject = (obj: unknown): unknown => {
    if (obj && typeof obj === 'object') {
        const convertibleObj = obj as ConvertibleObject;
        if (convertibleObj.toJSON) {
            return convertibleObj.toJSON();
        }
        if (convertibleObj._id && typeof convertibleObj._id.toString === 'function') {
            return {
                ...convertibleObj,
                _id: convertibleObj._id.toString()
            };
        }
        if (Array.isArray(obj)) {
            return obj.map(item => convertToPlainObject(item));
        }
        const plainObj: Record<string, unknown> = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                plainObj[key] = convertToPlainObject((obj as Record<string, unknown>)[key]);
            }
        }
        return plainObj;
    }
    return obj;
};

function OfferPage() {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [packages, setPackages] = useState<IPackage[]>([]);
    const [filteredPackages, setFilteredPackages] = useState<IPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Pagination state
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        hasNext: true
    });

    // Filter states
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [stockStatus, setStockStatus] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>("newest");

    // Track if price range has been initialized
    const [isPriceRangeInitialized, setIsPriceRangeInitialized] = useState(false);

    // Load packages function with useCallback to prevent infinite re-renders
    const loadPackages = useCallback(async (page: number, initialLoad: boolean = false) => {
        try {
            if (initialLoad) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            // Build filter object based on current filters
            const filter: Record<string, unknown> = { isActive: true };

            // Price filter
            const hasCustomPriceFilter = isPriceRangeInitialized &&
                (priceRange[0] > 0 || priceRange[1] < 1000);

            if (hasCustomPriceFilter) {
                filter.price = {
                    $gte: priceRange[0],
                    $lte: priceRange[1]
                };
            }

            // Category filter
            if (selectedCategories.length > 0) {
                filter.category = { $in: selectedCategories };
            }

            // Stock status filter
            if (stockStatus.length === 1) {
                if (stockStatus.includes("in-stock")) {
                    filter.isActive = true;
                } else if (stockStatus.includes("out-of-stock")) {
                    filter.isActive = false;
                }
            }

            // Search filter
            if (searchTerm) {
                filter.$or = [
                    { title: { $regex: searchTerm, $options: 'i' } },
                    { category: { $regex: searchTerm, $options: 'i' } }
                ];
            }

            const response = await getAllPackagesServerSide({
                filter: filter,
                page: page,
                limit: pagination.limit
            });

            if (!response.isError && response.data) {
                const { packages: newPackages } = response.data as { packages: IPackage[] };

                const plainPackages = newPackages.map((pkg: unknown) => {
                    const plainPkg = convertToPlainObject(pkg) as IPackage;
                    // Ensure imageUrl is always an array of strings
                    if (plainPkg.imageUrl && !Array.isArray(plainPkg.imageUrl)) {
                        plainPkg.imageUrl = [plainPkg.imageUrl as string];
                    } else if (!plainPkg.imageUrl) {
                        plainPkg.imageUrl = [];
                    }
                    return plainPkg;
                });

                if (page === 1) {
                    setPackages(plainPackages);
                } else {
                    setPackages(prev => [...prev, ...plainPackages]);
                }

                // Check if there are more pages
                const hasMore = newPackages.length === pagination.limit;
                setPagination(prev => ({
                    ...prev,
                    page: page,
                    hasNext: hasMore
                }));
            }
        } catch (error) {
            console.error("Error loading packages:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [
        isPriceRangeInitialized,
        priceRange,
        selectedCategories,
        stockStatus,
        searchTerm,
        pagination.limit
    ]);

    // Load initial packages
    useEffect(() => {
        loadPackages(1, true);
    }, [loadPackages]);

    // Calculate price range from packages when they load
    useEffect(() => {
        if (packages.length > 0 && !isPriceRangeInitialized) {
            const prices = packages.map(pkg => pkg.price);
            const minPrice = Math.floor(Math.min(...prices));
            const maxPrice = Math.ceil(Math.max(...prices));

            // Add 10% buffer to max price for better UX
            const bufferedMaxPrice = Math.max(maxPrice + 10, Math.ceil(maxPrice * 1.1));

            setPriceRange([minPrice, bufferedMaxPrice]);
            setIsPriceRangeInitialized(true);
        }
    }, [packages, isPriceRangeInitialized]);

    // Apply client-side sorting and additional filtering
    useEffect(() => {
        const filtered = [...packages];

        // Apply sorting
        switch (sortBy) {
            case "price-low":
                filtered.sort((a, b) => a.price - b.price);
                break;
            case "price-high":
                filtered.sort((a, b) => b.price - a.price);
                break;
            case "rating":
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case "name":
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "newest":
            default:
                filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                break;
        }

        setFilteredPackages(filtered);
    }, [packages, sortBy]);

    // Load more packages function
    const loadMorePackages = useCallback(() => {
        if (!loadingMore && pagination.hasNext) {
            const nextPage = pagination.page + 1;
            loadPackages(nextPage);
        }
    }, [loadingMore, pagination.page, pagination.hasNext, loadPackages]);

    // Scroll event handler for infinite scroll
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container || loadingMore || !pagination.hasNext) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const scrollThreshold = 100;

        if (scrollTop + clientHeight >= scrollHeight - scrollThreshold) {
            loadMorePackages();
        }
    }, [loadingMore, pagination.hasNext, loadMorePackages]);

    // Add scroll event listener
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    // Reload packages when filters change
    useEffect(() => {
        if (isPriceRangeInitialized) {
            loadPackages(1, true);
        }
    }, [selectedCategories, stockStatus, searchTerm, isPriceRangeInitialized, loadPackages]);

    // Separate effect for price range changes with debounce
    useEffect(() => {
        if (isPriceRangeInitialized) {
            const timeoutId = setTimeout(() => {
                loadPackages(1, true);
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    }, [priceRange, isPriceRangeInitialized, loadPackages]);

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleStockStatusToggle = (status: string) => {
        setStockStatus(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const clearAllFilters = () => {
        // Reset to calculated price range based on current packages
        if (packages.length > 0) {
            const prices = packages.map(pkg => pkg.price);
            const minPrice = Math.floor(Math.min(...prices));
            const maxPrice = Math.ceil(Math.max(...prices));
            const bufferedMaxPrice = Math.max(maxPrice + 10, Math.ceil(maxPrice * 1.1));
            setPriceRange([minPrice, bufferedMaxPrice]);
        }
        setSelectedCategories([]);
        setStockStatus([]);
        setSearchTerm("");
        setSortBy("newest");
    };

    // Get unique categories
    const uniqueCategories = [...new Set(packages.map(pkg => pkg.category))];

    // Calculate actual min and max prices for display
    const actualMinPrice = packages.length > 0 ? Math.min(...packages.map(p => p.price)) : 0;
    const actualMaxPrice = packages.length > 0 ? Math.max(...packages.map(p => p.price)) : 1000;

    return (
        <section className="w-full bg-black min-h-screen pt-20">
            <section className="max-w-7xl mx-auto py-16 px-6 text-center">
                <h1 className="text-3xl md:text-6xl font-custom font-bold text-white uppercase tracking-widest mb-6">
                    COMBO <span className="text-primary">OFFERS</span>
                </h1>
                <p className="text-white/40 font-bold uppercase tracking-widest text-sm max-w-3xl mx-auto leading-relaxed">
                    Experience year-round comfort with our premium curated performance packages.
                    Explore our exclusive fitness combos crafted for your goals and save more while training smarter.
                </p>
            </section>

            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex flex-col lg:flex-row gap-12 pb-24">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-64 shrink-0 space-y-10">
                        <div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 ml-2">Categories</h3>
                            <div className="space-y-3">
                                {uniqueCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => handleCategoryToggle(cat)}
                                        className={`block w-full text-left text-sm font-bold uppercase tracking-widest py-2 transition-colors ${selectedCategories.includes(cat) ? 'text-primary' : 'text-white/60 hover:text-white'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6 ml-2">Price Range</h3>
                            <div className="px-2">
                                <input
                                    type="range"
                                    min="0"
                                    max="5000"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="w-full accent-primary bg-white/10"
                                />
                                <div className="flex justify-between mt-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                    <span>TK {priceRange[0]}</span>
                                    <span>TK {priceRange[1]}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <button
                                onClick={clearAllFilters}
                                className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-white transition-colors ml-2"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-[4/5] bg-white/5 rounded-3xl animate-pulse border border-white/10" />
                                ))}
                            </div>
                        ) : filteredPackages.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredPackages.map((pkg) => (
                                    <ProductCart
                                        id={pkg._id}
                                        key={pkg._id?.toString()}
                                        image={pkg.imageUrl && pkg.imageUrl.length > 0 ? pkg.imageUrl[0] : "/placeholder.jpg"}
                                        name={pkg.title}
                                        category={pkg.category}
                                        price={pkg.originalPrice || pkg.price * 1.2}
                                        priceAfterDiscount={pkg.price}
                                        discount={pkg.originalPrice ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100) : 20}
                                        rating={pkg.rating || 5}
                                        isActive={pkg.isActive}
                                        brand={pkg.category}
                                        forwardUrl={`/package/${pkg._id.toString()}`}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white/5 border border-white/10 rounded-[3rem]">
                                <Package className="h-16 w-16 mx-auto mb-6 text-white/10" />
                                <h3 className="text-2xl font-custom font-bold text-white uppercase tracking-widest mb-4">No packages found</h3>
                                <button
                                    onClick={clearAllFilters}
                                    className="bg-primary text-black font-custom font-bold py-3 px-10 rounded-full hover:bg-white transition-all text-xs uppercase"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}

                        {pagination.hasNext && (
                            <div className="mt-16 flex justify-center">
                                <button
                                    onClick={loadMorePackages}
                                    disabled={loadingMore}
                                    className="border border-white/20 text-white px-12 py-4 rounded-full font-custom text-xs font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all"
                                >
                                    {loadingMore ? "Loading..." : "Load More Offers"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

// FilterSidebar Component
interface FilterSidebarProps {
    priceRange: number[];
    setPriceRange: (range: number[]) => void;
    selectedCategories: string[];
    onCategoryToggle: (category: string) => void;
    stockStatus: string[];
    onStockStatusToggle: (status: string) => void;
    uniqueCategories: string[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortBy: string;
    setSortBy: (sort: string) => void;
    onClearFilters: () => void;
    packageCount: number;
    totalPackageCount: number;
    actualMinPrice: number;
    actualMaxPrice: number;
    isLoading: boolean;
}

const FilterSidebar = ({
                           priceRange,
                           setPriceRange,
                           selectedCategories,
                           onCategoryToggle,
                           stockStatus,
                           onStockStatusToggle,
                           uniqueCategories,
                           searchTerm,
                           setSearchTerm,
                           sortBy,
                           setSortBy,
                           onClearFilters,
                           packageCount,
                           actualMinPrice,
                           actualMaxPrice,
                           isLoading
                       }: FilterSidebarProps) => {
    const [categorySearch, setCategorySearch] = useState("");
    const [localPriceRange, setLocalPriceRange] = useState(priceRange);

    const filteredCategories = uniqueCategories.filter(category =>
        category.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const activeFilterCount = [
        priceRange[0] > actualMinPrice || priceRange[1] < actualMaxPrice,
        selectedCategories.length > 0,
        stockStatus.length > 0,
        searchTerm
    ].filter(Boolean).length;

    const maxSliderValue = Math.max(actualMaxPrice + 10, Math.ceil(actualMaxPrice * 1.1));

    useEffect(() => {
        setLocalPriceRange(priceRange);
    }, [priceRange]);

    const handlePriceRangeChange = (newRange: number[]) => {
        setLocalPriceRange(newRange);
    };

    const applyPriceFilter = () => {
        setPriceRange(localPriceRange);
    };

    const resetPriceFilter = () => {
        const resetRange = [actualMinPrice, actualMaxPrice];
        setLocalPriceRange(resetRange);
        setPriceRange(resetRange);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <p className="text-sm text-gray-600">
                        {packageCount} packages
                        {activeFilterCount > 0 && ` • ${activeFilterCount} active filters`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Price range: ${actualMinPrice} - ${actualMaxPrice}
                    </p>
                </div>
                {activeFilterCount > 0 && (
                    <Button
                        onClick={onClearFilters}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Clear All"}
                    </Button>
                )}
            </div>

            {/* Sort Options */}
            <div className="bg-white p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Sort By</h3>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-amber-400 outline-none"
                    disabled={isLoading}
                >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="name">Name A-Z</option>
                </select>
            </div>

            {/* Search */}
            <div className="bg-white p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Search</h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search packages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-amber-400 outline-none"
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Filter by Price */}
            <div className="bg-white p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Filter by Price</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm text-gray-700">
                        <span>${localPriceRange[0]}</span>
                        <span>${localPriceRange[1]}</span>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="range"
                                min={actualMinPrice}
                                max={maxSliderValue}
                                step="1"
                                value={localPriceRange[0]}
                                onChange={(e) => handlePriceRangeChange([parseInt(e.target.value), localPriceRange[1]])}
                                className="absolute w-full top-4 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer z-20"
                                disabled={isLoading}
                            />
                            <input
                                type="range"
                                min={actualMinPrice}
                                max={maxSliderValue}
                                step="1"
                                value={localPriceRange[1]}
                                onChange={(e) => handlePriceRangeChange([localPriceRange[0], parseInt(e.target.value)])}
                                className="absolute w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer z-10"
                                disabled={isLoading}
                            />
                            <div
                                className="absolute h-2 bg-[#F27D31] rounded-lg z-0"
                                style={{
                                    left: `${((localPriceRange[0] - actualMinPrice) / (maxSliderValue - actualMinPrice)) * 100}%`,
                                    right: `${100 - ((localPriceRange[1] - actualMinPrice) / (maxSliderValue - actualMinPrice)) * 100}%`
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-12">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">Min Price</label>
                            <input
                                type="number"
                                value={localPriceRange[0]}
                                onChange={(e) => handlePriceRangeChange([parseInt(e.target.value) || actualMinPrice, localPriceRange[1]])}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                min={actualMinPrice}
                                max={localPriceRange[1]}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 block mb-1">Max Price</label>
                            <input
                                type="number"
                                value={localPriceRange[1]}
                                onChange={(e) => handlePriceRangeChange([localPriceRange[0], parseInt(e.target.value) || maxSliderValue])}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                min={localPriceRange[0]}
                                max={maxSliderValue}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Min: ${actualMinPrice}</span>
                        <span>Max: ${actualMaxPrice}</span>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={applyPriceFilter}
                            size="sm"
                            className="flex-1 bg-[#F27D31] hover:bg-[#e56f28]"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Price"}
                        </Button>
                        <Button
                            onClick={resetPriceFilter}
                            variant="outline"
                            size="sm"
                            className="text-gray-600 border-gray-300 hover:bg-gray-50"
                            disabled={isLoading}
                        >
                            Reset
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filter by Category */}
            <div className="bg-white p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Filter by Category</h3>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#F27D31]"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2 text-sm text-gray-700 max-h-40 overflow-y-auto">
                        {filteredCategories.map((category) => (
                            <label key={category} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category)}
                                    onChange={() => onCategoryToggle(category)}
                                    className="rounded border-gray-300 text-[#F27D31] focus:ring-[#F27D31]"
                                    disabled={isLoading}
                                />
                                <span className="capitalize">{category}</span>
                            </label>
                        ))}
                        {filteredCategories.length === 0 && (
                            <p className="text-gray-500 text-sm py-2">No categories found</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Stock Status */}
            <div className="bg-white p-4 border rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Availability</h3>
                <div className="space-y-2 text-sm text-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                            type="checkbox"
                            checked={stockStatus.includes("in-stock")}
                            onChange={() => onStockStatusToggle("in-stock")}
                            className="rounded border-gray-300 text-[#F27D31] focus:ring-[#F27D31]"
                            disabled={isLoading}
                        />
                        <span>In Stock</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                            type="checkbox"
                            checked={stockStatus.includes("out-of-stock")}
                            onChange={() => onStockStatusToggle("out-of-stock")}
                            className="rounded border-gray-300 text-[#F27D31] focus:ring-[#F27D31]"
                            disabled={isLoading}
                        />
                        <span>Out of Stock</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default OfferPage;