import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Official Schema for finalized acquisitions in the Kalamic ecosystem.
 * Updated to use camelCase and include specific artisanal charges.
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
  };
  orderStatus: OrderStatus;
  paymentMethod?: string;
  paymentGateway?: string;
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
      productId: String,
      name: String,
      price: Number,
      quantity: Number,
      imageUrl: String
    }],
    _id: false
  },

  shippingAddress: {
    fullName: { type: String },
    phone: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String, default: null },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
  },

  orderStatus: { 
    type: String, 
    enum: ["Placed", "Confirmed", "Preparing", "Developing", "Completed", "Dispatched", "Delivered", "Canceled"],
    default: "Placed"
  },

  paymentMethod: { type: String },
  paymentGateway: { type: String },
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
  expectedDelivery: { type: Date },
}, { 
  timestamps: true,
  collection: 'Ordered_Items' 
});

OrderedItemSchema.index({ createdAt: -1 });

export default mongoose.models.OrderedItem || mongoose.model<IOrderedItem>('OrderedItem', OrderedItemSchema);
