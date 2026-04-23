import { model, models, Schema } from "mongoose";
import { ICoupon, ICouponModel } from "./coupon.interface";

const couponSchema = new Schema<ICoupon>({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ["percentage", "fixed"],
        default: "percentage"
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    minPurchaseAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscountAmount: {
        type: Number,
        min: 0
    },
    usageLimit: {
        type: Number,
        min: 0
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    expiresAt: {
        type: Date
    }
}, {
    timestamps: true
});

couponSchema.statics.findValidCoupon = async function(code: string): Promise<ICoupon | null> {
    const coupon = await this.findOne({ code: code.toUpperCase() });
    
    if (!coupon) return null;
    
    const now = new Date();
    
    if (!coupon.isActive) return null;
    
    if (coupon.expiresAt && coupon.expiresAt < now) return null;
    
    if (coupon.usageLimit && coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return null;
    
    return coupon;
};

let CouponModel: ICouponModel;

if (typeof models !== 'undefined' && models.Coupon) {
    CouponModel = models.Coupon as unknown as ICouponModel;
} else {
    CouponModel = model<ICoupon, ICouponModel>("Coupon", couponSchema);
}

export { CouponModel };