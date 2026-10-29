import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Trash2,
  Edit3,
  Percent,
  DollarSign,
  Calendar,
  Store,
  Tag,
  ArrowUpRight,
  TrendingUp,
  X,
  Check,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

// Default realistic coupon records
const DEFAULT_COUPONS = [
  {
    id: 1,
    code: 'WELCOME50',
    title: 'New Customer Welcome Deal',
    description: 'Flat 50% discount on first purchase above ₹999 across all categories',
    discountType: 'percentage', // 'percentage' | 'fixed'
    discountValue: 50,
    maxDiscount: 500,
    minOrderValue: 999,
    applicableTo: 'all', // 'all' or specific vendor
    vendorName: 'All Marketplace',
    validFrom: '2026-10-01',
    validUntil: '2026-12-31',
    usageLimit: 2000,
    usedCount: 842,
    perUserLimit: 1,
    status: 'active', // 'active' | 'scheduled' | 'expired'
  },
  {
    id: 2,
    code: 'FESTIVE25',
    title: 'Festive Season Megasale',
    description: 'Get 25% off on electronic gadgets and smartphones',
    discountType: 'percentage',
    discountValue: 25,
    maxDiscount: 1500,
    minOrderValue: 2499,
    applicableTo: 'vendor',
    vendorName: 'TechWorld',
    validFrom: '2026-10-15',
    validUntil: '2026-11-15',
    usageLimit: 1000,
    usedCount: 465,
    perUserLimit: 2,
    status: 'active',
  },
  {
    id: 3,
    code: 'FLAT500',
    title: 'Weekend Flat Cash Discount',
    description: 'Flat ₹500 discount on cart value greater than ₹3,499',
    discountType: 'fixed',
    discountValue: 500,
    maxDiscount: 500,
    minOrderValue: 3499,
    applicableTo: 'all',
    vendorName: 'All Marketplace',
    validFrom: '2026-10-20',
    validUntil: '2026-10-28',
    usageLimit: 500,
    usedCount: 310,
    perUserLimit: 1,
    status: 'active',
  },
  {
    id: 4,
    code: 'FASHION20',
    title: 'Autumn Fashion Clearance',
    description: '20% off on premium apparel, shirts and seasonal styles',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 800,
    minOrderValue: 1499,
    applicableTo: 'vendor',
    vendorName: 'FashionHub',
    validFrom: '2026-10-10',
    validUntil: '2026-11-20',
    usageLimit: 800,
    usedCount: 228,
    perUserLimit: 2,
    status: 'active',
  },
  {
    id: 5,
    code: 'FREESHIP',
    title: 'Zero Delivery Fee Promo',
    description: 'Complimentary expedited delivery on all orders above ₹499',
    discountType: 'fixed',
    discountValue: 99,
    maxDiscount: 99,
    minOrderValue: 499,
    applicableTo: 'all',
    vendorName: 'All Marketplace',
    validFrom: '2026-09-01',
    validUntil: '2026-10-20',
    usageLimit: 3000,
    usedCount: 3000,
    perUserLimit: 5,
    status: 'expired',
  },
  {
    id: 6,
    code: 'DIWALI30',
    title: 'Grand Diwali Celebration Voucher',
    description: '30% discount on home appliances, decor and kitchenware',
    discountType: 'percentage',
    discountValue: 30,
    maxDiscount: 2000,
    minOrderValue: 2999,
    applicableTo: 'vendor',
    vendorName: 'HomeStyle',
    validFrom: '2026-11-01',
    validUntil: '2026-11-12',
    usageLimit: 1500,
    usedCount: 0,
    perUserLimit: 1,
    status: 'scheduled',
  },
];

export const CouponManager = ({ user, onToast, onNavigate }) => {
  const [coupons, setCoupons] = useState(() => {
    const saved = localStorage.getItem('app_coupons_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_COUPONS;
      }
    }
    return DEFAULT_COUPONS;
  });

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'scheduled' | 'expired' | 'percentage' | 'fixed'
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 500,
    minOrderValue: 999,
    applicableTo: 'all',
    vendorName: 'All Marketplace',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    usageLimit: 1000,
    perUserLimit: 1,
    status: 'active',
  });

  // Save to localStorage whenever coupons change
  useEffect(() => {
    localStorage.setItem('app_coupons_data', JSON.stringify(coupons));
  }, [coupons]);

  // Copy code to clipboard helper
  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    onToast?.(`Coupon "${code}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: 20,
      maxDiscount: 500,
      minOrderValue: 999,
      applicableTo: 'all',
      vendorName: 'All Marketplace',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      usageLimit: 1000,
      perUserLimit: 1,
      status: 'active',
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
      minOrderValue: coupon.minOrderValue,
      applicableTo: coupon.applicableTo,
      vendorName: coupon.vendorName,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      status: coupon.status,
    });
    setModalOpen(true);
  };

  // Save Coupon (Create or Update)
  const handleSaveCoupon = (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      onToast?.('Coupon code is required', 'error');
      return;
    }

    const cleanCode = formData.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    if (editingCoupon) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === editingCoupon.id
            ? {
                ...c,
                ...formData,
                code: cleanCode,
                discountValue: Number(formData.discountValue),
                maxDiscount: Number(formData.maxDiscount),
                minOrderValue: Number(formData.minOrderValue),
                usageLimit: Number(formData.usageLimit),
                perUserLimit: Number(formData.perUserLimit),
              }
            : c
        )
      );
      onToast?.(`Coupon "${cleanCode}" updated successfully!`, 'success');
    } else {
      const newCoupon = {
        id: Date.now(),
        ...formData,
        code: cleanCode,
        discountValue: Number(formData.discountValue),
        maxDiscount: Number(formData.maxDiscount),
        minOrderValue: Number(formData.minOrderValue),
        usageLimit: Number(formData.usageLimit),
        perUserLimit: Number(formData.perUserLimit),
        usedCount: 0,
      };
      setCoupons((prev) => [newCoupon, ...prev]);
      onToast?.(`Coupon "${cleanCode}" published successfully!`, 'success');
    }

    setModalOpen(false);
  };

  // Delete Coupon
  const handleDeleteCoupon = (id, code) => {
    if (window.confirm(`Are you sure you want to delete coupon "${code}"?`)) {
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      onToast?.(`Coupon "${code}" deleted`, 'info');
    }
  };

  // Toggle Status
  const handleToggleStatus = (id) => {
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newStatus = c.status === 'active' ? 'expired' : 'active';
          onToast?.(`Coupon "${c.code}" is now ${newStatus}`, 'info');
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  // Filter & Search Logic
  const filteredCoupons = coupons.filter((c) => {
    // Search match
    const matchSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return c.status === 'active';
    if (activeFilter === 'scheduled') return c.status === 'scheduled';
    if (activeFilter === 'expired') return c.status === 'expired';
    if (activeFilter === 'percentage') return c.discountType === 'percentage';
    if (activeFilter === 'fixed') return c.discountType === 'fixed';
    return true;
  });

  // KPI Calculations
  const totalActive = coupons.filter((c) => c.status === 'active').length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const totalDiscountEstimated = coupons.reduce(
    (sum, c) =>
      sum +
      (c.usedCount || 0) *
        (c.discountType === 'fixed' ? c.discountValue : Math.min(c.maxDiscount, (c.minOrderValue * c.discountValue) / 100)),
    0
  );

  return (
    <div className="bv-coupons-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Banner */}
      <div className="bv-dash-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="bv-dash-title">Coupons & Promotional Vouchers</h1>
            <span
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                color: '#4f46e5',
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              {coupons.length} Total Vouchers
            </span>
          </div>
          <p className="bv-dash-subtitle">
            Configure percentage discounts, flat cash vouchers, minimum purchase thresholds, and multi-vendor campaigns.
          </p>
        </div>

        <div className="bv-dash-actions">
          <button
            type="button"
            className="bv-download-btn"
            style={{ background: '#4f46e5', color: '#ffffff', border: 'none' }}
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Row */}
      <div className="bv-metrics-row">
        {/* KPI 1: Active Coupons */}
        <div className="bv-metric-card">
          <div className="bv-metric-top">
            <div>
              <span className="bv-metric-label">Active Promotions</span>
              <div className="bv-metric-val">{totalActive} Active</div>
            </div>
            <div className="bv-metric-icon">
              <Ticket size={22} />
            </div>
          </div>
          <div className="bv-metric-trend">
            <TrendingUp size={13} />
            <span>Live Campaigns</span>
            <span className="bv-trend-sub">across stores</span>
          </div>
        </div>

        {/* KPI 2: Total Redemptions */}
        <div className="bv-metric-card">
          <div className="bv-metric-top">
            <div>
              <span className="bv-metric-label">Total Redemptions</span>
              <div className="bv-metric-val">{totalRedemptions.toLocaleString()} Uses</div>
            </div>
            <div className="bv-metric-icon">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="bv-metric-trend">
            <ArrowUpRight size={13} />
            <span>+19.4%</span>
            <span className="bv-trend-sub">vs last 30 days</span>
          </div>
        </div>

        {/* KPI 3: Savings Granted */}
        <div className="bv-metric-card">
          <div className="bv-metric-top">
            <div>
              <span className="bv-metric-label">Total Savings Granted</span>
              <div className="bv-metric-val">₹{Math.round(totalDiscountEstimated).toLocaleString('en-IN')}</div>
            </div>
            <div className="bv-metric-icon">
              <ShoppingBag size={22} />
            </div>
          </div>
          <div className="bv-metric-trend">
            <ArrowUpRight size={13} />
            <span>High Retention</span>
            <span className="bv-trend-sub">buyer loyalty</span>
          </div>
        </div>

        {/* KPI 4: Average GMV Lift */}
        <div className="bv-metric-card">
          <div className="bv-metric-top">
            <div>
              <span className="bv-metric-label">Average Order Lift</span>
              <div className="bv-metric-val">+32.6%</div>
            </div>
            <div className="bv-metric-icon">
              <Percent size={22} />
            </div>
          </div>
          <div className="bv-metric-trend">
            <TrendingUp size={13} />
            <span>₹1,850 avg cart</span>
            <span className="bv-trend-sub">with vouchers</span>
          </div>
        </div>

        {/* KPI 5: Scheduled Deals */}
        <div className="bv-metric-card">
          <div className="bv-metric-top">
            <div>
              <span className="bv-metric-label">Scheduled Upcoming</span>
              <div className="bv-metric-val">
                {coupons.filter((c) => c.status === 'scheduled').length} Campaigns
              </div>
            </div>
            <div className="bv-metric-icon">
              <Calendar size={22} />
            </div>
          </div>
          <div className="bv-metric-trend" style={{ color: '#6366f1' }}>
            <Clock size={13} />
            <span>Auto-activates</span>
            <span className="bv-trend-sub">on date</span>
          </div>
        </div>
      </div>

      {/* 3. Controls & Filter Bar */}
      <div
        className="bv-card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Coupons' },
            { id: 'active', label: 'Active Deals' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'expired', label: 'Expired' },
            { id: 'percentage', label: 'Percentage %' },
            { id: 'fixed', label: 'Flat Cash ₹' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeFilter === tab.id ? '#4f46e5' : '#e2e8f0',
                background: activeFilter === tab.id ? '#4f46e5' : 'transparent',
                color: activeFilter === tab.id ? '#ffffff' : 'var(--text-secondary, #475569)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            className="bv-search-input"
            style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '34px' }}
            placeholder="Search code, title, vendor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Coupons Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px',
        }}
      >
        {filteredCoupons.map((coupon) => {
          const usagePercent = Math.min(100, Math.round(((coupon.usedCount || 0) / (coupon.usageLimit || 1)) * 100));

          return (
            <div
              key={coupon.id}
              className="bv-card"
              style={{
                padding: '18px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: coupon.status === 'active' ? '1.5px solid rgba(99, 102, 241, 0.3)' : '1px solid #f1f5f9',
              }}
            >
              <div>
                {/* Card Top: Code & Status Pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#f5f3ff',
                      border: '1.5px dashed #818cf8',
                      borderRadius: '8px',
                      padding: '4px 10px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '1rem',
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        color: '#4f46e5',
                      }}
                    >
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: copiedCode === coupon.code ? '#10b981' : '#6366f1',
                      }}
                      title="Copy code"
                    >
                      {copiedCode === coupon.code ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  <span
                    className={`bv-badge-status ${
                      coupon.status === 'active'
                        ? 'bv-badge-completed'
                        : coupon.status === 'scheduled'
                        ? 'bv-badge-processing'
                        : 'bv-badge-cancelled'
                    }`}
                  >
                    {coupon.status.toUpperCase()}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  {coupon.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                  {coupon.description}
                </p>

                {/* Offer Highlights Grid */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    marginBottom: '12px',
                    fontSize: '0.74rem',
                  }}
                >
                  <div>
                    <span style={{ color: '#94a3b8' }}>Discount:</span>{' '}
                    <strong style={{ color: '#0f172a' }}>
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}% OFF (Max ₹${coupon.maxDiscount})`
                        : `Flat ₹${coupon.discountValue} OFF`}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Min Order:</span>{' '}
                    <strong style={{ color: '#0f172a' }}>₹{coupon.minOrderValue}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Scope:</span>{' '}
                    <strong style={{ color: '#4f46e5' }}>{coupon.vendorName}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Valid Until:</span>{' '}
                    <strong style={{ color: '#0f172a' }}>{coupon.validUntil}</strong>
                  </div>
                </div>

                {/* Usage Progress Bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      color: '#64748b',
                      marginBottom: '4px',
                    }}
                  >
                    <span>
                      Redemptions: <strong>{coupon.usedCount}</strong> / {coupon.usageLimit}
                    </span>
                    <span style={{ fontWeight: 700, color: '#4f46e5' }}>{usagePercent}% Used</span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${usagePercent}%`,
                        background: usagePercent > 90 ? '#ef4444' : usagePercent > 60 ? '#f59e0b' : '#10b981',
                        borderRadius: '999px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleToggleStatus(coupon.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: coupon.status === 'active' ? '#d97706' : '#10b981',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {coupon.status === 'active' ? 'Pause Deal' : 'Reactivate Deal'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(coupon)}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      color: '#334155',
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Edit Coupon"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      color: '#ef4444',
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Delete Coupon"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Create / Edit Coupon Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="bv-card"
            style={{
              width: '100%',
              maxWidth: '540px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#ede9fe',
                    color: '#6d28d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ticket size={18} />
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {editingCoupon ? 'Edit Promotional Coupon' : 'Create New Voucher'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Row 1: Code & Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    className="bv-search-input"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                    placeholder="e.g. MEGA2026"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Discount Model
                  </label>
                  <select
                    className="bv-search-input"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  >
                    <option value="percentage">Percentage (%) Discount</option>
                    <option value="fixed">Flat Amount (₹) Off</option>
                  </select>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Deal Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  className="bv-search-input"
                  placeholder="e.g. Flash 30% Off on Tech Gadgets"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Terms & Description
                </label>
                <textarea
                  className="bv-search-input"
                  rows="2"
                  style={{ height: 'auto', resize: 'vertical' }}
                  placeholder="e.g. Valid on prepaid orders above ₹1,999 across selected merchants."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Row 2: Discount Value, Max Cap & Min Cart */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {formData.discountType === 'percentage' ? 'Discount %' : 'Flat Off (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="bv-search-input"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="bv-search-input"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Min Cart Value (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="bv-search-input"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 3: Limits & Scope */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Storefront Scope
                  </label>
                  <select
                    className="bv-search-input"
                    value={formData.vendorName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vendorName: e.target.value,
                        applicableTo: e.target.value === 'All Marketplace' ? 'all' : 'vendor',
                      })
                    }
                  >
                    <option value="All Marketplace">All Marketplace Vendors</option>
                    <option value="TechWorld">TechWorld (Electronics)</option>
                    <option value="FashionHub">FashionHub (Apparel)</option>
                    <option value="HomeStyle">HomeStyle (Decor)</option>
                    <option value="BookStore">BookStore (Publications)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="bv-search-input"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 4: Dates & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    className="bv-search-input"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    className="bv-search-input"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Initial Status
                  </label>
                  <select
                    className="bv-search-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active Now</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="expired">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bv-download-btn"
                  style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '8px 20px' }}
                >
                  {editingCoupon ? 'Update Voucher' : 'Publish Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManager;
