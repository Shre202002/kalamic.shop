/**
 * @fileOverview Pure utility for computing shipping and order charges based on business rules.
 */

export const FREE_DELIVERY_CITIES = ['kanpur'];
export const FREE_DELIVERY_THRESHOLD = 499;
export const HANDLING_CHARGE_DEFAULT = 40;
export const PREMIUM_CHARGE_DEFAULT = 20;

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
 * Calculates the shipping fee and breakdown based on city, subtotal and product requirements.
 * RULES:
 * 1. Kanpur: Always FREE (₹0)
 * 2. Outside Kanpur: FREE if subtotal >= 499, else ₹50
 * 3. Handling: ₹40 only if required by any product in order (default true)
 * 4. Premium Protection: ₹20 only if required by any product in order (default true)
 */
export function calculateOrderCharges(
  subtotal: number, 
  city: string,
  options?: {
    requiresHandling?: boolean;
    requiresPremiumProtection?: boolean;
  }
): OrderCharges {
  const normalizedCity = (city || '').trim().toLowerCase();
  const isKanpur = normalizedCity === 'kanpur';
  
  let shipping = 0;
  if (isKanpur) {
    shipping = 0;
  } else {
    shipping = subtotal < FREE_DELIVERY_THRESHOLD ? 50 : 0;
  }

  // Handling — only if product requires it
  const handling = (options?.requiresHandling ?? true) ? HANDLING_CHARGE_DEFAULT : 0;

  // Premium Protection — only if product requires it
  const premium = (options?.requiresPremiumProtection ?? true) ? PREMIUM_CHARGE_DEFAULT : 0;

  return {
    shipping,
    handling,
    premium,
    total: subtotal + shipping + handling + premium,
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
