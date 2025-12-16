"use server";

import "@/server/models/product/product.model";
import "@/server/models/package/package.model";
import "@/server/models/user/user.model";
import { revalidatePath } from "next/cache";
import connectToDB from "@/server/db";
import {OrderModel} from "@/server/models/order/order.model";
import {CartModel} from "@/server/models/cart/cart.model";
import mongoose from "mongoose";

interface CreateOrderData {
    paymentStatus: string;
    userId?: string;
    items: Array<{
        product?: string;
        package?: string;
        trainingProgram?: string;
        quantity: number;
        price: number;
        title: string;
        image: string;
        type: "product" | "package" | "trainingProgram";
    }>;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    shippingAddress: any;
    paymentMethod: "card" | "cashOnDelivery" | "bankTransfer";
    notes?: string;
}

export async function createOrder(orderData: CreateOrderData) {
    try {
        await connectToDB();

        console.log("Order data received:", orderData);

        // Process items
        const items = orderData.items.map((item: any) => ({
            product: item.product ? new mongoose.Types.ObjectId(item.product) : undefined,
            package: item.package ? new mongoose.Types.ObjectId(item.package) : undefined,
            quantity: item.quantity,
            price: item.price,
            title: item.title,
            image: item.image,
            type: item.type
        }));

        console.log("Processed items:", items);

        // Calculate totals
        const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const shippingFee = 60; // Default shipping fee, you can calculate based on district
        const tax = subtotal * 0.05;
        const total = subtotal + shippingFee + tax;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Prepare order data
        const orderDataToSave: any = {
            orderNumber: orderNumber,
            items: items,
            shippingAddress: {
                fullName: orderData.shippingAddress.fullName,
                phone: orderData.shippingAddress.phone,
                email: orderData.shippingAddress.email,
                address: orderData.shippingAddress.address,
                city: orderData.shippingAddress.city,
                postalCode: orderData.shippingAddress.postalCode || "",
                country: orderData.shippingAddress.country,
                district: orderData.shippingAddress.district
            },
            subtotal: subtotal,
            shippingFee: shippingFee,
            tax: tax,
            total: total,
            status: "pending",
            paymentStatus: orderData.paymentStatus || "pending",
            paymentMethod: orderData.paymentMethod,
            notes: orderData.notes || ""
        };

        // Only add user field if userId is provided and not "guest"
        if (orderData.userId && orderData.userId !== "guest") {
            try {
                orderDataToSave.user = new mongoose.Types.ObjectId(orderData.userId);
            } catch (error) {
                console.warn("Invalid user ID, creating guest order:", orderData.userId);
                // Don't add user field for invalid IDs
            }
        }

        console.log("Order data to save:", orderDataToSave);

        // Create order
        const order = await OrderModel.create(orderDataToSave);

        // Convert to plain object for response
        const plainOrder = order.toObject();

        console.log("Order created successfully:", plainOrder);

        return {
            success: true,
            order: plainOrder,
            message: "Order created successfully"
        };
    } catch (error: any) {
        console.error("Error creating order:", error);
        console.error("Error details:", error.errors);

        return {
            success: false,
            error: error.message || "Failed to create order",
            details: error.errors ? JSON.stringify(error.errors) : undefined
        };
    }
}


export async function updateOrderStatus(orderId: string, status: string) {
    try {
        await connectToDB();

        const updateData: Record<string, unknown> = { status };

        if (status === "delivered") {
            updateData.deliveredAt = new Date();
        } else if (status === "cancelled") {
            updateData.cancelledAt = new Date();
        }

        const order = await OrderModel.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        );

        if (!order) {
            return { success: false, error: "Order not found" };
        }

        revalidatePath("/admin/orders");
        revalidatePath("/orders");
        return { success: true, order: JSON.parse(JSON.stringify(order)) };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, error: "Failed to update order status" };
    }
}

export async function getUserOrders(userId: string) {
    try {
        await connectToDB();

        const orders = await OrderModel.find(
            {
                user: userId
            }
        ).lean();
        return { success: true, orders: JSON.parse(JSON.stringify(orders)) };
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return { success: false, error: "Failed to fetch orders" };
    }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
    try {
        const order = await OrderModel.findByIdAndUpdate(
            orderId,
            {
                paymentStatus,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!order) {
            return { success: false, error: "Order not found" };
        }

        return { success: true, order };
    } catch (error) {
        console.error("Error updating payment status:", error);
        return { success: false, error: "Failed to update payment status" };
    }
}

export async function getAllOrders() {
    try {
        await connectToDB();

        const orders = await OrderModel.find()
            .sort({ createdAt: -1 })
            .populate("user", "name email")
            .exec();

        return { success: true, orders: JSON.parse(JSON.stringify(orders)) };
    } catch (error) {
        console.error("Error fetching all orders:", error);
        return { success: false, error: "Failed to fetch orders" };
    }
}

export async function getOrderById(orderId: string) {
    try {
        await connectToDB();

        const order = await OrderModel.findOne({ orderNumber: orderId })
            .populate("user", "name email phone")
            .populate("items.product")
            .populate("items.package")
            // Remove trainingProgram population
            .exec();

        if (!order) {
            return { success: false, error: "Order not found" };
        }

        return { success: true, order: JSON.parse(JSON.stringify(order)) };
    } catch (error) {
        console.error("Error fetching order:", error);
        return { success: false, error: "Failed to fetch order" };
    }
}

export async function removeCartItemsAfterOrder({ userId, itemIds }: { userId: string; itemIds: string[] }) {
    try {
        await connectToDB();

        console.log("Removing cart items for user:", userId, "items:", itemIds);

        // Delete the cart items that were ordered
        const result = await CartModel.deleteMany({
            userId: userId,
            _id: { $in: itemIds }
        });

        console.log(`✅ Successfully removed ${result.deletedCount} items from cart`);

        return {
            success: true,
            deletedCount: result.deletedCount,
            message: `Removed ${result.deletedCount} items from cart`
        };
    } catch (error) {
        console.error("❌ Error removing cart items:", error);
        return {
            success: false,
            error: "Failed to remove cart items",
            message: "Please try again"
        };
    }
}