'use server';

import dbConnect from '@/lib/db';
import Otp from '@/lib/models/Otp';

/**
 * Generates and stores a 6-digit OTP for the given email.
 */
export async function sendOtp(email: string) {
  await dbConnect();
  
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

  try {
    // Delete existing OTPs for this email to avoid confusion
    await Otp.deleteMany({ email });
    
    await Otp.create({
      email,
      code,
      expiresAt,
    });

    // In a real production app, you would call an email service here.
    // For this prototype, we log it to the console (simulating sending).
    console.log(`[AUTH] OTP for ${email}: ${code}`);
    
    return { success: true, message: "OTP sent successfully." };
  } catch (error) {
    console.error("Error generating OTP:", error);
    throw new Error("Failed to send OTP. Please try again.");
  }
}

/**
 * Verifies the OTP provided by the user.
 */
export async function verifyOtp(email: string, code: string) {
  await dbConnect();
  
  try {
    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return { success: false, message: "No active OTP found for this email." };
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return { success: false, message: "OTP has expired." };
    }

    if (otpRecord.code !== code) {
      // Log failed attempt
      await Otp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      console.warn(`[SECURITY] Failed OTP attempt for ${email} at ${new Date().toISOString()}`);
      
      return { success: false, message: "Incorrect OTP code." };
    }

    // Success - delete OTP
    await Otp.deleteOne({ _id: otpRecord._id });
    return { success: true };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw new Error("Verification failed.");
  }
}
