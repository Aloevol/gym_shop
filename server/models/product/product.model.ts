import { model, models, Schema } from "mongoose";
import { IProduct, IProductModel } from "./product.interface";

const productSchema = new Schema<IProduct>({
    title: {
        type: String,
        required: [true, "Product title is required"],
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    description: {
        type: String,
        required: [true, "Product description is required"],
        trim: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    price: {
        type: Number,
        required: [true, "Product price is required"],
        min: [0, "Price cannot be negative"]
    },
    originalPrice: {
        type: Number,
        min: [0, "Original price cannot be negative"]
    },
    images: {
        type: [String],
        default: [],
        validate: {
            validator: function(images: string[]) {
                return images.length <= 10;
            },
            message: "Cannot have more than 10 images"
        }
    },
    category: {
        type: String,
        required: [true, "Product category is required"],
        trim: true
    },
    rating: {
        type: Number,
        default: 0,
        min: [0, "Rating cannot be less than 0"],
        max: [5, "Rating cannot be more than 5"],
        validate: {
            validator: function(value: number) {
                return value >= 0 && value <= 5;
            },
            message: "Rating must be between 0 and 5"
        }
    },
    brand: {
        type: String,
        required: [true, "Product brand is required"],
        trim: true
    },
    stock: {
        type: Number,
        required: [true, "Product stock is required"],
        min: [0, "Stock cannot be negative"],
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true
    }],
    specifications: {
        type: Map,
        of: String,
        default: {}
    },
    couponEnabled: {
        type: Boolean,
        default: false
    },
    couponDiscount: {
        type: Number,
        min: 0,
        default: 0
    },
    couponDiscountType: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage"
    }
}, {
    timestamps: true
});

// Indexes
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ title: 'text', description: 'text' });

// Static methods
productSchema.statics.findActiveProducts = async function(): Promise<IProduct[]> {
    return this.find({ isActive: true })
        .sort({ createdAt: -1 })
        .exec();
};

productSchema.statics.findFeaturedProducts = async function(): Promise<IProduct[]> {
    return this.find({
        isActive: true,
        isFeatured: true
    })
        .sort({ createdAt: -1 })
        .exec();
};

productSchema.statics.findByCategory = async function(category: string): Promise<IProduct[]> {
    return this.find({
        category: { $regex: category, $options: 'i' },
        isActive: true
    })
        .sort({ createdAt: -1 })
        .exec();
};

productSchema.statics.findByBrand = async function(brand: string): Promise<IProduct[]> {
    return this.find({
        brand: { $regex: brand, $options: 'i' },
        isActive: true
    })
        .sort({ createdAt: -1 })
        .exec();
};

let ProductModel: IProductModel;

if (typeof models !== 'undefined' && models.Product) {
    ProductModel = models.Product as unknown as IProductModel;
} else {
    ProductModel = model<IProduct, IProductModel>("Product", productSchema);
}

export { ProductModel };