import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerUpload extends Document {
  assetId: string;
  userId: string;
  productId: string;
  draftId: string;
  fileId: string;
  filePath: string;
  extension: 'jpg' | 'png' | 'webp';
  originalName: string;
  width: number;
  height: number;
  status: 'pending' | 'attached' | 'deleted';
  orderId?: string;
  expiresAt: Date;
}

const CustomerUploadSchema = new Schema<ICustomerUpload>({
  assetId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  draftId: { type: String, required: true, index: true },
  fileId: { type: String, required: true },
  filePath: { type: String, required: true },
  extension: { type: String, enum: ['jpg', 'png', 'webp'], required: true },
  originalName: { type: String, required: true, maxlength: 180 },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'attached', 'deleted'], default: 'pending', index: true },
  orderId: String,
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true, collection: 'Customer_Uploads' });

CustomerUploadSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'pending' } });
export default mongoose.models.CustomerUpload || mongoose.model<ICustomerUpload>('CustomerUpload', CustomerUploadSchema);
