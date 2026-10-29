const { z } = require('zod');

const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name must not exceed 100 characters')
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+() -]{7,20}$/, 'Invalid phone number format')
      .optional()
      .nullable()
      .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),
    avatar_url: z
      .string()
      .trim()
      .max(255, 'Avatar URL must not exceed 255 characters')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => data.name !== undefined || data.phone !== undefined || data.avatar_url !== undefined,
    {
      message: 'At least one field (name, phone, avatar_url) must be provided to update',
    }
  );

const changePasswordSchema = z.object({
  current_password: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password cannot be empty'),
  new_password: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'New password must not exceed 128 characters'),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};
