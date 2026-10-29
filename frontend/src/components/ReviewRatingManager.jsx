import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  Store,
  User,
  ShoppingBag,
  Clock,
  Trash2,
  Check,
  Send,
  CornerDownRight,
  ShieldAlert,
  Award,
  Sparkles,
} from 'lucide-react';

const DEFAULT_REVIEWS = [
  {
    id: 1,
    customerName: 'Aarav Sharma',
    customerEmail: 'aarav.sharma@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80',
    verifiedBuyer: true,
    productTitle: 'Sony WH-1000XM5 Noise Canceling Headphones',
    productPrice: '₹26,990',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=120&h=120&q=80',
    vendorName: 'TechWorld',
    rating: 5,
    title: 'Mind-blowing active noise cancellation and crystal clear audio!',
    comment:
      'Used these on a cross-country flight and the background cabin noise simply vanished. Battery easily lasted 30+ hours on a single charge. Delivery from TechWorld was prompt and packaging was flawless.',
    date: 'Oct 23, 2026',
    helpfulCount: 24,
    status: 'approved', // 'approved' | 'pending' | 'flagged'
    adminReply: 'Thank you for your stellar feedback, Aarav! We are delighted you love the audio fidelity.',
    replyDate: 'Oct 23, 2026',
  },
  {
    id: 2,
    customerName: 'Priya Patel',
    customerEmail: 'priya.patel@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
    verifiedBuyer: true,
    productTitle: 'Classic Oxford Cotton Button-Down Shirt',
    productPrice: '₹1,499',
    productImage: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=120&h=120&q=80',
    vendorName: 'FashionHub',
    rating: 5,
    title: 'Superb fabric texture, fits true to size!',
    comment:
      'The pure combed cotton feels luxurious against the skin. Stitching is solid and color did not bleed after the first machine wash. Will definitely order in other shades.',
    date: 'Oct 22, 2026',
    helpfulCount: 16,
    status: 'approved',
    adminReply: null,
    replyDate: null,
  },
  {
    id: 3,
    customerName: 'Rohan Mehra',
    customerEmail: 'rohan.m@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&h=100&q=80',
    verifiedBuyer: true,
    productTitle: 'Ceramic Handcrafted Minimalist Coffee Mug Set',
    productPrice: '₹899',
    productImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=120&h=120&q=80',
    vendorName: 'HomeStyle',
    rating: 4,
    title: 'Very aesthetic design, slight delay in courier transit',
    comment:
      'The mugs look beautiful on the dining table and retain heat nicely. The only reason for 4 stars is that delivery took 4 days instead of 2. Otherwise high quality craftsmanship.',
    date: 'Oct 21, 2026',
    helpfulCount: 8,
    status: 'approved',
    adminReply: 'Apologies for the delivery delay, Rohan! We have updated our logistics partner for speedier dispatch.',
    replyDate: 'Oct 22, 2026',
  },
  {
    id: 4,
    customerName: 'Kavita Joshi',
    customerEmail: 'kavita.j@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80',
    verifiedBuyer: true,
    productTitle: 'Mechanical Gaming Keyboard RGB Backlit',
    productPrice: '₹4,999',
    productImage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=120&h=120&q=80',
    vendorName: 'TechWorld',
    rating: 5,
    title: 'Tactile blue switches feel amazing for typing and gaming',
    comment:
      'Key travel is super responsive and the braided USB cable is rugged. RGB presets are easily customizable without bloated software. Highly recommended!',
    date: 'Oct 24, 2026',
    helpfulCount: 2,
    status: 'pending', // Awaiting moderation
    adminReply: null,
    replyDate: null,
  },
  {
    id: 5,
    customerName: 'Vikram Sengupta',
    customerEmail: 'vikram.s@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
    verifiedBuyer: false,
    productTitle: 'Stainless Steel Insulated Travel Tumbler 750ml',
    productPrice: '₹1,249',
    productImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=120&h=120&q=80',
    vendorName: 'HomeStyle',
    rating: 1,
    title: 'Dented lid packaging upon arrival',
    comment:
      'The outer carton was crushed during transit and the lid has a small scratch. Need an immediate replacement or full refund.',
    date: 'Oct 23, 2026',
    helpfulCount: 5,
    status: 'flagged', // Reported/Issue
    adminReply: 'Hello Vikram, our customer support team has initiated a free door-step replacement for you.',
    replyDate: 'Oct 24, 2026',
  },
  {
    id: 6,
    customerName: 'Ananya Roy',
    customerEmail: 'ananya.roy@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&h=100&q=80',
    verifiedBuyer: true,
    productTitle: 'Atomic Habits Hardcover Edition',
    productPrice: '₹650',
    productImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=120&h=120&q=80',
    vendorName: 'BookStore',
    rating: 5,
    title: 'A transformative read in mint condition',
    comment:
      'Original print with crisp bookmark ribbon. BookStore wrapped it in multiple protective bubble layers. Truly exemplary merchant care.',
    date: 'Oct 24, 2026',
    helpfulCount: 11,
    status: 'pending',
    adminReply: null,
    replyDate: null,
  },
];

export const ReviewRatingManager = ({ user, onToast, onNavigate }) => {
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('app_reviews_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_REVIEWS;
      }
    }
    return DEFAULT_REVIEWS;
  });

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'flagged'
  const [starFilter, setStarFilter] = useState('all'); // 'all' | '5' | '4' | '3' | '2' | '1'
  const [searchQuery, setSearchQuery] = useState('');
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Persist reviews in localStorage
  useEffect(() => {
    localStorage.setItem('app_reviews_data', JSON.stringify(reviews));
  }, [reviews]);

  // Moderation Actions
  const handleApprove = (id) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    );
    onToast?.('Review approved and published to storefront!', 'success');
  };

  const handleFlag = (id) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'flagged' } : r))
    );
    onToast?.('Review marked as flagged for merchant mediation.', 'warning');
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this customer review?')) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      onToast?.('Review removed from catalog.', 'info');
    }
  };

  const handleOpenReplyModal = (review) => {
    setSelectedReview(review);
    setReplyText(review.adminReply || '');
    setReplyModalOpen(true);
  };

  const handleSaveReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      onToast?.('Reply text cannot be empty', 'error');
      return;
    }

    setReviews((prev) =>
      prev.map((r) =>
        r.id === selectedReview.id
          ? {
              ...r,
              adminReply: replyText.trim(),
              replyDate: 'Today',
            }
          : r
      )
    );

    setReplyModalOpen(false);
    onToast?.('Official merchant response posted to customer review!', 'success');
  };

  // Filter & Search Logic
  const filteredReviews = reviews.filter((r) => {
    const matchSearch =
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (activeTab === 'pending' && r.status !== 'pending') return false;
    if (activeTab === 'approved' && r.status !== 'approved') return false;
    if (activeTab === 'flagged' && r.status !== 'flagged') return false;

    if (starFilter !== 'all' && r.rating !== parseInt(starFilter, 10)) return false;

    return true;
  });

  // KPI Metrics
  const totalCount = reviews.length;
  const avgRating = (
    reviews.reduce((acc, r) => acc + r.rating, 0) / Math.max(totalCount, 1)
  ).toFixed(1);
  const positiveSentiment = (
    (reviews.filter((r) => r.rating >= 4).length / Math.max(totalCount, 1)) *
    100
  ).toFixed(0);
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const flaggedCount = reviews.filter((r) => r.status === 'flagged').length;

  // Star Distribution
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
    percentage: Math.round(
      (reviews.filter((r) => r.rating === s).length / Math.max(totalCount, 1)) * 100
    ),
  }));

  return (
    <div className="bv-reviews-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Header Banner */}
      <div className="bv-dash-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="bv-dash-title">Customer Reviews & Ratings Moderation</h1>
            {pendingCount > 0 && (
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#d97706',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span className="admin-pulse-dot" style={{ width: '5px', height: '5px', background: '#f59e0b' }} />
                {pendingCount} Awaiting Review
              </span>
            )}
          </div>
          <p className="bv-dash-subtitle">
            Inspect verified buyer feedback, approve pending testimonials, mediate customer issues, and respond as merchant.
          </p>
        </div>

        <div className="bv-dash-actions">
          <button
            type="button"
            className="bv-date-btn"
            onClick={() => onToast?.('Review feeds synced with real-time purchases', 'info')}
          >
            <Sparkles size={15} color="#6366f1" />
            <span>Sync Live Ratings</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards Row */}
      <div className="bv-metrics-row">
        {/* KPI 1: Average Rating */}
        <div className="bv-metric-card">
          <div className="bv-metric-top">
            <div>
              <span className="bv-metric-label">Marketplace Average</span>
              <div className="bv-metric-val" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{avgRating}</span>
                <span style={{ color: '#f59e0b', fontSize: '1.2rem' }}>★</span>
              </div>
            </div>
            <div className="bv-metric-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Star size={22} style={{ fill: '#d97706' }} />
            </div>
          </div>
          <div className="bv-metric-trend">
            <Award size={13} />
            <span>High Satisfaction</span>
            <span className="bv-trend-sub">across 3.4k buyers</span>
          </div>
        </div>

        {/* KPI 2: Positive Sentiment */}
        <div className="bv-metric-card">
          <div className="bv-metric-top">
            <div>
              <span className="bv-metric-label">Positive Sentiment</span>
              <div className="bv-metric-val">{positiveSentiment}%</div>
            </div>
            <div className="bv-metric-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
              <ThumbsUp size={22} />
            </div>
          </div>
          <div className="bv-metric-trend">
            <CheckCircle2 size={13} />
            <span>4 & 5 Star Ratings</span>
            <span className="bv-trend-sub">dominant</span>
          </div>
        </div>

        {/* KPI 3: Pending Queue */}
        <div className="bv-metric-card">
          <div className="bv-metric-top">
            <div>
              <span className="bv-metric-label">Pending Approval</span>
              <div className="bv-metric-val" style={{ color: pendingCount > 0 ? '#d97706' : '#10b981' }}>
                {pendingCount} Reviews
              </div>
            </div>
            <div className="bv-metric-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
              <Clock size={22} />
            </div>
          </div>
          <div className="bv-metric-trend" style={{ color: pendingCount > 0 ? '#d97706' : '#10b981' }}>
            <span>Moderation Queue</span>
            <span className="bv-trend-sub">within 24 hrs</span>
          </div>
        </div>

        {/* KPI 4: Flagged Reports */}
        <div className="bv-metric-card">
          <div className="bv-metric-top">
            <div>
              <span className="bv-metric-label">Flagged Issues</span>
              <div className="bv-metric-val" style={{ color: flaggedCount > 0 ? '#ef4444' : '#10b981' }}>
                {flaggedCount} Cases
              </div>
            </div>
            <div className="bv-metric-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className="bv-metric-trend" style={{ color: '#ef4444' }}>
            <ShieldAlert size={13} />
            <span>Merchant Support</span>
            <span className="bv-trend-sub">priority</span>
          </div>
        </div>

        {/* KPI 5: Verified Reviews Ratio */}
        <div className="bv-metric-card">
          <div className="bv-metric-top">
            <div>
              <span className="bv-metric-label">Verified Buyers</span>
              <div className="bv-metric-val">92%</div>
            </div>
            <div className="bv-metric-icon">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="bv-metric-trend">
            <span>Genuine Orders</span>
            <span className="bv-trend-sub">fraud filtered</span>
          </div>
        </div>
      </div>

      {/* 3. Rating Distribution Card & Filter Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 2fr',
          gap: '16px',
        }}
      >
        {/* Star Rating Distribution Progress Bars */}
        <div className="bv-card" style={{ padding: '16px 20px' }}>
          <span className="bv-card-title" style={{ marginBottom: '12px', display: 'block' }}>
            Star Rating Breakdown
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {starCounts.map((item) => (
              <div
                key={item.star}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                }}
                onClick={() => setStarFilter(starFilter === String(item.star) ? 'all' : String(item.star))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', width: '48px', fontWeight: 600 }}>
                  <span>{item.star}</span>
                  <span style={{ color: '#f59e0b' }}>★</span>
                </div>

                <div
                  style={{
                    flex: 1,
                    height: '8px',
                    background: '#f1f5f9',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${item.percentage}%`,
                      background:
                        item.star >= 4 ? '#10b981' : item.star === 3 ? '#f59e0b' : '#ef4444',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ width: '64px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>
                  {item.percentage}% ({item.count})
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Toolbar & Search */}
        <div className="bv-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="bv-card-title" style={{ marginBottom: '10px', display: 'block' }}>
              Filter & Search Reviews
            </span>

            {/* Moderation Status Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {[
                { id: 'all', label: `All (${reviews.length})` },
                { id: 'pending', label: `Pending Approval (${pendingCount})` },
                { id: 'approved', label: `Approved (${reviews.filter((r) => r.status === 'approved').length})` },
                { id: 'flagged', label: `Flagged (${flaggedCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: activeTab === tab.id ? '#4f46e5' : '#e2e8f0',
                    background: activeTab === tab.id ? '#4f46e5' : 'transparent',
                    color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary, #475569)',
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
          </div>

          {/* Search & Star Filter Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                className="bv-search-input"
                style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '34px' }}
                placeholder="Search reviewer, product, store, text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="bv-chart-dropdown"
              style={{ height: '34px', fontSize: '0.78rem' }}
              value={starFilter}
              onChange={(e) => setStarFilter(e.target.value)}
            >
              <option value="all">All Star Ratings</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4 Stars Only</option>
              <option value="3">3 Stars Only</option>
              <option value="2">2 Stars Only</option>
              <option value="1">1 Star Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Reviews List Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredReviews.length === 0 ? (
          <div
            className="bv-card"
            style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}
          >
            <MessageSquare size={36} color="#94a3b8" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0' }}>No reviews found</h3>
            <p style={{ fontSize: '0.82rem', margin: 0 }}>
              Try adjusting your moderation status filters or search term.
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bv-card"
              style={{
                padding: '20px',
                borderLeft:
                  review.status === 'flagged'
                    ? '4px solid #ef4444'
                    : review.status === 'pending'
                    ? '4px solid #f59e0b'
                    : '4px solid #10b981',
              }}
            >
              {/* Review Header: User Info (Left) + Status Pill (Right) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={review.customerAvatar}
                    alt={review.customerName}
                    style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {review.customerName}
                      </span>
                      {review.verifiedBuyer && (
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Check size={11} /> Verified Buyer
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {review.customerEmail} • {review.date}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    className={`bv-badge-status ${
                      review.status === 'approved'
                        ? 'bv-badge-completed'
                        : review.status === 'pending'
                        ? 'bv-badge-pending'
                        : 'bv-badge-cancelled'
                    }`}
                  >
                    {review.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Product Reference Strip */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={review.productImage}
                    alt={review.productTitle}
                    style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
                      {review.productTitle}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Price: <strong>{review.productPrice}</strong> • Sold by:{' '}
                      <strong style={{ color: '#4f46e5' }}>{review.vendorName}</strong>
                    </span>
                  </div>
                </div>

                {/* Stars Render */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      style={{
                        color: s <= review.rating ? '#f59e0b' : '#cbd5e1',
                        fontSize: '1.25rem',
                        lineHeight: 1,
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', marginLeft: '6px' }}>
                    {review.rating}.0
                  </span>
                </div>
              </div>

              {/* Review Text Body */}
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  "{review.title}"
                </h4>
                <p style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  {review.comment}
                </p>
              </div>

              {/* Admin Official Reply (if any) */}
              {review.adminReply && (
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.06)',
                    borderLeft: '3px solid #6366f1',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <CornerDownRight size={14} color="#6366f1" />
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#4f46e5' }}>
                      Official Merchant Response
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>• {review.replyDate}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#334155', margin: 0, lineHeight: 1.4 }}>
                    {review.adminReply}
                  </p>
                </div>
              )}

              {/* Bottom Action Strip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '12px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#64748b' }}>
                  <ThumbsUp size={13} />
                  <span>{review.helpfulCount} customers found this helpful</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {review.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(review.id)}
                      style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve</span>
                    </button>
                  )}

                  {review.status !== 'flagged' && (
                    <button
                      type="button"
                      onClick={() => handleFlag(review.id)}
                      style={{
                        background: '#fffbeb',
                        color: '#b45309',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <AlertTriangle size={13} />
                      <span>Flag Issue</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenReplyModal(review)}
                    style={{
                      background: '#f1f5f9',
                      color: '#334155',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>{review.adminReply ? 'Edit Reply' : 'Reply'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(review.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                    title="Delete Review"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Reply Modal */}
      {replyModalOpen && selectedReview && (
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
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
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
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Merchant Response
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Replying to {selectedReview.customerName}'s review
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            {/* Original Review Preview Snippet */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '0.78rem',
                color: '#475569',
                border: '1px solid #f1f5f9',
              }}
            >
              <strong>"{selectedReview.title}"</strong>
              <p style={{ margin: '4px 0 0 0', color: '#64748b', fontStyle: 'italic' }}>
                "{selectedReview.comment.slice(0, 140)}..."
              </p>
            </div>

            <form onSubmit={handleSaveReply}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Official Response (Visible to Public Storefront Buyers) *
                </label>
                <textarea
                  required
                  rows="4"
                  className="bv-search-input"
                  style={{ width: '100%', height: 'auto', resize: 'vertical' }}
                  placeholder="Thank you for sharing your experience! We appreciate your support..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setReplyModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bv-download-btn"
                  style={{ background: '#4f46e5', color: '#ffffff', border: 'none', padding: '8px 20px' }}
                >
                  <Send size={14} />
                  <span>Post Public Response</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewRatingManager;
