import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress extends Document {
  userId: string;
  fullName: string;
  street: string;
  landmark?: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

const AddressSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  fullName: { type: String, required: true },
  street: { type: String, required: true },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true, collection: 'addresses' });

export default mongoose.models.Address || mongoose.model<IAddress>('Address', AddressSchema);
