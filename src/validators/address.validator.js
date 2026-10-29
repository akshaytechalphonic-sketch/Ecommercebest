const { z } = require('zod');

const createAddressSchema = z.object({
  recipient_name: z
    .string({ required_error: 'Recipient name is required' })
    .trim()
    .min(2, 'Recipient name must be at least 2 characters long')
    .max(100, 'Recipient name must not exceed 100 characters'),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .regex(/^[0-9+() -]{7,20}$/, 'Invalid phone number format'),
  address_line1: z
    .string({ required_error: 'Address line 1 is required' })
    .trim()
    .min(3, 'Address line 1 must be at least 3 characters long')
    .max(255, 'Address line 1 must not exceed 255 characters'),
  address_line2: z
    .string()
    .trim()
    .max(255, 'Address line 2 must not exceed 255 characters')
    .optional()
    .nullable()
    .transform((val) => (val && val.trim() !== '' ? val.trim() : null)),
  city: z
    .string({ required_error: 'City is required' })
    .trim()
    .min(2, 'City must be at least 2 characters long')
    .max(100, 'City must not exceed 100 characters'),
  state: z
    .string({ required_error: 'State is required' })
    .trim()
    .min(2, 'State must be at least 2 characters long')
    .max(100, 'State must not exceed 100 characters'),
  postal_code: z
    .string({ required_error: 'Postal code / pincode is required' })
    .trim()
    .min(4, 'Postal code must be at least 4 characters long')
    .max(20, 'Postal code must not exceed 20 characters'),
  country: z
    .string()
    .trim()
    .max(100)
    .default('India')
    .optional(),
  type: z
    .enum(['home', 'work', 'other'], {
      errorMap: () => ({ message: "Address type must be 'home', 'work', or 'other'" }),
    })
    .default('home')
    .optional(),
  is_default: z.boolean().default(false).optional(),
});

const updateAddressSchema = createAddressSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: 'At least one field must be provided to update the address',
  }
);

module.exports = {
  createAddressSchema,
  updateAddressSchema,
};
