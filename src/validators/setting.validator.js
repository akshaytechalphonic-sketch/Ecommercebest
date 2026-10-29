const { z } = require('zod');

const updateBrandingSchema = z.object({
  site_name: z
    .string()
    .trim()
    .min(1, 'Site name cannot be empty')
    .max(150, 'Site name must not exceed 150 characters')
    .optional(),
  site_tagline: z
    .string()
    .trim()
    .max(255, 'Site tagline must not exceed 255 characters')
    .optional()
    .nullable(),
  site_logo: z
    .string()
    .trim()
    .max(1024, 'Logo URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  site_dark_logo: z
    .string()
    .trim()
    .max(1024, 'Dark logo URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  site_favicon: z
    .string()
    .trim()
    .max(1024, 'Favicon URL must not exceed 1024 characters')
    .optional()
    .nullable(),
  contact_email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .nullable(),
  contact_phone: z
    .string()
    .trim()
    .max(50, 'Contact phone must not exceed 50 characters')
    .optional()
    .nullable(),
});

const updateSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().trim().min(1, 'Key cannot be empty'),
      value: z.any(),
      group: z.string().trim().default('general').optional(),
      description: z.string().trim().optional().nullable(),
      is_public: z.boolean().default(true).optional(),
    })
  ),
});

module.exports = {
  updateBrandingSchema,
  updateSettingsSchema,
};
