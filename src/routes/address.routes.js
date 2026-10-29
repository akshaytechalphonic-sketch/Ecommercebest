const express = require('express');
const router = express.Router();

const addressController = require('../controllers/address.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const {
  createAddressSchema,
  updateAddressSchema,
} = require('../validators/address.validator');

// All address routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/addresses:
 *   get:
 *     summary: List delivery addresses (Direct Endpoint)
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
 */
router.get('/', addressController.getAddresses);

/**
 * @swagger
 * /api/v1/addresses:
 *   post:
 *     summary: Add new delivery address (Direct Endpoint)
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
 *       201:
 *         description: Address created successfully
 */
router.post('/', validate(createAddressSchema), addressController.createAddress);

router.get('/:id', addressController.getAddressById);
router.put('/:id', validate(updateAddressSchema), addressController.updateAddress);
router.patch('/:id/default', addressController.setDefaultAddress);
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
