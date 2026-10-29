const { z } = require('zod');

const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Category name is required' })
    .trim()
    .min(2, 'Category name must be at least 2 characters long')
    .max(150, 'Category name must not exceed 150 characters'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters long')
    .max(191, 'Slug must not exceed 191 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable(),
  banner_image: z
    .string()
    .trim()
    .max(255, 'Banner image URL must not exceed 255 characters')
    .optional()
    .nullable(),
  thumbnail_image: z
    .string()
    .trim()
    .max(255, 'Thumbnail image URL must not exceed 255 characters')
    .optional()
    .nullable(),
  status: z
    .enum(['active', 'inactive'])
    .default('active')
    .optional(),
  parent_id: z
    .coerce
    .number()
    .int()
    .positive('Parent ID must be a positive integer')
    .optional()
    .nullable(),
  display_order: z
    .coerce
    .number()
    .int()
    .default(0)
    .optional(),
});

const updateCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Category name must be at least 2 characters long')
      .max(150, 'Category name must not exceed 150 characters')
      .optional(),
    slug: z
      .string()
      .trim()
      .min(2, 'Slug must be at least 2 characters long')
      .max(191, 'Slug must not exceed 191 characters')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, 'Description must not exceed 2000 characters')
      .optional()
      .nullable(),
    banner_image: z
      .string()
      .trim()
      .max(255, 'Banner image URL must not exceed 255 characters')
      .optional()
      .nullable(),
    thumbnail_image: z
      .string()
      .trim()
      .max(255, 'Thumbnail image URL must not exceed 255 characters')
      .optional()
      .nullable(),
    status: z
      .enum(['active', 'inactive'])
      .optional(),
    parent_id: z
      .coerce
      .number()
      .int()
      .positive('Parent ID must be a positive integer')
      .optional()
      .nullable(),
    display_order: z
      .coerce
      .number()
      .int()
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided to update',
    }
  );

const createSubcategorySchema = z.object({
  name: z
    .string({ required_error: 'Subcategory name is required' })
    .trim()
    .min(2, 'Subcategory name must be at least 2 characters long')
    .max(150, 'Subcategory name must not exceed 150 characters'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters long')
    .max(191, 'Slug must not exceed 191 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase alphanumeric characters and hyphens')
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable(),
  banner_image: z
    .string()
    .trim()
    .max(255, 'Banner image URL must not exceed 255 characters')
    .optional()
    .nullable(),
  thumbnail_image: z
    .string()
    .trim()
    .max(255, 'Thumbnail image URL must not exceed 255 characters')
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
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  createSubcategorySchema,
};
