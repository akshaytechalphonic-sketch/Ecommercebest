import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Store,
  Package,
  Layers,
  ArrowUpRight,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Wallet,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { financialApi, adminVendorApi } from '../services/api';

/**
 * Enterprise Reports & Financial Intelligence Manager
 * Real-time aggregated financial analytics, seller breakdown, commission reports & CSV export
 */
export const ReportsManager = ({ user, onToast }) => {
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState('vendors'); // 'vendors' | 'commissions' | 'orders'
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'today' | '7days' | '30days' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Overview Report Data
  const [overviewData, setOverviewData] = useState({
    total_gmv: '0.00',
    total_discount: '0.00',
    total_net_volume: '0.00',
    total_commission_earned: '0.00',
    total_vendor_earnings: '0.00',
    pending_vendor_earnings: '0.00',
    refunded_commission: '0.00',
    total_orders_with_commission: 0,
    active_vendors_count: 0,
  });

  const [vendorBreakdown, setVendorBreakdown] = useState([]);
  const [commissionsList, setCommissionsList] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {};

      if (timeframe === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        params.start_date = todayStr;
      } else if (timeframe === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.start_date = d.toISOString().split('T')[0];
      } else if (timeframe === '30days') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.start_date = d.toISOString().split('T')[0];
      } else if (timeframe === 'custom') {
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
      }

      // 1. Fetch Overview & Vendor breakdown
      const resOverview = await financialApi.getCommissionReportsOverview(params);
      if (resOverview?.data) {
        setOverviewData(resOverview.data.platform_summary || resOverview.data.overview || {});
        setVendorBreakdown(resOverview.data.vendor_breakdown || []);
      }

      // 2. Fetch Commissions Ledger
      const resComm = await financialApi.getCommissions({ limit: 50, ...params });
      if (resComm?.data) {
        setCommissionsList(resComm.data);
      }

      // 3. Fetch Orders for Order Sales report
      const resOrders = await financialApi.getOrders({ limit: 50 });
      if (resOrders?.data) {
        setRecentOrders(resOrders.data);
      }
    } catch (err) {
      console.error('Reports fetch failed:', err);
      onToast?.(err.message || 'Failed to load financial reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [timeframe, startDate, endDate]);

  // Export to CSV Function
  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      const timestamp = new Date().toISOString().split('T')[0];
      let filename = `marketplace_report_${timestamp}.csv`;

      if (activeReportTab === 'vendors') {
        filename = `vendor_performance_report_${timestamp}.csv`;
        csvContent += 'Vendor ID,Store Name,Commission Rate %,Gross Sales (INR),Commission Cut (INR),Net Vendor Earnings (INR),Pending Escrow (INR),Wallet Balance (INR),Total Orders,Items Sold\n';
        vendorBreakdown.forEach((v) => {
          csvContent += `"${v.vendor_id}","${v.store_name}","${v.commission_rate}%","${v.gross_sales}","${v.total_commission_paid}","${v.net_vendor_earnings}","${v.pending_earnings}","${v.wallet_balance}","${v.total_orders}","${v.total_items_sold}"\n`;
        });
      } else if (activeReportTab === 'commissions') {
        filename = `commissions_ledger_report_${timestamp}.csv`;
        csvContent += 'Commission ID,Order ID,Vendor Store,Gross Amount (INR),Rate %,Platform Fee (INR),Vendor Net (INR),Status,Settlement Status,Date\n';
        commissionsList.forEach((c) => {
          csvContent += `"${c.id}","${c.order?.order_number || c.order_id}","${c.vendor?.store_name || ''}","${c.gross_amount}","${c.commission_rate}%","${c.commission_amount}","${c.vendor_earning}","${c.status}","${c.settlement_status || 'unsettled'}","${c.created_at}"\n`;
        });
      } else {
        filename = `orders_sales_report_${timestamp}.csv`;
        csvContent += 'Order ID,Order Number,Customer ID,Total Amount (INR),Order Status,Payment Status,Items Count,Created At\n';
        recentOrders.forEach((o) => {
          csvContent += `"${o.id}","${o.order_number}","${o.user_id}","${o.total_amount}","${o.order_status}","${o.payment_status}","${o.items?.length || 0}","${o.created_at}"\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onToast?.(`Report exported as ${filename}`, 'success');
    } catch (e) {
      onToast?.('Failed to export CSV report', 'error');
    }
  };

  // Filtered Vendor Breakdown
  const filteredVendors = vendorBreakdown.filter((v) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.store_name?.toLowerCase().includes(query) ||
      String(v.vendor_id).includes(query)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>
      {/* 1. Header & Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          background: 'var(--bg-card, #ffffff)',
          padding: '20px 24px',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary-light, #eef2ff)',
                color: 'var(--primary, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                Marketplace Reports & Financial Intelligence
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Accurate GMV, commissions ledger, seller net earnings, and reconciliation records
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Timeframe Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Timeframe Pill Filter */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '10px',
              gap: '2px',
            }}
          >
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: 'custom', label: 'Custom' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimeframe(t.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: timeframe === t.id ? '#ffffff' : 'transparent',
                  color: timeframe === t.id ? 'var(--primary, #4f46e5)' : '#64748b',
                  boxShadow: timeframe === t.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              padding: '8px 14px',
              borderRadius: '9px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchReportData}
            disabled={loading}
            style={{
              padding: '8px 12px',
              borderRadius: '9px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
            title="Refresh Report Data"
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker (if timeframe === 'custom') */}
      {timeframe === 'custom' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 18px',
            background: 'var(--primary-light, #eef2ff)',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #e2e8f0)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary, #4f46e5)' }}>
            Custom Date Range:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Key Executive Financial KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {/* Card 1: Gross Merchandise Value */}
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            padding: '18px 20px',
            borderRadius: '14px',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Gross Volume (GMV)
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#dbeafe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '8px', color: '#0f172a' }}>
            ₹{Number(overviewData.total_gmv || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.76rem', color: '#64748b' }}>
            <span>{overviewData.total_orders_with_commission || 0} orders processed</span>
          </div>
        </div>

        {/* Card 2: Platform Commission Revenue */}
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            padding: '18px 20px',
            borderRadius: '14px',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Platform Commissions
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '8px', color: '#16a34a' }}>
            ₹{Number(overviewData.total_commission_earned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.76rem', color: '#16a34a' }}>
            <CheckCircle2 size={13} />
            <span>Marketplace cut realized</span>
          </div>
        </div>

        {/* Card 3: Vendor Net Payouts */}
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            padding: '18px 20px',
            borderRadius: '14px',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Vendor Net Earnings
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary-light, #eef2ff)',
                color: 'var(--primary, #4f46e5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '8px', color: 'var(--primary, #4f46e5)' }}>
            ₹{Number(overviewData.total_vendor_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.76rem', color: '#64748b' }}>
            <span>Across {overviewData.active_vendors_count || 0} active merchant stores</span>
          </div>
        </div>

        {/* Card 4: Pending In-Escrow */}
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            padding: '18px 20px',
            borderRadius: '14px',
            border: '1px solid var(--border-color, #e2e8f0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Pending Escrow Balance
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, marginTop: '8px', color: '#d97706' }}>
            ₹{Number(overviewData.pending_vendor_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.76rem', color: '#d97706' }}>
            <span>Awaiting order payment / delivery</span>
          </div>
        </div>
      </div>

      {/* 3. Report Data Section with Sub-Tabs */}
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Navigation Tabs Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#fafbfc',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveReportTab('vendors')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                background: activeReportTab === 'vendors' ? 'var(--primary, #4f46e5)' : 'transparent',
                color: activeReportTab === 'vendors' ? '#ffffff' : '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Store size={15} />
              <span>Vendor Breakdown ({vendorBreakdown.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveReportTab('commissions')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                background: activeReportTab === 'commissions' ? 'var(--primary, #4f46e5)' : 'transparent',
                color: activeReportTab === 'commissions' ? '#ffffff' : '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <FileSpreadsheet size={15} />
              <span>Commissions Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveReportTab('orders')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                background: activeReportTab === 'orders' ? 'var(--primary, #4f46e5)' : 'transparent',
                color: activeReportTab === 'orders' ? '#ffffff' : '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Package size={15} />
              <span>Order Sales History</span>
            </button>
          </div>

          {/* Search Field */}
          {activeReportTab === 'vendors' && (
            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }}
              />
              <input
                type="text"
                placeholder="Search vendor store..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.8rem',
                }}
              />
            </div>
          )}
        </div>

        {/* Tab 1: Vendor Breakdown Table */}
        {activeReportTab === 'vendors' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Merchant Store</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Comm. Rate</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Gross Sales</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Platform Cut</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Vendor Net</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Pending Escrow</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Withdrawn</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Wallet Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No merchant sales data recorded in selected timeframe.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => (
                    <tr
                      key={v.vendor_id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                          {v.store_name}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          ID: #{v.vendor_id} • {v.total_items_sold || 0} items sold
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: 600 }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            fontSize: '0.78rem',
                          }}
                        >
                          {v.commission_rate}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: 700 }}>
                        ₹{parseFloat(v.gross_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 18px', color: '#16a34a', fontWeight: 700 }}>
                        ₹{parseFloat(v.total_commission_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 18px', color: 'var(--primary, #4f46e5)', fontWeight: 800 }}>
                        ₹{parseFloat(v.net_vendor_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 18px', color: '#d97706', fontWeight: 600 }}>
                        ₹{parseFloat(v.pending_earnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 18px', color: '#64748b' }}>
                        ₹{parseFloat(v.total_withdrawn || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: 700 }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            background: '#ecfdf5',
                            color: '#059669',
                            fontWeight: 700,
                          }}
                        >
                          ₹{parseFloat(v.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Commissions Ledger Table */}
        {activeReportTab === 'commissions' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Order #</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Merchant Store</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Gross Sale</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Rate</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Admin Cut</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Vendor Net</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Settlement</th>
                </tr>
              </thead>
              <tbody>
                {commissionsList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No commission ledger entries found.
                    </td>
                  </tr>
                ) : (
                  commissionsList.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 700 }}>
                        {c.order?.order_number || `#${c.order_id}`}
                      </td>
                      <td style={{ padding: '12px 18px', color: '#334155', fontWeight: 600 }}>
                        {c.vendor?.store_name || `Vendor #${c.vendor_id}`}
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: 700 }}>
                        ₹{parseFloat(c.gross_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        {parseFloat(c.commission_rate)}%
                      </td>
                      <td style={{ padding: '12px 18px', color: '#16a34a', fontWeight: 700 }}>
                        ₹{parseFloat(c.commission_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 18px', color: 'var(--primary, #4f46e5)', fontWeight: 800 }}>
                        ₹{parseFloat(c.vendor_earning || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background:
                              c.status === 'credited' ? '#dcfce7' : c.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                            color:
                              c.status === 'credited' ? '#15803d' : c.status === 'cancelled' ? '#dc2626' : '#d97706',
                          }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            background: c.settlement_status === 'settled' ? '#e0e7ff' : '#f1f5f9',
                            color: c.settlement_status === 'settled' ? '#4338ca' : '#64748b',
                          }}
                        >
                          {c.settlement_status || 'unsettled'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Orders Sales History Table */}
        {activeReportTab === 'orders' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Order #</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Items</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Total GMV</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Order Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: 700 }}>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No orders available in record.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 700 }}>
                        {o.order_number}
                      </td>
                      <td style={{ padding: '12px 18px', color: '#64748b', fontSize: '0.8rem' }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: 600 }}>
                        {o.items?.length || 1} items
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                        ₹{parseFloat(o.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background:
                              o.order_status === 'delivered'
                                ? '#dcfce7'
                                : o.order_status === 'cancelled'
                                ? '#fee2e2'
                                : '#e0f2fe',
                            color:
                              o.order_status === 'delivered'
                                ? '#15803d'
                                : o.order_status === 'cancelled'
                                ? '#dc2626'
                                : '#0369a1',
                          }}
                        >
                          {o.order_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            background: o.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
                            color: o.payment_status === 'paid' ? '#15803d' : '#d97706',
                          }}
                        >
                          {o.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsManager;
