const { z } = require('zod');

const registerVendorSchema = z.object({
  store_name: z
    .string({ required_error: 'Store name is required' })
    .trim()
    .min(2, 'Store name must be at least 2 characters long')
    .max(150, 'Store name must not exceed 150 characters'),
  store_slug: z
    .string()
    .trim()
    .min(2, 'Store slug must be at least 2 characters long')
    .max(191, 'Store slug must not exceed 191 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Store slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  store_email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid store email address')
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? val.trim().toLowerCase() : null)),
  store_phone: z
    .string()
    .trim()
    .regex(/^[0-9+() -]{7,20}$/, 'Invalid store phone number format')
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable(),
  address: z
    .string()
    .trim()
    .max(500, 'Address must not exceed 500 characters')
    .optional()
    .nullable(),
  city: z
    .string()
    .trim()
    .max(100, 'City must not exceed 100 characters')
    .optional()
    .nullable(),
  state: z
    .string()
    .trim()
    .max(100, 'State must not exceed 100 characters')
    .optional()
    .nullable(),
  postal_code: z
    .string()
    .trim()
    .max(20, 'Postal code must not exceed 20 characters')
    .optional()
    .nullable(),
  country: z
    .string()
    .trim()
    .max(100, 'Country must not exceed 100 characters')
    .default('India'),
  logo_url: z
    .string()
    .trim()
    .max(255, 'Logo URL must not exceed 255 characters')
    .optional()
    .nullable(),
  banner_url: z
    .string()
    .trim()
    .max(255, 'Banner URL must not exceed 255 characters')
    .optional()
    .nullable(),
  tax_id: z
    .string()
    .trim()
    .max(50, 'Tax ID / GSTIN must not exceed 50 characters')
    .optional()
    .nullable(),
  bank_account_name: z
    .string()
    .trim()
    .max(100, 'Bank account name must not exceed 100 characters')
    .optional()
    .nullable(),
  bank_account_number: z
    .string()
    .trim()
    .max(50, 'Bank account number must not exceed 50 characters')
    .optional()
    .nullable(),
  bank_ifsc_code: z
    .string()
    .trim()
    .max(20, 'Bank IFSC code must not exceed 20 characters')
    .optional()
    .nullable(),
  bank_name: z
    .string()
    .trim()
    .max(100, 'Bank name must not exceed 100 characters')
    .optional()
    .nullable(),
  // Direct user registration fields (used when unauthenticated)
  name: z
    .string()
    .trim()
    .min(2, 'Owner name must be at least 2 characters long')
    .max(100, 'Owner name must not exceed 100 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid owner email address')
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+() -]{7,20}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
});

const updateVendorSchema = z
  .object({
    store_name: z
      .string()
      .trim()
      .min(2, 'Store name must be at least 2 characters long')
      .max(150, 'Store name must not exceed 150 characters')
      .optional(),
    store_slug: z
      .string()
      .trim()
      .min(2, 'Store slug must be at least 2 characters long')
      .max(191, 'Store slug must not exceed 191 characters')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Store slug must contain only lowercase alphanumeric characters and hyphens')
      .optional(),
    store_email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Invalid store email address')
      .optional()
      .nullable()
      .transform((val) => (val && val.trim() !== '' ? val.trim().toLowerCase() : null)),
    store_phone: z
      .string()
      .trim()
      .regex(/^[0-9+() -]{7,20}$/, 'Invalid store phone number format')
      .optional()
      .nullable()
      .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),
    description: z
      .string()
      .trim()
      .max(2000, 'Description must not exceed 2000 characters')
      .optional()
      .nullable(),
    address: z
      .string()
      .trim()
      .max(500, 'Address must not exceed 500 characters')
      .optional()
      .nullable(),
    city: z
      .string()
      .trim()
      .max(100, 'City must not exceed 100 characters')
      .optional()
      .nullable(),
    state: z
      .string()
      .trim()
      .max(100, 'State must not exceed 100 characters')
      .optional()
      .nullable(),
    postal_code: z
      .string()
      .trim()
      .max(20, 'Postal code must not exceed 20 characters')
      .optional()
      .nullable(),
    country: z
      .string()
      .trim()
      .max(100, 'Country must not exceed 100 characters')
      .optional(),
    logo_url: z
      .string()
      .trim()
      .max(255, 'Logo URL must not exceed 255 characters')
      .optional()
      .nullable(),
    banner_url: z
      .string()
      .trim()
      .max(255, 'Banner URL must not exceed 255 characters')
      .optional()
      .nullable(),
    tax_id: z
      .string()
      .trim()
      .max(50, 'Tax ID / GSTIN must not exceed 50 characters')
      .optional()
      .nullable(),
    bank_account_name: z
      .string()
      .trim()
      .max(100, 'Bank account name must not exceed 100 characters')
      .optional()
      .nullable(),
    bank_account_number: z
      .string()
      .trim()
      .max(50, 'Bank account number must not exceed 50 characters')
      .optional()
      .nullable(),
    bank_ifsc_code: z
      .string()
      .trim()
      .max(20, 'Bank IFSC code must not exceed 20 characters')
      .optional()
      .nullable(),
    bank_name: z
      .string()
      .trim()
      .max(100, 'Bank name must not exceed 100 characters')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided to update',
    }
  );

const adminUpdateVendorStatusSchema = z
  .object({
    status: z.enum(['approved', 'rejected', 'suspended'], {
      required_error: 'Status is required (approved, rejected, or suspended)',
    }),
    rejection_reason: z
      .string()
      .trim()
      .min(2, 'Rejection reason must be at least 2 characters long')
      .max(1000, 'Rejection reason must not exceed 1000 characters')
      .optional()
      .nullable(),
    commission_rate: z
      .number()
      .min(0, 'Commission rate cannot be negative')
      .max(100, 'Commission rate cannot exceed 100%')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'rejected') {
        return Boolean(data.rejection_reason && data.rejection_reason.trim().length > 0);
      }
      return true;
    },
    {
      message: 'Rejection reason is required when status is rejected',
      path: ['rejection_reason'],
    }
  );

const adminVendorListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['created_at', 'store_name', 'status', 'approved_at']).default('created_at'),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).default('DESC'),
});

module.exports = {
  registerVendorSchema,
  updateVendorSchema,
  adminUpdateVendorStatusSchema,
  adminVendorListQuerySchema,
};
