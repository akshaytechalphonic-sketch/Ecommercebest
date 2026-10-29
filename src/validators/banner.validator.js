const { z } = require('zod');

const BANNER_TYPES = ['home_hero', 'home_middle', 'home_bottom', 'promo_strip', 'popup', 'sidebar'];

const createBannerSchema = z.object({
  title: z
    .string({ required_error: 'Banner title is required' })
    .trim()
    .min(2, 'Banner title must be at least 2 characters long')
    .max(255, 'Banner title must not exceed 255 characters'),
  subtitle: z
    .string()
    .trim()
    .max(255, 'Banner subtitle must not exceed 255 characters')
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable(),
  image_url: z
    .string({ required_error: 'Banner image URL is required' })
    .trim()
    .min(1, 'Banner image URL is required')
    .max(1024, 'Image URL must not exceed 1024 characters'),
  mobile_image_url: z
    .string()
    .trim()
    .max(1024, 'Mobile image URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  link_url: z
    .string()
    .trim()
    .max(1024, 'Link URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  banner_type: z
    .enum(BANNER_TYPES, {
      errorMap: () => ({ message: `Banner type must be one of: ${BANNER_TYPES.join(', ')}` }),
    })
    .default('home_hero')
    .optional(),
  category_id: z
    .coerce
    .number()
    .int('Category ID must be an integer')
    .positive('Category ID must be a positive integer')
    .optional()
    .nullable(),
  position: z
    .coerce
    .number()
    .int('Position must be an integer')
    .default(0)
    .optional(),
  is_active: z
    .boolean()
    .default(true)
    .optional(),
  start_date: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/))
    .optional()
    .nullable(),
  end_date: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/))
    .optional()
    .nullable(),
});

const updateBannerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Banner title must be at least 2 characters long')
    .max(255, 'Banner title must not exceed 255 characters')
    .optional(),
  subtitle: z
    .string()
    .trim()
    .max(255, 'Banner subtitle must not exceed 255 characters')
    .optional()
    .nullable(),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable(),
  image_url: z
    .string()
    .trim()
    .min(1, 'Banner image URL is required')
    .max(1024, 'Image URL must not exceed 1024 characters')
    .optional(),
  mobile_image_url: z
    .string()
    .trim()
    .max(1024, 'Mobile image URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  link_url: z
    .string()
    .trim()
    .max(1024, 'Link URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  banner_type: z
    .enum(BANNER_TYPES, {
      errorMap: () => ({ message: `Banner type must be one of: ${BANNER_TYPES.join(', ')}` }),
    })
    .optional(),
  category_id: z
    .coerce
    .number()
    .int('Category ID must be an integer')
    .positive('Category ID must be a positive integer')
    .optional()
    .nullable(),
  position: z
    .coerce
    .number()
    .int('Position must be an integer')
    .optional(),
  is_active: z
    .boolean()
    .optional(),
  start_date: z
    .string()
    .optional()
    .nullable(),
  end_date: z
    .string()
    .optional()
    .nullable(),
});

const bannerStatusSchema = z.object({
  is_active: z.boolean({ required_error: 'is_active boolean flag is required' }),
});

const bannerQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  banner_type: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(z.enum(BANNER_TYPES).optional())
    .optional(),
  category_id: z
    .string()
    .transform((val) => {
      if (val === '' || val === undefined) return undefined;
      if (val === 'null' || val === 'none' || val === '0') return null;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    })
    .optional(),
  is_active: z
    .string()
    .transform((val) => (val === '' ? undefined : val === 'true' || val === '1'))
    .optional(),
  search: z
    .string()
    .trim()
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
});

module.exports = {
  BANNER_TYPES,
  createBannerSchema,
  updateBannerSchema,
  bannerStatusSchema,
  bannerQuerySchema,
};
