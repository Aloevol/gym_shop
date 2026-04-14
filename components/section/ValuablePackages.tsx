"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { IPackage } from "@/server/models/package/package.interface";
import { getAllPackagesServerSide } from "@/server/functions/package.fun";
import { toast } from "sonner";
import PackageDisplayCard from "@/components/card/PackageDisplayCard";

// Create a client-safe version of IPackage where dates are strings
interface ClientPackage extends Omit<IPackage, 'createdAt' | 'updatedAt'> {
    createdAt: string;
    updatedAt: string;
}

// Type definitions for Mongoose document structure
interface MongooseDocument {
    toObject?: () => Record<string, unknown>;
    toJSON?: () => Record<string, unknown>;
    _id?: unknown;
    $__?: unknown;
    _doc?: Record<string, unknown>;
}

// Comprehensive function to convert Mongoose documents to plain objects
const convertToPlainObject = <T,>(obj: T): T => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle Mongoose documents
    if (typeof obj === 'object' && obj !== null) {
        const convertibleObj = obj as MongooseDocument & Record<string, unknown>;

        // If it has toObject method, use it
        if (typeof convertibleObj.toObject === 'function') {
            return convertibleObj.toObject() as T;
        }

        // If it has toJSON method, use it
        if (typeof convertibleObj.toJSON === 'function') {
            return convertibleObj.toJSON() as T;
        }

        // Handle Mongoose-specific properties
        if (convertibleObj._id && typeof convertibleObj._id === 'object') {
            const idObj = convertibleObj._id as { toString?: () => string };
            if (typeof idObj.toString === 'function') {
                const result: Record<string, unknown> = { ...convertibleObj };
                result._id = idObj.toString();

                // Convert other ObjectId fields if they exist
                Object.keys(result).forEach(key => {
                    const value = result[key];
                    if (value && typeof value === 'object' && value !== null) {
                        const valueObj = value as MongooseDocument;
                        if (valueObj._id && typeof valueObj._id === 'object') {
                            result[key] = convertToPlainObject(value);
                        }
                    }
                });

                return result as T;
            }
        }

        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map(item => convertToPlainObject(item)) as unknown as T;
        }

        // Handle regular objects
        const plainObj: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            plainObj[key] = convertToPlainObject(value);
        }
        return plainObj as T;
    }

    return obj;
};

// Specialized function for converting packages with common field transformations
const convertPackageToPlainObject = (pkg: unknown): ClientPackage => {
    const plainPkg = convertToPlainObject(pkg) as IPackage & Record<string, unknown>;

    // Ensure _id is a string - simplified check
    if (plainPkg._id && typeof plainPkg._id === 'object') {
        const idObj = plainPkg._id as { toString?: () => string };
        if (idObj.toString && typeof idObj.toString === 'function') {
            plainPkg._id = idObj.toString();
        }
    }

    // If _id is still not a string, generate a random one
    if (typeof plainPkg._id !== 'string') {
        plainPkg._id = Math.random().toString();
    }

    // Ensure imageUrl is always an array of strings
    if (plainPkg.imageUrl && !Array.isArray(plainPkg.imageUrl)) {
        plainPkg.imageUrl = [plainPkg.imageUrl as string];
    } else if (!plainPkg.imageUrl) {
        plainPkg.imageUrl = [];
    }

    // Convert dates to ISO strings
    let createdAtString: string;
    if (plainPkg.createdAt instanceof Date) {
        createdAtString = plainPkg.createdAt.toISOString();
    } else if (plainPkg.createdAt && typeof plainPkg.createdAt === 'object') {
        createdAtString = new Date().toISOString();
    } else if (typeof plainPkg.createdAt === 'string') {
        createdAtString = plainPkg.createdAt;
    } else {
        createdAtString = new Date().toISOString();
    }

    let updatedAtString: string;
    if (plainPkg.updatedAt instanceof Date) {
        updatedAtString = plainPkg.updatedAt.toISOString();
    } else if (plainPkg.updatedAt && typeof plainPkg.updatedAt === 'object') {
        updatedAtString = new Date().toISOString();
    } else if (typeof plainPkg.updatedAt === 'string') {
        updatedAtString = plainPkg.updatedAt;
    } else {
        updatedAtString = new Date().toISOString();
    }

    // Ensure other common fields have proper values
    const price = typeof plainPkg.price === 'number' ? plainPkg.price : Number(plainPkg.price) || 0;
    const originalPrice = plainPkg.originalPrice && typeof plainPkg.originalPrice !== 'number'
        ? Number(plainPkg.originalPrice) || 0
        : plainPkg.originalPrice;
    const isActive = typeof plainPkg.isActive === 'boolean' ? plainPkg.isActive : Boolean(plainPkg.isActive);
    const isFeatured = typeof plainPkg.isFeatured === 'boolean' ? plainPkg.isFeatured : Boolean(plainPkg.isFeatured);

    // Return as ClientPackage with string dates
    return {
        ...plainPkg,
        _id: plainPkg._id as string,
        title: plainPkg.title as string,
        description: plainPkg.description as string,
        price,
        originalPrice,
        imageUrl: plainPkg.imageUrl as string[],
        category: plainPkg.category as string,
        isActive,
        isFeatured,
        rating: plainPkg.rating as number,
        createdAt: createdAtString,
        updatedAt: updatedAtString,
    } as ClientPackage;
};

// Loading section component
const LoadingSection = () => (
    <section className="w-full bg-black py-20 px-6 md:px-12 lg:px-20 flex flex-col items-center gap-12">
        {/* Header */}
        <motion.div
            initial={{ opacity: 0, y: -40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl"
        >
            <h2 className="text-3xl md:text-5xl font-custom font-bold text-white tracking-widest uppercase mb-4">
                VALUABLE <span className="text-primary">PACKAGES</span>
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto"></div>
        </motion.div>

        {/* Loading Skeleton */}
        <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full gap-6 justify-items-center max-w-[1200px]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
        >
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="w-full aspect-[4/5] bg-white/5 rounded-2xl animate-pulse"
                ></div>
            ))}
        </motion.div>
    </section>
);

// Error section component
const ErrorSection = ({ error }: { error: string }) => (
    <section className="w-full bg-black py-20 px-6 md:px-12 lg:px-20 flex flex-col items-center gap-12">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 uppercase tracking-widest">Error Loading Packages</h2>
            <p className="text-white/40 mt-2 uppercase text-xs tracking-widest">{error}</p>
        </div>
    </section>
);

// Main component
const ValuablePackages = () => {
    const [packages, setPackages] = useState<ClientPackage[]>([]);
    const [isLoading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initialize = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await getAllPackagesServerSide({
                    filter: { isActive: true, isFeatured: true },
                    page: 1,
                    limit: 6
                });

                if (!response.isError && response.data) {
                    const responseData = response.data as { packages: unknown[] };
                    const packageData = responseData.packages;

                    // Convert all MongoDB objects to plain objects
                    const plainPackages = packageData.map((pkg: unknown) => {
                        return convertPackageToPlainObject(pkg);
                    });

                    setPackages(plainPackages);
                } else {
                    const errorMsg = response.message || "Failed to load packages";
                    setError(errorMsg);
                    toast.error(errorMsg);
                }
            } catch (err) {
                console.error("Error loading packages:", err);
                const errorMsg = err instanceof Error ? err.message : "Failed to load packages";
                setError(errorMsg);
                toast.error(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, []);

    // Filter active packages and take first 3
    const displayPackages = packages.slice(0, 3);

    if (isLoading) {
        return <LoadingSection />;
    }

    if (error) {
        return <ErrorSection error={error} />;
    }

    return (
        <section className="w-full bg-black py-20 px-6 md:px-12 lg:px-20 flex flex-col items-center gap-12">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-center max-w-2xl"
            >
                <h2 className="text-3xl md:text-5xl font-custom font-bold text-white tracking-widest uppercase mb-4">
                    VALUABLE <span className="text-primary">PACKAGES</span>
                </h2>
                <p className="text-white/40 font-bold tracking-widest uppercase text-sm">
                    Experience year-round comfort with our premium curated performance packages.
                </p>
            </motion.div>

                    {/* Cards Grid */}
                    {displayPackages.length > 0 ? (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full gap-6 justify-items-center max-w-[1200px]"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={{
                                hidden: {},
                                visible: {
                                    transition: {
                                        staggerChildren: 0.2
                                    }
                                }
                            }}
                        >
                            {displayPackages.map((pkg, index) => (
                                <motion.div
                                    key={pkg._id || `package-${index}`}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="w-full"
                                >
                                    <PackageDisplayCard pkg={pkg as unknown as IPackage} />
                                </motion.div>
                            ))}
                        </motion.div>            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center py-12"
                >
                    <p className="text-white/40 font-custom tracking-widest uppercase">No packages available at the moment.</p>
                </motion.div>
            )}
        </section>
    );
};

export default ValuablePackages;
