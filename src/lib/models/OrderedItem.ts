
import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Represents finalized order records in the Kalamic ecosystem.
 * This collection is the source of truth for post-acquisition logistics and payment audits.
 */

export interface IOrderedItem extends Document {
  user_id: string; // Firebase UID
  user_name: string;
  user_phone: string;
  order_number: string; // Unique human-readable ID
  total_amount: number;
  shipping_address: {
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
  status: 'Placed' | 'Crafting' | 'Developing' | 'Packed' | 'Dispatched' | 'Delivered' | 'cancelled' | 'refunded';
  payment_method: string;
  payment_gateway: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
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
  // --- USER DATA (User-provided) ---
  user_id: { type: String, required: true, index: true },
  user_name: { type: String, required: true },
  user_phone: { type: String, required: true },

  // --- ORDER CORE (System-generated) ---
  order_number: { type: String, required: true, unique: true, index: true },
  total_amount: { type: Number, required: true, min: [0, 'Amount cannot be negative'] },

  // --- LOGISTICS (User-provided) ---
  shipping_address: {
    full_name: { type: String, required: true },
    phone: { type: String, required: true },
    address_line1: { type: String, required: true },
    address_line2: { type: String, default: null },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },

  // --- WORKFLOW (Admin-controlled) ---
  status: { 
    type: String, 
    enum: ['Placed', 'Crafting', 'Developing', 'Packed', 'Dispatched', 'Delivered', 'cancelled', 'refunded'],
    default: 'Placed'
  },

  // --- PAYMENT METADATA (Webhook/Gateway-updated) ---
  /** Security: gateway_order_id and payment_id must match records in gateway dashboard */
  payment_method: { type: String, required: true },
  payment_gateway: { type: String, required: true },
  payment_status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  transaction_id: { type: String, default: null }, // Required if status is "paid"
  gateway_order_id: { type: String, default: null },
  payment_id: { type: String, default: null, index: true },
  payment_verified: { type: Boolean, default: false },
  payment_timestamp: { type: Date, default: null },

  // --- DATES ---
  expected_delivery: { type: Date, required: true },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'Ordered_Items' 
});

// --- VALIDATION RULES ---

OrderedItemSchema.pre('save', function(next) {
  // Rule: transaction_id must not be null if payment_status = "paid"
  if (this.payment_status === 'paid' && !this.transaction_id) {
    return next(new Error('Transaction ID is required for paid orders.'));
  }
  
  // Rule: payment_verified must be true before status becomes logic
  // Note: While enforced by business logic, we log warnings here for audit
  if ((this.status === 'Dispatched' || this.status === 'Delivered') && !this.payment_verified) {
    console.warn(`[AUDIT] Order ${this.order_number} marked as ${this.status} without payment verification.`);
  }

  next();
});

// --- INDEXES ---
OrderedItemSchema.index({ created_at: -1 });

export default mongoose.models.OrderedItem || mongoose.model<IOrderedItem>('OrderedItem', OrderedItemSchema);
