
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  userId: string; // Firebase UID
  orderDate: Date;
  totalAmount: number;
  orderStatus: string;
  shippingAddressId?: string;
  items: any[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  orderDate: { type: Date, default: Date.now },
  totalAmount: { type: Number, required: true },
  orderStatus: { type: String, default: 'pending' },
  shippingAddressId: { type: String },
  items: [{
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    imageUrl: String
  }]
}, { timestamps: true, collection: 'orders' });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
