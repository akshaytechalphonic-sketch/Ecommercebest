const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const addressController = require('../controllers/address.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const {
  updateProfileSchema,
  changePasswordSchema,
} = require('../validators/user.validator');

const {
  createAddressSchema,
  updateAddressSchema,
} = require('../validators/address.validator');

// All user and address routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get authenticated user profile
 *     description: Retrieve detailed profile of the currently logged-in user including their saved delivery addresses.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update name, phone, or avatar of the authenticated user.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Johnathan Doe
 *               phone:
 *                 type: string
 *                 example: 9876543210
 *               avatar_url:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate phone number
 */
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

/**
 * @swagger
 * /api/v1/users/change-password:
 *   put:
 *     summary: Change user password
 *     description: Update password by verifying the current password. Revokes active refresh token sessions for security.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *                 example: Password@123
 *               new_password:
 *                 type: string
 *                 example: NewSecretPassword@2026
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 *       400:
 *         description: Current password incorrect or validation error
 */
router.put('/change-password', validate(changePasswordSchema), userController.changePassword);

/**
 * @swagger
 * /api/v1/users/addresses:
 *   get:
 *     summary: List delivery addresses
 *     description: Retrieve all saved delivery addresses for the authenticated user, sorted with the default address first.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
router.get('/addresses', addressController.getAddresses);

/**
 * @swagger
 * /api/v1/users/addresses:
 *   post:
 *     summary: Add new delivery address
 *     description: Add a new delivery address. If marked default or if it is the user's first address, it automatically becomes the default delivery address.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipient_name, phone, address_line1, city, state, postal_code]
 *             properties:
 *               recipient_name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: 9876543210
 *               address_line1:
 *                 type: string
 *                 example: Flat 402, Lotus Residency, MG Road
 *               address_line2:
 *                 type: string
 *                 example: Near City Center Mall
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               postal_code:
 *                 type: string
 *                 example: 400001
 *               country:
 *                 type: string
 *                 example: India
 *               type:
 *                 type: string
 *                 enum: [home, work, other]
 *                 example: home
 *               is_default:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Delivery address added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
router.post('/addresses', validate(createAddressSchema), addressController.createAddress);

/**
 * @swagger
 * /api/v1/users/addresses/{id}:
 *   get:
 *     summary: Get single delivery address
 *     description: Retrieve a specific delivery address by its ID (must belong to authenticated user).
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *       404:
 *         description: Address not found
 */
router.get('/addresses/:id', addressController.getAddressById);

/**
 * @swagger
 * /api/v1/users/addresses/{id}:
 *   put:
 *     summary: Update delivery address
 *     description: Update details of an existing delivery address.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipient_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address_line1:
 *                 type: string
 *               address_line2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [home, work, other]
 *               is_default:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       404:
 *         description: Address not found
 */
router.put('/addresses/:id', validate(updateAddressSchema), addressController.updateAddress);

/**
 * @swagger
 * /api/v1/users/addresses/{id}/default:
 *   patch:
 *     summary: Set default delivery address
 *     description: Mark an address as the default delivery address, automatically unsetting any previous default address.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Default address set successfully
 *       404:
 *         description: Address not found
 */
router.patch('/addresses/:id/default', addressController.setDefaultAddress);

/**
 * @swagger
 * /api/v1/users/addresses/{id}:
 *   delete:
 *     summary: Delete delivery address
 *     description: Delete a delivery address. If the deleted address was default, another existing address will be promoted to default automatically.
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       404:
 *         description: Address not found
 */
router.delete('/addresses/:id', addressController.deleteAddress);

module.exports = router;
