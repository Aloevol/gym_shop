"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Filter, Search, X, Loader } from "lucide-react";
import ProductCart from "@/components/card/ProductCart";
import { getAllProductsServerSide } from "@/server/functions/product.fun";
import { IProduct } from "@/server/models/product/product.interface";
import { useRouter, useSearchParams } from "next/navigation";

const PAGE_LIMIT = 12;

interface PaginationState {
    page: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
}

export default function ShopContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const syncRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // ── Initialize all filter state from URL params ──────────────────
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");
    const [priceRange, setPriceRange] = useState<[number, number]>([
        Number(searchParams.get("pmin")) || 0,
        Number(searchParams.get("pmax")) || 5000,
    ]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
        const c = searchParams.get("cats");
        return c ? c.split(",").filter(Boolean) : [];
    });
    const [stockStatus, setStockStatus] = useState<"inStock" | "outOfStock" | "all">(() => {
        const s = searchParams.get("stock");
        return s === "inStock" || s === "outOfStock" ? s : "all";
    });
    const [minRating, setMinRating] = useState(() => Number(searchParams.get("rating")) || 0);

    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1, total: 0, totalPages: 0, hasNext: false,
    });

    // ── Sync filters → URL (debounced 400 ms) ─────────────────────────
    useEffect(() => {
        clearTimeout(syncRef.current);
        syncRef.current = setTimeout(() => {
            const params = new URLSearchParams();
            if (searchQuery) params.set("q", searchQuery);
            if (priceRange[0] > 0) params.set("pmin", String(priceRange[0]));
            if (priceRange[1] < 5000) params.set("pmax", String(priceRange[1]));
            if (selectedCategories.length > 0) params.set("cats", selectedCategories.join(","));
            if (stockStatus !== "all") params.set("stock", stockStatus);
            if (minRating > 0) params.set("rating", String(minRating));
            const qs = params.toString();
            router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
        }, 400);
        return () => clearTimeout(syncRef.current);
    }, [searchQuery, priceRange, selectedCategories, stockStatus, minRating, router]);

    // ── Derive available categories from loaded products ──────────────
    const availableCategories = useMemo(
        () => Array.from(new Set(products.map(p => p.category))).filter(Boolean),
        [products]
    );

    // ── Fetch products ─────────────────────────────────────────────────
    const loadProducts = useCallback(async (page: number = 1, isInitialLoad = false) => {
        try {
            if (isInitialLoad) setLoading(true);
            else setLoadingMore(true);

            const filter: Record<string, unknown> = { isActive: true };

            if (searchQuery) {
                filter.$or = [
                    { title: { $regex: searchQuery, $options: "i" } },
                    { brand: { $regex: searchQuery, $options: "i" } },
                    { category: { $regex: searchQuery, $options: "i" } },
                ];
            }
            if (priceRange[0] > 0 || priceRange[1] < 5000)
                filter.price = { $gte: priceRange[0], $lte: priceRange[1] };
            if (selectedCategories.length > 0) filter.category = { $in: selectedCategories };
            if (stockStatus === "inStock") filter.stock = { $gt: 0 };
            else if (stockStatus === "outOfStock") filter.stock = { $lte: 0 };
            if (minRating > 0) filter.rating = { $gte: minRating };

            const response = await getAllProductsServerSide({ filter, page, limit: PAGE_LIMIT });

            if (!response.isError && response.data) {
                const { products: newProducts, pagination: newPagination } = response.data as any;
                if (page === 1) setProducts(newProducts || []);
                else setProducts(prev => [...prev, ...(newProducts || [])]);
                setPagination({
                    page: newPagination.page,
                    total: newPagination.total,
                    totalPages: newPagination.totalPages,
                    hasNext: newPagination.hasNext,
                });
            }
        } catch (error) {
            console.error("Error loading products:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchQuery, priceRange, selectedCategories, stockStatus, minRating]);

    useEffect(() => {
        loadProducts(1, true);
    }, [loadProducts]);

    const loadMoreProducts = () => {
        if (pagination.hasNext && !loadingMore) loadProducts(pagination.page + 1);
    };

    const clearAllFilters = () => {
        setSearchQuery("");
        setPriceRange([0, 5000]);
        setSelectedCategories([]);
        setStockStatus("all");
        setMinRating(0);
    };

    const hasActiveFilters =
        priceRange[0] > 0 ||
        priceRange[1] < 5000 ||
        selectedCategories.length > 0 ||
        stockStatus !== "all" ||
        minRating > 0;

    return (
        <div className="w-full bg-black min-h-screen pt-20">
            <div className="max-w-7xl mx-auto px-4 md:px-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-custom font-bold text-white tracking-widest uppercase mb-2">
                            Our Shop
                        </h1>
                        <p className="text-primary font-custom tracking-widest uppercase text-sm">
                            Premium Fitness Performance
                        </p>
                    </div>

                    <div className="w-full md:w-96 relative">
                        <label htmlFor="shop-search" className="sr-only">Search products</label>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" aria-hidden="true" />
                        <input
                            id="shop-search"
                            type="text"
                            placeholder="Search Products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-full pl-12 pr-12 py-3 text-sm text-white focus:border-primary outline-none transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                aria-label="Clear search"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 pb-20">
                    {/* Mobile filter toggle */}
                    <div className="lg:hidden">
                        <button
                            onClick={() => setIsFilterOpen(prev => !prev)}
                            className="flex items-center gap-2 border border-white/10 text-white/60 hover:text-white hover:border-primary px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                        >
                            <Filter size={14} aria-hidden="true" />
                            {isFilterOpen ? "Hide Filters" : "Show Filters"}
                            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-1" aria-label="Active filters" />}
                        </button>
                    </div>

                    {/* Filters sidebar */}
                    <aside className={`lg:w-64 shrink-0 space-y-8 ${isFilterOpen ? "block" : "hidden lg:block"}`}>
                        {/* Categories */}
                        <div>
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Categories</h3>
                            <div className="space-y-2">
                                {availableCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() =>
                                            setSelectedCategories(prev =>
                                                prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                            )
                                        }
                                        className={`block w-full text-left text-sm font-bold uppercase tracking-widest py-2 transition-colors ${
                                            selectedCategories.includes(cat) ? "text-primary" : "text-white/60 hover:text-white"
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div>
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Price Range</h3>
                            <div className="px-2">
                                <label htmlFor="price-range" className="sr-only">Maximum price: TK {priceRange[1]}</label>
                                <input
                                    id="price-range"
                                    type="range"
                                    min="0"
                                    max="5000"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                    className="w-full accent-primary bg-white/10"
                                />
                                <div className="flex justify-between mt-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                    <span>TK {priceRange[0]}</span>
                                    <span>TK {priceRange[1]}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stock Status */}
                        <div>
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Availability</h3>
                            <div className="space-y-2">
                                {(["all", "inStock", "outOfStock"] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStockStatus(s)}
                                        className={`block w-full text-left text-sm font-bold uppercase tracking-widest py-2 transition-colors ${
                                            stockStatus === s ? "text-primary" : "text-white/60 hover:text-white"
                                        }`}
                                    >
                                        {s === "all" ? "All Products" : s === "inStock" ? "In Stock" : "Out of Stock"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Rating */}
                        <div>
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Min Rating</h3>
                            <div className="space-y-2">
                                {[0, 3, 4, 5].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setMinRating(r)}
                                        className={`block w-full text-left text-sm font-bold uppercase tracking-widest py-2 transition-colors ${
                                            minRating === r ? "text-primary" : "text-white/60 hover:text-white"
                                        }`}
                                    >
                                        {r === 0 ? "All Ratings" : `${r}★ & Up`}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] hover:text-white transition-colors"
                            >
                                Clear All Filters
                            </button>
                        )}
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="aspect-4/5 bg-white/5 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-white/40 font-custom tracking-widest uppercase">No products found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {products.map(product => (
                                    <ProductCart
                                        id={product._id}
                                        key={product._id.toString()}
                                        name={product.title}
                                        category={product.category}
                                        price={product.price}
                                        discount={
                                            product.originalPrice
                                                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                                                : 0
                                        }
                                        priceAfterDiscount={product.price}
                                        image={product.images?.[0] || "/placeholder.jpg"}
                                        rating={product.rating || 5}
                                        brand={product.brand}
                                        isActive={product.isActive}
                                    />
                                ))}
                            </div>
                        )}

                        {pagination.hasNext && (
                            <div className="mt-12 flex justify-center">
                                <button
                                    onClick={loadMoreProducts}
                                    disabled={loadingMore}
                                    className="border border-white/20 text-white px-12 py-4 rounded-full font-custom text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-all disabled:opacity-50"
                                >
                                    {loadingMore ? "Loading..." : "Load More"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
