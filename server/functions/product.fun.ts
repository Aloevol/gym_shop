"use server";

import { connectToDB } from "@/server/db";
import { SendResponse } from "../helper/sendResponse.helper";
import { handleServerError } from "../helper/ErrorHandler";
import { ProductModel } from "../models/product/product.model";
import { ICreateProductInput, IUpdateProductInput, IProductResponse } from "../interface/product.interface";
import { IProductData } from "../interface/response.interface";
import {IProduct} from "@/server/models/product/product.interface";

interface MongooseDocument {
    toJSON?: () => Record<string, unknown>;
}

interface ObjectIdLike {
    _id?: {
        toString?: () => string;
    };
}

type ConvertibleObject = Record<string, unknown> & MongooseDocument & ObjectIdLike;

const convertToPlainObject = <T>(doc: unknown): T => {
    if (doc && typeof doc === 'object') {
        // Handle Mongoose documents
        const convertibleDoc = doc as ConvertibleObject;
        if (convertibleDoc.toJSON) {
            return convertibleDoc.toJSON() as T;
        }
        // Handle ObjectId
        if (convertibleDoc._id && typeof convertibleDoc._id.toString === 'function') {
            return {
                ...convertibleDoc,
                _id: convertibleDoc._id.toString()
            } as T;
        }
        // Handle arrays
        if (Array.isArray(doc)) {
            return doc.map(item => convertToPlainObject(item)) as unknown as T;
        }
        // Handle nested objects
        const plainObj: Record<string, unknown> = {};
        for (const key in doc) {
            if (Object.prototype.hasOwnProperty.call(doc, key)) {
                plainObj[key] = convertToPlainObject((doc as Record<string, unknown>)[key]);
            }
        }
        return plainObj as T;
    }
    return doc as T;
};

export async function createProductServerSide(body: ICreateProductInput): Promise<IProductResponse> {
    try {
        await connectToDB();

        const {
            title,
            description,
            price,
            originalPrice,
            images,
            category,
            brand,
            rating = 0,
            stock,
            isActive = true,
            isFeatured = false,
            tags = [],
            specifications = {}
        } = body;

        const existingProduct = await ProductModel.findOne({
            title: { $regex: new RegExp(`^${title}$`, 'i') }
        });

        if (existingProduct) {
            return SendResponse<IProductData>({
                isError: true,
                status: 409,
                message: "Product with this title already exists"
            });
        }

        const newProduct = await ProductModel.create({
            title,
            description,
            price,
            originalPrice,
            images,
            category,
            brand,
            stock,
            rating,
            isActive,
            isFeatured,
            tags: tags.filter(tag => tag.trim() !== ""),
            specifications
        });

        const plainProduct = convertToPlainObject<IProduct>(newProduct);

        return SendResponse<IProductData>({
            isError: false,
            status: 201,
            message: "Product created successfully",
            data: { product: plainProduct }
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}

export async function getAProductsServerSide(id: unknown): Promise<IProductResponse> {
    try {
        await connectToDB();

        const product = await ProductModel.findById(id).lean().exec();
        if(!product){
            return SendResponse<IProductData>({
                isError: true,
                status: 404,
                message: "Product not found."
            });
        }

        const serializedProduct = JSON.parse(JSON.stringify(product));

        return SendResponse({
            isError: false,
            status: 200,
            message: "Products fetched successfully",
            data: serializedProduct
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}

export async function getRelatedProductsServerSide(
    category: string,
    excludeProductId: string
): Promise<IProductResponse> {
    try {
        await connectToDB();

        const relatedProducts = await ProductModel.find({
            category: category,
            _id: { $ne: excludeProductId },
            isActive: true
        })
            .limit(8)
            .lean()
            .exec();

        const serializedProducts = JSON.parse(JSON.stringify(relatedProducts));

        return SendResponse({
            isError: false,
            status: 200,
            message: "Related products fetched successfully",
            data: serializedProducts
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}

export async function getAllProductsServerSide({filter, page, limit}: { filter?: Record<string, unknown> | null; page: number; limit: number; }): Promise<IProductResponse> {
    try {
        await connectToDB();

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            ProductModel.find(filter ? filter : {})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            ProductModel.countDocuments(filter ? filter : {})
        ]);

        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;

        const plainProducts = products.map(product => convertToPlainObject<IProduct>(product));

        return SendResponse<IProductData>({
            isError: false,
            status: 200,
            message: "Products fetched successfully",
            data: {
                products: plainProducts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext
                }
            }
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}

export async function getActiveProductsServerSide(): Promise<IProductResponse> {
    try {
        await connectToDB();

        const products = await ProductModel.find({ isActive: true }).sort({ createdAt: -1 }).exec();

        const plainProducts = products.map(product => convertToPlainObject<IProduct>(product));

        return SendResponse<IProductData>({
            isError: false,
            status: 200,
            message: "Active products fetched successfully",
            data: { products: plainProducts }
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}

export async function getFeaturedProductsServerSide(): Promise<IProductResponse> {
    try {
        await connectToDB();

        const products = await ProductModel.find({ isFeatured: true, isActive: true }).sort({ createdAt: -1 }).exec();

        const plainProducts = products.map(product => convertToPlainObject<IProduct>(product));

        return SendResponse<IProductData>({
            isError: false,
            status: 200,
            message: "Featured products fetched successfully",
            data: { products: plainProducts }
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}

export async function getProductByIdServerSide(productId: string): Promise<IProductResponse> {
    try {
        await connectToDB();

        const productData = await ProductModel.findById(productId).lean().exec();

        if (!productData) {
            return SendResponse<IProductData>({
                isError: true,
                status: 404,
                message: "Product not found"
            });
        }

        const plainProduct = convertToPlainObject<IProduct>(productData);

        return SendResponse<IProductData>({
            isError: false,
            status: 200,
            message: "Product fetched successfully",
            data: { product: plainProduct }
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}

export async function updateProductServerSide(productId: string, body: IUpdateProductInput): Promise<IProductResponse> {
    try {
        await connectToDB();

        const existingProduct = await ProductModel.findById(productId).lean().exec();
        if (!existingProduct) {
            return SendResponse<IProductData>({
                isError: true,
                status: 404,
                message: "Product not found"
            });
        }

        if (body.title && body.title !== existingProduct.title) {
            const titleExists = await ProductModel.findOne({
                title: { $regex: new RegExp(`^${body.title}$`, 'i') },
                _id: { $ne: productId }
            }).lean().exec();

            if (titleExists) {
                return SendResponse<IProductData>({
                    isError: true,
                    status: 409,
                    message: "Product with this title already exists"
                });
            }
        }

        const updateData: Partial<IProduct> = {};
        if (body.title) updateData.title = body.title;
        if (body.description) updateData.description = body.description;
        if (body.price !== undefined) updateData.price = body.price;
        if (body.originalPrice !== undefined) updateData.originalPrice = body.originalPrice;
        if (body.images) updateData.images = body.images;
        if (body.rating) updateData.rating = body.rating;
        if (body.category) updateData.category = body.category;
        if (body.brand) updateData.brand = body.brand;
        if (body.stock !== undefined) updateData.stock = body.stock;
        if (typeof body.isActive === 'boolean') updateData.isActive = body.isActive;
        if (typeof body.isFeatured === 'boolean') updateData.isFeatured = body.isFeatured;
        if (body.tags) updateData.tags = body.tags.filter(tag => tag.trim() !== "");
        if (body.specifications) updateData.specifications = body.specifications;

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).lean().exec();

        if (!updatedProduct) {
            return SendResponse<IProductData>({
                isError: true,
                status: 404,
                message: "Product not found during update"
            });
        }

        const plainProduct = convertToPlainObject<IProduct>(updatedProduct);

        return SendResponse<IProductData>({
            isError: false,
            status: 200,
            message: "Product updated successfully",
            data: { product: plainProduct }
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}

export async function deleteProductServerSide(productId: string): Promise<IProductResponse> {
    try {
        await connectToDB();

        const productData = await ProductModel.findByIdAndDelete(productId).lean().exec();

        if (!productData) {
            return SendResponse<IProductData>({
                isError: true,
                status: 404,
                message: "Product not found"
            });
        }

        return SendResponse<IProductData>({
            isError: false,
            status: 200,
            message: "Product deleted successfully"
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}

export async function toggleProductStatusServerSide(productId: string): Promise<IProductResponse> {
    try {
        await connectToDB();

        const productData = await ProductModel.findById(productId).lean().exec();

        if (!productData) {
            return SendResponse<IProductData>({
                isError: true,
                status: 404,
                message: "Product not found"
            });
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            { $set: { isActive: !productData.isActive } },
            { new: true }
        ).lean().exec();

        if (!updatedProduct) {
            return SendResponse<IProductData>({
                isError: true,
                status: 404,
                message: "Product not found during status update"
            });
        }

        const plainProduct = convertToPlainObject<IProduct>(updatedProduct);

        return SendResponse<IProductData>({
            isError: false,
            status: 200,
            message: `Product ${updatedProduct.isActive ? 'activated' : 'deactivated'} successfully`,
            data: { product: plainProduct }
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}

export async function toggleProductFeaturedStatusServerSide(productId: string): Promise<IProductResponse> {
    try {
        await connectToDB();

        const productData = await ProductModel.findById(productId).lean().exec();

        if (!productData) {
            return SendResponse<IProductData>({
                isError: true,
                status: 404,
                message: "Product not found"
            });
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            { $set: { isFeatured: !productData.isFeatured } },
            { new: true }
        ).lean().exec();

        if (!updatedProduct) {
            return SendResponse<IProductData>({
                isError: true,
                status: 404,
                message: "Product not found during featured status update"
            });
        }

        const plainProduct = convertToPlainObject<IProduct>(updatedProduct);

        return SendResponse<IProductData>({
            isError: false,
            status: 200,
            message: `Product ${updatedProduct.isFeatured ? 'featured' : 'unfeatured'} successfully`,
            data: { product: plainProduct }
        });

    } catch (error) {
        return handleServerError(error) as IProductResponse;
    }
}