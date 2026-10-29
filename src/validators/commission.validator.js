const { z } = require('zod');

/**
 * Validator schema for querying commissions ledger and reports
 */
const getCommissionsQuerySchema = z.object({
  vendor_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: 'vendor_id must be a positive integer',
    }),
  status: z
    .enum(['pending', 'available', 'credited', 'settled', 'refunded', 'cancelled'])
    .optional(),
  settlement_status: z
    .enum(['unsettled', 'settling', 'settled'])
    .optional(),
  start_date: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'start_date must be a valid ISO date string',
    }),
  end_date: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'end_date must be a valid ISO date string',
    }),
  search: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, Math.min(100, parseInt(val, 10) || 10)) : 10)),
});

/**
 * Validator schema for single vendor earnings summary param
 */
const vendorEarningsParamsSchema = z.object({
  vendor_id: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: 'vendor_id must be a positive integer',
    }),
});

/**
 * Validator schema for manual / on-demand commission calculation
 */
const calculateCommissionSchema = z.object({
  order_id: z.number().int().positive({ message: 'Valid order_id is required' }),
  order_item_id: z.number().int().positive().optional(),
  apply_to_wallet: z.boolean().optional().default(false),
});

/**
 * Validator schema for order cancellation with earning reversal
 */
const cancelOrderSchema = z.object({
  reason: z.string().max(500, { message: 'Cancellation reason too long' }).optional().default('Cancelled by user or administrator'),
});

/**
 * Validator schema for setting platform or vendor commission rate
 */
const updateCommissionRateSchema = z.object({
  commission_rate: z
    .number()
    .min(0, { message: 'Commission rate cannot be negative' })
    .max(100, { message: 'Commission rate cannot exceed 100%' }),
  vendor_id: z.number().int().positive().optional(),
});

module.exports = {
  getCommissionsQuerySchema,
  vendorEarningsParamsSchema,
  calculateCommissionSchema,
  cancelOrderSchema,
  updateCommissionRateSchema,
};
