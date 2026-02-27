
import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminLog extends Document {
  adminId: string;
  adminName: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: Date;
}

const AdminLogSchema: Schema = new Schema({
  adminId: { type: String, required: true, index: true },
  adminName: { type: String },
  role: { type: String },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { collection: 'admin_logs' });

export default mongoose.models.AdminLog || mongoose.model<IAdminLog>('AdminLog', AdminLogSchema);
