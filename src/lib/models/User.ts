
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  firebaseId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String },
  lastName: { type: String },
  phone: { type: String },
}, { timestamps: true, collection: 'users' });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
