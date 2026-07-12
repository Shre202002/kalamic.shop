import mongoose, { Schema, Document } from 'mongoose';

/**
 * @fileOverview Schema for discount promo codes in the Kalamic ecosystem.
 * Ensures codes are unique, uppercase, and have strictly enforced usage rules.
 */

export interface IPromoCode extends Document {
  code: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema: Schema = new Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true, 
    uppercase: true, 
    trim: true 
  },
  discountType: { 
    type: String, 
    enum: ['flat', 'percent'], 
    required: true 
  },
  discountValue: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  minOrderValue: { 
    type: Number, 
    default: 0 
  },
  maxUses: { 
    type: Number, 
    default: 0 // 0 = unlimited
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  expiresAt: { 
    type: Date, 
    default: null 
  },
  description: { 
    type: String 
  },
}, { 
  timestamps: true,
  collection: 'Promo_Codes'
});

// Pre-save hook to ensure uppercase even if set via direct DB ops
PromoCodeSchema.pre('save', function(this: IPromoCode, next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  next();
});

export default mongoose.models.PromoCode || mongoose.model<IPromoCode>('PromoCode', PromoCodeSchema);
