"use client"
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ProductCart from '../card/ProductCart'
import { getFeaturedProductsServerSide } from '@/server/functions/product.fun'
import { IProduct } from '@/server/models/product/product.interface'
import { Loader } from 'lucide-react'

function SpecialProducts() {
    const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchFeaturedProducts = async () => {
            try {
                setLoading(true)
                const response = await getFeaturedProductsServerSide()

                if (!response.isError && response.data) {
                    const { products } = response.data as { products: IProduct[] }
                    // Limit to maximum 10 products
                    const limitedProducts = products.slice(0, 10)
                    setFeaturedProducts(limitedProducts)
                } else {
                    setError('Failed to load featured products')
                }
            } catch (err) {
                console.error('Error fetching featured products:', err)
                setError('Failed to load featured products')
            } finally {
                setLoading(false)
            }
        }

        fetchFeaturedProducts()
    }, [])

    // Calculate discount for ProductCart
    const calculateDiscount = (price: number, originalPrice?: number): number => {
        if (!originalPrice || originalPrice <= price) return 0
        return Math.round(((originalPrice - price) / originalPrice) * 100)
    }

    if (loading) {
        return (
            <section className='bg-black pb-20 px-6 md:px-12 lg:px-20 flex flex-col items-center gap-12'>
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-2xl"
                >
                    <h2 className="text-3xl md:text-5xl font-custom font-bold text-white tracking-widest uppercase mb-4">
                        SPECIAL <span className="text-primary">PRODUCTS</span>
                    </h2>
                    <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
                </motion.div>

                <div className="flex justify-center items-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-primary" />
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className='bg-black pb-20 px-6 md:px-12 lg:px-20 flex flex-col items-center gap-12'>
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-2xl"
                >
                    <h2 className="text-3xl md:text-5xl font-custom font-bold text-white tracking-widest uppercase mb-4">
                        SPECIAL <span className="text-primary">PRODUCTS</span>
                    </h2>
                </motion.div>

                <div className="text-center py-12">
                    <p className="text-red-500 uppercase font-bold tracking-widest">{error}</p>
                </div>
            </section>
        )
    }

    return (
        <section className='bg-black pb-20 px-6 md:px-12 lg:px-20 flex flex-col items-center gap-12'>
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center max-w-2xl"
            >
                <h2 className="text-3xl md:text-5xl font-custom font-bold text-white tracking-widest uppercase mb-4">
                    SPECIAL <span className="text-primary">PRODUCTS</span>
                </h2>
                <p className="text-white/40 font-bold tracking-widest uppercase text-sm">
                    Discover our most popular performance essentials, trusted by athletes everywhere.
                </p>
            </motion.div>

            {featuredProducts.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center py-12"
                >
                    <p className="text-white/40 font-custom tracking-widest uppercase">No featured products available</p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, staggerChildren: 0.1 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full max-w-7xl"
                >
                    {featuredProducts.map((product, index) => (
                        <motion.div
                            key={product._id.toString()}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="w-full"
                        >
                            <ProductCart
                                id={product._id}
                                name={product.title}
                                category={product.category}
                                rating={product.rating}
                                isActive={product.isActive}
                                brand={product.brand}
                                price={product.originalPrice || product.price + (product.price * 0.2)}
                                discount={calculateDiscount(product.price, product.originalPrice)}
                                priceAfterDiscount={product.price}
                                image={product.images?.[0] || "/placeholder.jpg"}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    )
}

export default SpecialProducts