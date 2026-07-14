import mongoose, { Schema } from 'mongoose';
import dbConnect from '@/lib/db';

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  count: { type: Number, required: true, default: 0 },
  resetAt: { type: Date, required: true, index: true },
}, { collection: 'Security_Rate_Limits', timestamps: true });

const RateLimit = mongoose.models.SecurityRateLimit || mongoose.model('SecurityRateLimit', RateLimitSchema);

export function requestIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

/** Distributed Mongo-backed fixed-window limiter. Fail closed if the limiter cannot be reached. */
export async function consumeRateLimit(key: string, limit: number, windowMs: number) {
  try {
    await dbConnect();
    const now = new Date();
    const current = await RateLimit.findOneAndUpdate(
      { key, resetAt: { $gt: now }, count: { $lt: limit } },
      { $inc: { count: 1 } },
      { new: true }
    ).lean();
    if (current) return true;

    const existing: any = await RateLimit.findOne({ key }).lean();
    if (existing && existing.resetAt > now) return false;

    await RateLimit.updateOne(
      { key },
      { $set: { count: 1, resetAt: new Date(Date.now() + windowMs) } },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('[RATE_LIMIT_ERROR]', error instanceof Error ? error.message : 'unknown');
    return false;
  }
}
