

import { IProduct } from "../models/product/product.interface";

export interface IResponse<T = unknown> {
    isError: boolean;
    status: number;
    message: string;
    data?: T;
}

export interface IProductData {
    product?: IProduct;
    products?: IProduct[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
    };
}

export type IProductResponse = IResponse<IProductData>;