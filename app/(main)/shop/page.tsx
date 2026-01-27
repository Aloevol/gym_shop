"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Search, X, Star, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCart from "@/components/card/ProductCart";
import { getAllProductsServerSide } from "@/server/functions/product.fun";
import { IProduct } from "@/server/models/product/product.interface";

interface PaginationState {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
}

function ShopPage() {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [stockStatus, setStockStatus] = useState<"inStock" | "outOfStock" | "all">("all");
    const [minRating, setMinRating] = useState(0);
    const [brandSearch, setBrandSearch] = useState("");

    // Product and loading states
    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
        hasNext: false
    });

    // Extract unique brands and categories from products
    const availableBrands = useMemo(() =>
            Array.from(new Set(products.map(product => product.brand))).filter(Boolean),
        [products]);

    const availableCategories = useMemo(() =>
            Array.from(new Set(products.map(product => product.category))).filter(Boolean),
        [products]);

    // Load products function - UPDATED with server-side rating filtering
    const loadProducts = useCallback(async (page: number = 1, isInitialLoad: boolean = false) => {
        try {
            if (isInitialLoad) {
                setLoading(true);
            } else {
                setLoadingMore(true);
            }

            // Build filter object based on current filters
            const filter: Record<string, unknown> = { isActive: true };

            // Search filter
            if (searchQuery) {
                filter.$or = [
                    { title: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } },
                    { brand: { $regex: searchQuery, $options: 'i' } },
                    { category: { $regex: searchQuery, $options: 'i' } }
                ];
            }

            // Price filter
            if (priceRange[0] > 0 || priceRange[1] < 1000) {
                filter.price = {
                    $gte: priceRange[0],
                    $lte: priceRange[1]
                };
            }

            // Brand filter
            if (selectedBrands.length > 0) {
                filter.brand = { $in: selectedBrands };
            }

            // Category filter
            if (selectedCategories.length > 0) {
                filter.category = { $in: selectedCategories };
            }

            // Stock status filter - FIXED: Use actual stock field
            if (stockStatus === 'inStock') {
                filter.stock = { $gt: 0 };
            } else if (stockStatus === 'outOfStock') {
                filter.stock = { $lte: 0 };
            }

            // Rating filter - ADDED: Server-side rating filtering
            if (minRating > 0) {
                filter.rating = { $gte: minRating };
            }

            const response = await getAllProductsServerSide({
                filter: Object.keys(filter).length > 0 ? filter : { isActive: true },
                page,
                limit: pagination.limit
            });

            if (!response.isError && response.data) {
                const { products: newProducts, pagination: newPagination } = response.data as { products: IProduct[], pagination:{ page: number, limit: number, total: number,hasNext: boolean, totalPages: number  }  };

                if (page === 1) {
                    setProducts(newProducts || []);
                } else {
                    setProducts(prev => [...prev, ...(newProducts || [])]);
                }

                setPagination({
                    page: newPagination.page,
                    limit: newPagination.limit,
                    total: newPagination.total,
                    totalPages: newPagination.totalPages,
                    hasNext: newPagination.hasNext
                });
            } else {
                console.error("Failed to load products:", response.message);
            }
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [
        searchQuery,
        priceRange,
        selectedBrands,
        selectedCategories,
        stockStatus,
        minRating,
        pagination.limit
    ]);

    // Load products on component mount and when filters change - UPDATED
    useEffect(() => {
        loadProducts(1, true);
    }, [loadProducts]);

    // Load more products for infinite scroll
    const loadMoreProducts = useCallback(() => {
        if (pagination.hasNext && !loadingMore) {
            loadProducts(pagination.page + 1);
        }
    }, [pagination.hasNext, pagination.page, loadingMore, loadProducts]);

    // Handle scroll for infinite loading
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            loadMoreProducts();
        }
    }, [loadMoreProducts]);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setPriceRange([0, 1000]);
        setSelectedBrands([]);
        setSelectedCategories([]);
        setStockStatus("all");
        setMinRating(0);
        setSearchQuery("");
        setBrandSearch("");
    }, []);

    const toggleBrand = useCallback((brand: string) => {
        setSelectedBrands(prev =>
            prev.includes(brand)
                ? prev.filter(b => b !== brand)
                : [...prev, brand]
        );
    }, []);

    const toggleCategory = useCallback((category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    }, []);

    const hasActiveFilters =
        priceRange[0] > 0 ||
        priceRange[1] < 1000 ||
        selectedBrands.length > 0 ||
        selectedCategories.length > 0 ||
        stockStatus !== "all" ||
        minRating > 0;

    return (
        <div className="w-full bg-white min-h-screen pt-6">
            <div className="w-full max-w-[1500px] mx-auto flex flex-col md:flex-row h-[100svh] overflow-hidden">

                {/* --- MOBILE TOP BAR --- */}
                <div className="flex md:hidden justify-between items-center p-4 bg-white border-b shadow-sm z-20 sticky top-0">
                    <div className="relative w-[75%]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-amber-400 outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Button
                        onClick={() => setIsFilterOpen(true)}
                        variant="outline"
                        className="border-amber-400 text-amber-500 flex items-center gap-2 relative"
                    >
                        <Filter className="w-4 h-4" />
                        Filter
                        {hasActiveFilters && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full"></span>
                        )}
                    </Button>
                </div>

                {/* --- DESKTOP SIDEBAR --- */}
                <aside className="hidden md:block md:w-[350px] lg:w-[400px] h-full border-gray-200 p-5 overflow-y-auto">
                    <FilterSidebar
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        selectedBrands={selectedBrands}
                        toggleBrand={toggleBrand}
                        selectedCategories={selectedCategories}
                        toggleCategory={toggleCategory}
                        stockStatus={stockStatus}
                        setStockStatus={setStockStatus}
                        minRating={minRating}
                        setMinRating={setMinRating}
                        clearAllFilters={clearAllFilters}
                        hasActiveFilters={hasActiveFilters}
                        availableBrands={availableBrands}
                        availableCategories={availableCategories}
                        brandSearch={brandSearch}
                        setBrandSearch={setBrandSearch}
                        loading={loading}
                    />
                </aside>

                {/* --- PRODUCT GRID --- */}
                <main className="w-full h-full bg-gray-100 overflow-y-auto">
                    {/* Desktop Search Bar */}
                    <div className="hidden md:flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search products, brands, categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm focus:ring-1 focus:ring-amber-400 outline-none"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {loading ? "Loading..." : `${products.length} products found`}
              </span>
                            {hasActiveFilters && (
                                <Button
                                    onClick={clearAllFilters}
                                    variant="outline"
                                    size="sm"
                                    className="text-gray-600 border-gray-300"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div
                        className="p-4 overflow-y-auto h-full"
                        onScroll={handleScroll}
                    >
                        {loading ? (
                            // Loading skeleton
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <div key={index} className="w-full max-w-[280px] border-2 rounded-2xl p-4 animate-pulse">
                                        <div className="w-full aspect-[1/1.1] bg-gray-200 rounded-xl mb-4"></div>
                                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                                    </div>
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No products found</p>
                                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or search terms</p>
                                <Button
                                    onClick={clearAllFilters}
                                    className="mt-4 bg-amber-400 hover:bg-amber-500"
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
                                    {products.map((product) => (
                                        <ProductCart
                                            id={product._id}
                                            key={product._id.toString()}
                                            name={product.title}
                                            category={product.category}
                                            price={product.originalPrice || product.price + (product.price * 0.2)}
                                            discount={product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 20}
                                            priceAfterDiscount={product.price}
                                            image={product.images?.[0] || "/placeholder-image.jpg"}
                                            rating={product.rating || 0}
                                            brand={product.brand}
                                            isActive={product.isActive}
                                        />
                                    ))}
                                </div>

                                {/* Load More */}
                                {pagination.hasNext && (
                                    <div className="flex justify-center mt-8">
                                        <Button
                                            onClick={loadMoreProducts}
                                            disabled={loadingMore}
                                            variant="outline"
                                            className="flex items-center gap-2"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                    Loading...
                                                </>
                                            ) : (
                                                'Load More Products'
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>

                {/* --- MOBILE DRAWER FILTER --- */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <>
                            {/* Overlay */}
                            <motion.div
                                className="fixed inset-0 bg-black/40 z-30"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFilterOpen(false)}
                            />

                            {/* Sidebar Drawer */}
                            <motion.aside
                                className="fixed top-0 right-0 w-[85%] sm:w-[60%] h-full bg-white shadow-lg z-40 p-5 overflow-y-auto"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "tween", duration: 0.3 }}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-800">Filters</h2>
                                    <div className="flex items-center gap-2">
                                        {hasActiveFilters && (
                                            <Button
                                                onClick={clearAllFilters}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                            >
                                                Clear All
                                            </Button>
                                        )}
                                        <button
                                            onClick={() => setIsFilterOpen(false)}
                                            className="text-gray-600 hover:text-gray-800 p-1"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <FilterSidebar
                                    priceRange={priceRange}
                                    setPriceRange={setPriceRange}
                                    selectedBrands={selectedBrands}
                                    toggleBrand={toggleBrand}
                                    selectedCategories={selectedCategories}
                                    toggleCategory={toggleCategory}
                                    stockStatus={stockStatus}
                                    setStockStatus={setStockStatus}
                                    minRating={minRating}
                                    setMinRating={setMinRating}
                                    clearAllFilters={clearAllFilters}
                                    hasActiveFilters={hasActiveFilters}
                                    availableBrands={availableBrands}
                                    availableCategories={availableCategories}
                                    brandSearch={brandSearch}
                                    setBrandSearch={setBrandSearch}
                                    loading={loading}
                                />
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

/* --- REUSABLE FILTER SIDEBAR --- */
interface FilterSidebarProps {
    priceRange: number[];
    setPriceRange: (range: number[]) => void;
    selectedBrands: string[];
    toggleBrand: (brand: string) => void;
    selectedCategories: string[];
    toggleCategory: (category: string) => void;
    stockStatus: string;
    setStockStatus: (status: "inStock" | "outOfStock" | "all") => void;
    minRating: number;
    setMinRating: (rating: number) => void;
    clearAllFilters: () => void;
    hasActiveFilters: boolean;
    availableBrands: string[];
    availableCategories: string[];
    brandSearch: string;
    setBrandSearch: (search: string) => void;
    loading: boolean;
}

const FilterSidebar = ({
                           priceRange,
                           setPriceRange,
                           selectedBrands,
                           toggleBrand,
                           selectedCategories,
                           toggleCategory,
                           stockStatus,
                           setStockStatus,
                           minRating,
                           setMinRating,
                           availableBrands,
                           availableCategories,
                           brandSearch,
                           setBrandSearch,
                           loading
                       }: FilterSidebarProps) => {
    const filteredBrands = availableBrands.filter(brand =>
        brand.toLowerCase().includes(brandSearch.toLowerCase())
    );

    return (
        <div className="space-y-4 md:border md:rounded-sm overflow-hidden">

            {/* Filter by Price */}
            <div className="bg-gray-50 md:bg-white rounded-md shadow-sm md:rounded-none md:shadow-none p-4 md:border-b">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                    Filter by Price
                </h2>
                <div className="w-[90%] h-[4px] bg-amber-400 mx-auto mb-2 rounded"></div>
                <div className="flex justify-between items-center text-sm text-gray-700 mb-2">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                </div>
                <div className="flex flex-col gap-3">
                    <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                        className="w-full"
                    />
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="Min"
                        />
                        <input
                            type="number"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="Max"
                        />
                    </div>
                </div>
            </div>

            {/* Filter by Brand */}
            <div className="bg-gray-50 md:bg-white shadow-sm rounded-md md:rounded-none md:shadow-none p-4 md:border-b">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                    Filter by Brand
                </h2>
                <div className="flex gap-2 mb-3 flex-col">
                    <input
                        type="text"
                        placeholder="Search brand..."
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                </div>
                <div className="space-y-2 text-sm text-gray-700 max-h-40 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center">
                            <Loader className="w-4 h-4 animate-spin" />
                        </div>
                    ) : filteredBrands.length === 0 ? (
                        <p className="text-gray-400 text-center">No brands found</p>
                    ) : (
                        filteredBrands.map((brand) => (
                            <label key={brand} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedBrands.includes(brand)}
                                    onChange={() => toggleBrand(brand)}
                                    className="text-amber-400 focus:ring-amber-400"
                                />
                                {brand}
                            </label>
                        ))
                    )}
                </div>
            </div>

            {/* Filter by Category */}
            <div className="bg-gray-50 md:bg-white shadow-sm rounded-md md:rounded-none md:shadow-none p-4 md:border-b">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                    Filter by Category
                </h2>
                <div className="space-y-2 text-sm text-gray-700">
                    {loading ? (
                        <div className="flex justify-center">
                            <Loader className="w-4 h-4 animate-spin" />
                        </div>
                    ) : availableCategories.length === 0 ? (
                        <p className="text-gray-400 text-center">No categories found</p>
                    ) : (
                        availableCategories.map((category) => (
                            <label key={category} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category)}
                                    onChange={() => toggleCategory(category)}
                                    className="text-amber-400 focus:ring-amber-400"
                                />
                                {category}
                            </label>
                        ))
                    )}
                </div>
            </div>

            {/* Filter by Stock - FIXED: Now uses actual stock field */}
            <div className="bg-gray-50 md:bg-white rounded-md shadow-sm p-4 md:border-b">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                    Stock Status
                </h2>
                <div className="flex flex-col gap-2 text-sm text-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="stock"
                            checked={stockStatus === "all"}
                            onChange={() => setStockStatus("all")}
                            className="text-amber-400 focus:ring-amber-400"
                        />
                        All Products
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="stock"
                            checked={stockStatus === "inStock"}
                            onChange={() => setStockStatus("inStock")}
                            className="text-amber-400 focus:ring-amber-400"
                        />
                        In Stock Only
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="stock"
                            checked={stockStatus === "outOfStock"}
                            onChange={() => setStockStatus("outOfStock")}
                            className="text-amber-400 focus:ring-amber-400"
                        />
                        Out of Stock
                    </label>
                </div>
            </div>

            {/* Filter by Rating */}
            <div className="bg-gray-50 md:bg-white rounded-md shadow-sm p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                    Minimum Rating
                </h2>
                <div className="flex flex-col gap-2 text-sm text-gray-700">
                    {[4, 3, 2, 1, 0].map((rating) => (
                        <label key={rating} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="rating"
                                checked={minRating === rating}
                                onChange={() => setMinRating(rating)}
                                className="text-amber-400 focus:ring-amber-400"
                            />
                            <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                            i < rating ? "text-amber-400 fill-amber-400" : "text-gray-300"
                                        }`}
                                    />
                                ))}
                                <span className="ml-1">& up</span>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ShopPage;