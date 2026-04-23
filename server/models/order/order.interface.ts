import { Document, Model, Types } from "mongoose";

export interface IOrderItem {
    product?: Types.ObjectId;
    package?: Types.ObjectId;
    // Remove trainingProgram
    quantity: number;
    price: number;
    title: string;
    image: string;
    type: "product" | "package"; // Remove "trainingProgram"
}

export interface IShippingAddress {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode?: string;
    country: string;
    district: string;
}

export interface IOrder extends Document {
    orderNumber: string;
    user: Types.ObjectId;
    items: IOrderItem[];
    shippingAddress: IShippingAddress;
    subtotal: number;
    shippingFee: number;
    total: number;
    status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";
    paymentMethod: "card" | "cashOnDelivery" | "bankTransfer";
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IOrderModel extends Model<IOrder> {
    generateOrderNumber(): Promise<string>;
}