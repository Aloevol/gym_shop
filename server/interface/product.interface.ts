import {IProduct} from "@/server/models/product/product.interface";
export type { IProductResponse } from "./response.interface";

export interface ICreateProductInput {
    title: string;
    description: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    brand: string;
    stock: number;
    isActive?: boolean;
    isFeatured?: boolean;
    tags?: string[];
    specifications?: Record<string, string>;
    rating?: number;
}

export interface IUpdateProductInput {
    title?: string;
    description?: string;
    price?: number;
    originalPrice?: number;
    images?: string[];
    category?: string;
    brand?: string;
    stock?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    tags?: string[];
    specifications?: Record<string, string>;
    rating?: number;
}