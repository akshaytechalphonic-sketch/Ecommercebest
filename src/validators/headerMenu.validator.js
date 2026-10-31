const { z } = require('zod');

const createHeaderMenuSchema = z.object({
  name: z
    .string({ required_error: 'Menu name is required' })
    .trim()
    .min(1, 'Menu name cannot be empty')
    .max(150, 'Menu name must not exceed 150 characters'),
  slug: z
    .string()
    .trim()
    .max(191, 'Slug must not exceed 191 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  url: z
    .string()
    .trim()
    .max(1024, 'URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  icon: z
    .string()
    .trim()
    .max(1024, 'Icon URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  image: z
    .string()
    .trim()
    .max(1024, 'Image URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  status: z
    .enum(['active', 'inactive'])
    .default('active')
    .optional(),
  display_order: z
    .coerce
    .number()
    .int()
    .default(0)
    .optional(),
  banner_id: z
    .coerce
    .number()
    .int()
    .positive('Banner ID must be a positive integer')
    .optional()
    .nullable(),
  category_id: z
    .coerce
    .number()
    .int()
    .positive('Category ID must be a positive integer')
    .optional()
    .nullable(),
});

const updateHeaderMenuSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Menu name cannot be empty')
    .max(150, 'Menu name must not exceed 150 characters')
    .optional(),
  slug: z
    .string()
    .trim()
    .max(191, 'Slug must not exceed 191 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  url: z
    .string()
    .trim()
    .max(1024, 'URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  icon: z
    .string()
    .trim()
    .max(1024, 'Icon URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  image: z
    .string()
    .trim()
    .max(1024, 'Image URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  status: z
    .enum(['active', 'inactive'])
    .optional(),
  display_order: z
    .coerce
    .number()
    .int()
    .optional(),
  banner_id: z
    .coerce
    .number()
    .int()
    .positive('Banner ID must be a positive integer')
    .optional()
    .nullable(),
  category_id: z
    .coerce
    .number()
    .int()
    .positive('Category ID must be a positive integer')
    .optional()
    .nullable(),
});

const headerMenuStatusSchema = z
  .object({
    status: z.enum(['active', 'inactive']).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => data.status !== undefined || data.is_active !== undefined, {
    message: 'Either status ("active" | "inactive") or is_active (boolean) must be provided',
  });

const reorderHeaderMenusSchema = z.union([
  z.object({
    items: z
      .array(
        z.object({
          id: z.coerce.number().int().positive('Menu ID must be a positive integer'),
          display_order: z.coerce.number().int('Display order must be an integer'),
        })
      )
      .min(1, 'At least one menu item is required for reordering'),
  }),
  z
    .array(
      z.object({
        id: z.coerce.number().int().positive('Menu ID must be a positive integer'),
        display_order: z.coerce.number().int('Display order must be an integer'),
      })
    )
    .min(1, 'At least one menu item is required for reordering'),
]);

const createHeaderMenuItemSchema = z.object({
  name: z
    .string({ required_error: 'Item name is required' })
    .trim()
    .min(1, 'Item name cannot be empty')
    .max(150, 'Item name must not exceed 150 characters'),
  slug: z
    .string()
    .trim()
    .max(191, 'Slug must not exceed 191 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  parent_id: z
    .coerce
    .number()
    .int()
    .positive('Parent Item ID must be a positive integer')
    .optional()
    .nullable(),
  category_id: z
    .coerce
    .number()
    .int()
    .positive('Category ID must be a positive integer')
    .optional()
    .nullable(),
  redirect_url: z
    .string()
    .trim()
    .max(1024, 'Redirect URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  image: z
    .string()
    .trim()
    .max(1024, 'Image URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  display_order: z
    .coerce
    .number()
    .int()
    .default(0)
    .optional(),
  is_active: z
    .boolean()
    .default(true)
    .optional(),
  banner_id: z
    .coerce
    .number()
    .int()
    .positive('Banner ID must be a positive integer')
    .optional()
    .nullable(),
});

const updateHeaderMenuItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Item name cannot be empty')
    .max(150, 'Item name must not exceed 150 characters')
    .optional(),
  slug: z
    .string()
    .trim()
    .max(191, 'Slug must not exceed 191 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  parent_id: z
    .coerce
    .number()
    .int()
    .positive('Parent Item ID must be a positive integer')
    .optional()
    .nullable(),
  category_id: z
    .coerce
    .number()
    .int()
    .positive('Category ID must be a positive integer')
    .optional()
    .nullable(),
  redirect_url: z
    .string()
    .trim()
    .max(1024, 'Redirect URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  image: z
    .string()
    .trim()
    .max(1024, 'Image URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  display_order: z
    .coerce
    .number()
    .int()
    .optional(),
  is_active: z
    .boolean()
    .optional(),
  banner_id: z
    .coerce
    .number()
    .int()
    .positive('Banner ID must be a positive integer')
    .optional()
    .nullable(),
});

module.exports = {
  createHeaderMenuSchema,
  updateHeaderMenuSchema,
  headerMenuStatusSchema,
  reorderHeaderMenusSchema,
  createHeaderMenuItemSchema,
  updateHeaderMenuItemSchema,
};

