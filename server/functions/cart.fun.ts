"use server";

import {connectToDB} from "@/server/db";
import {handleServerError} from "@/server/helper/ErrorHandler";
import {CartModel} from "@/server/models/cart/cart.model";
import { FilterQuery } from "mongoose";
import { ICart } from "@/server/models/cart/cart.interface";

export async function addToCart({userId, productId, packageId}: {userId: unknown, productId?: unknown, packageId?: unknown}) {
    try {
        await connectToDB();

        // Build query dynamically based on what's provided
        const query: FilterQuery<ICart> = { userId: userId as string };

        const orConditions = [];
        if (productId) orConditions.push({ product: productId });
        if (packageId) orConditions.push({ package: packageId });

        if (orConditions.length === 0) {
            return {
                isError: true,
                status: 400,
                message: "Either productId or packageId is required",
                data: null
            };
        }

        query.$or = orConditions;

        const cart = await CartModel.findOne(query).populate("product package").lean();

        if(cart) {
            return {
                isError: true,
                status: 400,
                message: "This item is already in your cart",
                data: cart
            };
        }

        const createdCart = await CartModel.create({
            userId: userId,
            product: productId || null,
            package: packageId || null
        });

        return {
            isError: false,
            status: 200,
            message: "Item added to cart",
            data: createdCart
        };

    } catch (error) {
        return handleServerError(error);
    }
}

export async function countCurrentCartLength({userId}: {userId: unknown}) {
    try {
        await connectToDB();

        return await CartModel.countDocuments({userId: userId});

    } catch (error) {
        return handleServerError(error);
    }
}

export async function getCartItems({ userId }: { userId: string }) {
    try {
        await connectToDB();

        const cartItems = await CartModel.find({ userId })
            .populate('product')
            .populate('package')
            .lean() // Convert to plain JavaScript objects
            .exec();

        // Convert all ObjectIds to strings
        const serializedItems = JSON.parse(JSON.stringify(cartItems));

        return {
            isError: false,
            status: 200,
            message: "Cart items fetched successfully",
            data: serializedItems
        };
    } catch (error) {
        console.error("Error fetching cart items:", error);
        return {
            isError: true,
            status: 500,
            message: "Failed to fetch cart items",
            data: null
        };
    }
}

export async function updateCartQuantity({ cartId, quantity }: { cartId: string; quantity: number }) {
    try {
        await connectToDB();

        const updatedCart = await CartModel.findByIdAndUpdate(
            cartId,
            { quantity },
            { new: true }
        )
            .populate('product')
            .populate('package')
            .lean() // Convert to plain object
            .exec();

        if (!updatedCart) {
            return {
                isError: true,
                status: 404,
                message: "Cart item not found",
                data: null
            };
        }

        return {
            isError: false,
            status: 200,
            message: "Quantity updated successfully",
            data: updatedCart
        };
    } catch (error) {
        console.error("Error updating cart quantity:", error);
        return {
            isError: true,
            status: 500,
            message: "Failed to update quantity",
            data: null
        };
    }
}

export async function removeFromCart({ cartId }: { cartId: string }) {
    try {
        await connectToDB();

        const deletedCart = await CartModel.findByIdAndDelete(cartId).lean().exec();

        if (!deletedCart) {
            return {
                isError: true,
                status: 404,
                message: "Cart item not found",
                data: null
            };
        }

        return {
            isError: false,
            status: 200,
            message: "Item removed from cart",
            data: deletedCart
        };
    } catch (error) {
        console.error("Error removing from cart:", error);
        return {
            isError: true,
            status: 500,
            message: "Failed to remove item",
            data: null
        };
    }
}
// Clear entire cart
export async function clearCart({ userId }: { userId: unknown }) {
    try {
        await connectToDB();

        const result = await CartModel.updateMany(
            {
                userId: userId,
                isActive: true
            },
            {
                isActive: false,
                isRemoved: true
            }
        ).exec();

        return {
            isError: false,
            status: 200,
            message: "Cart cleared successfully",
            data: { deletedCount: result.modifiedCount }
        };

    } catch (error) {
        return handleServerError(error);
    }
}
