
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';

// We store the confirmation result globally to allow the second step of verification.
let phoneConfirmationResult: ConfirmationResult | null = null;

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(err => {
    errorEmitter.emit('login-error', { code: err.code, message: err.message });
  });
}

/** Initiate email/password sign-up (non-blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    await createUserWithEmailAndPassword(authInstance, email, password);
  } catch (err: any) {
    errorEmitter.emit('login-error', { code: err.code, message: err.message });
    throw err;
  }
}

/** Initiate email/password sign-in (non-blocking). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(authInstance, email, password);
  } catch (err: any) {
    errorEmitter.emit('login-error', { code: err.code, message: err.message });
    throw err;
  }
}

/** 
 * Initiate Phone Sign-In (Real Firebase Phone Auth).
 * @param authInstance The Firebase Auth instance.
 * @param phoneNumber The phone number in E.164 format (e.g., +919876543210).
 * @param appVerifier The RecaptchaVerifier instance.
 */
export async function initiatePhoneSignIn(
  authInstance: Auth, 
  phoneNumber: string, 
  appVerifier: RecaptchaVerifier
): Promise<boolean> {
  try {
    const cleanPhone = phoneNumber.trim();
    
    // Validate number format (E.164)
    if (!cleanPhone.startsWith('+')) {
      errorEmitter.emit('login-error', { 
        code: 'auth/invalid-phone-number', 
        message: 'Phone number must start with + followed by country code (e.g., +91...)' 
      });
      return false;
    }

    console.log(`[AUTH] Requesting Real Firebase SMS for: ${cleanPhone}`);
    phoneConfirmationResult = await signInWithPhoneNumber(authInstance, cleanPhone, appVerifier);
    return true;
  } catch (err: any) {
    console.error("Firebase Phone Auth Error:", err);
    errorEmitter.emit('login-error', { code: err.code, message: err.message });
    return false;
  }
}

/**
 * Confirm the Phone OTP code.
 * @param verificationCode The 6-digit code sent to the user's phone.
 */
export async function confirmPhoneCode(verificationCode: string): Promise<boolean> {
  if (!phoneConfirmationResult) {
    errorEmitter.emit('login-error', { 
      code: 'auth/no-confirmation-result', 
      message: 'No pending verification found. Please request a new code.' 
    });
    return false;
  }

  try {
    await phoneConfirmationResult.confirm(verificationCode.trim());
    return true;
  } catch (err: any) {
    console.error("Code Confirmation Error:", err);
    errorEmitter.emit('login-error', { code: err.code, message: err.message });
    return false;
  }
}
