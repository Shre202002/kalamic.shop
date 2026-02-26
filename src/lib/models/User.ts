import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  state: string;
  city: string;
  pincode: string;
  landmark: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  firebaseId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: false }, // Made optional for initial OTP verification step
  lastName: { type: String, required: false },  // Made optional for initial OTP verification step
  phone: { type: String, required: false },     // Made optional for initial OTP verification step
  address: { type: String, required: false },   // Made optional for initial OTP verification step
  state: { type: String, required: false },     // Made optional for initial OTP verification step
  city: { type: String, required: false },      // Made optional for initial OTP verification step
  pincode: { type: String, required: false },   // Made optional for initial OTP verification step
  landmark: { type: String, required: false },  // Made optional for initial OTP verification step
  emailVerified: { type: Boolean, default: false },
}, { timestamps: true, collection: 'users' });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
