import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  DollarSign,
  Wallet,
  AlertCircle,
  RotateCcw,
  Store,
  ChevronRight,
  TrendingUp,
  Percent,
  FileText,
  ShieldCheck,
  Send,
  Building2,
  User,
  ShoppingBag,
} from 'lucide-react';
import { financialApi } from '../services/api';

export const FinancialManager = ({ user, onToast, initialSection = 'payments' }) => {
  const isAdmin = user?.role === 'admin';
  const isVendor = user?.role === 'vendor';

  const [activeSubTab, setActiveSubTab] = useState(initialSection); // 'payments' | 'withdrawals' | 'commissions' | 'refunds'
  const [loading, setLoading] = useState(false);

  // Payments State
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState({});
  const [paymentFilter, setPaymentFilter] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');

  // Withdrawals State
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalStats, setWithdrawalStats] = useState({});
  const [withdrawalFilter, setWithdrawalFilter] = useState('');
  const [payoutModal, setPayoutModal] = useState({ open: false, payout: null, action: 'approve' });
  const [payoutForm, setPayoutForm] = useState({ transaction_reference: '', rejection_reason: '', admin_notes: '' });

  // Vendor Payout Request State (for vendor)
  const [requestWithdrawalModal, setRequestWithdrawalModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [vendorSummary, setVendorSummary] = useState(null);

  // Commissions State
  const [commissions, setCommissions] = useState([]);
  const [commissionStats, setCommissionStats] = useState({});
  const [commissionFilter, setCommissionFilter] = useState('');

  // Refunds State
  const [refunds, setRefunds] = useState([]);
  const [refundStats, setRefundStats] = useState({});
  const [refundFilter, setRefundFilter] = useState('');
  const [refundModal, setRefundModal] = useState({ open: false, refund: null, action: 'approve' });
  const [refundForm, setRefundForm] = useState({ rejection_reason: '', gateway_refund_id: '' });

  // Simulate Payment Modal (convenient test tool for admin/vendor)
  const [simulatePayModal, setSimulatePayModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrderToPay, setSelectedOrderToPay] = useState('');
  const [simPaymentMethod, setSimPaymentMethod] = useState('upi');

  // Load Data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeSubTab, paymentFilter, paymentSearch, withdrawalFilter, commissionFilter, refundFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'payments') {
        const res = await financialApi.getPayments({
          status: paymentFilter || undefined,
          search: paymentSearch || undefined,
        });
        if (res?.data) setPayments(res.data);
        if (res?.stats) setPaymentStats(res.stats);
      } else if (activeSubTab === 'withdrawals') {
        const res = await financialApi.getWithdrawals({
          status: withdrawalFilter || undefined,
        });
        if (res?.data) setWithdrawals(res.data);
        if (res?.stats) setWithdrawalStats(res.stats);

        if (isVendor) {
          const vRes = await financialApi.getVendorEarnings();
          if (vRes?.data) setVendorSummary(vRes.data);
        }
      } else if (activeSubTab === 'commissions') {
        const res = await financialApi.getCommissions({
          status: commissionFilter || undefined,
        });
        if (res?.data) setCommissions(res.data);
        if (res?.stats) setCommissionStats(res.stats);
      } else if (activeSubTab === 'refunds') {
        const res = await financialApi.getRefunds({
          status: refundFilter || undefined,
        });
        if (res?.data) setRefunds(res.data);
        if (res?.stats) setRefundStats(res.stats);
      }
    } catch (err) {
      onToast?.(err.message || 'Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Process Withdrawal (Approve / Reject)
  const handleProcessWithdrawal = async (e) => {
    e.preventDefault();
    if (!payoutModal.payout) return;
    try {
      await financialApi.processWithdrawal(payoutModal.payout.id, {
        action: payoutModal.action,
        transaction_reference: payoutForm.transaction_reference || undefined,
        rejection_reason: payoutForm.rejection_reason || undefined,
        admin_notes: payoutForm.admin_notes || undefined,
      });
      onToast?.(`Withdrawal successfully ${payoutModal.action === 'approve' ? 'settled' : 'rejected'}.`, 'success');
      setPayoutModal({ open: false, payout: null, action: 'approve' });
      setPayoutForm({ transaction_reference: '', rejection_reason: '', admin_notes: '' });
      fetchData();
    } catch (err) {
      onToast?.(err.message || 'Failed to process withdrawal', 'error');
    }
  };

  // Vendor Request Withdrawal
  const handleVendorWithdrawalRequest = async (e) => {
    e.preventDefault();
    try {
      await financialApi.requestWithdrawal({
        amount: parseFloat(withdrawAmount),
        payout_method: payoutMethod,
      });
      onToast?.('Payout request submitted successfully!', 'success');
      setRequestWithdrawalModal(false);
      setWithdrawAmount('');
      fetchData();
    } catch (err) {
      onToast?.(err.message || 'Failed to request payout', 'error');
    }
  };

  // Process Refund (Approve / Reject)
  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!refundModal.refund) return;
    try {
      await financialApi.processRefund(refundModal.refund.id, {
        action: refundModal.action,
        rejection_reason: refundForm.rejection_reason || undefined,
        gateway_refund_id: refundForm.gateway_refund_id || undefined,
      });
      onToast?.(`Refund successfully ${refundModal.action === 'approve' ? 'approved and vendor balance adjusted' : 'rejected'}.`, 'success');
      setRefundModal({ open: false, refund: null, action: 'approve' });
      setRefundForm({ rejection_reason: '', gateway_refund_id: '' });
      fetchData();
    } catch (err) {
      onToast?.(err.message || 'Failed to process refund', 'error');
    }
  };

  // Open Simulate Payment Modal
  const openSimulateModal = async () => {
    try {
      const res = await financialApi.getOrders({ payment_status: 'pending' });
      if (res?.data) {
        setPendingOrders(res.data);
        if (res.data.length > 0) {
          setSelectedOrderToPay(res.data[0].id);
        }
      }
      setSimulatePayModal(true);
    } catch (err) {
      onToast?.('Could not load pending orders', 'error');
    }
  };

  // Submit Simulated Payment
  const handleSimulatePayment = async (e) => {
    e.preventDefault();
    if (!selectedOrderToPay) {
      onToast?.('Select an order to pay', 'error');
      return;
    }
    try {
      const res = await financialApi.recordPayment({
        order_id: selectedOrderToPay,
        payment_method: simPaymentMethod,
        gateway: 'razorpay',
      });
      onToast?.('Payment verified! Vendor earnings and commission credited.', 'success');
      setSimulatePayModal(false);
      fetchData();
    } catch (err) {
      onToast?.(err.message || 'Failed to record payment', 'error');
    }
  };

  return (
    <div className="fin-hub-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Sub-Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet className="text-primary" size={28} />
            Financial & Settlements Hub
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>
            Gateway payments, automated commission calculation, vendor wallet balance, withdrawals, and returns.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={openSimulateModal}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CreditCard size={16} />
              Simulate / Record Payment
            </button>
          )}

          {isVendor && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setRequestWithdrawalModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowDownLeft size={16} />
              Request Payout
            </button>
          )}
        </div>
      </div>

      {/* Navigation Pills */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color, #e2e8f0)', paddingBottom: '12px', overflowX: 'auto' }}>
        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('payments')}
          style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
        >
          <CreditCard size={18} />
          Payments ({payments.length})
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('withdrawals')}
          style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
        >
          <ArrowDownLeft size={18} />
          Withdrawals ({withdrawals.length})
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'commissions' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('commissions')}
          style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
        >
          <Percent size={18} />
          Commissions & Earnings ({commissions.length})
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'refunds' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('refunds')}
          style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}
        >
          <RotateCcw size={18} />
          Returns & Refunds ({refunds.length})
        </button>
      </div>

      {/* ====================================================================
          TAB 1: PAYMENTS MANAGEMENT
          ==================================================================== */}
      {activeSubTab === 'payments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="stat-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#16a34a' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Collected</span>
                <DollarSign size={20} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '8px' }}>
                ₹{paymentStats.total_collected || '0.00'}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>{paymentStats.successful_count || 0} Successful Transactions</span>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ea580c' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Pending Payments</span>
                <Clock size={20} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '8px' }}>
                ₹{paymentStats.total_pending || '0.00'}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#ea580c' }}>Awaiting Customer Completion</span>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#dc2626' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Refunded</span>
                <RotateCcw size={20} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '8px' }}>
                ₹{paymentStats.total_refunded || '0.00'}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>Adjusted against Vendor balance</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by transaction ID..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}
              />
            </div>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <th style={{ padding: '12px 16px' }}>Transaction ID</th>
                  <th style={{ padding: '12px 16px' }}>Order #</th>
                  <th style={{ padding: '12px 16px' }}>Customer</th>
                  <th style={{ padding: '12px 16px' }}>Amount</th>
                  <th style={{ padding: '12px 16px' }}>Method</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No payment records found. Use "Simulate / Record Payment" to test!
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '600' }}>
                        {p.transaction_id || `ID-${p.id}`}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                        {p.order?.order_number || `#${p.order_id}`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div>{p.user?.name || 'Customer'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.user?.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '700' }}>
                        ₹{parseFloat(p.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#e0e7ff', color: '#3730a3', fontWeight: '600' }}>
                          {p.payment_method}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background:
                              p.status === 'completed' ? '#dcfce7' : p.status === 'refunded' ? '#fee2e2' : '#fef3c7',
                            color:
                              p.status === 'completed' ? '#15803d' : p.status === 'refunded' ? '#b91c1c' : '#b45309',
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: WITHDRAWALS & SETTLEMENTS
          ==================================================================== */}
      {activeSubTab === 'withdrawals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="stat-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#16a34a' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Settled</span>
                <CheckCircle2 size={20} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '8px' }}>
                ₹{withdrawalStats.total_settled || '0.00'}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>Disbursed to merchant bank accounts</span>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ea580c' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Pending Settlement</span>
                <Clock size={20} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '8px' }}>
                ₹{withdrawalStats.total_pending_settlement || '0.00'}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#ea580c' }}>{withdrawalStats.pending_count || 0} Requests Awaiting Approval</span>
            </div>
          </div>

          {/* Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <select
              value={withdrawalFilter}
              onChange={(e) => setWithdrawalFilter(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}
            >
              <option value="">All Withdrawals</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Settled / Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <th style={{ padding: '12px 16px' }}>Payout #</th>
                  <th style={{ padding: '12px 16px' }}>Vendor Store</th>
                  <th style={{ padding: '12px 16px' }}>Amount</th>
                  <th style={{ padding: '12px 16px' }}>Method</th>
                  <th style={{ padding: '12px 16px' }}>Requested At</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  {isAdmin && <th style={{ padding: '12px 16px' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No withdrawal requests found.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '600' }}>
                        {w.payout_number}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600' }}>{w.vendor?.store_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Wallet Balance: ₹{w.vendor?.wallet_balance}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                        ₹{parseFloat(w.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>
                        {w.payout_method.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {new Date(w.requested_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background:
                              w.status === 'approved' ? '#dcfce7' : w.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                            color:
                              w.status === 'approved' ? '#15803d' : w.status === 'rejected' ? '#b91c1c' : '#b45309',
                          }}
                        >
                          {w.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '12px 16px' }}>
                          {w.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                onClick={() => setPayoutModal({ open: true, payout: w, action: 'approve' })}
                              >
                                Settle
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#dc2626' }}
                                onClick={() => setPayoutModal({ open: true, payout: w, action: 'reject' })}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: COMMISSIONS & EARNINGS
          ==================================================================== */}
      {activeSubTab === 'commissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="stat-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#2563eb' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Gross Platform GMV</span>
                <TrendingUp size={20} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '8px' }}>
                ₹{commissionStats.total_gross || '0.00'}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total sales volume processed</span>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#16a34a' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Admin Commission</span>
                <Percent size={20} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '8px' }}>
                ₹{commissionStats.total_commission_earned || '0.00'}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>Marketplace fee revenue</span>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#7c3aed' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Vendor Net Earnings</span>
                <Wallet size={20} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '8px' }}>
                ₹{commissionStats.total_vendor_earnings || '0.00'}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#7c3aed' }}>Net vendor payouts generated</span>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <th style={{ padding: '12px 16px' }}>Order #</th>
                  <th style={{ padding: '12px 16px' }}>Vendor Store</th>
                  <th style={{ padding: '12px 16px' }}>Gross Sale</th>
                  <th style={{ padding: '12px 16px' }}>Comm. %</th>
                  <th style={{ padding: '12px 16px' }}>Admin Cut</th>
                  <th style={{ padding: '12px 16px' }}>Vendor Net</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No commission records available.
                    </td>
                  </tr>
                ) : (
                  commissions.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                        {c.order?.order_number || `#${c.order_id}`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {c.vendor?.store_name}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                        ₹{parseFloat(c.gross_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {parseFloat(c.commission_rate)}%
                      </td>
                      <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: '600' }}>
                        ₹{parseFloat(c.commission_amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#7c3aed', fontWeight: '700' }}>
                        ₹{parseFloat(c.vendor_earning).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background:
                              c.status === 'credited' ? '#dcfce7' : c.status === 'refunded' ? '#fee2e2' : '#fef3c7',
                            color:
                              c.status === 'credited' ? '#15803d' : c.status === 'refunded' ? '#b91c1c' : '#b45309',
                          }}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: RETURNS & REFUNDS
          ==================================================================== */}
      {activeSubTab === 'refunds' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="stat-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#dc2626' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Refund Volume</span>
                <RotateCcw size={20} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '8px' }}>
                ₹{refundStats.total_refunded_amount || '0.00'}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>Total amount refunded to customers</span>
            </div>

            <div className="stat-card" style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-bg, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ea580c' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Pending Review</span>
                <Clock size={20} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '8px' }}>
                {refundStats.pending_request_count || 0}
              </div>
              <span style={{ fontSize: '0.8rem', color: '#ea580c' }}>Customer return requests awaiting resolution</span>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: 'var(--card-bg, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle, #f8fafc)', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                  <th style={{ padding: '12px 16px' }}>Refund #</th>
                  <th style={{ padding: '12px 16px' }}>Order #</th>
                  <th style={{ padding: '12px 16px' }}>Customer</th>
                  <th style={{ padding: '12px 16px' }}>Amount</th>
                  <th style={{ padding: '12px 16px' }}>Reason</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  {isAdmin && <th style={{ padding: '12px 16px' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No refund requests logged.
                    </td>
                  </tr>
                ) : (
                  refunds.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '600' }}>
                        {r.refund_number}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                        {r.order?.order_number || `#${r.order_id}`}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {r.user?.name || 'Customer'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#dc2626' }}>
                        ₹{parseFloat(r.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                        <span title={r.reason} style={{ display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          {r.reason}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background:
                              r.status === 'refunded' ? '#fee2e2' : r.status === 'rejected' ? '#f1f5f9' : '#fef3c7',
                            color:
                              r.status === 'refunded' ? '#b91c1c' : r.status === 'rejected' ? '#475569' : '#b45309',
                          }}
                        >
                          {r.status}
                        </span>
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '12px 16px' }}>
                          {r.status === 'requested' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                onClick={() => setRefundModal({ open: true, refund: r, action: 'approve' })}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#dc2626' }}
                                onClick={() => setRefundModal({ open: true, refund: r, action: 'reject' })}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Processed</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: PROCESS WITHDRAWAL (ADMIN)
          ==================================================================== */}
      {payoutModal.open && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--card-bg, #ffffff)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700' }}>
              {payoutModal.action === 'approve' ? 'Approve & Settle Payout' : 'Reject Withdrawal Request'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
              Payout: <strong>{payoutModal.payout?.payout_number}</strong> for ₹{payoutModal.payout?.amount} ({payoutModal.payout?.vendor?.store_name})
            </p>

            <form onSubmit={handleProcessWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {payoutModal.action === 'approve' ? (
                <>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Bank Transaction UTR / Ref</label>
                    <input
                      type="text"
                      placeholder="e.g. UTR12345678"
                      value={payoutForm.transaction_reference}
                      onChange={(e) => setPayoutForm({ ...payoutForm, transaction_reference: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color, #e2e8f0)', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Admin Settlement Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Transferred via NEFT"
                      value={payoutForm.admin_notes}
                      onChange={(e) => setPayoutForm({ ...payoutForm, admin_notes: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color, #e2e8f0)', marginTop: '4px' }}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Rejection Reason (Refunds held balance)</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Provide reason for rejecting payout..."
                    value={payoutForm.rejection_reason}
                    onChange={(e) => setPayoutForm({ ...payoutForm, rejection_reason: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color, #e2e8f0)', marginTop: '4px' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPayoutModal({ open: false, payout: null, action: 'approve' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${payoutModal.action === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                >
                  {payoutModal.action === 'approve' ? 'Confirm Settlement' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: PROCESS REFUND (ADMIN)
          ==================================================================== */}
      {refundModal.open && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--card-bg, #ffffff)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700' }}>
              {refundModal.action === 'approve' ? 'Approve Return & Refund' : 'Reject Refund Request'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
              Refund for <strong>₹{refundModal.refund?.amount}</strong>. Approving will automatically reverse vendor earnings and restore stock!
            </p>

            <form onSubmit={handleProcessRefund} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {refundModal.action === 'approve' ? (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Gateway Refund ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. RFD_RAZORPAY_123"
                    value={refundForm.gateway_refund_id}
                    onChange={(e) => setRefundForm({ ...refundForm, gateway_refund_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color, #e2e8f0)', marginTop: '4px' }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Rejection Reason</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Explain why the return was rejected..."
                    value={refundForm.rejection_reason}
                    onChange={(e) => setRefundForm({ ...refundForm, rejection_reason: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color, #e2e8f0)', marginTop: '4px' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRefundModal({ open: false, refund: null, action: 'approve' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${refundModal.action === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                >
                  {refundModal.action === 'approve' ? 'Approve & Reverse Balance' : 'Reject Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: SIMULATE / RECORD PAYMENT (ADMIN / DEV)
          ==================================================================== */}
      {simulatePayModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--card-bg, #ffffff)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: '700' }}>
              Simulate Gateway Payment
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
              Verify checkout payment: triggers commission calculation and credits vendor wallet balance.
            </p>

            <form onSubmit={handleSimulatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Select Pending Order</label>
                {pendingOrders.length === 0 ? (
                  <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                    No pending orders found. You can place an order from Cart!
                  </div>
                ) : (
                  <select
                    value={selectedOrderToPay}
                    onChange={(e) => setSelectedOrderToPay(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color, #e2e8f0)', marginTop: '4px' }}
                  >
                    {pendingOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.order_number} — ₹{parseFloat(o.total_amount).toFixed(2)} ({o.customer?.name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Payment Method</label>
                <select
                  value={simPaymentMethod}
                  onChange={(e) => setSimPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color, #e2e8f0)', marginTop: '4px' }}
                >
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSimulatePayModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={pendingOrders.length === 0}
                >
                  Execute Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManager;
