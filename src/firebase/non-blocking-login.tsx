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

// We store the confirmation result globally (or in a stateful way in the component) 
// to allow the second step of verification.
let phoneConfirmationResult: ConfirmationResult | null = null;

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(err => {
    errorEmitter.emit('login-error', { code: err.code, message: err.message });
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .catch(err => {
      errorEmitter.emit('login-error', { code: err.code, message: err.message });
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch(err => {
    errorEmitter.emit('login-error', { code: err.code, message: err.message });
  });
}

/** 
 * Initiate Phone Sign-In.
 * @param authInstance The Firebase Auth instance.
 * @param phoneNumber The phone number in E.164 format (e.g., +16505550101).
 * @param appVerifier The RecaptchaVerifier instance.
 */
export async function initiatePhoneSignIn(
  authInstance: Auth, 
  phoneNumber: string, 
  appVerifier: RecaptchaVerifier
): Promise<boolean> {
  try {
    phoneConfirmationResult = await signInWithPhoneNumber(authInstance, phoneNumber, appVerifier);
    return true;
  } catch (err: any) {
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
      message: 'No pending phone verification found. Please request a new code.' 
    });
    return false;
  }

  try {
    await phoneConfirmationResult.confirm(verificationCode);
    return true;
  } catch (err: any) {
    errorEmitter.emit('login-error', { code: err.code, message: err.message });
    return false;
  }
}
