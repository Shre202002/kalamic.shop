import mongoose, { Document, Schema } from 'mongoose';

export interface IInstagramConnection extends Document {
  instagramUserId: string;
  username: string;
  encryptedAccessToken: string;
  tokenExpiresAt?: Date | null;
  status: 'connected' | 'error' | 'disconnected';
  lastSyncAt?: Date | null;
  lastError?: string;
  connectedBy: string;
}

const InstagramConnectionSchema = new Schema<IInstagramConnection>({
  instagramUserId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  encryptedAccessToken: { type: String, required: true, select: false },
  tokenExpiresAt: { type: Date, default: null },
  status: { type: String, enum: ['connected', 'error', 'disconnected'], default: 'connected' },
  lastSyncAt: { type: Date, default: null },
  lastError: { type: String, maxlength: 500, default: '' },
  connectedBy: { type: String, required: true },
}, { timestamps: true, collection: 'Instagram_Connections' });

export default mongoose.models.InstagramConnection || mongoose.model<IInstagramConnection>('InstagramConnection', InstagramConnectionSchema);
