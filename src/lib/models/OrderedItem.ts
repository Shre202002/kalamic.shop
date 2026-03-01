import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Official Schema for finalized acquisitions in the Kalamic ecosystem.
 * Standardized to camelCase to match application logic and prevent validation errors.
 */

export type OrderStatus = 
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
  subtotal: number;
  charges: {
    shipping: number;
    handling: number;
    premium: number;
  };
  totalAmount: number;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
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
  
  subtotal: { type: Number, required: true },
  charges: {
    shipping: { type: Number, default: 20 },
    handling: { type: Number, default: 80 },
    premium: { type: Number, default: 50 }
  },
  totalAmount: { type: Number, required: true },

  items: {
    type: [{
      productId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      imageUrl: String
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
    enum: ["Placed", "Confirmed", "Preparing", "Developing", "Completed", "Dispatched", "Delivered", "Canceled"],
    default: "Placed"
  },

  paymentMethod: { type: String, required: true, default: 'online' },
  paymentGateway: { type: String, required: true, default: 'cashfree' },
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
  collection: 'Ordered_Items' 
});

// For debugging: verify correct schema paths are loaded
if (process.env.NODE_ENV === 'development') {
  console.log('[OrderedItem] Loaded Schema Paths:', Object.keys(OrderedItemSchema.paths));
}

export default mongoose.models.OrderedItem || mongoose.model<IOrderedItem>('OrderedItem', OrderedItemSchema);