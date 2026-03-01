import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Schema for administrative notifications within the studio control hub.
 */

export interface IAdminNotification extends Document {
  type: 'order_placed' | 'payment_received' | 'system_alert';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const AdminNotificationSchema: Schema = new Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false },
}, { 
  timestamps: { createdAt: true, updatedAt: false }, 
  collection: 'admin_notifications' 
});

export default mongoose.models.AdminNotification || mongoose.model<IAdminNotification>('AdminNotification', AdminNotificationSchema);
