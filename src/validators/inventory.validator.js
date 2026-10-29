const { z } = require('zod');

/**
 * Schema for stock adjustment (increase, decrease, or set)
 */
const adjustStockSchema = z
  .object({
    action: z.enum(['increase', 'decrease', 'set', 'increment', 'decrement'], {
      errorMap: () => ({
        message: "Action must be 'increase', 'decrease', or 'set'",
      }),
    }),
    quantity: z.coerce
      .number({ required_error: 'Quantity is required' })
      .int('Quantity must be an integer')
      .min(0, 'Quantity must be a valid non-negative integer'),
    reason: z
      .string({ required_error: 'Reason is required' })
      .trim()
      .min(2, 'Reason must be at least 2 characters')
      .max(255, 'Reason cannot exceed 255 characters'),
  })
  .refine(
    (data) => {
      const act = data.action.toLowerCase();
      if (
        (act === 'increase' ||
          act === 'increment' ||
          act === 'decrease' ||
          act === 'decrement') &&
        data.quantity <= 0
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Quantity must be at least 1 for increase and decrease operations',
      path: ['quantity'],
    }
  );

/**
 * Schema for configuring low-stock threshold
 */
const updateThresholdSchema = z.object({
  low_stock_threshold: z.coerce
    .number({ required_error: 'low_stock_threshold is required' })
    .int('low_stock_threshold must be an integer')
    .min(0, 'low_stock_threshold must be a valid non-negative integer'),
});

/**
 * Schema for inventory listing query params
 */
const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'inactive', 'draft']).optional().default('all'),
  filter: z.enum(['all', 'low_stock', 'in_stock', 'out_of_stock']).optional().default('all'),
  vendor_id: z.coerce.number().int().positive().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(['stock', 'name', 'created_at', 'updated_at']).optional().default('updated_at'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional().default('DESC'),
});

/**
 * Schema for inventory audit log query params
 */
const inventoryLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  product_id: z.coerce.number().int().positive().optional(),
  action_type: z.enum(['increase', 'decrease', 'set', 'threshold_update']).optional(),
});

/**
 * Schema for product ID URL parameter
 */
const productIdParamSchema = z.object({
  productId: z.coerce.number().int().positive('Valid product ID is required'),
});

module.exports = {
  adjustStockSchema,
  updateThresholdSchema,
  inventoryQuerySchema,
  inventoryLogQuerySchema,
  productIdParamSchema,
};
