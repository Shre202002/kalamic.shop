import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Represents finalized order records in the Kalamic ecosystem.
 * This collection is the source of truth for post-acquisition logistics and payment audits.
 */

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IOrderedItem extends Document {
  user_id: string; // Firebase UID
  user_name: string;
  user_phone: string;
  user_email: string;
  order_number: string; // Unique human-readable ID
  total_amount: number;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
  }>;
  shipping_address: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  status: OrderStatus;
  payment_method: string;
  payment_gateway: string;
  payment_status: PaymentStatus;
  transaction_id?: string | null;
  gateway_order_id?: string | null;
  payment_id?: string | null;
  payment_verified: boolean;
  payment_timestamp?: Date | null;
  expected_delivery: Date;
  created_at: Date;
  updated_at: Date;
}

const OrderedItemSchema: Schema = new Schema({
  user_id: { type: String, required: true, index: true },
  user_name: { type: String, required: true },
  user_phone: { type: String, required: true },
  user_email: { type: String },
  order_number: { type: String, required: true, unique: true, index: true },
  total_amount: { type: Number, required: true, min: [0, 'Amount cannot be negative'] },
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
  shipping_address: {
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    address_line1: { type: String, required: true },
    address_line2: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment_method: { type: String, required: true },
  payment_gateway: { type: String, required: true },
  payment_status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transaction_id: { type: String, default: null },
  gateway_order_id: { type: String, default: null },
  payment_id: { type: String, default: null, index: true },
  payment_verified: { type: Boolean, default: false },
  payment_timestamp: { type: Date, default: null },
  expected_delivery: { type: Date, required: true },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'Ordered_Items' 
});

OrderedItemSchema.index({ created_at: -1 });

export default mongoose.models.OrderedItem || mongoose.model<IOrderedItem>('OrderedItem', OrderedItemSchema);
