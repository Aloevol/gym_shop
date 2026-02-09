import { model, models, Schema } from "mongoose";
import ICartModel, {ICart} from "@/server/models/cart/cart.interface";

const cartSchema = new Schema<ICart>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User id is required"],
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    package: {
        type: Schema.Types.ObjectId,
        ref: 'Package'
    },
    quantity: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isRemoved: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});


// Indexes
cartSchema.index({ userId: 1, isRemoved: 1 });

// Static methods
cartSchema.statics.getAllByUserId = async function(userId: unknown, page: number = 1, limit: number = 10): Promise<ICart[]> {
    const skip = (page - 1) * limit;

    return this.find({
        userId: userId,
        isActive: true
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
};

cartSchema.statics.getCartByUserId = async function(userId: unknown): Promise<ICart | null> {
    return this.findOne({
        userId: userId,
        isActive: true
    }).exec();
};

cartSchema.statics.getCartItemById = async function(cartId: unknown): Promise<ICart | null> {
    return this.findOne({
        _id: cartId,
        isActive: true
    }).exec();
};

cartSchema.statics.getCartByUserAndProduct = async function(userId: unknown, productId: unknown): Promise<ICart | null> {
    return this.findOne({
        userId: userId,
        product: productId,
        isActive: true
    }).exec();
};

cartSchema.statics.getCartByUserAndPackage = async function(userId: unknown, packageId: unknown): Promise<ICart | null> {
    return this.findOne({
        userId: userId,
        package: packageId,
        isActive: true
    }).exec();
};

cartSchema.statics.getCartCountByUserId = async function(userId: unknown): Promise<number> {
    return this.countDocuments({
        userId: userId,
        isActive: true
    }).exec();
};

cartSchema.statics.removeCartItem = async function(cartId: unknown): Promise<ICart | null> {
    return this.findByIdAndUpdate(
        cartId,
        {
            isActive: false,
            isRemoved: true
        },
        { new: true }
    ).exec();
};

cartSchema.statics.clearUserCart = async function(userId: unknown): Promise<{ deletedCount?: number }> {
    return this.updateMany(
        {
            userId: userId,
            isActive: true
        },
        {
            isActive: false,
            isRemoved: true
        }
    ).exec();
};

cartSchema.statics.updateCartQuantity = async function(cartId: unknown, quantity: number): Promise<ICart | null> {
    return this.findByIdAndUpdate(
        cartId,
        { quantity: quantity },
        { new: true }
    ).exec();
};

let CartModel: ICartModel;

    if (typeof models !== 'undefined' && models.Cart) {
    CartModel = models.Cart as unknown as ICartModel;
} else {
    CartModel = model<ICart, ICartModel>("Cart", cartSchema);
}

export { CartModel };