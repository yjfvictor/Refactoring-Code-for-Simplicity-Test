// Refactored code - Simplified Order Processing System
// This version is simpler, more readable, and easier to maintain

// Constants for business rules
const TAX_RATE = 0.1;
const STANDARD_FEE = 2.50;
const LARGE_ORDER_FEE = 5.00;
const LARGE_ORDER_THRESHOLD = 10;
const MINIMUM_ORDER_VALUE = 10;

const CUSTOMER_TIERS = {
  PREMIUM: { threshold: 1000, discount: 0.1 },
  GOLD: { threshold: 500, discount: 0 },
  STANDARD: { threshold: 0, discount: 0 }
};

const PROMO_CODES = {
  SAVE10: 0.1,
  SAVE20: 0.2,
  SAVE50: 0.5
};

// Simple validation functions
function validateOrder(order) {
  if (!order || !order.id) {
    return { valid: false, error: 'Order must have an id' };
  }

  if (!order.items || order.items.length === 0) {
    return { valid: false, error: 'Order must have at least one item' };
  }

  for (const item of order.items) {
    if (!item.id || !item.price || item.price <= 0 || !item.quantity || item.quantity <= 0) {
      return { valid: false, error: 'Invalid item data' };
    }
  }

  if (!order.customer || !order.customer.id || !isValidEmail(order.customer.email)) {
    return { valid: false, error: 'Invalid customer data' };
  }

  return { valid: true };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Simple calculation functions
function calculateSubtotal(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

function calculateTax(subtotal) {
  return subtotal * TAX_RATE;
}

function calculateFee(itemCount) {
  return itemCount > LARGE_ORDER_THRESHOLD ? LARGE_ORDER_FEE : STANDARD_FEE;
}

function calculateTotal(subtotal, tax, fee) {
  return subtotal + tax + fee;
}

// Discount functions
function getCustomerTier(customer) {
  const totalSpent = customer?.purchaseHistory?.totalSpent || 0;
  
  if (totalSpent >= CUSTOMER_TIERS.PREMIUM.threshold) return 'premium';
  if (totalSpent >= CUSTOMER_TIERS.GOLD.threshold) return 'gold';
  return 'standard';
}

function applyTierDiscount(price, tier) {
  const discountRate = CUSTOMER_TIERS[tier.toUpperCase()]?.discount || 0;
  return price * discountRate;
}

function applyVolumeDiscount(price, itemCount) {
  if (itemCount > LARGE_ORDER_THRESHOLD) {
    return price * 0.05; // 5% volume discount
  }
  return 0;
}

function applyPromoDiscount(price, promoCode) {
  const discountRate = PROMO_CODES[promoCode] || 0;
  return price * discountRate;
}

function applySeasonalDiscount(price) {
  const currentMonth = new Date().getMonth();
  if (currentMonth === 11) { // December
    return price * 0.15; // 15% seasonal discount
  }
  return 0;
}

function calculateFinalPrice(order, promoCode) {
  const subtotal = calculateSubtotal(order.items);
  const tax = calculateTax(subtotal);
  const fee = calculateFee(calculateSubtotal(order.items) / order.items[0].price); // Approximate item count
  const total = calculateTotal(subtotal, tax, fee);

  // Apply discounts
  const tier = getCustomerTier(order.customer);
  const tierDiscount = applyTierDiscount(total, tier);
  const volumeDiscount = applyVolumeDiscount(total, order.items.length);
  const promoDiscount = promoCode ? applyPromoDiscount(total, promoCode) : 0;
  const seasonalDiscount = applySeasonalDiscount(total);

  const totalDiscount = tierDiscount + volumeDiscount + promoDiscount + seasonalDiscount;
  const finalPrice = Math.max(0, total - totalDiscount);

  return {
    subtotal,
    tax,
    fee,
    total,
    discounts: {
      tier: tierDiscount,
      volume: volumeDiscount,
      promotional: promoDiscount,
      seasonal: seasonalDiscount
    },
    finalPrice
  };
}

// Main processing function
function processOrder(order, promoCode) {
  // Validate
  const validation = validateOrder(order);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Calculate pricing
  const pricing = calculateFinalPrice(order, promoCode);

  // Check minimum value
  if (pricing.finalPrice < MINIMUM_ORDER_VALUE) {
    return { success: false, error: 'Order value below minimum' };
  }

  // Return processed order
  return {
    success: true,
    order: {
      id: order.id,
      customerId: order.customer.id,
      itemCount: order.items.length,
      pricing
    }
  };
}

function processOrders(orders, promoCode) {
  const results = orders.map(order => processOrder(order, promoCode));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  return {
    total: orders.length,
    successful: successful.length,
    failed: failed.length,
    orders: successful.map(r => r.order)
  };
}

// Usage example
const orders = [
  {
    id: '123',
    items: [{ id: 'item1', price: 10, quantity: 2 }],
    customer: { 
      id: 'cust1', 
      email: 'test@example.com', 
      purchaseHistory: { totalSpent: 1200 } 
    }
  }
];

const result = processOrders(orders, 'SAVE10');
console.log(result);
