import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Store,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserCheck,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Percent,
  Sliders,
  ChevronRight,
  Shield,
  Activity,
  Server,
  Database,
  ArrowUpRight,
  Plus,
  Check,
  X,
  Eye,
  Edit3,
  Package,
  Box,
  ShoppingCart,
  Heart,
} from 'lucide-react';
import { adminVendorApi, adminProductApi, categoryApi, systemApi } from '../services/api';
import { CategoryManager } from './CategoryManager';
import { ProductManager } from './ProductManager';
import { CartWishlistManager } from './CartWishlistManager';
import '../admin.css';

export const AdminPanel = ({ user, onToast, onNavigateToCategories, initialTab = 'overview' }) => {
  const [activeAdminTab, setActiveAdminTab] = useState(initialTab); // 'overview' | 'vendors' | 'products' | 'categories' | 'carts' | 'api-tools'

  // Vendors state
  const [vendors, setVendors] = useState([]);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [vendorFilterStatus, setVendorFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected' | 'suspended'
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorPagination, setVendorPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  // Selected vendor modal for approval/rejection
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject' | 'suspend' | 'view'
  const [commissionRate, setCommissionRate] = useState(10);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Categories stats
  const [categoryStats, setCategoryStats] = useState({ total: 0, active: 0, subcategories: 0 });

  // Products stats
  const [productStats, setProductStats] = useState({ total: 0, pending: 0, approved: 0 });

  // System & API test state
  const [apiTesting, setApiTesting] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [activeEndpoint, setActiveEndpoint] = useState('');

  // Fetch Vendors
  const fetchVendors = async () => {
    try {
      setVendorLoading(true);
      const params = {};
      if (vendorFilterStatus !== 'all') {
        params.status = vendorFilterStatus;
      }
      if (vendorSearch.trim()) {
        params.search = vendorSearch.trim();
      }
      const res = await adminVendorApi.getVendors(params);
      if (res?.data) {
        setVendors(res.data.vendors || []);
        if (res.data.pagination) {
          setVendorPagination(res.data.pagination);
        }
      }
    } catch (err) {
      onToast?.(err.message || 'Failed to fetch vendor records', 'error');
    } finally {
      setVendorLoading(false);
    }
  };

  // Fetch Category Stats
  const fetchCategoryStats = async () => {
    try {
      const res = await categoryApi.adminGetCategories();
      if (res?.data) {
        const total = res.data.length;
        const active = res.data.filter((c) => c.status === 'active').length;
        const subcategories = res.data.reduce(
          (acc, c) => acc + (c.subcategories ? c.subcategories.length : 0),
          0
        );
        setCategoryStats({ total, active, subcategories });
      }
    } catch (e) {
      // fallback
    }
  };

  // Fetch Product Stats
  const fetchProductStats = async () => {
    try {
      const res = await adminProductApi.getProducts({ limit: 100 });
      if (res?.data) {
        const total = res.data.pagination?.total || (res.data.products?.length || 0);
        const pending = (res.data.products || []).filter((p) => p.approval_status === 'pending').length;
        const approved = (res.data.products || []).filter((p) => p.approval_status === 'approved').length;
        setProductStats({ total, pending, approved });
      }
    } catch (e) {
      // fallback
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchCategoryStats();
    fetchProductStats();
  }, [vendorFilterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVendors();
  };

  // Open Approval / Rejection Modal
  const openActionModal = (vendor, type) => {
    setSelectedVendor(vendor);
    setActionType(type);
    setCommissionRate(vendor.commission_rate ?? 10);
    setRejectionReason(vendor.rejection_reason || '');
    setActionError('');
  };

  const closeActionModal = () => {
    setSelectedVendor(null);
    setActionError('');
  };

  // Submit Vendor Approval / Rejection
  const handleVendorActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;

    if (actionType === 'reject' && (!rejectionReason || !rejectionReason.trim())) {
      setActionError('A valid rejection reason is required to notify the applicant.');
      return;
    }

    try {
      setActionSubmitting(true);
      setActionError('');

      let payload = {};
      if (actionType === 'approve') {
        payload = {
          status: 'approved',
          commission_rate: Number(commissionRate),
        };
      } else if (actionType === 'reject') {
        payload = {
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
        };
      } else if (actionType === 'suspend') {
        payload = {
          status: 'suspended',
          rejection_reason: rejectionReason.trim() || 'Account suspended by platform administrator',
        };
      }

      await adminVendorApi.updateVendorStatus(selectedVendor.id, payload);

      onToast?.(
        `Seller "${selectedVendor.store_name}" marked as ${payload.status}!`,
        'success'
      );
      closeActionModal();
      fetchVendors();
    } catch (err) {
      setActionError(err.message || 'Failed to update vendor status');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Test API Endpoints
  const testApi = async (endpointKey) => {
    try {
      setApiTesting(true);
      setActiveEndpoint(endpointKey);
      setApiResult(null);

      let result;
      if (endpointKey === 'health') {
        result = await systemApi.checkHealth();
      } else if (endpointKey === 'vendors') {
        result = await adminVendorApi.getVendors({ limit: 3 });
      } else if (endpointKey === 'products') {
        result = await adminProductApi.getProducts({ limit: 3 });
      } else if (endpointKey === 'categories') {
        result = await categoryApi.adminGetCategories();
      } else if (endpointKey === 'root') {
        result = await systemApi.getRoot();
      }

      setApiResult({
        timestamp: new Date().toLocaleTimeString(),
        status: 200,
        data: result,
      });
      onToast?.(`API endpoint "${endpointKey}" responded successfully!`, 'success');
    } catch (err) {
      setApiResult({
        timestamp: new Date().toLocaleTimeString(),
        status: err.status || 500,
        error: err.message,
      });
      onToast?.(`API Error: ${err.message}`, 'error');
    } finally {
      setApiTesting(false);
    }
  };

  // Quick stats
  const pendingVendors = vendors.filter((v) => v.status === 'pending');
  const approvedVendors = vendors.filter((v) => v.status === 'approved');
  const rejectedVendors = vendors.filter((v) => v.status === 'rejected');
  const avgCommission = vendors.length
    ? (
        vendors.reduce((acc, v) => acc + Number(v.commission_rate || 0), 0) /
        vendors.length
      ).toFixed(1)
    : 10;

  return (
    <div className="admin-panel-container">
      {/* 1. EXECUTIVE COMMAND HEADER */}
      <div className="admin-command-hero">
        <div className="admin-hero-left">
          <div className="admin-crown-badge">
            <Shield size={16} className="admin-shield-icon" />
            <span>Super Administrator Console</span>
            <span className="admin-live-pulse-badge">
              <span className="admin-pulse-dot"></span>
              Live Gateway
            </span>
          </div>
          <h1 className="admin-hero-title">Multivendor Marketplace Control Center</h1>
          <p className="admin-hero-subtitle">
            Oversee seller merchant onboarding, approval workflows, store commission rules, and comprehensive product taxonomy.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              fetchVendors();
              fetchCategoryStats();
              fetchProductStats();
              onToast?.('Refreshing marketplace metrics...', 'info');
            }}
          >
            <RefreshCw size={15} className={vendorLoading ? 'spin-anim' : ''} />
            <span>Sync Live Data</span>
          </button>

          <a
            href="http://localhost:5000/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn admin-btn-swagger"
          >
            <BookOpen size={15} />
            <span>OpenAPI Docs</span>
            <ExternalLink size={13} style={{ opacity: 0.7 }} />
          </a>
        </div>
      </div>

      {/* 2. TOP LEVEL ADMIN NAVIGATION TABS */}
      <div className="admin-nav-bar">
        <button
          type="button"
          className={`admin-nav-tab ${activeAdminTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('overview')}
        >
          <Activity size={17} />
          <span>Platform Overview</span>
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeAdminTab === 'vendors' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('vendors')}
        >
          <Store size={17} />
          <span>Seller & Vendor Approvals</span>
          {pendingVendors.length > 0 && (
            <span className="admin-badge-count">{pendingVendors.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeAdminTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('products')}
        >
          <Package size={17} />
          <span>Products & Moderation</span>
          {productStats.pending > 0 ? (
            <span className="admin-badge-count pulse">{productStats.pending}</span>
          ) : productStats.total > 0 ? (
            <span className="admin-badge-count-subtle">{productStats.total}</span>
          ) : null}
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeAdminTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('categories')}
        >
          <Layers size={17} />
          <span>Categories & Taxonomy</span>
          <span className="admin-badge-count-subtle">{categoryStats.total}</span>
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeAdminTab === 'carts' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('carts')}
        >
          <ShoppingCart size={17} />
          <span>Carts & Wishlists</span>
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeAdminTab === 'api-tools' ? 'active' : ''}`}
          onClick={() => setActiveAdminTab('api-tools')}
        >
          <Server size={17} />
          <span>API & Architecture</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: PLATFORM OVERVIEW & METRICS
          ========================================================================= */}
      {activeAdminTab === 'overview' && (
        <div className="admin-view-fade">
          {/* 4 Rich KPI Metric Cards */}
          <div className="admin-kpi-grid">
            <div
              className="admin-kpi-card glow-indigo"
              onClick={() => setActiveAdminTab('vendors')}
              style={{ cursor: 'pointer' }}
            >
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">Marketplace Sellers</span>
                <div className="admin-kpi-icon bg-indigo">
                  <Store size={20} />
                </div>
              </div>
              <div className="admin-kpi-main">
                <span className="admin-kpi-value">{vendors.length}</span>
                <span className="admin-kpi-pill success">
                  <UserCheck size={12} />
                  <span>{approvedVendors.length} Approved</span>
                </span>
              </div>
              <div className="admin-kpi-footer">
                {pendingVendors.length > 0 ? (
                  <span className="admin-kpi-alert-text">
                    ⚠️ {pendingVendors.length} pending seller review
                  </span>
                ) : (
                  <span className="admin-kpi-muted-text">All seller applications reviewed</span>
                )}
              </div>
            </div>

            <div
              className="admin-kpi-card glow-emerald"
              onClick={() => setActiveAdminTab('categories')}
              style={{ cursor: 'pointer' }}
            >
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">Catalog Taxonomy</span>
                <div className="admin-kpi-icon bg-emerald">
                  <Layers size={20} />
                </div>
              </div>
              <div className="admin-kpi-main">
                <span className="admin-kpi-value">{categoryStats.total}</span>
                <span className="admin-kpi-pill info">
                  <span>{categoryStats.subcategories} Subcategories</span>
                </span>
              </div>
              <div className="admin-kpi-footer">
                <span className="admin-kpi-muted-text">
                  {categoryStats.active} Active catalogs visible to buyers
                </span>
              </div>
            </div>

            <div
              className="admin-kpi-card glow-indigo"
              onClick={() => setActiveAdminTab('products')}
              style={{ cursor: 'pointer' }}
            >
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">Products & Inventory</span>
                <div className="admin-kpi-icon bg-indigo" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                  <Package size={20} />
                </div>
              </div>
              <div className="admin-kpi-main">
                <span className="admin-kpi-value">{productStats.total}</span>
                {productStats.pending > 0 ? (
                  <span className="admin-kpi-pill warning">
                    <span>{productStats.pending} Pending Review</span>
                  </span>
                ) : (
                  <span className="admin-kpi-pill success">
                    <span>{productStats.approved} Live</span>
                  </span>
                )}
              </div>
              <div className="admin-kpi-footer">
                <span className="admin-kpi-muted-text">
                  Marketplace catalog & moderation queue
                </span>
              </div>
            </div>

            <div
              className="admin-kpi-card glow-amber"
              onClick={() => {
                setVendorFilterStatus('pending');
                setActiveAdminTab('vendors');
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">Pending Approvals</span>
                <div className="admin-kpi-icon bg-amber">
                  <Clock size={20} />
                </div>
              </div>
              <div className="admin-kpi-main">
                <span className="admin-kpi-value">{pendingVendors.length}</span>
                {pendingVendors.length > 0 ? (
                  <span className="admin-kpi-pill warning">Requires Review</span>
                ) : (
                  <span className="admin-kpi-pill success">Clean Queue</span>
                )}
              </div>
              <div className="admin-kpi-footer">
                <span className="admin-kpi-muted-text">
                  Direct seller onboarding queue
                </span>
              </div>
            </div>

            <div className="admin-kpi-card glow-cyan">
              <div className="admin-kpi-header">
                <span className="admin-kpi-title">Avg. Platform Fee</span>
                <div className="admin-kpi-icon bg-cyan">
                  <Percent size={20} />
                </div>
              </div>
              <div className="admin-kpi-main">
                <span className="admin-kpi-value">{avgCommission}%</span>
                <span className="admin-kpi-pill accent">Customizable</span>
              </div>
              <div className="admin-kpi-footer">
                <span className="admin-kpi-muted-text">
                  Configured on vendor approval
                </span>
              </div>
            </div>
          </div>

          {/* Pending Applications Urgent Callout */}
          {pendingVendors.length > 0 && (
            <div className="admin-urgent-banner">
              <div className="admin-urgent-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="admin-urgent-text">
                <h3>{pendingVendors.length} Seller Application(s) Awaiting Review</h3>
                <p>
                  New sellers have submitted their store profile, contact information, and business credentials. Approve them with custom commissions or reject with structured reasons.
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-urgent"
                onClick={() => {
                  setVendorFilterStatus('pending');
                  setActiveAdminTab('vendors');
                }}
              >
                <span>Review Pending Queue</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Quick Operations 2-Column Split */}
          <div className="admin-dual-grid">
            {/* Left: Recent Seller Applications Stream */}
            <div className="admin-card-panel">
              <div className="admin-panel-head">
                <div>
                  <h3 className="admin-panel-title">Recent Seller Registrations</h3>
                  <p className="admin-panel-subtitle">Latest marketplace store accounts</p>
                </div>
                <button
                  type="button"
                  className="admin-panel-link"
                  onClick={() => setActiveAdminTab('vendors')}
                >
                  <span>View All Sellers</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {vendors.length === 0 ? (
                <div className="admin-empty-state">
                  <Store size={36} />
                  <p>No seller records found yet</p>
                </div>
              ) : (
                <div className="admin-stream-list">
                  {vendors.slice(0, 5).map((vendor) => (
                    <div key={vendor.id} className="admin-stream-row">
                      <div className="admin-store-avatar">
                        {vendor.logo_url ? (
                          <img src={vendor.logo_url} alt={vendor.store_name} />
                        ) : (
                          <span>{vendor.store_name?.charAt(0) || 'S'}</span>
                        )}
                      </div>
                      <div className="admin-stream-info">
                        <div className="admin-stream-name-row">
                          <span className="admin-stream-store">{vendor.store_name}</span>
                          <span className={`admin-status-tag ${vendor.status}`}>
                            {vendor.status}
                          </span>
                        </div>
                        <div className="admin-stream-meta">
                          <span>Owner: {vendor.user?.name || 'Seller'}</span>
                          <span>•</span>
                          <span>Fee: {vendor.commission_rate ?? 10}%</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="admin-btn-table-action"
                        onClick={() => openActionModal(vendor, 'view')}
                        title="Inspect Store"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: System Architecture & Infrastructure Health */}
            <div className="admin-card-panel">
              <div className="admin-panel-head">
                <div>
                  <h3 className="admin-panel-title">Backend Architecture</h3>
                  <p className="admin-panel-subtitle">Core engine runtime and security parameters</p>
                </div>
                <span className="admin-status-tag active">Operational</span>
              </div>

              <div className="admin-infra-list">
                <div className="admin-infra-item">
                  <div className="admin-infra-icon">
                    <Database size={18} color="#0284c7" />
                  </div>
                  <div className="admin-infra-details">
                    <span className="admin-infra-label">Relational Database Engine</span>
                    <span className="admin-infra-val">MySQL 10.4 / MariaDB via Sequelize ORM</span>
                  </div>
                  <span className="admin-tag-pill green">Connected</span>
                </div>

                <div className="admin-infra-item">
                  <div className="admin-infra-icon">
                    <Server size={18} color="#4f46e5" />
                  </div>
                  <div className="admin-infra-details">
                    <span className="admin-infra-label">Express.js API Server</span>
                    <span className="admin-infra-val">Port 5000 (Vite Proxy enabled on 3000)</span>
                  </div>
                  <span className="admin-tag-pill green">Active</span>
                </div>

                <div className="admin-infra-item">
                  <div className="admin-infra-icon">
                    <Shield size={18} color="#10b981" />
                  </div>
                  <div className="admin-infra-details">
                    <span className="admin-infra-label">JWT Token Rotation & Auth</span>
                    <span className="admin-infra-val">Dual Tokens with Cryptographic Reuse Detection</span>
                  </div>
                  <span className="admin-tag-pill indigo">Secured</span>
                </div>

                <div className="admin-infra-item">
                  <div className="admin-infra-icon">
                    <Layers size={18} color="#f59e0b" />
                  </div>
                  <div className="admin-infra-details">
                    <span className="admin-infra-label">API Documentation Spec</span>
                    <span className="admin-infra-val">OpenAPI 3.0 / Swagger UI Embedded</span>
                  </div>
                  <a
                    href="http://localhost:5000/api-docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-tag-pill link"
                  >
                    /api-docs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: VENDOR & SELLER APPROVAL WORKFLOW
          ========================================================================= */}
      {activeAdminTab === 'vendors' && (
        <div className="admin-view-fade">
          {/* Vendor Filter and Search Bar */}
          <div className="admin-filter-bar">
            <div className="admin-filter-pills">
              <button
                type="button"
                className={`admin-filter-pill ${vendorFilterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setVendorFilterStatus('all')}
              >
                <span>All Sellers</span>
                <span className="pill-count">{vendors.length}</span>
              </button>

              <button
                type="button"
                className={`admin-filter-pill pending ${vendorFilterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setVendorFilterStatus('pending')}
              >
                <Clock size={13} />
                <span>Pending Approvals</span>
                {pendingVendors.length > 0 && (
                  <span className="pill-count pulse">{pendingVendors.length}</span>
                )}
              </button>

              <button
                type="button"
                className={`admin-filter-pill approved ${vendorFilterStatus === 'approved' ? 'active' : ''}`}
                onClick={() => setVendorFilterStatus('approved')}
              >
                <CheckCircle2 size={13} />
                <span>Approved</span>
                <span className="pill-count">{approvedVendors.length}</span>
              </button>

              <button
                type="button"
                className={`admin-filter-pill rejected ${vendorFilterStatus === 'rejected' ? 'active' : ''}`}
                onClick={() => setVendorFilterStatus('rejected')}
              >
                <XCircle size={13} />
                <span>Rejected</span>
                <span className="pill-count">{rejectedVendors.length}</span>
              </button>

              <button
                type="button"
                className={`admin-filter-pill suspended ${vendorFilterStatus === 'suspended' ? 'active' : ''}`}
                onClick={() => setVendorFilterStatus('suspended')}
              >
                <span>Suspended</span>
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="admin-search-form">
              <Search size={16} className="admin-search-icon" />
              <input
                type="text"
                placeholder="Search store name, email, or seller..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                className="admin-search-field"
              />
              {vendorSearch && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => {
                    setVendorSearch('');
                    fetchVendors();
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </form>
          </div>

          {/* Vendor Table / Card Grid */}
          <div className="admin-table-wrapper">
            {vendorLoading ? (
              <div className="admin-table-loading">
                <RefreshCw size={28} className="spin-anim" />
                <p>Loading marketplace merchants...</p>
              </div>
            ) : vendors.length === 0 ? (
              <div className="admin-empty-table">
                <Store size={44} />
                <h3>No sellers found</h3>
                <p>No seller accounts match your current filter selection.</p>
                {vendorFilterStatus !== 'all' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setVendorFilterStatus('all')}
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Store / Brand</th>
                    <th>Merchant Owner</th>
                    <th>Contact & Location</th>
                    <th>Commission Rate</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                    <th style={{ textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="admin-table-row">
                      {/* Store Details */}
                      <td>
                        <div className="admin-td-store">
                          <div className="admin-td-logo">
                            {vendor.logo_url ? (
                              <img src={vendor.logo_url} alt={vendor.store_name} />
                            ) : (
                              <span>{vendor.store_name?.charAt(0) || 'S'}</span>
                            )}
                          </div>
                          <div>
                            <span className="admin-td-store-name">{vendor.store_name}</span>
                            <span className="admin-td-slug">/{vendor.store_slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* Merchant Owner */}
                      <td>
                        <div className="admin-td-owner">
                          <span className="admin-td-owner-name">
                            {vendor.user?.name || 'Applicant'}
                          </span>
                          <span className="admin-td-owner-email">
                            {vendor.user?.email || vendor.store_email || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Contact & Location */}
                      <td>
                        <div className="admin-td-contact">
                          <span className="admin-contact-item">
                            <Phone size={12} />
                            <span>{vendor.store_phone || vendor.user?.phone || 'No phone'}</span>
                          </span>
                          <span className="admin-contact-item">
                            <MapPin size={12} />
                            <span>{vendor.city ? `${vendor.city}, ${vendor.state || ''}` : 'India'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Commission */}
                      <td>
                        <div className="admin-commission-pill">
                          <Percent size={13} />
                          <span>{vendor.commission_rate ?? 10}%</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`admin-status-tag ${vendor.status}`}>
                          {vendor.status === 'pending' && <Clock size={11} />}
                          {vendor.status === 'approved' && <CheckCircle2 size={11} />}
                          {vendor.status === 'rejected' && <XCircle size={11} />}
                          <span>{vendor.status}</span>
                        </span>
                      </td>

                      {/* Applied Date */}
                      <td>
                        <span className="admin-date-text">
                          {vendor.created_at
                            ? new Date(vendor.created_at).toLocaleDateString()
                            : 'Recently'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-actions-group">
                          {vendor.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                className="admin-action-btn approve"
                                onClick={() => openActionModal(vendor, 'approve')}
                                title="Approve Seller"
                              >
                                <Check size={14} />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                className="admin-action-btn reject"
                                onClick={() => openActionModal(vendor, 'reject')}
                                title="Reject Application"
                              >
                                <X size={14} />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="admin-action-btn edit"
                                onClick={() => openActionModal(vendor, 'approve')}
                                title="Adjust Commission / Details"
                              >
                                <Edit3 size={13} />
                                <span>Edit Rate</span>
                              </button>
                              {vendor.status === 'approved' && (
                                <button
                                  type="button"
                                  className="admin-action-btn suspend"
                                  onClick={() => openActionModal(vendor, 'suspend')}
                                  title="Suspend Vendor"
                                >
                                  <span>Suspend</span>
                                </button>
                              )}
                              {vendor.status === 'suspended' && (
                                <button
                                  type="button"
                                  className="admin-action-btn approve"
                                  onClick={() => openActionModal(vendor, 'approve')}
                                  title="Reactivate Vendor"
                                >
                                  <span>Reactivate</span>
                                </button>
                              )}
                            </>
                          )}
                          <button
                            type="button"
                            className="admin-action-btn view"
                            onClick={() => openActionModal(vendor, 'view')}
                            title="Inspect Details"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PRODUCTS & MODERATION CATALOG
          ========================================================================= */}
      {activeAdminTab === 'products' && (
        <div className="admin-view-fade">
          <ProductManager user={user} onToast={onToast} isAdminMode={true} />
        </div>
      )}

      {/* =========================================================================
          TAB 4: CATEGORIES & TAXONOMY CATALOG
          ========================================================================= */}
      {activeAdminTab === 'categories' && (
        <div className="admin-view-fade">
          <div className="admin-category-embed">
            <CategoryManager user={user} onToast={onToast} />
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: CARTS & WISHLISTS INTELLIGENCE
          ========================================================================= */}
      {activeAdminTab === 'carts' && (
        <div className="admin-view-fade">
          <CartWishlistManager user={user} onToast={onToast} />
        </div>
      )}

      {/* =========================================================================
          TAB 6: API & DEV CONSOLE
          ========================================================================= */}
      {activeAdminTab === 'api-tools' && (
        <div className="admin-view-fade">
          <div className="admin-dev-grid">
            <div className="admin-card-panel">
              <h3 className="admin-panel-title">Interactive Live API Verifier</h3>
              <p className="admin-panel-subtitle">
                Test protected and public backend routes directly with the current Admin session token.
              </p>

              <div className="admin-api-buttons-grid">
                <button
                  type="button"
                  className="admin-api-call-btn"
                  onClick={() => testApi('health')}
                  disabled={apiTesting}
                >
                  <span className="method get">GET</span>
                  <span className="route">/api/health</span>
                </button>

                <button
                  type="button"
                  className="admin-api-call-btn"
                  onClick={() => testApi('root')}
                  disabled={apiTesting}
                >
                  <span className="method get">GET</span>
                  <span className="route">/</span>
                </button>

                <button
                  type="button"
                  className="admin-api-call-btn"
                  onClick={() => testApi('vendors')}
                  disabled={apiTesting}
                >
                  <span className="method get">GET</span>
                  <span className="route">/api/v1/admin/vendors</span>
                  <span className="auth-pill">Admin</span>
                </button>

                <button
                  type="button"
                  className="admin-api-call-btn"
                  onClick={() => testApi('products')}
                  disabled={apiTesting}
                >
                  <span className="method get">GET</span>
                  <span className="route">/api/v1/admin/products</span>
                  <span className="auth-pill">Admin</span>
                </button>

                <button
                  type="button"
                  className="admin-api-call-btn"
                  onClick={() => testApi('categories')}
                  disabled={apiTesting}
                >
                  <span className="method get">GET</span>
                  <span className="route">/api/v1/admin/categories</span>
                  <span className="auth-pill">Admin</span>
                </button>
              </div>

              <div className="admin-api-spec-callout">
                <div className="callout-content">
                  <h4>Looking for full documentation & schema definitions?</h4>
                  <p>Swagger OpenAPI UI offers interactive testing, authorization headers, and sample payloads.</p>
                </div>
                <a
                  href="http://localhost:5000/api-docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn-swagger"
                >
                  <BookOpen size={16} />
                  <span>Launch Swagger UI</span>
                </a>
              </div>
            </div>

            {/* Live Output Terminal */}
            <div className="admin-card-panel terminal-panel">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <span className="terminal-title">
                  {activeEndpoint ? `Response: /${activeEndpoint}` : 'API Output Terminal'}
                </span>
                {apiResult && (
                  <span className={`terminal-status-code status-${apiResult.status}`}>
                    {apiResult.status} OK
                  </span>
                )}
              </div>

              <div className="terminal-body">
                {apiTesting ? (
                  <div className="terminal-loading">
                    <RefreshCw size={24} className="spin-anim" />
                    <span>Executing live HTTP call...</span>
                  </div>
                ) : apiResult ? (
                  <pre className="terminal-code">
                    {JSON.stringify(apiResult.data || apiResult.error, null, 2)}
                  </pre>
                ) : (
                  <div className="terminal-placeholder">
                    <span>Click any API endpoint on the left to inspect live backend response JSON</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VENDOR ACTION (APPROVE / REJECT / SUSPEND / VIEW)
          ========================================================================= */}
      {selectedVendor && (
        <div className="admin-modal-backdrop" onClick={closeActionModal}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="modal-title-wrap">
                <Store size={22} className="modal-store-icon" />
                <div>
                  <h3 className="modal-title">
                    {actionType === 'approve' && 'Approve Seller & Set Commission'}
                    {actionType === 'reject' && 'Reject Seller Application'}
                    {actionType === 'suspend' && 'Suspend Seller Account'}
                    {actionType === 'view' && 'Seller Application Details'}
                  </h3>
                  <span className="modal-subtitle">{selectedVendor.store_name} ({selectedVendor.store_slug})</span>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={closeActionModal}
              >
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div className="admin-modal-error">
                <AlertTriangle size={16} />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleVendorActionSubmit} className="admin-modal-body">
              {/* Store summary card */}
              <div className="modal-seller-summary">
                <div className="summary-item">
                  <span className="summary-lbl">Merchant Owner</span>
                  <span className="summary-val">{selectedVendor.user?.name || 'Applicant'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Store Email</span>
                  <span className="summary-val">{selectedVendor.store_email || selectedVendor.user?.email || '—'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Phone Number</span>
                  <span className="summary-val">{selectedVendor.store_phone || selectedVendor.user?.phone || '—'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-lbl">Tax ID / GSTIN</span>
                  <span className="summary-val">{selectedVendor.tax_id || 'Not specified'}</span>
                </div>
              </div>

              {selectedVendor.description && (
                <div className="modal-seller-desc">
                  <span className="desc-lbl">Business Description:</span>
                  <p>{selectedVendor.description}</p>
                </div>
              )}

              {/* ACTION TYPE: APPROVE */}
              {actionType === 'approve' && (
                <div className="modal-action-fields">
                  <div className="form-group">
                    <label className="form-label">
                      <span>Marketplace Commission Rate (%)</span>
                      <span className="label-hint">Default is 10%</span>
                    </label>
                    <div className="input-with-icon">
                      <Percent size={16} className="input-icon" />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        className="modal-input"
                        required
                      />
                    </div>
                  </div>
                  <p className="modal-notice-text">
                    ✅ Upon approval, the seller's store will become immediately active on the marketplace and they will receive full seller dashboard access.
                  </p>
                </div>
              )}

              {/* ACTION TYPE: REJECT */}
              {actionType === 'reject' && (
                <div className="modal-action-fields">
                  <div className="form-group">
                    <label className="form-label">
                      <span>Rejection Reason</span>
                      <span className="label-required">* Required</span>
                    </label>
                    <textarea
                      rows="3"
                      placeholder="e.g. Incomplete business address, missing tax registration details, or invalid phone verification."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="modal-textarea"
                      required
                    ></textarea>
                  </div>
                  <p className="modal-notice-text error">
                    ⚠️ The applicant will be able to see this reason when checking their application status.
                  </p>
                </div>
              )}

              {/* ACTION TYPE: SUSPEND */}
              {actionType === 'suspend' && (
                <div className="modal-action-fields">
                  <div className="form-group">
                    <label className="form-label">Suspension Reason</label>
                    <textarea
                      rows="3"
                      placeholder="Reason for suspending this vendor account..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="modal-textarea"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* ACTION TYPE: VIEW ONLY */}
              {actionType === 'view' && selectedVendor.rejection_reason && (
                <div className="modal-rejection-history">
                  <span className="history-lbl">Past Rejection Reason:</span>
                  <p>{selectedVendor.rejection_reason}</p>
                </div>
              )}

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={closeActionModal}
                >
                  Cancel
                </button>

                {actionType === 'approve' && (
                  <button
                    type="submit"
                    className="admin-btn admin-btn-approve-submit"
                    disabled={actionSubmitting}
                  >
                    <Check size={16} />
                    <span>{actionSubmitting ? 'Approving...' : 'Confirm Approval'}</span>
                  </button>
                )}

                {actionType === 'reject' && (
                  <button
                    type="submit"
                    className="admin-btn admin-btn-reject-submit"
                    disabled={actionSubmitting}
                  >
                    <X size={16} />
                    <span>{actionSubmitting ? 'Rejecting...' : 'Confirm Rejection'}</span>
                  </button>
                )}

                {actionType === 'suspend' && (
                  <button
                    type="submit"
                    className="admin-btn admin-btn-suspend-submit"
                    disabled={actionSubmitting}
                  >
                    <span>{actionSubmitting ? 'Suspending...' : 'Confirm Suspension'}</span>
                  </button>
                )}

                {actionType === 'view' && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={() => setActionType('approve')}
                  >
                    <span>Manage Status</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
