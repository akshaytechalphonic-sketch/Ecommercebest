const { z } = require('zod');

/**
 * 1. Schema for Seller Creating a Product
 */
const createProductSchema = z
  .object({
    name: z
      .string({ required_error: 'Product name is required' })
      .trim()
      .min(2, 'Product name must be at least 2 characters long')
      .max(255, 'Product name cannot exceed 255 characters'),
    slug: z
      .string()
      .trim()
      .min(2, 'Product slug must be at least 2 characters long')
      .max(255, 'Product slug cannot exceed 255 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must contain only lowercase alphanumeric characters and hyphens'
      )
      .optional(),
    description: z
      .string()
      .trim()
      .max(10000, 'Description cannot exceed 10000 characters')
      .optional()
      .nullable()
      .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),
    category_id: z.coerce
      .number({ required_error: 'Category ID is required' })
      .int('Category ID must be an integer')
      .positive('Category ID must be a positive number'),
    subcategory_id: z.coerce
      .number()
      .int('Subcategory ID must be an integer')
      .positive('Subcategory ID must be a positive number')
      .optional()
      .nullable()
      .transform((val) => (val ? Number(val) : null)),
    images: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Image URL or path cannot be empty')
          .max(2000, 'Image URL cannot exceed 2000 characters')
      )
      .max(10, 'A maximum of 10 product images is permitted')
      .optional()
      .default([]),
    price: z.coerce
      .number({ required_error: 'Product price is required' })
      .positive('Product price must be greater than 0')
      .max(99999999.99, 'Product price is too high'),
    discount_price: z.coerce
      .number()
      .nonnegative('Discount price cannot be negative')
      .optional()
      .nullable()
      .transform((val) => (val !== undefined && val !== null && val !== '' ? Number(val) : null)),
    sku: z
      .string({ required_error: 'Product SKU is required' })
      .trim()
      .min(2, 'SKU must be at least 2 characters long')
      .max(100, 'SKU cannot exceed 100 characters')
      .regex(/^[A-Za-z0-9-_]+$/, 'SKU may only contain alphanumeric characters, hyphens, and underscores'),
    stock: z.coerce
      .number()
      .int('Stock must be an integer')
      .nonnegative('Stock quantity cannot be negative')
      .default(0),
    status: z.enum(['active', 'inactive', 'draft']).default('active'),
    vendor_id: z.coerce
      .number()
      .int('Vendor ID must be an integer')
      .positive('Vendor ID must be a positive number')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.discount_price !== null && data.discount_price !== undefined) {
        return Number(data.discount_price) < Number(data.price);
      }
      return true;
    },
    {
      message: 'Discount price must be less than regular product price',
      path: ['discount_price'],
    }
  );

/**
 * 2. Schema for Seller Updating a Product
 */
const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Product name must be at least 2 characters long')
      .max(255, 'Product name cannot exceed 255 characters')
      .optional(),
    slug: z
      .string()
      .trim()
      .min(2, 'Product slug must be at least 2 characters long')
      .max(255, 'Product slug cannot exceed 255 characters')
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must contain only lowercase alphanumeric characters and hyphens'
      )
      .optional(),
    description: z
      .string()
      .trim()
      .max(10000, 'Description cannot exceed 10000 characters')
      .optional()
      .nullable()
      .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),
    category_id: z.coerce
      .number()
      .int('Category ID must be an integer')
      .positive('Category ID must be a positive number')
      .optional(),
    subcategory_id: z.coerce
      .number()
      .int('Subcategory ID must be an integer')
      .positive('Subcategory ID must be a positive number')
      .optional()
      .nullable()
      .transform((val) => (val ? Number(val) : null)),
    images: z
      .array(
        z
          .string()
          .trim()
          .min(1, 'Image URL or path cannot be empty')
          .max(2000, 'Image URL cannot exceed 2000 characters')
      )
      .max(10, 'A maximum of 10 product images is permitted')
      .optional(),
    price: z.coerce
      .number()
      .positive('Product price must be greater than 0')
      .max(99999999.99, 'Product price is too high')
      .optional(),
    discount_price: z.coerce
      .number()
      .nonnegative('Discount price cannot be negative')
      .optional()
      .nullable()
      .transform((val) => (val !== undefined && val !== null && val !== '' ? Number(val) : null)),
    sku: z
      .string()
      .trim()
      .min(2, 'SKU must be at least 2 characters long')
      .max(100, 'SKU cannot exceed 100 characters')
      .regex(/^[A-Za-z0-9-_]+$/, 'SKU may only contain alphanumeric characters, hyphens, and underscores')
      .optional(),
    stock: z.coerce
      .number()
      .int('Stock must be an integer')
      .nonnegative('Stock quantity cannot be negative')
      .optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    vendor_id: z.coerce
      .number()
      .int('Vendor ID must be an integer')
      .positive('Vendor ID must be a positive number')
      .optional()
      .nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update',
  })
  .refine(
    (data) => {
      if (
        data.price !== undefined &&
        data.discount_price !== undefined &&
        data.discount_price !== null
      ) {
        return Number(data.discount_price) < Number(data.price);
      }
      return true;
    },
    {
      message: 'Discount price must be less than regular product price',
      path: ['discount_price'],
    }
  );

/**
 * 3. Schema for Admin Approving or Rejecting a Product
 */
const adminUpdateProductStatusSchema = z
  .object({
    approval_status: z.enum(['approved', 'rejected'], {
      required_error: 'Approval status is required (approved or rejected)',
    }),
    rejection_reason: z
      .string()
      .trim()
      .min(2, 'Rejection reason must be at least 2 characters long')
      .max(1000, 'Rejection reason cannot exceed 1000 characters')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.approval_status === 'rejected') {
        return Boolean(data.rejection_reason && data.rejection_reason.trim().length > 0);
      }
      return true;
    },
    {
      message: 'Rejection reason is required when product is rejected',
      path: ['rejection_reason'],
    }
  );

/**
 * 4. Query Schema for Product Listing
 */
const productListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    category_id: z.coerce.number().int().positive().optional(),
    subcategory_id: z.coerce.number().int().positive().optional(),
    category_slug: z.string().trim().optional(),
    category: z.string().trim().optional(),
    subcategory_slug: z.string().trim().optional(),
    subcategory: z.string().trim().optional(),
    vendor_id: z.coerce.number().int().positive().optional(),
    search: z.string().trim().optional(),
    name: z.string().trim().optional(),
    q: z.string().trim().optional(),
    min_price: z.coerce.number().min(0, 'min_price cannot be negative').optional(),
    max_price: z.coerce.number().min(0, 'max_price cannot be negative').optional(),
    in_stock: z
      .enum(['true', 'false', '1', '0'])
      .optional()
      .transform((val) => val === 'true' || val === '1'),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    approval_status: z.enum(['pending', 'approved', 'rejected']).optional(),
    sort: z
      .enum([
        'price_asc',
        'price_desc',
        'low_to_high',
        'high_to_low',
        'price_low_to_high',
        'price_high_to_low',
        'newest',
        'oldest',
        'name_asc',
        'name_desc',
      ])
      .optional(),
    sortBy: z.enum(['created_at', 'price', 'name', 'stock']).default('created_at'),
    sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).default('DESC'),
  })
  .refine(
    (data) => {
      if (data.min_price !== undefined && data.max_price !== undefined) {
        return Number(data.max_price) >= Number(data.min_price);
      }
      return true;
    },
    {
      message: 'max_price must be greater than or equal to min_price',
      path: ['max_price'],
    }
  );

module.exports = {
  createProductSchema,
  updateProductSchema,
  adminUpdateProductStatusSchema,
  productListQuerySchema,
};
