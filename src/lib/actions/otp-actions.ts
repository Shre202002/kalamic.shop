
'use server';

import dbConnect from '@/lib/db';
import Otp from '@/lib/models/Otp';
import { sendEmail } from '@/lib/email';

/**
 * Generates and stores a 6-digit OTP for the given identifier (email or phone).
 * Uses an upsert to ensure the record is atomic and stored correctly.
 */
async function generateAndStoreOtp(identifier: string) {
  await dbConnect();
  const cleanIdentifier = identifier.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

  console.log(`[DB] Storing OTP for ${cleanIdentifier}: ${code}`);

  try {
    // Atomic update or insert
    const record = await Otp.findOneAndUpdate(
      { email: cleanIdentifier },
      { 
        code, 
        expiresAt, 
        attempts: 0,
        createdAt: new Date() 
      },
      { upsert: true, new: true }
    );
    
    if (!record) {
      throw new Error("Failed to save OTP record to database.");
    }
    
    return code;
  } catch (dbError: any) {
    console.error("[DB] OTP Storage Error:", dbError);
    throw new Error("Database error while generating code.");
  }
}

/**
 * Sends an OTP via SMTP for email verification.
 */
export async function sendOtp(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  console.log(`[AUTH] Requesting Email OTP for: ${cleanEmail}`);
  
  const code = await generateAndStoreOtp(cleanEmail);

  try {
    await sendEmail({
      to: cleanEmail,
      subject: "Kalamic Artisan Shop - Verification Code",
      text: `Your 6-digit verification code is: ${code}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: 'Inter', sans-serif; padding: 40px; background-color: #FAF4EB; border-radius: 24px; max-width: 600px; margin: auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #EA781E; font-size: 32px; font-weight: 800; margin: 0;">Kalamic</h1>
            <p style="color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Handcrafted Heritage</p>
          </div>
          <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center;">
            <h2 style="color: #271E1B; margin-top: 0;">Verify Your Identity</h2>
            <p style="color: #666; line-height: 1.6;">Welcome to the Kalamic collection. Use the following code to verify your account.</p>
            <div style="background: #FAF4EB; padding: 24px; border-radius: 16px; margin: 32px 0; border: 1px dashed #EA781E;">
              <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #EA781E; display: block;">${code}</span>
            </div>
          </div>
        </div>
      `,
    });
    return { success: true, message: "Verification code sent to email." };
  } catch (error: any) {
    console.error("[SMTP] Email delivery failed:", error);
    throw new Error(error.message || "Failed to deliver email OTP.");
  }
}

/**
 * Simulates sending an OTP via SMS for phone verification.
 */
export async function sendPhoneOtp(phone: string) {
  const cleanPhone = phone.trim();
  console.log(`[AUTH] Requesting Phone OTP for: ${cleanPhone}`);
  const code = await generateAndStoreOtp(cleanPhone);

  console.log(`\n--------------------------------------`);
  console.log(`[SIMULATED SMS] TO: ${cleanPhone}`);
  console.log(`[SIMULATED SMS] CODE: ${code}`);
  console.log(`--------------------------------------\n`);

  return { 
    success: true, 
    message: "Verification code sent to your phone (Simulated: Check server logs)." 
  };
}

/**
 * Verifies the OTP provided by the user.
 */
export async function verifyOtp(identifier: string, code: string) {
  await dbConnect();
  const cleanIdentifier = identifier.trim().toLowerCase();
  const cleanCode = code.trim();

  console.log(`[AUTH] Verifying OTP for: ${cleanIdentifier} with code: ${cleanCode}`);

  try {
    const otpRecord = await Otp.findOne({ email: cleanIdentifier }).sort({ createdAt: -1 });

    if (!otpRecord) {
      console.error(`[AUTH] No OTP record found in DB for: ${cleanIdentifier}`);
      return { success: false, message: "No active verification code found." };
    }

    if (new Date() > otpRecord.expiresAt) {
      console.error(`[AUTH] OTP expired for: ${cleanIdentifier}`);
      await Otp.deleteOne({ _id: otpRecord._id });
      return { success: false, message: "Code has expired." };
    }

    if (otpRecord.code !== cleanCode) {
      console.error(`[AUTH] Incorrect code for: ${cleanIdentifier}. Expected: ${otpRecord.code}, Got: ${cleanCode}`);
      await Otp.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      return { success: false, message: "Incorrect code." };
    }

    console.log(`[AUTH] OTP verification SUCCESS for: ${cleanIdentifier}`);
    await Otp.deleteOne({ _id: otpRecord._id });
    return { success: true };
  } catch (error: any) {
    console.error("[OTP] Verification error:", error);
    throw new Error("Verification failed.");
  }
}
