import { model, models, Schema } from "mongoose";
import { IOrder, IOrderModel } from "./order.interface";

const orderItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    package: { type: Schema.Types.ObjectId, ref: "Package" },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    title: { type: String, required: true },
    image: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ["product", "package"]
    }
});

const shippingAddressSchema = new Schema({
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, required: true, default: "Bangladesh" },
    district: { type: String, required: true }
});

const orderSchema = new Schema<IOrder>({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: false,
        efault: null
    },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingFee: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    tax: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
        default: "pending"
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["card", "cashOnDelivery", "bankTransfer"]
    },
    notes: { type: String, trim: true }
}, {
    timestamps: true
});

// Static method to generate order number
orderSchema.statics.generateOrderNumber = async function(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${dateStr}-${random}`;
};

// Pre-save middleware to generate order number
orderSchema.pre("save", async function(next) {
    if (this.isNew && !this.orderNumber) {
        try {
            this.orderNumber = await (this.constructor as IOrderModel).generateOrderNumber();
        } catch (error) {
            return next(error as Error);
        }
    }
    next();
});

let OrderModel: IOrderModel;

if (typeof models !== 'undefined' && models.Order) {
    OrderModel = models.Order as unknown as IOrderModel;
} else {
    OrderModel = model<IOrder, IOrderModel>("Order", orderSchema);
}

export { OrderModel };