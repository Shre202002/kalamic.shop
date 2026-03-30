/**
 * @fileOverview Pure utility for computing shipping and order charges based on business rules.
 */

export const FREE_DELIVERY_CITIES = ['kanpur'];
export const FREE_DELIVERY_THRESHOLD = 499;
export const STANDARD_SHIPPING_CHARGE = 150;
export const HANDLING_CHARGE = 40;
export const PREMIUM_CHARGE = 20;

export interface OrderCharges {
  shipping: number;
  handling: number;
  premium: number;
  total: number;
}

/**
 * Calculates the shipping fee based on city and subtotal.
 * Priority: 1. City list (Kanpur is always free), 2. Subtotal threshold (499+ is free), 3. Standard charge.
 */
export function calculateShippingCharge(subtotal: number, city: string): number {
  const normalizedCity = (city || '').toLowerCase().trim();
  
  // Rule 1: Local City Override (Kanpur is always free)
  if (normalizedCity && FREE_DELIVERY_CITIES.includes(normalizedCity)) {
    return 0;
  }

  // Rule 2: Order Value Threshold (499 and above)
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    return 0;
  }

  // Rule 3: Standard Charge
  return STANDARD_SHIPPING_CHARGE;
}

/**
 * Returns a detailed breakdown of all order-level charges.
 */
export function calculateOrderCharges(subtotal: number, city: string): OrderCharges {
  const shipping = calculateShippingCharge(subtotal, city);
  // Handling and Protection charges are standard for artisanal items
  const handling = HANDLING_CHARGE;
  const premium = PREMIUM_CHARGE;
  
  return {
    shipping,
    handling,
    premium,
    total: subtotal + shipping + handling + premium
  };
}

/**
 * Determines eligibility and reason for free delivery for UI display.
 */
export function isEligibleForFreeDelivery(subtotal: number, city: string): { isFree: boolean; reason: 'city' | 'threshold' | null } {
  const normalizedCity = (city || '').toLowerCase().trim();
  
  if (normalizedCity && FREE_DELIVERY_CITIES.includes(normalizedCity)) {
    return { isFree: true, reason: 'city' };
  }
  
  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    return { isFree: true, reason: 'threshold' };
  }
  
  return { isFree: false, reason: null };
}
