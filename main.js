// Overly complicated code example - Order Processing System
// This code is intentionally over-engineered to demonstrate refactoring

class OrderProcessor {
  constructor() {
    this.state = {
      orders: [],
      processedOrders: [],
      failedOrders: [],
      metadata: {
        processingStartTime: null,
        processingEndTime: null,
        totalProcessingTime: null,
        statistics: {
          successCount: 0,
          failureCount: 0,
          totalValue: 0,
          averageOrderValue: 0
        }
      }
    };
  }

  processOrders(orders, options = {}) {
    // Initialize processing state
    this.state.metadata.processingStartTime = new Date().getTime();
    this.state.orders = Array.isArray(orders) ? orders : [];
    
    // Validate and process each order
    const results = this.state.orders.map((order, index) => {
      try {
        // Complex validation chain
        const validationResult = this.performComprehensiveValidation(order, options);
        if (!validationResult.isValid) {
          this.handleValidationFailure(order, validationResult, index);
          return null;
        }

        // Process order with multiple transformations
        const processedOrder = this.transformAndEnrichOrder(order, options);
        
        // Calculate pricing with complex logic
        const pricingResult = this.calculateComplexPricing(processedOrder, options);
        processedOrder.finalPrice = pricingResult.finalPrice;
        processedOrder.pricingBreakdown = pricingResult.breakdown;

        // Apply discounts with nested conditions
        const discountResult = this.applyMultiLevelDiscounts(processedOrder, options);
        processedOrder.discountedPrice = discountResult.discountedPrice;
        processedOrder.appliedDiscounts = discountResult.discounts;

        // Final validation before completion
        if (this.shouldCompleteOrder(processedOrder, options)) {
          this.state.processedOrders.push(processedOrder);
          this.updateStatistics(processedOrder, 'success');
          return processedOrder;
        } else {
          this.handleCompletionFailure(order, index);
          return null;
        }
      } catch (error) {
        this.handleError(error, order, index);
        return null;
      }
    });

    // Finalize processing
    this.finalizeProcessing();
    return this.buildResponse(results, options);
  }

  performComprehensiveValidation(order, options) {
    const errors = [];
    const warnings = [];

    // Validate order structure
    if (!order || typeof order !== 'object') {
      errors.push('Order must be a valid object');
      return { isValid: false, errors, warnings };
    }

    // Validate required fields
    const requiredFields = ['id', 'items', 'customer'];
    requiredFields.forEach(field => {
      if (!order[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate items
    if (order.items) {
      if (!Array.isArray(order.items)) {
        errors.push('Items must be an array');
      } else if (order.items.length === 0) {
        errors.push('Order must contain at least one item');
      } else {
        order.items.forEach((item, index) => {
          if (!item.id) errors.push(`Item ${index} missing id`);
          if (!item.price || item.price <= 0) errors.push(`Item ${index} has invalid price`);
          if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index} has invalid quantity`);
        });
      }
    }

    // Validate customer
    if (order.customer) {
      if (!order.customer.id) errors.push('Customer missing id');
      if (!order.customer.email || !this.isValidEmail(order.customer.email)) {
        errors.push('Customer missing valid email');
      }
    }

    // Validate dates
    if (order.createdAt && !this.isValidDate(order.createdAt)) {
      warnings.push('Invalid createdAt date');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  transformAndEnrichOrder(order, options) {
    const transformed = {
      ...order,
      processedAt: new Date().toISOString(),
      processingOptions: options
    };

    // Add computed fields
    transformed.totalItems = transformed.items.reduce((sum, item) => sum + item.quantity, 0);
    transformed.subtotal = transformed.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Add metadata
    transformed.metadata = {
      itemCount: transformed.items.length,
      hasMultipleItems: transformed.items.length > 1,
      isLargeOrder: transformed.totalItems > 10,
      customerTier: this.determineCustomerTier(transformed.customer)
    };

    return transformed;
  }

  calculateComplexPricing(order, options) {
    let basePrice = order.subtotal;
    const breakdown = {
      subtotal: basePrice,
      taxes: 0,
      fees: 0,
      adjustments: 0
    };

    // Calculate taxes
    const taxRate = options.taxRate || 0.1;
    breakdown.taxes = basePrice * taxRate;
    basePrice += breakdown.taxes;

    // Calculate fees
    if (options.applyFees !== false) {
      const feeAmount = order.metadata.isLargeOrder ? 5.00 : 2.50;
      breakdown.fees = feeAmount;
      basePrice += feeAmount;
    }

    // Apply adjustments
    if (options.adjustments) {
      breakdown.adjustments = options.adjustments.reduce((sum, adj) => sum + adj.amount, 0);
      basePrice += breakdown.adjustments;
    }

    return {
      finalPrice: basePrice,
      breakdown
    };
  }

  applyMultiLevelDiscounts(order, options) {
    let discountedPrice = order.finalPrice;
    const appliedDiscounts = [];

    // Customer tier discount
    if (order.metadata.customerTier === 'premium') {
      const discount = discountedPrice * 0.1;
      discountedPrice -= discount;
      appliedDiscounts.push({ type: 'tier', amount: discount, percentage: 10 });
    }

    // Volume discount
    if (order.metadata.isLargeOrder) {
      const discount = discountedPrice * 0.05;
      discountedPrice -= discount;
      appliedDiscounts.push({ type: 'volume', amount: discount, percentage: 5 });
    }

    // Promotional discount
    if (options.promotionalCode) {
      const promoDiscount = this.calculatePromotionalDiscount(discountedPrice, options.promotionalCode);
      if (promoDiscount > 0) {
        discountedPrice -= promoDiscount;
        appliedDiscounts.push({ type: 'promotional', amount: promoDiscount, code: options.promotionalCode });
      }
    }

    // Seasonal discount
    const currentMonth = new Date().getMonth();
    if (currentMonth === 11) { // December
      const discount = discountedPrice * 0.15;
      discountedPrice -= discount;
      appliedDiscounts.push({ type: 'seasonal', amount: discount, percentage: 15 });
    }

    return {
      discountedPrice: Math.max(0, discountedPrice),
      discounts: appliedDiscounts
    };
  }

  calculatePromotionalDiscount(price, code) {
    const codes = {
      'SAVE10': 0.1,
      'SAVE20': 0.2,
      'SAVE50': 0.5
    };
    return codes[code] ? price * codes[code] : 0;
  }

  determineCustomerTier(customer) {
    if (!customer || !customer.purchaseHistory) return 'standard';
    const totalSpent = customer.purchaseHistory.totalSpent || 0;
    if (totalSpent > 1000) return 'premium';
    if (totalSpent > 500) return 'gold';
    return 'standard';
  }

  shouldCompleteOrder(order, options) {
    if (options.strictMode && order.discountedPrice <= 0) return false;
    if (options.requireMinimumValue && order.discountedPrice < 10) return false;
    if (options.skipInvalidCustomers && !order.customer.isValid) return false;
    return true;
  }

  handleValidationFailure(order, validationResult, index) {
    const failure = {
      order,
      index,
      reason: 'validation_failed',
      errors: validationResult.errors,
      timestamp: new Date().toISOString()
    };
    this.state.failedOrders.push(failure);
    this.updateStatistics(null, 'failure');
  }

  handleCompletionFailure(order, index) {
    const failure = {
      order,
      index,
      reason: 'completion_failed',
      timestamp: new Date().toISOString()
    };
    this.state.failedOrders.push(failure);
    this.updateStatistics(null, 'failure');
  }

  handleError(error, order, index) {
    const failure = {
      order,
      index,
      reason: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
    this.state.failedOrders.push(failure);
    this.updateStatistics(null, 'failure');
  }

  updateStatistics(order, status) {
    if (status === 'success') {
      this.state.metadata.statistics.successCount++;
      this.state.metadata.statistics.totalValue += order.discountedPrice;
    } else {
      this.state.metadata.statistics.failureCount++;
    }
    this.state.metadata.statistics.averageOrderValue = 
      this.state.metadata.statistics.totalValue / 
      Math.max(1, this.state.metadata.statistics.successCount);
  }

  finalizeProcessing() {
    this.state.metadata.processingEndTime = new Date().getTime();
    this.state.metadata.totalProcessingTime = 
      this.state.metadata.processingEndTime - this.state.metadata.processingStartTime;
  }

  buildResponse(results, options) {
    return {
      success: true,
      processed: this.state.processedOrders.length,
      failed: this.state.failedOrders.length,
      total: this.state.orders.length,
      orders: options.includeDetails ? results.filter(r => r !== null) : undefined,
      statistics: options.includeStatistics ? this.state.metadata.statistics : undefined,
      metadata: options.includeMetadata ? this.state.metadata : undefined
    };
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  isValidDate(date) {
    return !isNaN(new Date(date).getTime());
  }
}

// Usage example
const processor = new OrderProcessor();
const orders = [
  {
    id: '123',
    items: [{ id: 'item1', price: 10, quantity: 2 }],
    customer: { id: 'cust1', email: 'test@example.com', purchaseHistory: { totalSpent: 1200 } }
  }
];
const result = processor.processOrders(orders, { includeDetails: true });
