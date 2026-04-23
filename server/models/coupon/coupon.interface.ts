import { Document, Model, Types } from "mongoose";

export interface ICoupon {
    _id: Types.ObjectId;
    code: string;
    description?: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    isActive: boolean;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usedCount: number;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICouponModel extends Model<ICoupon> {
    findValidCoupon(code: string): Promise<ICoupon | null>;
}