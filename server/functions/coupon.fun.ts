"use server";

import { connectToDB } from "@/server/db";
import { SendResponse } from "../helper/sendResponse.helper";
import { CouponModel } from "../models/coupon/coupon.model";
import { ICoupon } from "../models/coupon/coupon.interface";

interface ICouponResponse {
    isError: boolean;
    status: number;
    message: string;
    data?: ICoupon | ICoupon[] | null;
}

export async function createCouponServerSide(body: Partial<ICoupon>): Promise<ICouponResponse> {
    try {
        await connectToDB();

        const { code, discountType, discountValue } = body;

        if (!code || !discountType || !discountValue) {
            return SendResponse<ICoupon>({
                isError: true,
                status: 400,
                message: "Code, discount type, and discount value are required"
            });
        }

        const existingCoupon = await CouponModel.findOne({ code: code.toUpperCase() });

        if (existingCoupon) {
            return SendResponse<ICoupon>({
                isError: true,
                status: 409,
                message: "Coupon code already exists"
            });
        }

        const newCoupon = await CouponModel.create({
            ...body,
            code: code.toUpperCase()
        });

        return SendResponse<ICoupon>({
            isError: false,
            status: 201,
            message: "Coupon created successfully",
            data: newCoupon
        });
    } catch (error) {
        return SendResponse<ICoupon>({
            isError: true,
            status: 500,
            message: "Failed to create coupon"
        });
    }
}

export async function getAllCouponsServerSide(): Promise<ICouponResponse> {
    try {
        await connectToDB();

        const coupons = await CouponModel.find().sort({ createdAt: -1 });

        return SendResponse<ICoupon[]>({
            isError: false,
            status: 200,
            message: "Coupons retrieved successfully",
            data: coupons
        });
    } catch (error) {
        return SendResponse<ICoupon[]>({
            isError: true,
            status: 500,
            message: "Failed to retrieve coupons"
        });
    }
}

export async function updateCouponServerSide(couponId: string, body: Partial<ICoupon>): Promise<ICouponResponse> {
    try {
        await connectToDB();

        const coupon = await CouponModel.findById(couponId);

        if (!coupon) {
            return SendResponse<ICoupon>({
                isError: true,
                status: 404,
                message: "Coupon not found"
            });
        }

        if (body.code) {
            const existingCoupon = await CouponModel.findOne({
                code: body.code.toUpperCase(),
                _id: { $ne: couponId }
            });

            if (existingCoupon) {
                return SendResponse<ICoupon>({
                    isError: true,
                    status: 409,
                    message: "Coupon code already exists"
                });
            }
            body.code = body.code.toUpperCase();
        }

        const updatedCoupon = await CouponModel.findByIdAndUpdate(
            couponId,
            body,
            { new: true }
        );

        return SendResponse<ICoupon>({
            isError: false,
            status: 200,
            message: "Coupon updated successfully",
            data: updatedCoupon || undefined
        });
    } catch (error) {
        return SendResponse<ICoupon>({
            isError: true,
            status: 500,
            message: "Failed to update coupon"
        });
    }
}

export async function deleteCouponServerSide(couponId: string): Promise<ICouponResponse> {
    try {
        await connectToDB();

        const coupon = await CouponModel.findByIdAndDelete(couponId);

        if (!coupon) {
            return SendResponse<ICoupon>({
                isError: true,
                status: 404,
                message: "Coupon not found"
            });
        }

        return SendResponse<ICoupon>({
            isError: false,
            status: 200,
            message: "Coupon deleted successfully"
        });
    } catch (error) {
        return SendResponse<ICoupon>({
            isError: true,
            status: 500,
            message: "Failed to delete coupon"
        });
    }
}

export async function validateCouponServerSide(code: string, subtotal: number): Promise<{
    isError: boolean;
    message: string;
    discount?: number;
    discountType?: string;
    discountValue?: number;
}> {
    try {
        await connectToDB();

        const coupon = await CouponModel.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return {
                isError: true,
                message: "Invalid or expired coupon code"
            };
        }

        if (!coupon.isActive) {
            return {
                isError: true,
                message: "Coupon is inactive"
            };
        }

        const now = new Date();
        if (coupon.expiresAt && coupon.expiresAt < now) {
            return {
                isError: true,
                message: "Coupon has expired"
            };
        }

        if (coupon.usageLimit && coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
            return {
                isError: true,
                message: "Coupon usage limit reached"
            };
        }

        if (coupon.minPurchaseAmount && coupon.minPurchaseAmount > 0 && subtotal < coupon.minPurchaseAmount) {
            return {
                isError: true,
                message: `Minimum purchase of ৳${coupon.minPurchaseAmount} required`
            };
        }

        let discount = 0;

        if (coupon.discountType === "percentage") {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0 && discount > coupon.maxDiscountAmount) {
                discount = coupon.maxDiscountAmount;
            }
        } else {
            discount = coupon.discountValue;
            if (discount > subtotal) {
                discount = subtotal;
            }
        }

        return {
            isError: false,
            message: `Coupon applied! You save ৳${discount}`,
            discount,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        };
    } catch (error) {
        console.error("Coupon validation error:", error);
        return {
            isError: true,
            message: "Failed to validate coupon"
        };
    }
}

export async function applyCouponToOrder(couponId: string): Promise<ICouponResponse> {
    try {
        await connectToDB();

        const coupon = await CouponModel.findById(couponId);

        if (!coupon) {
            return SendResponse<ICoupon>({
                isError: true,
                status: 404,
                message: "Coupon not found"
            });
        }

        const updatedCoupon = await CouponModel.findByIdAndUpdate(
            couponId,
            { $inc: { usedCount: 1 } },
            { new: true }
        );

        return SendResponse<ICoupon>({
            isError: false,
            status: 200,
            message: "Coupon applied to order",
            data: updatedCoupon || undefined
        });
    } catch (error) {
        return SendResponse<ICoupon>({
            isError: true,
            status: 500,
            message: "Failed to apply coupon"
        });
    }
}

export async function applyCouponByCode(code: string): Promise<ICouponResponse> {
    try {
        await connectToDB();

        const coupon = await CouponModel.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return SendResponse<ICoupon>({
                isError: true,
                status: 404,
                message: "Coupon not found"
            });
        }

        const updatedCoupon = await CouponModel.findByIdAndUpdate(
            coupon._id,
            { $inc: { usedCount: 1 } },
            { new: true }
        );

        return SendResponse<ICoupon>({
            isError: false,
            status: 200,
            message: "Coupon usage updated",
            data: updatedCoupon || undefined
        });
    } catch (error) {
        return SendResponse<ICoupon>({
            isError: true,
            status: 500,
            message: "Failed to update coupon usage"
        });
    }
}