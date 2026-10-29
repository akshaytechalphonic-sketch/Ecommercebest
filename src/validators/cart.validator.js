const { z } = require('zod');

/**
 * Validation schema for adding a product to the cart
 */
const addToCartSchema = z.object({
  product_id: z.coerce
    .number({
      required_error: 'Product ID is required',
      invalid_type_error: 'Product ID must be a valid number',
    })
    .int('Product ID must be an integer')
    .positive('Product ID must be greater than 0'),
  quantity: z.coerce
    .number({
      invalid_type_error: 'Quantity must be a valid number',
    })
    .int('Quantity must be an integer')
    .positive('Quantity must be at least 1')
    .default(1),
});

/**
 * Validation schema for updating item quantity in the cart
 */
const updateCartItemSchema = z.object({
  quantity: z.coerce
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a valid number',
    })
    .int('Quantity must be an integer')
    .positive('Quantity must be at least 1'),
});

/**
 * Validation schema for route parameters with itemId or productId
 */
const cartParamSchema = z.object({
  id: z.coerce
    .number({
      required_error: 'ID parameter is required',
      invalid_type_error: 'ID must be a valid number',
    })
    .int('ID must be an integer')
    .positive('ID must be greater than 0'),
});

module.exports = {
  addToCartSchema,
  updateCartItemSchema,
  cartParamSchema,
};
