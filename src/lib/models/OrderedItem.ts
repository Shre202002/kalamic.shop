import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Official Schema for finalized acquisitions in the Kalamic ecosystem.
 * Standardized to camelCase. Includes promo code tracking for financial reconciliation.
 */

export type OrderStatus = 
  | "Initiated"
  | "Placed" 
  | "Confirmed" 
  | "Preparing" 
  | "Developing" 
  | "Completed" 
  | "Dispatched" 
  | "Delivered" 
  | "Canceled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface IOrderedItem extends Document {
  userId: string;
  userName: string;
  userPhone: string;
  userEmail?: string;
  orderNumber: string;
  checkoutIdempotencyKey?: string | null;
  inventoryReserved?: boolean;
  inventoryReleased?: boolean;
  subtotal: number;
  charges: {
    shipping: number;
    handling: number;
    premium: number;
  };
  totalAmount: number;
  
  // Promo tracking
  promoCode: string | null;
  promoDiscount: number;
  promoDiscountType: string | null;

  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    containImage: boolean;
    customerImage?: {
      assetId: string;
      mediaType: 'image';
      fileId: string;
      filePath: string;
      width: number;
      height: number;
      originalName: string;
      uploadedAt: Date;
    };
    customerImageDetails: Array<{
      assetId: string;
      mediaType: 'image';
      fileId: string;
      filePath: string;
      width: number;
      height: number;
      originalName: string;
      uploadedAt: Date;
    }>;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
    nearestLandmark?: string | null;
  };
  orderStatus: OrderStatus;
  paymentMethod: string;
  paymentGateway: string;
  paymentStatus: PaymentStatus;
  transactionId?: string | null;
  gatewayOrderId?: string | null;
  paymentId?: string | null;
  paymentVerified: boolean;
  paymentTimestamp?: Date | null;
  expectedDelivery: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderedItemSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  userPhone: { type: String, required: true },
  userEmail: { type: String },
  
  orderNumber: { type: String, required: true, unique: true, index: true },
  checkoutIdempotencyKey: { type: String, default: null, index: true, sparse: true },
  inventoryReserved: { type: Boolean, default: false },
  inventoryReleased: { type: Boolean, default: false },
  
  subtotal: { type: Number, required: true },
  charges: {
    shipping: { type: Number, default: 150 },
    handling: { type: Number, default: 40 },
    premium: { type: Number, default: 20 }
  },
  totalAmount: { type: Number, required: true },

  // Promo Fields
  promoCode: { 
    type: String, 
    default: null,
    trim: true,
    uppercase: true
  },
  promoDiscount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  promoDiscountType: { 
    type: String, 
    enum: ['flat', 'percent', null],
    default: null 
  },

  items: {
    type: [{
      productId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      imageUrl: String,
      containImage: { type: Boolean, default: false },
      customerImage: {
        assetId: { type: String, default: null }, mediaType: { type: String, enum: ['image', null], default: null },
        fileId: { type: String, default: null }, filePath: { type: String, default: null },
        width: { type: Number, default: null }, height: { type: Number, default: null },
        originalName: { type: String, default: null }, uploadedAt: { type: Date, default: null }
      },
      customerImageDetails: {
        type: [{
          assetId: { type: String, required: true }, mediaType: { type: String, enum: ['image'], required: true },
          fileId: { type: String, required: true }, filePath: { type: String, required: true },
          width: { type: Number, required: true }, height: { type: Number, required: true },
          originalName: { type: String, required: true }, uploadedAt: { type: Date, required: true }
        }],
        default: []
      }
    }],
    _id: false
  },

  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    nearestLandmark: { type: String, default: null },
  },

  orderStatus: { 
    type: String, 
    enum: ["Initiated", "Placed", "Confirmed", "Preparing", "Developing", "Completed", "Dispatched", "Delivered", "Canceled"],
    default: "Initiated"
  },

  paymentMethod: { type: String, required: true, default: 'online' },
  paymentGateway: { type: String, required: true, default: 'razorpay' },
  paymentStatus: { 
    type: String, 
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },

  transactionId: { type: String, default: null },
  gatewayOrderId: { type: String, default: null },
  paymentId: { type: String, default: null, index: true },
  
  paymentVerified: { type: Boolean, default: false },
  paymentTimestamp: { type: Date, default: null },
  expectedDelivery: { type: Date, required: true },
}, { 
  timestamps: true,
  collection: 'Ordered_Items',
  strict: true 
});

OrderedItemSchema.index({ userId: 1, checkoutIdempotencyKey: 1 }, { unique: true, sparse: true });

export default mongoose.models.OrderedItem || mongoose.model<IOrderedItem>('OrderedItem', OrderedItemSchema);
