const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const addressRoutes = require("./routes/address.routes");
const vendorRoutes = require("./routes/vendor.routes");
const adminVendorRoutes = require("./routes/admin.vendor.routes");
const categoryRoutes = require("./routes/category.routes");
const adminCategoryRoutes = require("./routes/admin.category.routes");
const path = require("path");
const productRoutes = require("./routes/product.routes");
const adminProductRoutes = require("./routes/admin.product.routes");
const uploadRoutes = require("./routes/upload.routes");
const cartRoutes = require("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const adminCartRoutes = require("./routes/admin.cart.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const bannerRoutes = require("./routes/banner.routes");
const adminBannerRoutes = require("./routes/admin.banner.routes");
const settingRoutes = require("./routes/setting.routes");
const adminSettingRoutes = require("./routes/admin.setting.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const commissionRoutes = require("./routes/commission.routes");
const sellerPayoutRoutes = require("./routes/sellerPayout.routes");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

// Trust reverse proxy (Render, Heroku, Cloudflare) for secure cookies and protocol handling
app.set('trust proxy', 1);

// Disable Helmet CSP to allow Swagger UI scripts and styling to load seamlessly
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);
app.use(cors());
app.use(express.json());

// Serve uploaded product files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Swagger API Documentation UI & Raw JSON endpoints
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Multivendor Marketplace API Docs",
    swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "list",
    },
}));

app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Root
 *     description: Returns the API running status.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Multivendor Ecommerce API is running",
    });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API Health Check
 *     description: Health check endpoint for monitoring uptime.
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StandardSuccessResponse'
 */
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "API is healthy",
    });
});

// Authentication routes
app.use("/api/v1/auth", authRoutes);

// User profile & address management
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/addresses", addressRoutes);

// Vendor / Seller management routes
app.use("/api/v1/vendors", vendorRoutes);
app.use("/api/v1/sellers", vendorRoutes); // Backwards-compatible alias
app.use("/api/v1/admin/vendors", adminVendorRoutes);

// Category & Subcategory routes
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/admin/categories", adminCategoryRoutes);

// Product management routes
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/vendor/products", productRoutes); // Backwards-compatible alias for vendors
app.use("/api/v1/admin/products", adminProductRoutes);

// File and media upload routes
app.use("/api/v1/upload", uploadRoutes);

// Shopping cart management routes
app.use("/api/v1/cart", cartRoutes);

// Customer wishlist management routes
app.use("/api/v1/wishlist", wishlistRoutes);

// Admin customer carts & demand analytics routes
app.use("/api/v1/admin/carts", adminCartRoutes);

// Inventory & Stock Management routes (Sellers and Admins)
app.use("/api/v1/inventory", inventoryRoutes);

// Promotional Banners & Campaign Placement routes
app.use("/api/v1/banners", bannerRoutes);
app.use("/api/v1/admin/banners", adminBannerRoutes);

// Dynamic Store Branding, Logo, and Site Configuration routes
app.use("/api/v1/settings", settingRoutes);
app.use("/api/v1/admin/settings", adminSettingRoutes);

// Orders & Returns / Refunds routes
app.use("/api/v1/orders", orderRoutes);

// Payments Management routes
app.use("/api/v1/payments", paymentRoutes);

// Commissions & Vendor Earnings routes
app.use("/api/v1/commissions", commissionRoutes);

// Withdrawals & Seller Payouts routes
app.use("/api/v1/payouts", sellerPayoutRoutes);
app.use("/api/v1/withdrawals", sellerPayoutRoutes); // Helpful alias

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
