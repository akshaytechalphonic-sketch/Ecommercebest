const { sequelize, User, Vendor, Category, Product, Cart, CartItem, Wishlist, Order, OrderItem, Payment, Address } = require('../models');

async function seedOrdersAndCarts() {
  console.log('--- Starting Orders & Cart Data Seeding ---');

  try {
    // 1. Fetch available customers & vendors
    const customers = await User.findAll({ where: { role: 'customer' } });
    const vendors = await Vendor.findAll({ where: { status: 'approved' } });
    const categories = await Category.findAll();

    if (!customers.length || !vendors.length) {
      console.log('Customers or approved vendors missing.');
      return;
    }

    const primaryVendor = vendors[0];
    const techVendor = vendors.find(v => v.store_name.toLowerCase().includes('tech') || v.store_name.toLowerCase().includes('apex')) || vendors[0];
    const groceryVendor = vendors.find(v => v.store_name.toLowerCase().includes('grocery') || v.store_name.toLowerCase().includes('fresh')) || vendors[0];

    console.log(`Using vendors: ${primaryVendor.store_name}, ${techVendor.store_name}, ${groceryVendor.store_name}`);

    // 2. Ensure Rich Products exist
    const sampleProducts = [
      {
        name: 'Noise Cancelling Wireless Earbuds Pro',
        slug: 'noise-cancelling-wireless-earbuds-pro',
        sku: 'ELEC-EAR-001',
        description: 'Active Noise Cancelling Bluetooth 5.3 Earbuds with 40-hour playback and deep bass response.',
        price: 2499.00,
        discount_price: 2199.00,
        stock: 45,
        vendor_id: techVendor.id,
        category_id: categories[0]?.id || 149,
        approval_status: 'approved',
        status: 'active',
        images: JSON.stringify(['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80']),
      },
      {
        name: 'Fitness Smartwatch AMOLED Display',
        slug: 'fitness-smartwatch-amoled-display',
        sku: 'ELEC-WATCH-002',
        description: 'Sleek 1.43-inch AMOLED Always-On Display with SpO2, Heart Rate, and 100+ Sports Modes.',
        price: 3299.00,
        discount_price: 2999.00,
        stock: 30,
        vendor_id: techVendor.id,
        category_id: categories[0]?.id || 150,
        approval_status: 'approved',
        status: 'active',
        images: JSON.stringify(['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=80']),
      },
      {
        name: 'Organic Darjeeling First Flush Green Tea 500g',
        slug: 'organic-darjeeling-first-flush-green-tea',
        sku: 'GROC-TEA-003',
        description: 'Directly sourced fresh harvest single-estate antioxidant rich Darjeeling loose leaf green tea.',
        price: 760.00,
        discount_price: 699.00,
        stock: 80,
        vendor_id: groceryVendor.id,
        category_id: categories[0]?.id || 152,
        approval_status: 'approved',
        status: 'active',
        images: JSON.stringify(['https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=500&auto=format&fit=crop&q=80']),
      },
      {
        name: 'Premium Cotton Oxford Slim-Fit Shirt',
        slug: 'premium-cotton-oxford-slim-fit-shirt',
        sku: 'FASH-SHIRT-004',
        description: 'Tailored 100% breathable organic cotton classic shirt for formal and casual occasions.',
        price: 1299.00,
        discount_price: 1149.00,
        stock: 50,
        vendor_id: primaryVendor.id,
        category_id: categories[0]?.id || 151,
        approval_status: 'approved',
        status: 'active',
        images: JSON.stringify(['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop&q=80']),
      },
      {
        name: 'Ceramic Non-Stick Induction Cookware Set',
        slug: 'ceramic-non-stick-cookware-set',
        sku: 'HOME-COOK-005',
        description: 'Toxin-free healthy non-stick 3-piece granite induction cookware with soft-touch wood handles.',
        price: 4999.00,
        discount_price: 4499.00,
        stock: 25,
        vendor_id: groceryVendor.id,
        category_id: categories[0]?.id || 152,
        approval_status: 'approved',
        status: 'active',
        images: JSON.stringify(['https://images.unsplash.com/photo-1584990347449-39904791334c?w=500&auto=format&fit=crop&q=80']),
      },
      {
        name: 'UltraBook Pro 15-inch M3 Chip 16GB',
        slug: 'ultrabook-pro-15-inch-m3-chip',
        sku: 'ELEC-LAP-006',
        description: 'Blazing fast productivity powerhouse with Retina TrueTone display and all-day 18-hour battery.',
        price: 84999.00,
        discount_price: 79999.00,
        stock: 12,
        vendor_id: techVendor.id,
        category_id: categories[0]?.id || 148,
        approval_status: 'approved',
        status: 'active',
        images: JSON.stringify(['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80']),
      },
    ];

    const seededProducts = [];
    for (const prodData of sampleProducts) {
      const [p] = await Product.findOrCreate({
        where: { sku: prodData.sku },
        defaults: prodData,
      });
      // Ensure approved & active
      p.approval_status = 'approved';
      p.status = 'active';
      await p.save();
      seededProducts.push(p);
    }

    // Also get all existing active products
    const allProducts = await Product.findAll({ where: { status: 'active', approval_status: 'approved' } });
    console.log(`Total active approved products available: ${allProducts.length}`);

    // Ensure sample shipping address exists
    let sampleAddress = await Address.findOne();
    if (!sampleAddress && customers[0]) {
      sampleAddress = await Address.create({
        user_id: customers[0].id,
        recipient_name: customers[0].name,
        phone: '9876543210',
        street_address: '42, Cyber Park, Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        postal_code: '201301',
        country: 'India',
        is_default: true,
      });
    }

    // 3. SEED REALISTIC ORDERS & ORDER ITEMS & PAYMENTS
    const ordersList = [
      {
        order_number: 'ORD-1256',
        customer: customers[0],
        total: 2499.00,
        product: allProducts.find(p => p.name.includes('Earbuds')) || allProducts[0],
        qty: 1,
        order_status: 'delivered',
        payment_status: 'paid',
        payment_method: 'upi',
        time_offset: 2 * 60 * 60 * 1000, // 2 hours ago
      },
      {
        order_number: 'ORD-1255',
        customer: customers[1] || customers[0],
        total: 1299.00,
        product: allProducts.find(p => p.name.includes('Shirt')) || allProducts[1],
        qty: 1,
        order_status: 'processing',
        payment_status: 'paid',
        payment_method: 'card',
        time_offset: 5 * 60 * 60 * 1000,
      },
      {
        order_number: 'ORD-1254',
        customer: customers[2] || customers[0],
        total: 4999.00,
        product: allProducts.find(p => p.name.includes('Cookware')) || allProducts[2],
        qty: 1,
        order_status: 'shipped',
        payment_status: 'paid',
        payment_method: 'netbanking',
        time_offset: 8 * 60 * 60 * 1000,
      },
      {
        order_number: 'ORD-1253',
        customer: customers[3] || customers[0],
        total: 760.00,
        product: allProducts.find(p => p.name.includes('Tea')) || allProducts[0],
        qty: 1,
        order_status: 'delivered',
        payment_status: 'paid',
        payment_method: 'upi',
        time_offset: 12 * 60 * 60 * 1000,
      },
      {
        order_number: 'ORD-1252',
        customer: customers[4] || customers[0],
        total: 3299.00,
        product: allProducts.find(p => p.name.includes('Smartwatch')) || allProducts[1],
        qty: 1,
        order_status: 'cancelled',
        payment_status: 'failed',
        payment_method: 'upi',
        time_offset: 18 * 60 * 60 * 1000,
      },
      {
        order_number: 'ORD-1251',
        customer: customers[0],
        total: 84999.00,
        product: allProducts.find(p => p.name.includes('UltraBook')) || allProducts[0],
        qty: 1,
        order_status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'card',
        time_offset: 24 * 60 * 60 * 1000,
      },
      {
        order_number: 'ORD-1250',
        customer: customers[1] || customers[0],
        total: 1800.00,
        product: allProducts.find(p => p.name.includes('Walnut')) || allProducts[0],
        qty: 1,
        order_status: 'delivered',
        payment_status: 'paid',
        payment_method: 'wallet',
        time_offset: 36 * 60 * 60 * 1000,
      },
      {
        order_number: 'ORD-1249',
        customer: customers[2] || customers[0],
        total: 2998.00,
        product: allProducts.find(p => p.name.includes('Olive Oil')) || allProducts[1],
        qty: 2,
        order_status: 'delivered',
        payment_status: 'paid',
        payment_method: 'upi',
        time_offset: 48 * 60 * 60 * 1000,
      },
    ];

    for (const item of ordersList) {
      if (!item.product || !item.customer) continue;

      const orderCreatedDate = new Date(Date.now() - item.time_offset);

      const [order] = await Order.findOrCreate({
        where: { order_number: item.order_number },
        defaults: {
          user_id: item.customer.id,
          shipping_address_id: sampleAddress ? sampleAddress.id : null,
          total_amount: item.total,
          tax_amount: parseFloat((item.total * 0.18).toFixed(2)),
          shipping_fee: 0.00,
          discount_amount: 0.00,
          payment_status: item.payment_status,
          order_status: item.order_status,
          notes: `Order placed via online storefront by ${item.customer.name}`,
          created_at: orderCreatedDate,
          updated_at: orderCreatedDate,
        },
      });

      // Ensure OrderItem exists
      const [orderItem] = await OrderItem.findOrCreate({
        where: { order_id: order.id, product_id: item.product.id },
        defaults: {
          vendor_id: item.product.vendor_id,
          quantity: item.qty,
          unit_price: item.product.price,
          subtotal: item.total,
          item_status: item.order_status === 'cancelled' ? 'cancelled' : 'confirmed',
          created_at: orderCreatedDate,
          updated_at: orderCreatedDate,
        },
      });

      // Ensure Payment Record exists
      const txId = `TXN_${item.order_number}_${item.payment_method.toUpperCase()}`;
      await Payment.findOrCreate({
        where: { order_id: order.id },
        defaults: {
          user_id: item.customer.id,
          amount: item.total,
          currency: 'INR',
          payment_method: item.payment_method,
          gateway: 'razorpay',
          transaction_id: txId,
          gateway_order_id: `rzp_order_${item.order_number}`,
          status: item.payment_status === 'paid' ? 'completed' : 'failed',
          paid_at: item.payment_status === 'paid' ? orderCreatedDate : null,
          failure_reason: item.payment_status === 'failed' ? 'UPI Transaction Timed Out' : null,
          created_at: orderCreatedDate,
          updated_at: orderCreatedDate,
        },
      });
    }

    console.log('Orders, OrderItems & Payments seeded successfully.');

    // 4. SEED ACTIVE CUSTOMER CARTS & CART ITEMS
    // Give multiple customers active shopping carts with items
    const cartUsers = customers.slice(0, 5);
    for (let i = 0; i < cartUsers.length; i++) {
      const u = cartUsers[i];
      const [cart] = await Cart.findOrCreate({
        where: { user_id: u.id },
        defaults: { user_id: u.id },
      });

      // Add 1 or 2 products into cart
      const prod1 = allProducts[i % allProducts.length];
      const prod2 = allProducts[(i + 1) % allProducts.length];

      if (prod1) {
        await CartItem.findOrCreate({
          where: { cart_id: cart.id, product_id: prod1.id },
          defaults: {
            quantity: (i % 2) + 1,
            price: prod1.price,
          },
        });
      }

      if (prod2 && prod2.id !== prod1.id && i % 2 === 0) {
        await CartItem.findOrCreate({
          where: { cart_id: cart.id, product_id: prod2.id },
          defaults: {
            quantity: 1,
            price: prod2.price,
          },
        });
      }
    }

    console.log(`Active carts populated for ${cartUsers.length} customers.`);

    // 5. SEED WISHLISTS
    for (let i = 0; i < Math.min(customers.length, 6); i++) {
      const u = customers[i];
      const prodA = allProducts[(i + 2) % allProducts.length];
      const prodB = allProducts[(i + 3) % allProducts.length];

      if (prodA) {
        await Wishlist.findOrCreate({
          where: { user_id: u.id, product_id: prodA.id },
          defaults: { user_id: u.id, product_id: prodA.id },
        });
      }
      if (prodB && prodB.id !== prodA.id) {
        await Wishlist.findOrCreate({
          where: { user_id: u.id, product_id: prodB.id },
          defaults: { user_id: u.id, product_id: prodB.id },
        });
      }
    }

    console.log('Customer wishlists populated successfully.');

    // 6. Verify Final Counts
    const counts = {
      orders: await Order.count(),
      orderItems: await OrderItem.count(),
      payments: await Payment.count(),
      activeCarts: await Cart.count(),
      cartItems: await CartItem.count(),
      wishlistRecords: await Wishlist.count(),
    };
    console.log('Final DB State:', counts);

  } catch (err) {
    console.error('Error seeding orders data:', err);
  } finally {
    process.exit(0);
  }
}

seedOrdersAndCarts();
