const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name must not exceed 100 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address')
    .max(191, 'Email is too long'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must not exceed 128 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+() -]{7,20}$/, 'Invalid phone number format')
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),
  role: z
    .enum(['customer', 'vendor', 'admin'])
    .default('customer')
    .optional(),
  store_name: z
    .string()
    .trim()
    .min(2, 'Store name must be at least 2 characters long')
    .max(150, 'Store name must not exceed 150 characters')
    .optional(),
  store_email: z.string().trim().email('Invalid store email').optional().nullable(),
  store_phone: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  city: z.string().trim().optional().nullable(),
  state: z.string().trim().optional().nullable(),
  postal_code: z.string().trim().optional().nullable(),
  country: z.string().trim().optional(),
  tax_id: z.string().trim().optional().nullable(),
});

const loginSchema = z
  .object({
    identifier: z.string().trim().optional(),
    email: z.string().trim().toLowerCase().optional(),
    phone: z.string().trim().optional(),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  })
  .refine((data) => Boolean(data.identifier || data.email || data.phone), {
    message: 'Email, phone, or identifier is required',
    path: ['identifier'],
  });

const refreshTokenSchema = z.object({
  refresh_token: z
    .string({ required_error: 'Refresh token is required' })
    .min(1, 'Refresh token cannot be empty'),
});

const logoutSchema = z.object({
  refresh_token: z.string().trim().optional(),
});

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Reset token is required' })
    .trim()
    .min(1, 'Reset token cannot be empty'),
  new_password: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'New password must not exceed 128 characters'),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
