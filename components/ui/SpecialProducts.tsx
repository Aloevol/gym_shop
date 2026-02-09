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
            <section className='bg-white pb-20 px-6 md:px-12 lg:px-20 flex flex-col items-center gap-12'>
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-2xl"
                >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#F27D31] leading-tight drop-shadow-lg">
                        <span className="text-black">Our</span> Special Products List
                    </h2>
                    <p className="text-gray-600 mt-4 text-sm md:text-base">
                        Experience year-round comfort with our Comport Zone, designed to keep your home warm in winter, cool in summer, and stylish every day.
                    </p>
                </motion.div>

                <div className="flex justify-center items-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-[#F27D31]" />
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className='bg-white pb-20 px-6 md:px-12 lg:px-20 flex flex-col items-center gap-12'>
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center max-w-2xl"
                >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#F27D31] leading-tight drop-shadow-lg">
                        <span className="text-black">Our</span> Special Products List
                    </h2>
                    <p className="text-gray-600 mt-4 text-sm md:text-base">
                        Experience year-round comfort with our Comport Zone, designed to keep your home warm in winter, cool in summer, and stylish every day.
                    </p>
                </motion.div>

                <div className="text-center py-12">
                    <p className="text-red-500 text-lg">{error}</p>
                </div>
            </section>
        )
    }

    return (
        <section className='bg-white pb-20 px-6 md:px-12 lg:px-20 flex flex-col items-center gap-12'>
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center max-w-2xl"
            >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#F27D31] leading-tight drop-shadow-lg">
                    <span className="text-black">Our</span> Special Products List
                </h2>
                <p className="text-gray-600 mt-4 text-sm md:text-base">
                    Experience year-round comfort with our Comport Zone, designed to keep your home warm in winter, cool in summer, and stylish every day.
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
                    <p className="text-gray-500 text-lg">No featured products available</p>
                    <p className="text-gray-400 text-sm mt-2">Check back later for special offers</p>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, staggerChildren: 0.1 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 w-full max-w-[1540px]"
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
                                price={product.originalPrice || product.price + (product.price * 0.2)} // Calculate original price if not exists
                                discount={calculateDiscount(product.price, product.originalPrice)}
                                priceAfterDiscount={product.price}
                                image={product.images?.[0] || "/placeholder-product.jpg"}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    )
}

export default SpecialProducts