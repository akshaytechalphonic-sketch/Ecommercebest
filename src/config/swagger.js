const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const port = process.env.PORT || 5000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Multivendor Marketplace API',
      version: '1.0.0',
      description:
        'Production-ready REST API documentation for Multivendor Marketplace Backend built with Node.js, Express.js, MySQL, and Sequelize.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current Server (Auto-detect Local / Live)',
      },
      {
        url: `http://localhost:${port}`,
        description: 'Local Development Server',
      },
      {
        url: process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'https://ecommercebest.onrender.com',
        description: 'Production Server (Live Render)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT Bearer token without "Bearer " prefix',
        },
      },
      schemas: {
        StandardSuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
            },
          },
        },
        StandardErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'An error occurred',
            },
            code: {
              type: 'string',
              example: 'ERROR',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email',
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid email address',
                  },
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            phone: {
              type: 'string',
              nullable: true,
              example: '9876543210',
            },
            role: {
              type: 'string',
              enum: ['admin', 'vendor', 'customer'],
              example: 'customer',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'blocked'],
              example: 'active',
            },
            is_verified: {
              type: 'boolean',
              example: false,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            password: {
              type: 'string',
              minLength: 8,
              maxLength: 128,
              example: 'Password@123',
            },
            phone: {
              type: 'string',
              nullable: true,
              example: '9876543210',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            identifier: {
              type: 'string',
              description: 'Email address or phone number',
              example: 'john@example.com',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Alternative email field',
              example: 'john@example.com',
            },
            phone: {
              type: 'string',
              description: 'Alternative phone field',
              example: '9876543210',
            },
            password: {
              type: 'string',
              example: 'Password@123',
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refresh_token'],
          properties: {
            refresh_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        LogoutRequest: {
          type: 'object',
          properties: {
            refresh_token: {
              type: 'string',
              description: 'Optional refresh token to revoke specific session',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'new_password'],
          properties: {
            token: {
              type: 'string',
              description: 'Single-use password reset token received from forgot-password',
              example: '706b0c342a590f196a8b3ca006e516ba138dbb144a94d3a440f3b7144ad63639',
            },
            new_password: {
              type: 'string',
              minLength: 8,
              maxLength: 128,
              example: 'NewSecurePassword@2026',
            },
          },
        },
        Vendor: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            user_id: {
              type: 'integer',
              example: 5,
            },
            store_name: {
              type: 'string',
              example: 'Tech Hub Online',
            },
            store_slug: {
              type: 'string',
              example: 'tech-hub-online',
            },
            store_email: {
              type: 'string',
              format: 'email',
              example: 'support@techhub.com',
            },
            store_phone: {
              type: 'string',
              example: '+919876543210',
            },
            description: {
              type: 'string',
              example: 'Premium electronics and accessories',
            },
            address: {
              type: 'string',
              example: 'Shop 4, Commercial Plaza',
            },
            city: {
              type: 'string',
              example: 'Mumbai',
            },
            state: {
              type: 'string',
              example: 'Maharashtra',
            },
            postal_code: {
              type: 'string',
              example: '400001',
            },
            country: {
              type: 'string',
              example: 'India',
            },
            logo_url: {
              type: 'string',
              nullable: true,
            },
            banner_url: {
              type: 'string',
              nullable: true,
            },
            tax_id: {
              type: 'string',
              example: '27AAAAA0000A1Z5',
            },
            commission_rate: {
              type: 'number',
              example: 10.0,
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'suspended'],
              example: 'pending',
            },
            rejection_reason: {
              type: 'string',
              nullable: true,
            },
            approved_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Electronics',
            },
            slug: {
              type: 'string',
              example: 'electronics',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'All electronics items',
            },
            banner_image: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/banner.jpg',
            },
            thumbnail_image: {
              type: 'string',
              nullable: true,
              example: 'https://example.com/thumb.jpg',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active',
            },
            parent_id: {
              type: 'integer',
              nullable: true,
              example: null,
            },
            display_order: {
              type: 'integer',
              example: 1,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication, Session & Token Management',
      },
      {
        name: 'Users',
        description: 'User Profile & Password Management',
      },
      {
        name: 'Addresses',
        description: 'Delivery Address Management',
      },
      {
        name: 'Vendors',
        description: 'Seller Onboarding, Store Management & Approval Status',
      },
      {
        name: 'Admin Vendors',
        description: 'Marketplace Administration of Sellers and Approval Workflows',
      },
      {
        name: 'Categories',
        description: 'Public Product Categories and Nested Subcategories Catalog',
      },
      {
        name: 'Admin Categories',
        description: 'Marketplace Administration of Categories and Subcategories',
      },
      {
        name: 'Cart',
        description: 'Customer Shopping Cart, Item Quantity & Pricing Management',
      },
      {
        name: 'Inventory & Stock Management',
        description: 'Seller & Admin Stock Tracking, Atomic Adjustments, Low-Stock Alerts, and Audit Logs',
      },
      {
        name: 'Admin Header Menus',
        description: 'Administrator management of dynamic header menus, submenus, ordering, and banners',
      },
      {
        name: 'Admin Header Menu Items',
        description: 'Administrator management of nested submenu items and category/banner associations',
      },
      {
        name: 'Storefront Navigation',
        description: 'Public storefront dynamic header navigation with multi-level nested menus and banners',
      },
      {
        name: 'System',
        description: 'Health & Status Checks',
      },
    ],
  },
  apis: [
    './src/routes/*.routes.js',
    './src/routes/*.js',
    './src/app.js',
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
