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
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  firebaseId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: { type: String, required: true },
}, { timestamps: true, collection: 'users' });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
