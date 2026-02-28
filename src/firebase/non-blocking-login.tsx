'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  ConfirmationResult,
  RecaptchaVerifier
} from 'firebase/auth';
import { errorEmitter } from './error-emitter';

// Store confirmation result module-level for simplicity in the phone auth flow
let globalConfirmationResult: ConfirmationResult | null = null;

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error: any) => {
    errorEmitter.emit('login-error', { code: error.code, message: error.message });
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch((error: any) => {
    errorEmitter.emit('login-error', { code: error.code, message: error.message });
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch((error: any) => {
    errorEmitter.emit('login-error', { code: error.code, message: error.message });
  });
}

/** 
 * Initiate phone number sign-in.
 * Returns a promise because the first step (sending SMS) is a blocking network request 
 * that provides the confirmation result needed for the next step.
 */
export async function initiatePhoneSignIn(auth: Auth, phoneNumber: string, verifier: RecaptchaVerifier): Promise<boolean> {
  try {
    globalConfirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    return true;
  } catch (error: any) {
    errorEmitter.emit('login-error', { code: error.code, message: error.message });
    return false;
  }
}

/** 
 * Confirm the OTP code sent to the user's phone.
 */
export async function confirmPhoneCode(code: string): Promise<boolean> {
  if (!globalConfirmationResult) {
    errorEmitter.emit('login-error', { code: 'auth/missing-confirmation-result', message: 'Verification session expired. Please request a new code.' });
    return false;
  }
  try {
    await globalConfirmationResult.confirm(code);
    return true;
  } catch (error: any) {
    errorEmitter.emit('login-error', { code: error.code, message: error.message });
    return false;
  }
}
