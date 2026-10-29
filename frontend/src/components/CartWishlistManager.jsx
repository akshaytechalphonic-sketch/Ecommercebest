import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  ShoppingBag,
  Heart,
  Eye,
  RefreshCw,
  Search,
  Package,
  TrendingUp,
  Sparkles,
  Clock,
  Store,
  CheckCircle2,
  X,
  ExternalLink,
  Plus,
  Trash2,
  User as UserIcon,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Box,
} from 'lucide-react';
import { adminCartApi, cartApi, wishlistApi, productApi } from '../services/api';

/**
 * Robust helper to resolve local upload paths and remote URLs
 */
const getProductImageUrl = (url) => {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/uploads/')) return trimmed;
  if (trimmed.startsWith('uploads/')) return `/${trimmed}`;
  return trimmed;
};

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';

export const CartWishlistManager = ({ user, onToast }) => {
  const [activeTab, setActiveTab] = useState('carts'); // 'carts' | 'wishlists' | 'simulator'

  // Carts state
  const [carts, setCarts] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    active_carts_count: 0,
    total_pipeline_value: 0,
    total_items_in_carts: 0,
  });
  const [cartLoading, setCartLoading] = useState(true);
  const [cartSearch, setCartSearch] = useState('');

  // Wishlist stats state
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [wishlistSummary, setWishlistSummary] = useState({
    total_wishlist_records: 0,
    unique_wishlisted_products: 0,
    unique_customers: 0,
  });
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Inspector modal state
  const [selectedCart, setSelectedCart] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);

  // Storefront Simulator state (to test adding products to cart & wishlist live)
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [simLoading, setSimLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch Carts
  const fetchCarts = async () => {
    try {
      setCartLoading(true);
      const params = {};
      if (cartSearch.trim()) params.search = cartSearch.trim();
      const res = await adminCartApi.getCarts(params);
      if (res?.data) {
        setCarts(res.data.carts || []);
        if (res.data.summary) {
          setCartSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load carts', err);
      onToast?.(err.message || 'Failed to load customer carts', 'error');
    } finally {
      setCartLoading(false);
    }
  };

  // Fetch Wishlist stats
  const fetchWishlistStats = async () => {
    try {
      setWishlistLoading(true);
      const res = await adminCartApi.getWishlistStats();
      if (res?.data) {
        setWishlistProducts(res.data.products || []);
        if (res.data.summary) {
          setWishlistSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load wishlist analytics', err);
      onToast?.(err.message || 'Failed to load wishlist stats', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Fetch Catalog for simulator
  const fetchSimulatorCatalog = async () => {
    try {
      setSimLoading(true);
      const res = await productApi.getPublicProducts({ limit: 12 });
      if (res?.data?.products) {
        setCatalogProducts(res.data.products);
      }
    } catch (err) {
      console.error('Failed to load public products', err);
    } finally {
      setSimLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
    fetchWishlistStats();
    fetchSimulatorCatalog();
  }, []);

  // Simulator actions
  const handleSimAddToCart = async (product) => {
    try {
      setActionLoadingId(`cart-${product.id}`);
      await cartApi.addToCart({ product_id: product.id, quantity: 1 });
      onToast?.(`Added '${product.name}' to Cart successfully!`, 'success');
      fetchCarts();
    } catch (err) {
      onToast?.(err.message || 'Failed to add to cart', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSimAddToWishlist = async (product) => {
    try {
      setActionLoadingId(`wish-${product.id}`);
      await wishlistApi.addToWishlist(product.id);
      onToast?.(`Saved '${product.name}' to Wishlist!`, 'success');
      fetchWishlistStats();
    } catch (err) {
      onToast?.(err.message || 'Failed to add to wishlist', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="pm-wrap">
      {/* 1. Header Banner & Action Bar */}
      <div className="pm-header-card">
        <div className="pm-header-info">
          <div className="pm-header-icon" style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(139, 92, 246, 0.18) 100%)', color: '#db2777' }}>
            <ShoppingCart size={22} />
          </div>
          <div>
            <h2 className="pm-header-title">Customer Carts & Wishlist Intelligence</h2>
            <div className="pm-header-subtitle">
              Live marketplace visibility into active customer shopping bags, pipeline revenue, and wishlist interest
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="pm-btn pm-btn-secondary"
            onClick={() => {
              fetchCarts();
              fetchWishlistStats();
              onToast?.('Refreshing cart and wishlist metrics...', 'info');
            }}
          >
            <RefreshCw size={14} className={cartLoading || wishlistLoading ? 'spin-anim' : ''} />
            <span>Sync Live Data</span>
          </button>

          <button
            type="button"
            className="pm-btn pm-btn-primary"
            style={{ background: 'linear-gradient(135deg, #db2777 0%, #9333ea 100%)' }}
            onClick={() => setActiveTab('simulator')}
          >
            <Sparkles size={16} />
            <span>Test Cart & Wishlist</span>
          </button>
        </div>
      </div>

      {/* 2. Key Performance Metric Cards */}
      <div className="pm-kpi-grid">
        <div className="pm-kpi-card total" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('carts')}>
          <div className="pm-kpi-head">
            <span className="pm-kpi-label">Active Customer Carts</span>
            <div className="pm-kpi-icon-wrap" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <ShoppingCart size={18} />
            </div>
          </div>
          <div className="pm-kpi-value">{cartSummary.active_carts_count}</div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Carts with active products</span>
        </div>

        <div className="pm-kpi-card approved">
          <div className="pm-kpi-head">
            <span className="pm-kpi-label">Pipeline Cart Value</span>
            <div className="pm-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="pm-kpi-value" style={{ color: '#059669' }}>
            ₹{cartSummary.total_pipeline_value.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Potential marketplace revenue</span>
        </div>

        <div className="pm-kpi-card pending">
          <div className="pm-kpi-head">
            <span className="pm-kpi-label">Total Units in Carts</span>
            <div className="pm-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
              <Box size={18} />
            </div>
          </div>
          <div className="pm-kpi-value" style={{ color: '#d97706' }}>
            {cartSummary.total_items_in_carts}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Items ready for checkout</span>
        </div>

        <div className="pm-kpi-card rejected" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('wishlists')}>
          <div className="pm-kpi-head">
            <span className="pm-kpi-label">Wishlist Engagements</span>
            <div className="pm-kpi-icon-wrap" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#db2777' }}>
              <Heart size={18} />
            </div>
          </div>
          <div className="pm-kpi-value" style={{ color: '#db2777' }}>
            {wishlistSummary.total_wishlist_records}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            Across {wishlistSummary.unique_customers} shoppers
          </span>
        </div>
      </div>

      {/* 3. Segmented Sub-Navigation Bar */}
      <div className="pm-filter-bar">
        <div className="pm-pills">
          <button
            type="button"
            className={`pm-pill ${activeTab === 'carts' ? 'active' : ''}`}
            onClick={() => setActiveTab('carts')}
          >
            <ShoppingCart size={14} />
            <span>Active Customer Carts</span>
            {cartSummary.active_carts_count > 0 && (
              <span className="pm-pill-count">{cartSummary.active_carts_count}</span>
            )}
          </button>

          <button
            type="button"
            className={`pm-pill ${activeTab === 'wishlists' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishlists')}
          >
            <Heart size={14} />
            <span>Wishlist Demand & Popularity</span>
            {wishlistSummary.unique_wishlisted_products > 0 && (
              <span className="pm-pill-count">{wishlistSummary.unique_wishlisted_products}</span>
            )}
          </button>

          <button
            type="button"
            className={`pm-pill ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
          >
            <Sparkles size={14} />
            <span>Storefront Quick Actions (Add to Cart / Wishlist)</span>
          </button>
        </div>

        {activeTab === 'carts' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchCarts();
            }}
            className="pm-search-input-box"
          >
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search customer name / email..."
              value={cartSearch}
              onChange={(e) => setCartSearch(e.target.value)}
            />
            {cartSearch && (
              <button
                type="button"
                onClick={() => {
                  setCartSearch('');
                  fetchCarts();
                }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </form>
        )}
      </div>

      {/* =========================================================================
          TAB 1: ACTIVE CUSTOMER CARTS TABLE
          ========================================================================= */}
      {activeTab === 'carts' && (
        <div className="pm-table-card">
          {cartLoading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <RefreshCw size={28} className="spin-anim" style={{ color: 'var(--primary)', margin: '0 auto' }} />
              <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading active customer shopping carts...</p>
            </div>
          ) : carts.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <ShoppingBag size={48} style={{ opacity: 0.3, margin: '0 auto 12px', color: 'var(--text-muted)' }} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                No active shopping carts
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 18px' }}>
                There are currently no items in any customer shopping carts. You can click "Test Cart & Wishlist" to add products and test live!
              </p>
              <button
                type="button"
                className="pm-btn pm-btn-primary"
                onClick={() => setActiveTab('simulator')}
              >
                <Sparkles size={15} />
                <span>Open Storefront Quick Actions</span>
              </button>
            </div>
          ) : (
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Cart Items Preview</th>
                  <th>Total Units</th>
                  <th>Pipeline Value</th>
                  <th>Last Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => (
                  <tr key={cart.id}>
                    {/* Customer Info */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: 'rgba(79, 70, 229, 0.1)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.86rem',
                          }}
                        >
                          {cart.customer?.name ? cart.customer.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {cart.customer?.name || 'Customer'}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {cart.customer?.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Items Thumbnails Preview */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {(cart.items || []).slice(0, 4).map((item, idx) => (
                          <div
                            key={idx}
                            title={`${item.name} (${item.quantity}x)`}
                            style={{
                              position: 'relative',
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <img
                              src={getProductImageUrl(item.image) || PLACEHOLDER_IMG}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = PLACEHOLDER_IMG;
                              }}
                            />
                            {item.quantity > 1 && (
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  right: 0,
                                  background: 'rgba(0,0,0,0.75)',
                                  color: '#fff',
                                  fontSize: '0.58rem',
                                  fontWeight: 800,
                                  padding: '1px 3px',
                                  borderRadius: '3px 0 0 0',
                                }}
                              >
                                {item.quantity}x
                              </span>
                            )}
                          </div>
                        ))}
                        {(cart.items || []).length > 4 && (
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              padding: '2px 6px',
                              background: 'var(--bg-subtle)',
                              borderRadius: '6px',
                            }}
                          >
                            +{cart.items.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Units */}
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {cart.total_items} items
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ({cart.items_count} distinct)
                      </div>
                    </td>

                    {/* Pipeline Value */}
                    <td>
                      <span style={{ fontWeight: 800, color: '#059669', fontSize: '1rem' }}>
                        ₹{Number(cart.total_price).toLocaleString()}
                      </span>
                      {cart.subtotal > cart.total_price && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          MRP: ₹{Number(cart.subtotal).toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                        <span>{new Date(cart.updated_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="pm-btn pm-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => {
                          setSelectedCart(cart);
                          setInspectModalOpen(true);
                        }}
                      >
                        <Eye size={14} />
                        <span>Inspect Cart</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: WISHLIST DEMAND INTELLIGENCE TABLE
          ========================================================================= */}
      {activeTab === 'wishlists' && (
        <div className="pm-table-card">
          {wishlistLoading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <RefreshCw size={28} className="spin-anim" style={{ color: 'var(--primary)', margin: '0 auto' }} />
              <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading wishlist demand intelligence...</p>
            </div>
          ) : wishlistProducts.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Heart size={48} style={{ opacity: 0.3, margin: '0 auto 12px', color: '#db2777' }} />
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                No wishlist entries yet
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 18px' }}>
                No customers have added items to their wishlist yet. Use the Storefront Quick Actions tab to test wishlist saving!
              </p>
              <button
                type="button"
                className="pm-btn pm-btn-primary"
                onClick={() => setActiveTab('simulator')}
              >
                <Sparkles size={15} />
                <span>Test Wishlist Action</span>
              </button>
            </div>
          ) : (
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category & Seller</th>
                  <th>Price & Stock</th>
                  <th>Wishlist Count</th>
                  <th>In Carts</th>
                  <th>Demand Level</th>
                </tr>
              </thead>
              <tbody>
                {wishlistProducts.map((prod) => (
                  <tr key={prod.product_id}>
                    {/* Product */}
                    <td>
                      <div className="pm-prod-cell">
                        <img
                          src={getProductImageUrl(prod.image) || PLACEHOLDER_IMG}
                          alt={prod.name}
                          className="pm-prod-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_IMG;
                          }}
                        />
                        <div>
                          <div className="pm-prod-name">{prod.name}</div>
                          <div className="pm-prod-slug">{prod.sku}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Seller */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                          {prod.category?.name || 'General'}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {prod.vendor?.store_name || 'Store'}
                        </span>
                      </div>
                    </td>

                    {/* Price & Stock */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 800, color: '#059669', fontSize: '0.94rem' }}>
                          ₹{Number(prod.price).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: prod.stock > 0 ? 'var(--text-muted)' : '#dc2626' }}>
                          {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </td>

                    {/* Wishlist Count */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Heart size={15} color="#db2777" fill="#db2777" />
                        <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#db2777' }}>
                          {prod.wishlist_count} {prod.wishlist_count === 1 ? 'user' : 'users'}
                        </span>
                      </div>
                    </td>

                    {/* In Carts */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShoppingCart size={15} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {prod.cart_count} units
                        </span>
                      </div>
                    </td>

                    {/* Demand Level Badge */}
                    <td>
                      <span
                        className="pm-approval-badge"
                        style={{
                          background:
                            prod.demand_level === 'High Demand'
                              ? 'rgba(239, 68, 68, 0.12)'
                              : prod.demand_level === 'Trending'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : 'rgba(79, 70, 229, 0.08)',
                          color:
                            prod.demand_level === 'High Demand'
                              ? '#dc2626'
                              : prod.demand_level === 'Trending'
                              ? '#d97706'
                              : 'var(--primary)',
                          border: 'none',
                        }}
                      >
                        {prod.demand_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: STOREFRONT SIMULATOR (QUICK TEST ACTIONS)
          ========================================================================= */}
      {activeTab === 'simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Interactive Marketplace Storefront Simulator
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Click "+ Add to Cart" or "♡ Wishlist" on any product below to simulate live customer shopping. The carts and wishlist tables above will immediately update!
              </p>
            </div>
            <button
              type="button"
              className="pm-btn pm-btn-secondary"
              onClick={fetchSimulatorCatalog}
            >
              <RefreshCw size={13} className={simLoading ? 'spin-anim' : ''} />
              <span>Refresh Catalog</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {catalogProducts.map((prod) => {
              const firstImg = Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : null;
              const hasDiscount = prod.discount_price && Number(prod.discount_price) < Number(prod.price);

              return (
                <div
                  key={prod.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <div style={{ width: '100%', height: '140px', background: 'var(--bg-subtle)', position: 'relative' }}>
                    <img
                      src={getProductImageUrl(firstImg) || PLACEHOLDER_IMG}
                      alt={prod.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = PLACEHOLDER_IMG;
                      }}
                    />
                    {hasDiscount && prod.discount_percent && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: '#d97706',
                          color: '#fff',
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {prod.discount_percent}% OFF
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      SKU: {prod.sku} • {prod.vendor?.store_name || 'Store'}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#059669' }}>
                          ₹{Number(prod.discount_price || prod.price).toLocaleString()}
                        </span>
                        {hasDiscount && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            ₹{Number(prod.price).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button
                          type="button"
                          className="pm-btn pm-btn-primary"
                          style={{ padding: '6px 8px', fontSize: '0.76rem', justifyContent: 'center' }}
                          disabled={actionLoadingId === `cart-${prod.id}`}
                          onClick={() => handleSimAddToCart(prod)}
                        >
                          <ShoppingCart size={13} />
                          <span>{actionLoadingId === `cart-${prod.id}` ? 'Adding...' : '+ Cart'}</span>
                        </button>

                        <button
                          type="button"
                          className="pm-btn pm-btn-secondary"
                          style={{ padding: '6px 8px', fontSize: '0.76rem', justifyContent: 'center', borderColor: '#ec4899', color: '#db2777' }}
                          disabled={actionLoadingId === `wish-${prod.id}`}
                          onClick={() => handleSimAddToWishlist(prod)}
                        >
                          <Heart size={13} />
                          <span>{actionLoadingId === `wish-${prod.id}` ? 'Saving...' : 'Wishlist'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: INSPECT CUSTOMER CART ITEMS DETAILS
          ========================================================================= */}
      {inspectModalOpen && selectedCart && (
        <div className="admin-modal-backdrop" onClick={() => setInspectModalOpen(false)}>
          <div className="pm-modal-box" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart size={22} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  Customer Cart Breakdown
                </h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setInspectModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="pm-modal-scroll">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'var(--bg-subtle)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {selectedCart.customer?.name}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {selectedCart.customer?.email} • {selectedCart.customer?.phone || 'No phone'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#059669' }}>
                    ₹{Number(selectedCart.total_price).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {selectedCart.total_items} items total
                  </div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>
                  Cart Line Items ({selectedCart.items.length})
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedCart.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={getProductImageUrl(item.image) || PLACEHOLDER_IMG}
                          alt={item.name}
                          style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_IMG;
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            SKU: {item.sku} • Store: {item.vendor_name}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          ₹{Number(item.item_total).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {item.quantity} × ₹{Number(item.unit_price).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pm-modal-foot">
              <button
                type="button"
                className="pm-btn pm-btn-secondary"
                onClick={() => setInspectModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartWishlistManager;
