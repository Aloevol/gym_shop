import { Model } from "mongoose";

export interface IProduct {
    _id: string;
    title: string;
    rating: number;
    description: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    brand: string;
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
    tags: string[];
    specifications: Record<string, string>;
    couponEnabled: boolean;
    couponDiscount: number;
    couponDiscountType: "percentage" | "fixed";
    createdAt: Date;
    updatedAt: Date;
}

export interface IProductModel extends Model<IProduct> {
    findActiveProducts(): Promise<IProduct[]>;
    findFeaturedProducts(): Promise<IProduct[]>;
    findByCategory(category: string): Promise<IProduct[]>;
    findByBrand(brand: string): Promise<IProduct[]>;
}