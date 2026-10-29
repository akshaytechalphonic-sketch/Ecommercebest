const financialService = require('../services/financial.service');
const { Vendor, Order, OrderItem } = require('../models');

class FinancialController {
  // 1. ORDERS
  async createOrder(req, res, next) {
    try {
      const order = await financialService.createOrderFromCart(req.user.id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully from cart.',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  async getOrders(req, res, next) {
    try {
      const { status, payment_status, search, page, limit } = req.query;
      const isAdmin = req.user.role === 'admin';
      const isVendor = req.user.role === 'vendor';

      let userId = null;
      let vendorId = null;

      if (!isAdmin && !isVendor) {
        // Normal customer
        userId = req.user.id;
      } else if (isVendor && !isAdmin) {
        // Vendor viewing their sales
        const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
        if (vendor) vendorId = vendor.id;
      }

      const result = await financialService.getOrders({
        user_id: userId,
        vendor_id: vendorId,
        status,
        payment_status,
        search,
        page,
        limit,
      });

      return res.json({
        success: true,
        message: 'Orders retrieved successfully.',
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  // 2. PAYMENTS
  async recordPayment(req, res, next) {
    try {
      const { order_id, amount, payment_method, gateway, transaction_id, gateway_response } = req.body;
      const result = await financialService.recordPayment({
        order_id,
        user_id: req.user.id,
        amount,
        payment_method,
        gateway,
        transaction_id,
        gateway_response,
      });

      return res.status(201).json({
        success: true,
        message: 'Payment verified and recorded. Vendor earnings and commissions credited successfully.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPayments(req, res, next) {
    try {
      const { status, payment_method, search, page, limit } = req.query;
      const result = await financialService.getPayments({
        status,
        payment_method,
        search,
        page,
        limit,
      });

      return res.json({
        success: true,
        message: 'Payment transactions retrieved successfully.',
        data: result.payments,
        stats: result.stats,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  // 3. COMMISSIONS & VENDOR EARNINGS
  async getCommissions(req, res, next) {
    try {
      const { vendor_id, status, settlement_status, start_date, end_date, search, page, limit } = req.query;
      const isAdmin = req.user.role === 'admin';
      const isVendor = req.user.role === 'vendor';

      if (!isAdmin && !isVendor) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only marketplace administrators and verified vendors can view commissions.',
        });
      }

      let targetVendorId = vendor_id;

      // Vendors can ONLY view their own commissions - prevent data leakage
      if (isVendor && !isAdmin) {
        const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
        if (!vendor) {
          return res.status(404).json({
            success: false,
            message: 'Vendor store account not found for current user.',
          });
        }
        targetVendorId = vendor.id;
      }

      const result = await financialService.getCommissions({
        vendor_id: targetVendorId,
        status,
        settlement_status,
        start_date,
        end_date,
        search,
        page,
        limit,
      });

      return res.json({
        success: true,
        message: 'Commission records and earnings ledger retrieved successfully.',
        data: result.commissions,
        stats: result.stats,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getVendorEarnings(req, res, next) {
    try {
      const isAdmin = req.user.role === 'admin';
      const isVendor = req.user.role === 'vendor';

      if (!isAdmin && !isVendor) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Requires vendor or admin role.',
        });
      }

      let vendorId = req.params.vendor_id;

      // Vendor can only view their own earnings
      if (isVendor && !isAdmin) {
        const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
        if (!vendor) {
          return res.status(404).json({ success: false, message: 'Vendor store account not found.' });
        }
        vendorId = vendor.id;
      }

      if (!vendorId) {
        return res.status(400).json({ success: false, message: 'Vendor ID is required for administrative lookup.' });
      }

      const summary = await financialService.getVendorEarningsSummary(vendorId);
      return res.json({
        success: true,
        message: 'Vendor earnings, pending escrow, and wallet balance retrieved successfully.',
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCommissionReportsOverview(req, res, next) {
    try {
      const { start_date, end_date } = req.query;
      const report = await financialService.getCommissionReportsOverview({ start_date, end_date });
      return res.json({
        success: true,
        message: 'Platform commission reports and vendor-wise earnings summary retrieved successfully.',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const orderId = req.params.id || req.params.order_id;
      const { reason } = req.body;
      const order = await financialService.cancelOrder(orderId, {
        reason,
        userRole: req.user.role,
        userId: req.user.id,
      });

      return res.json({
        success: true,
        message: 'Order cancelled successfully. Associated inventory and commissions adjusted.',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  async calculateOrderCommission(req, res, next) {
    try {
      const { order_id } = req.body;
      const order = await Order.findByPk(order_id, {
        include: [{ model: OrderItem, as: 'items' }],
      });

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }

      const results = [];
      for (const item of order.items) {
        const c = await financialService.calculateOrderItemCommission({
          order,
          orderItem: item,
          status: order.payment_status === 'paid' ? 'credited' : 'pending',
        });
        results.push(c);
      }

      return res.json({
        success: true,
        message: 'Commission calculated successfully for order items.',
        data: results,
      });
    } catch (err) {
      next(err);
    }
  }

  // 4. WITHDRAWALS (SELLER PAYOUTS)
  async requestWithdrawal(req, res, next) {
    try {
      const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor store account not found.' });
      }

      const payout = await financialService.requestWithdrawal(vendor.id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Withdrawal payout request submitted successfully.',
        data: payout,
      });
    } catch (err) {
      next(err);
    }
  }

  async getWithdrawals(req, res, next) {
    try {
      const { vendor_id, status, page, limit } = req.query;
      const isAdmin = req.user.role === 'admin';
      let targetVendorId = vendor_id;

      if (!isAdmin && req.user.role === 'vendor') {
        const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
        if (vendor) targetVendorId = vendor.id;
      }

      const result = await financialService.getWithdrawals({
        vendor_id: targetVendorId,
        status,
        page,
        limit,
      });

      return res.json({
        success: true,
        message: 'Withdrawals retrieved successfully.',
        data: result.payouts,
        stats: result.stats,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async processWithdrawal(req, res, next) {
    try {
      const payout = await financialService.processWithdrawal(req.params.id, req.user.id, req.body);
      return res.json({
        success: true,
        message: `Withdrawal request successfully ${payout.status}.`,
        data: payout,
      });
    } catch (err) {
      next(err);
    }
  }

  // 5. RETURNS & REFUNDS
  async requestRefund(req, res, next) {
    try {
      const refund = await financialService.requestRefund(req.user.id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Return & refund request submitted successfully.',
        data: refund,
      });
    } catch (err) {
      next(err);
    }
  }

  async getRefunds(req, res, next) {
    try {
      const { vendor_id, status, page, limit } = req.query;
      const isAdmin = req.user.role === 'admin';
      let targetUserId = null;
      let targetVendorId = vendor_id;

      if (!isAdmin) {
        if (req.user.role === 'vendor') {
          const vendor = await Vendor.findOne({ where: { user_id: req.user.id } });
          if (vendor) targetVendorId = vendor.id;
        } else {
          targetUserId = req.user.id;
        }
      }

      const result = await financialService.getRefunds({
        user_id: targetUserId,
        vendor_id: targetVendorId,
        status,
        page,
        limit,
      });

      return res.json({
        success: true,
        message: 'Refund requests retrieved successfully.',
        data: result.refunds,
        stats: result.stats,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async processRefund(req, res, next) {
    try {
      const refund = await financialService.processRefund(req.params.id, req.body);
      return res.json({
        success: true,
        message: `Refund request successfully ${refund.status}. Vendor balance, commission, and stock adjusted.`,
        data: refund,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FinancialController();
