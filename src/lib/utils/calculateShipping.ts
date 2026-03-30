/**
 * @fileOverview Pure utility for computing shipping and order charges based on business rules.
 */

export const FREE_DELIVERY_CITIES = ['kanpur'];
export const FREE_DELIVERY_THRESHOLD = 499;
export const HANDLING_CHARGE = 40;
export const PREMIUM_CHARGE = 20;

export interface OrderCharges {
  shipping: number;
  handling: number;
  premium: number;
  total: number;
  freeDelivery: {
    isFree: boolean;
    reason: 'city' | 'threshold' | null;
  };
}

/**
 * Calculates the shipping fee and breakdown based on city and subtotal.
 * RULES:
 * 1. Kanpur: Always FREE (₹0)
 * 2. Outside Kanpur: FREE if subtotal >= 499, else ₹50
 */
export function calculateOrderCharges(subtotal: number, city: string): OrderCharges {
  const normalizedCity = (city || '').trim().toLowerCase();
  const isKanpur = normalizedCity === 'kanpur';
  
  let shipping = 0;
  if (isKanpur) {
    shipping = 0;
  } else {
    shipping = subtotal < FREE_DELIVERY_THRESHOLD ? 50 : 0;
  }

  return {
    shipping,
    handling: HANDLING_CHARGE,
    premium: PREMIUM_CHARGE,
    total: subtotal + shipping + HANDLING_CHARGE + PREMIUM_CHARGE,
    freeDelivery: {
      isFree: shipping === 0,
      reason: isKanpur 
        ? 'city' 
        : subtotal >= FREE_DELIVERY_THRESHOLD 
          ? 'threshold' 
          : null
    }
  };
}

/**
 * Determines eligibility and reason for free delivery for UI display.
 */
export function isEligibleForFreeDelivery(subtotal: number, city: string) {
  const charges = calculateOrderCharges(subtotal, city);
  return charges.freeDelivery;
}
