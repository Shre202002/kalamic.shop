
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
  phoneVerified: boolean;
  role: 'super_admin' | 'admin' | 'support' | 'user';
  status: 'active' | 'disabled';
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  firebaseId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: false }, 
  lastName: { type: String, required: false },  
  phone: { type: String, required: false },     
  address: { type: String, required: false },   
  state: { type: String, required: false },     
  city: { type: String, required: false },      
  pincode: { type: String, required: false },   
  landmark: { type: String, required: false },  
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'support', 'user'], 
    default: 'user' 
  },
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'users' });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
