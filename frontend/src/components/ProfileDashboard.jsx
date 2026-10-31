import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  RefreshCw,
  LogOut,
  CheckCircle,
  Code,
  Edit2,
  Lock,
  MapPin,
  Terminal,
  ExternalLink,
  X,
  Check,
  LayoutDashboard,
  ShoppingBag,
  Sun,
  Moon,
  Search,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Star,
  Plus,
  FolderTree,
  Layers,
  Package,
  Store,
  Server,
  ShoppingCart,
  Heart,
  Menu,
  Ticket,
  CreditCard,
  ArrowLeftRight,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Clock,
  HelpCircle,
  Tag,
  Users,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { userApi, addressApi, adminProductApi, categoryApi, settingApi } from '../services/api';
import { AddressManager } from './AddressManager';
import { CategoryManager } from './CategoryManager';
import { ProductManager } from './ProductManager';
import { VendorManager } from './VendorManager';
import { AdminOverview } from './AdminOverview';
import { CartWishlistManager } from './CartWishlistManager';
import { CouponManager } from './CouponManager';
import { ReviewRatingManager } from './ReviewRatingManager';
import { VendorDashboard } from './VendorDashboard';
import { BannerBrandingManager } from './BannerBrandingManager';
import { FinancialManager } from './FinancialManager';
import { ImageUploadInput } from './ImageUploadInput';
import { ReportsManager } from './ReportsManager';
import { HeaderMenuManager } from './HeaderMenuManager';

export const ProfileDashboard = ({
  user,
  onLogout,
  onRefreshSession,
  onUpdateUser,
  onToast,
  theme,
  onToggleTheme,
  onNavigateToStore,
}) => {
  const isAdmin = user?.role === 'admin';
  const isVendor = user?.role === 'vendor';
  const [activeTab, setActiveTab] = useState(() => (isAdmin ? 'admin-overview' : isVendor ? 'vendor-dashboard' : 'profile'));
  const [branding, setBranding] = useState(null);
  const [brandLogoFailed, setBrandLogoFailed] = useState(false);

  // Reset scroll to top whenever tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
    const bodyEl = document.querySelector('.dashboard-body');
    if (bodyEl) bodyEl.scrollTop = 0;
  }, [activeTab]);

  // Fetch dynamic branding
  useEffect(() => {
    settingApi
      .getBranding()
      .then((res) => {
        if (res?.data) {
          setBranding(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Edit Profile State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  // Change Password State
  const [passForm, setPassForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passSaving, setPassSaving] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // API Verification State
  const [apiResponse, setApiResponse] = useState(null);
  const [testingEndpoint, setTestingEndpoint] = useState('');
  const [rotating, setRotating] = useState(false);

  // Address Summary State
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  const fetchAddressesSummary = async () => {
    try {
      setAddressLoading(true);
      const res = await addressApi.getAddresses();
      if (res?.data) {
        setAddresses(res.data);
      }
    } catch (e) {
      // silent fallback
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    fetchAddressesSummary();
  }, []);

  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSaving(true);
    try {
      const res = await userApi.updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim() || null,
        avatar_url: profileForm.avatar_url.trim() || null,
      });
      if (res?.data) {
        onUpdateUser?.(res.data);
        setEditingProfile(false);
        onToast?.('Profile updated successfully!', 'success');
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (passForm.new_password !== passForm.confirm_password) {
      setPassError('New passwords do not match');
      return;
    }
    if (passForm.new_password.length < 8) {
      setPassError('New password must be at least 8 characters long');
      return;
    }

    setPassSaving(true);
    try {
      await userApi.changePassword({
        current_password: passForm.current_password,
        new_password: passForm.new_password,
      });
      setPassSuccess('Password updated successfully! Active sessions secured.');
      setPassForm({ current_password: '', new_password: '', confirm_password: '' });
      onToast?.('Password changed successfully!', 'success');
    } catch (err) {
      setPassError(err.message || 'Failed to change password');
    } finally {
      setPassSaving(false);
    }
  };

  const handleTestApi = async (endpointType) => {
    setTestingEndpoint(endpointType);
    try {
      let data, endpoint;
      if (endpointType === 'profile') {
        const res = await userApi.getProfile();
        endpoint = 'GET /api/v1/users/profile';
        data = res.data;
      } else if (endpointType === 'addresses') {
        const res = await addressApi.getAddresses();
        endpoint = 'GET /api/v1/addresses';
        data = res.data;
      } else if (endpointType === 'products') {
        const res = await adminProductApi.getProducts({ limit: 5 });
        endpoint = 'GET /api/v1/admin/products';
        data = res.data;
      } else if (endpointType === 'categories') {
        const res = await categoryApi.adminGetCategories();
        endpoint = 'GET /api/v1/admin/categories';
        data = res.data;
      }
      setApiResponse({
        status: '200 OK',
        endpoint,
        payload: data,
      });
      onToast?.(`API ${endpoint} verified!`, 'success');
    } catch (err) {
      setApiResponse({
        status: 'Error',
        endpoint: endpointType,
        payload: { error: err.message },
      });
    } finally {
      setTestingEndpoint('');
    }
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      const res = await onRefreshSession();
      setApiResponse({
        status: '200 OK',
        endpoint: 'POST /api/v1/auth/refresh',
        payload: {
          message: 'Refresh token rotated with reuse protection',
          data: res.data,
        },
      });
      onToast?.('Token session rotated and verified!', 'success');
    } catch (err) {
      onToast?.(`Rotation failed: ${err.message}`, 'error');
    } finally {
      setRotating(false);
    }
  };

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'admin-overview':
        return 'Executive Overview & Analytics';
      case 'reports':
        return 'Marketplace Financial Reports & Analytics';
      case 'vendor-dashboard':
        return 'Vendor Storefront Dashboard';
      case 'banners':
        return 'Promotional Banners & Dynamic Branding';
      case 'payments':
        return 'Payments & Gateway Transactions';
      case 'withdrawals':
        return 'Merchant Withdrawals & Settlements';
      case 'coupons':
        return 'Coupons & Promotional Vouchers';
      case 'reviews':
        return 'Customer Reviews & Ratings Moderation';
      case 'products':
        return 'Products & Inventory Moderation';
      case 'categories':
        return 'Categories & Taxonomy Catalog';
      case 'vendors':
        return 'Merchant Stores & Verification';
      case 'carts':
        return 'Customer Carts & Orders Demand';
      case 'api-tools':
        return 'API & Developer Bench';
      case 'overview':
        return 'Account Overview';
      case 'profile':
        return 'My Profile';
      case 'addresses':
        return 'Delivery Addresses';
      case 'security':
        return 'Security & Sessions';
      default:
        return 'Marketplace Dashboard';
    }
  };

  return (
    <div className="dashboard-app">
      {/* 1. LEFT SIDEBAR MENU (Docked to full left height) */}
      {/* 1. LEFT SIDEBAR MENU */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-top">
          {isAdmin ? (
            /* Bada Vyapaar Super Admin Branding */
            <div className="bv-sidebar-brand">
              <div className="bv-brand-wrapper" onClick={() => setActiveTab('admin-overview')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {branding?.site_logo && !brandLogoFailed ? (
                  <img
                    src={theme === 'dark' && branding?.site_dark_logo ? branding.site_dark_logo : branding.site_logo}
                    alt={branding.site_name || 'Logo'}
                    style={{ maxHeight: '30px', maxWidth: '140px', objectFit: 'contain' }}
                    onError={() => setBrandLogoFailed(true)}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
                      flexShrink: 0
                    }}>
                      <Store size={18} />
                    </div>
                    <span className="bv-brand-logo-text">
                      Bada <span className="bv-brand-vyapaar">Vyapaar</span>
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="bv-top-icon-btn"
                style={{ width: '28px', height: '28px' }}
                title="Sidebar Navigation"
              >
                <Menu size={18} />
              </button>
            </div>
          ) : (
            /* Standard User / Vendor Brand Logo & Title */
            <div className="sidebar-brand" onClick={() => setActiveTab(isVendor ? 'vendor-dashboard' : 'profile')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {branding?.site_logo ? (
                <img
                  src={theme === 'dark' && branding?.site_dark_logo ? branding.site_dark_logo : branding.site_logo}
                  alt={branding.site_name || 'Logo'}
                  style={{ maxHeight: '30px', maxWidth: '140px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="sidebar-brand-icon">
                  <ShoppingBag size={22} />
                </div>
              )}
              <div>
                <span className="sidebar-brand-title">{branding?.site_name || 'Multivendor'}</span>
                <span className="sidebar-brand-sub">{isVendor ? 'Marketplace Portal' : 'User Account'}</span>
              </div>
            </div>
          )}

          {/* Admin Navigation Menu (1:1 from Bada Vyapaar reference) */}
          {isAdmin ? (
            <div className="bv-sidebar-menu">
              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'admin-overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin-overview')}
              >
                <div className="bv-menu-left">
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'vendor-dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('vendor-dashboard')}
                title="Vendor Dashboard Preview"
              >
                <div className="bv-menu-left">
                  <Store size={18} />
                  <span>Vendor Dashboard</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'vendors' ? 'active' : ''}`}
                onClick={() => setActiveTab('vendors')}
              >
                <div className="bv-menu-left">
                  <Store size={18} />
                  <span>Vendors</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <div className="bv-menu-left">
                  <Package size={18} />
                  <span>Products</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'carts' ? 'active' : ''}`}
                onClick={() => setActiveTab('carts')}
              >
                <div className="bv-menu-left">
                  <ShoppingCart size={18} />
                  <span>Orders</span>
                </div>
                <span className="bv-menu-badge">156</span>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <div className="bv-menu-left">
                  <Users size={18} />
                  <span>Customers</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveTab('categories')}
              >
                <div className="bv-menu-left">
                  <Tag size={18} />
                  <span>Categories</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'coupons' ? 'active' : ''}`}
                onClick={() => setActiveTab('coupons')}
              >
                <div className="bv-menu-left">
                  <Ticket size={18} />
                  <span>Coupons</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'payments' ? 'active' : ''}`}
                onClick={() => setActiveTab('payments')}
              >
                <div className="bv-menu-left">
                  <CreditCard size={18} />
                  <span>Payments</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'withdrawals' ? 'active' : ''}`}
                onClick={() => setActiveTab('withdrawals')}
              >
                <div className="bv-menu-left">
                  <ArrowLeftRight size={18} />
                  <span>Withdrawals</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                <div className="bv-menu-left">
                  <Star size={18} />
                  <span>Reviews & Ratings</span>
                </div>
              </button>

              <button
                type="button"
                className="bv-menu-btn"
                onClick={() => onToast?.('Dispute management center active', 'info')}
              >
                <div className="bv-menu-left">
                  <AlertTriangle size={18} />
                  <span>Disputes</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
                title="Marketplace Financial Reports & Analytics"
              >
                <div className="bv-menu-left">
                  <BarChart3 size={18} />
                  <span>Reports</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'banners' ? 'active' : ''}`}
                onClick={() => setActiveTab('banners')}
                title="Promotional Banners & Dynamic Logo Hub"
              >
                <div className="bv-menu-left">
                  <Sparkles size={18} />
                  <span>Banners & Logo</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'header-menus' ? 'active' : ''}`}
                onClick={() => setActiveTab('header-menus')}
                title="Dynamic Header Menus & Navigation Hub"
              >
                <div className="bv-menu-left">
                  <Menu size={18} />
                  <span>Header Menus</span>
                </div>
              </button>

              <button
                type="button"
                className="bv-menu-btn"
                onClick={() => onToast?.('Broadcast notifications queue', 'info')}
              >
                <div className="bv-menu-left">
                  <Bell size={18} />
                  <span>Notifications</span>
                </div>
              </button>

              <button
                type="button"
                className={`bv-menu-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <div className="bv-menu-left">
                  <Settings size={18} />
                  <span>Settings</span>
                </div>
              </button>

              <button
                type="button"
                className="bv-menu-btn"
                onClick={() => onToast?.('Audit & activity logs logged securely', 'info')}
              >
                <div className="bv-menu-left">
                  <Clock size={18} />
                  <span>Activity Logs</span>
                </div>
              </button>
            </div>
          ) : isVendor ? (
            /* Vendor Dedicated Sidebar (1:1 from User Reference Image) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 2px' }}>
              <button
                type="button"
                className={`vd-menu-pill ${activeTab === 'vendor-dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('vendor-dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                className={`vd-menu-pill ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <Package size={18} />
                <span>Products</span>
              </button>

              <button
                type="button"
                className={`vd-menu-pill ${activeTab === 'carts' ? 'active' : ''}`}
                onClick={() => setActiveTab('carts')}
              >
                <ShoppingCart size={18} />
                <span>Orders</span>
              </button>

              <button
                type="button"
                className={`vd-menu-pill ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => setActiveTab('reports')}
                title="Store Sales Analytics & Reports"
              >
                <BarChart3 size={18} />
                <span>Reports & Analytics</span>
              </button>

              <button
                type="button"
                className="vd-menu-pill"
                onClick={() => onToast?.('Merchant Helpdesk: support@multivendor.com', 'info')}
              >
                <HelpCircle size={18} />
                <span>Help and support</span>
              </button>

              <div style={{ height: '1px', background: 'var(--border-color, #e2e8f0)', margin: '8px 6px' }} />

              <button
                type="button"
                className={`vd-menu-pill ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} />
                <span>Profile</span>
              </button>

              <button
                type="button"
                className={`vd-menu-pill ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Settings size={18} />
                <span>Setting</span>
              </button>
            </div>
          ) : (
            /* Customer / Non-Vendor Account Sidebar */
            <>
              <div className="sidebar-section-title">Personal Account</div>
              <div className="sidebar-nav-list">
                <button
                  type="button"
                  className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <User size={18} />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  className={`sidebar-nav-item ${activeTab === 'addresses' ? 'active' : ''}`}
                  onClick={() => setActiveTab('addresses')}
                >
                  <MapPin size={18} />
                  <span>Delivery Addresses</span>
                  {addresses.length > 0 && (
                    <span className="sidebar-nav-badge">{addresses.length}</span>
                  )}
                </button>
              </div>

              <div className="sidebar-section-title">Security & System</div>
              <div className="sidebar-nav-list">
                <button
                  type="button"
                  className={`sidebar-nav-item ${activeTab === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  <ShieldCheck size={18} />
                  <span>Security & Password</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer User Card (Shown for Non-Admin Customers / Vendors) */}
        {!isAdmin && (
          <div className="sidebar-footer">
            <div className="sidebar-user-card">
              {user?.avatar_url && !avatarError ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="sidebar-footer-avatar"
                  style={{ objectFit: 'cover' }}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="sidebar-footer-avatar">{initials}</div>
              )}
              <div className="sidebar-user-details">
                <span className="sidebar-user-fullname">{user?.name || 'User'}</span>
                <span className="sidebar-user-subrole">
                  <span className="online-dot" />
                  {user?.role || 'User'}
                </span>
              </div>
              <button
                type="button"
                className="sidebar-signout-btn"
                onClick={onLogout}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* 2. MAIN DASHBOARD WORKSPACE (Right of Sidebar) */}
      <div className="dashboard-main-area">
        {/* Topbar Navigation Header */}
        <header className="dashboard-topbar" style={{ padding: isAdmin ? '10px 24px' : undefined }}>
          {isAdmin ? (
            /* Bada Vyapaar Topbar: Global Search + Notifications + Help + Admin Profile Chip */
            <div className="bv-topbar-wrapper">
              <div className="bv-topbar-search">
                <Search size={16} className="bv-search-icon" />
                <input
                  type="text"
                  className="bv-search-input"
                  placeholder="Search vendors, products, orders..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onToast?.(`Searching for "${e.target.value}"...`, 'info');
                    }
                  }}
                />
                <span className="bv-search-shortcut">Ctrl + K</span>
              </div>

              <div className="bv-topbar-right">
                {onNavigateToStore && (
                  <button
                    type="button"
                    onClick={onNavigateToStore}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '7px 15px',
                      background: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '12px',
                      letterSpacing: '0.04em',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(180, 83, 9, 0.35)',
                    }}
                    title="Open Live Storefront Preview (Dynamic Header Navigation & Banners)"
                  >
                    <ExternalLink size={14} />
                    <span>View Storefront</span>
                  </button>
                )}

                <button
                  type="button"
                  className="bv-top-icon-btn"
                  onClick={onToggleTheme}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} />}
                </button>

                <button
                  type="button"
                  className="bv-top-icon-btn"
                  onClick={() => onToast?.('You have 12 unread marketplace alerts', 'info')}
                  title="Notifications"
                >
                  <Bell size={18} />
                  <span className="bv-notif-badge">12</span>
                </button>

                <button
                  type="button"
                  className="bv-top-icon-btn"
                  onClick={() => onToast?.('Multivendor Help & Documentation', 'info')}
                  title="Help & Knowledge"
                >
                  <HelpCircle size={18} />
                </button>

                <div
                  className="bv-admin-profile-chip"
                  onClick={() => setActiveTab(activeTab === 'profile' ? 'admin-overview' : 'profile')}
                  title="Super Administrator Profile"
                >
                  <img
                    src={user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"}
                    alt="Admin"
                    className="bv-admin-avatar"
                  />
                  <div className="bv-admin-info">
                    <span className="bv-admin-name">{user?.name || 'Admin'}</span>
                    <span className="bv-admin-role">Super Administrator</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onLogout}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '5px' }}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="dashboard-breadcrumbs">
                <span className="breadcrumb-root">Dashboard</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-root">{user?.name?.split(' ')[0] || 'User'}</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-active">{getBreadcrumbTitle()}</span>
              </div>

              <div className="dashboard-topbar-actions">
                <button
                  type="button"
                  className="theme-toggle-btn"
                  onClick={onToggleTheme}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} />}
                </button>

                <div className="topbar-badge-user">
                  <span className="online-dot" />
                  <span>{user?.name?.split(' ')[0]}</span>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onLogout}
                  style={{ padding: '7px 12px', fontSize: '0.82rem', color: '#ef4444' }}
                  title="Sign Out"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </header>

        {/* Dashboard Body Content */}
        <main className="dashboard-body">
          {/* ================================================================
              TAB: EXECUTIVE ADMIN OVERVIEW (WITH CHARTS & GRAPHS)
              ================================================================ */}
          {(activeTab === 'admin-overview' || (activeTab === 'admin-hub' && isAdmin)) && (
            <div className="admin-view-fade">
              <AdminOverview
                user={user}
                onToast={onToast}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {/* ================================================================
              TAB: VENDOR STOREFRONT DASHBOARD (MATCHING USER REFERENCE DESIGN)
              ================================================================ */}
          {(activeTab === 'vendor-dashboard' || (isVendor && activeTab === 'overview')) && (
            <div className="admin-view-fade">
              <VendorDashboard
                user={user}
                onToast={onToast}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {/* ================================================================
              TAB: COUPONS & PROMOTIONAL VOUCHERS
              ================================================================ */}
          {activeTab === 'coupons' && (
            <div className="admin-view-fade">
              <CouponManager
                user={user}
                onToast={onToast}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {/* ================================================================
              TAB: CUSTOMER REVIEWS & RATINGS MODERATION
              ================================================================ */}
          {activeTab === 'reviews' && (
            <div className="admin-view-fade">
              <ReviewRatingManager
                user={user}
                onToast={onToast}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {/* ================================================================
              TAB: PRODUCTS & INVENTORY
              ================================================================ */}
          {activeTab === 'products' && (
            <div className="admin-view-fade">
              <ProductManager
                user={user}
                onToast={onToast}
                isAdminMode={isAdmin}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {/* ================================================================
              TAB: CATEGORIES & TAXONOMY
              ================================================================ */}
          {activeTab === 'categories' && (
            <div className="admin-view-fade">
              <CategoryManager
                user={user}
                onToast={onToast}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {/* ================================================================
              TAB: SELLERS & VENDORS
              ================================================================ */}
          {activeTab === 'vendors' && (
            <div className="admin-view-fade">
              <VendorManager
                user={user}
                onToast={onToast}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {/* ================================================================
              TAB: PROMOTIONAL BANNERS & DYNAMIC BRANDING / LOGO
              ================================================================ */}
          {activeTab === 'banners' && (
            <div className="admin-view-fade">
              <BannerBrandingManager
                user={user}
                onToast={onToast}
                onBrandingUpdated={(updated) => setBranding(updated)}
              />
            </div>
          )}

          {/* ================================================================
              TAB: DYNAMIC HEADER MENUS & NAVIGATION
              ================================================================ */}
          {activeTab === 'header-menus' && (
            <div className="admin-view-fade">
              <HeaderMenuManager
                user={user}
                onToast={onToast}
              />
            </div>
          )}

          {/* ================================================================
              TAB: CARTS & WISHLISTS / ORDERS
              ================================================================ */}
          {activeTab === 'carts' && (
            <div className="admin-view-fade">
              <CartWishlistManager
                user={user}
                onToast={onToast}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {/* ================================================================
              TAB: PAYMENTS & TRANSACTIONS
              ================================================================ */}
          {activeTab === 'payments' && (
            <div className="admin-view-fade">
              <FinancialManager
                user={user}
                onToast={onToast}
                initialSection="payments"
              />
            </div>
          )}

          {/* ================================================================
              TAB: WITHDRAWALS & SETTLEMENTS
              ================================================================ */}
          {activeTab === 'withdrawals' && (
            <div className="admin-view-fade">
              <FinancialManager
                user={user}
                onToast={onToast}
                initialSection="withdrawals"
              />
            </div>
          )}

          {/* ================================================================
              TAB: FINANCIAL REPORTS & ANALYTICS
              ================================================================ */}
          {activeTab === 'reports' && (
            <div className="admin-view-fade">
              <ReportsManager
                user={user}
                onToast={onToast}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </div>
          )}

          {/* ================================================================
              TAB: CUSTOMER OVERVIEW (SHOWN ONLY WHEN OVERVIEW TAB IS ACTIVE FOR NON-ADMIN)
              ================================================================ */}
          {activeTab === 'overview' && !isAdmin && (
            <div>
              <div className="dashboard-welcome-banner">
                <h2 className="welcome-title">Welcome back, {user?.name} 👋</h2>
                <p className="welcome-subtitle">
                  Manage your personal credentials, delivery addresses, and account security.
                </p>
              </div>

              {/* 4 Professional KPI Metric Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrap primary">
                    <User size={22} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Profile Status</div>
                    <div className="stat-value">100%</div>
                    <span className="stat-note" style={{ color: '#059669' }}>
                      Verified Customer
                    </span>
                  </div>
                </div>

                <div
                  className="stat-card"
                  onClick={() => setActiveTab('addresses')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="stat-icon-wrap cyan">
                    <MapPin size={22} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Delivery Addresses</div>
                    <div className="stat-value">{addresses.length} Saved</div>
                    <span className="stat-note" style={{ color: 'var(--primary)' }}>
                      {defaultAddress ? `Default: ${defaultAddress.type}` : 'Click to add'}
                    </span>
                  </div>
                </div>

                <div
                  className="stat-card"
                  onClick={() => setActiveTab('security')}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="stat-icon-wrap success">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Account Security</div>
                    <div className="stat-value">Protected</div>
                    <span className="stat-note" style={{ color: '#059669' }}>
                      Active & Encrypted
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrap amber">
                    <Calendar size={22} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-label">Account Role</div>
                    <div className="stat-value">{user?.role || 'Customer'}</div>
                    <span className="stat-note" style={{ color: 'var(--text-muted)' }}>
                      Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '2026'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: MY PROFILE
              ================================================================ */}
          {activeTab === 'profile' && (
            <div>
              <div className="profile-card">
                {/* Visual Cover Banner */}
                <div className="profile-cover" />

                {/* Profile Identity Bar */}
                <div className="profile-header-strip">
                  <div className="profile-avatar-wrap">
                    {user?.avatar_url && !avatarError ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="profile-avatar-lg"
                        style={{ objectFit: 'cover' }}
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="profile-avatar-lg">{initials}</div>
                    )}

                    <div className="profile-identity-info">
                      <h3>{user?.name}</h3>
                      <div className="profile-identity-tags">
                        <span className="tag-badge role">{user?.role || 'Customer'}</span>
                        <span className="tag-badge status">
                          <CheckCircle size={12} />
                          {user?.status || 'Active'}
                        </span>
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                          {user?.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={editingProfile ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => setEditingProfile(!editingProfile)}
                    style={{ width: 'auto' }}
                  >
                    {editingProfile ? <X size={16} /> : <Edit2 size={16} />}
                    <span>{editingProfile ? 'Cancel Edit' : 'Edit Profile'}</span>
                  </button>
                </div>

                {/* Profile Details Content */}
                <div className="profile-details-body">
                  {/* Inline Profile Edit Form */}
                  {editingProfile && (
                    <div
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1.5px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '24px',
                        marginBottom: '28px',
                      }}
                    >
                      <h4
                        style={{
                          fontWeight: 700,
                          fontSize: '1.05rem',
                          color: 'var(--text-primary)',
                          marginBottom: '16px',
                        }}
                      >
                        Edit Personal Information
                      </h4>

                      {profileError && (
                        <div
                          style={{
                            background: 'var(--danger-bg)',
                            border: '1px solid var(--danger-border)',
                            color: '#b91c1c',
                            padding: '10px 14px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.86rem',
                            marginBottom: '16px',
                          }}
                        >
                          {profileError}
                        </div>
                      )}

                      <form onSubmit={handleProfileSubmit}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px',
                            marginBottom: '16px',
                          }}
                        >
                          <div>
                            <label className="form-label">Full Name *</label>
                            <input
                              type="text"
                              className="input-field"
                              style={{ paddingLeft: '14px' }}
                              value={profileForm.name}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, name: e.target.value })
                              }
                              required
                            />
                          </div>

                          <div>
                            <label className="form-label">Phone Number</label>
                            <input
                              type="tel"
                              className="input-field"
                              style={{ paddingLeft: '14px' }}
                              placeholder="e.g. 9876543210"
                              value={profileForm.phone}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, phone: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <ImageUploadInput
                          label="Profile Avatar Image"
                          value={profileForm.avatar_url}
                          onChange={(url) => setProfileForm({ ...profileForm, avatar_url: url })}
                          placeholder="https://images.unsplash.com/... or browse file"
                          helperText="JPG, PNG, WEBP (Max 5MB)"
                          onToast={onToast}
                          style={{ marginBottom: '20px' }}
                        />

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setEditingProfile(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn-primary"
                            disabled={profileSaving}
                            style={{ width: 'auto' }}
                          >
                            {profileSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Clean Personal Details Grid */}
                  <h4 className="section-headline">
                    <User size={18} color="var(--primary)" />
                    <span>Personal Details & Account Credentials</span>
                  </h4>

                  <div className="details-row-grid">
                    <div className="detail-item-box">
                      <div className="detail-item-icon">
                        <User size={18} />
                      </div>
                      <div className="detail-item-content">
                        <div className="detail-item-label">Full Name</div>
                        <div className="detail-item-value">{user?.name || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="detail-item-box">
                      <div className="detail-item-icon">
                        <Mail size={18} />
                      </div>
                      <div className="detail-item-content">
                        <div className="detail-item-label">Email Address</div>
                        <div className="detail-item-value">{user?.email || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="detail-item-box">
                      <div className="detail-item-icon">
                        <Phone size={18} />
                      </div>
                      <div className="detail-item-content">
                        <div className="detail-item-label">Phone Number</div>
                        <div className="detail-item-value">
                          {user?.phone || 'Not provided'}
                        </div>
                      </div>
                    </div>

                    <div className="detail-item-box">
                      <div className="detail-item-icon">
                        <Shield size={18} />
                      </div>
                      <div className="detail-item-content">
                        <div className="detail-item-label">Account Role</div>
                        <div
                          className="detail-item-value"
                          style={{ color: 'var(--primary)', textTransform: 'uppercase' }}
                        >
                          {user?.role || 'Customer'}
                        </div>
                      </div>
                    </div>

                    <div className="detail-item-box">
                      <div className="detail-item-icon">
                        <CheckCircle size={18} color="#059669" />
                      </div>
                      <div className="detail-item-content">
                        <div className="detail-item-label">Account Status</div>
                        <div
                          className="detail-item-value"
                          style={{ color: '#059669', textTransform: 'capitalize' }}
                        >
                          {user?.status || 'Active'}
                        </div>
                      </div>
                    </div>

                    <div className="detail-item-box">
                      <div className="detail-item-icon">
                        <Calendar size={18} />
                      </div>
                      <div className="detail-item-content">
                        <div className="detail-item-label">Member Since</div>
                        <div className="detail-item-value">
                          {user?.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : 'Recent'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subcards Grid: Default Address Preview & Security Status */}
                  <div className="profile-subcards-grid">
                    {/* Subcard 1: Default Delivery Location */}
                    <div className="subcard-box">
                      <div className="subcard-header">
                        <div className="subcard-title">
                          <MapPin size={18} color="#0284c7" />
                          <span>Primary Delivery Address</span>
                        </div>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => setActiveTab('addresses')}
                        >
                          Manage All ({addresses.length})
                        </button>
                      </div>

                      {defaultAddress ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                              {defaultAddress.recipient_name}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                background: 'var(--primary-light)',
                                border: '1px solid rgba(79, 70, 229, 0.2)',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                textTransform: 'capitalize',
                              }}
                            >
                              {defaultAddress.type} • Default
                            </span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '8px' }}>
                            {defaultAddress.address_line1}
                            {defaultAddress.address_line2 ? `, ${defaultAddress.address_line2}` : ''}
                            <br />
                            {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.postal_code}
                          </p>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Contact: {defaultAddress.phone}
                          </span>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)' }}>
                          <p style={{ fontSize: '0.88rem', marginBottom: '12px' }}>
                            No delivery address added yet.
                          </p>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setActiveTab('addresses')}
                            style={{ margin: '0 auto', fontSize: '0.84rem' }}
                          >
                            <Plus size={14} />
                            <span>Add Delivery Address</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Subcard 2: Security & Session Status */}
                    <div className="subcard-box">
                      <div className="subcard-header">
                        <div className="subcard-title">
                          <ShieldCheck size={18} color="#059669" />
                          <span>Security & Sessions</span>
                        </div>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => setActiveTab('security')}
                        >
                          Security Settings
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                              Password Protection
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Encrypted with bcrypt (salted rounds)
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setActiveTab('security')}
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            <Lock size={13} />
                            <span>Change</span>
                          </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                              Session Security
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Continuous session protection and encryption
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={handleRotate}
                            disabled={rotating}
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            <RefreshCw size={13} className={rotating ? 'spin' : ''} />
                            <span>{rotating ? 'Rotating...' : 'Rotate'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: DELIVERY ADDRESSES
              ================================================================ */}
          {activeTab === 'addresses' && (
            <div className="glass-panel" style={{ padding: '32px' }}>
              <AddressManager
                onToast={(msg, type) => {
                  onToast?.(msg, type);
                  fetchAddressesSummary();
                }}
              />
            </div>
          )}

          {/* ================================================================
              TAB: SECURITY & PASSWORD
              ================================================================ */}
          {activeTab === 'security' && (
            <div>
              <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px' }}>
                <h3 className="section-headline">
                  <Lock size={20} color="var(--primary)" />
                  <span>Update Account Password</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '22px' }}>
                  Ensure your account is using a secure password with a minimum of 8 characters.
                </p>

                {passSuccess && (
                  <div
                    style={{
                      background: 'var(--success-bg)',
                      border: '1px solid var(--success-border)',
                      color: '#065f46',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontWeight: 500,
                    }}
                  >
                    <CheckCircle size={18} color="#059669" />
                    <span>{passSuccess}</span>
                  </div>
                )}

                {passError && (
                  <div
                    style={{
                      background: 'var(--danger-bg)',
                      border: '1px solid var(--danger-border)',
                      color: '#b91c1c',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.86rem',
                      marginBottom: '20px',
                      fontWeight: 500,
                    }}
                  >
                    {passError}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="form-label">Current Password *</label>
                    <input
                      type="password"
                      className="input-field"
                      style={{ paddingLeft: '14px' }}
                      placeholder="Enter your current password"
                      value={passForm.current_password}
                      onChange={(e) =>
                        setPassForm({ ...passForm, current_password: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px',
                      marginBottom: '24px',
                    }}
                  >
                    <div>
                      <label className="form-label">New Password (min 8 chars) *</label>
                      <input
                        type="password"
                        className="input-field"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Enter new password"
                        value={passForm.new_password}
                        onChange={(e) =>
                          setPassForm({ ...passForm, new_password: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Confirm New Password *</label>
                      <input
                        type="password"
                        className="input-field"
                        style={{ paddingLeft: '14px' }}
                        placeholder="Re-enter new password"
                        value={passForm.confirm_password}
                        onChange={(e) =>
                          setPassForm({ ...passForm, confirm_password: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={passSaving}
                    style={{ width: 'auto' }}
                  >
                    <Lock size={16} />
                    <span>{passSaving ? 'Updating Password...' : 'Save New Password'}</span>
                  </button>
                </form>
              </div>

              {/* Session Security Card */}
              <div
                className="glass-panel"
                style={{
                  padding: '24px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                    Active Account Session Security
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '2px' }}>
                    Renew active authentication session credentials and secure current login.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleRotate}
                  disabled={rotating}
                >
                  <RefreshCw size={15} color="#4f46e5" className={rotating ? 'spin' : ''} />
                  <span>{rotating ? 'Updating Session...' : 'Refresh Session'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: API & DEV TOOLS
              ================================================================ */}
          {activeTab === 'api-tools' && (
            <div className="glass-panel" style={{ padding: '32px' }}>
              <h3 className="section-headline">
                <Terminal size={20} color="var(--primary)" />
                <span>Live API Bench & Response Inspector</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Execute real HTTP calls against the authenticated Express.js backend and inspect JSON payloads.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  marginBottom: '26px',
                }}
              >
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleTestApi('profile')}
                  disabled={Boolean(testingEndpoint)}
                  style={{
                    padding: '16px',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      color: 'var(--primary)',
                    }}
                  >
                    <Code size={16} />
                    <span>GET /api/v1/users/profile</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Fetch user profile with associated delivery addresses
                  </span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleTestApi('addresses')}
                  disabled={Boolean(testingEndpoint)}
                  style={{
                    padding: '16px',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      color: '#0284c7',
                    }}
                  >
                    <MapPin size={16} />
                    <span>GET /api/v1/addresses</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Fetch user delivery address book
                  </span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleRotate}
                  disabled={rotating}
                  style={{
                    padding: '16px',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      color: '#059669',
                    }}
                  >
                    <RefreshCw size={16} className={rotating ? 'spin' : ''} />
                    <span>POST /api/v1/auth/refresh</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Test cryptographic refresh token rotation
                  </span>
                </button>
              </div>

              {apiResponse && (
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '18px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                      fontSize: '0.84rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{apiResponse.endpoint}</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>
                      {apiResponse.status}
                    </span>
                  </div>
                  <pre
                    style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: '0.84rem',
                      overflowX: 'auto',
                      maxHeight: '320px',
                      background: 'var(--bg-card)',
                      padding: '16px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {JSON.stringify(apiResponse.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              TAB: DASHBOARD OVERVIEW
              ================================================================ */}
          {activeTab === 'overview' && (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  marginBottom: '24px',
                }}
              >
                {/* Overview Card 1 */}
                <div className="glass-panel" style={{ padding: '26px' }}>
                  <h4 className="section-headline">
                    <User size={18} color="var(--primary)" />
                    <span>Account Overview</span>
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                    Logged in as <strong>{user?.name}</strong> ({user?.email}) with role <strong>{user?.role}</strong>.
                  </p>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setActiveTab('profile')}
                    style={{ width: 'auto', fontSize: '0.86rem', padding: '8px 16px' }}
                  >
                    <span>View Complete Profile</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                {/* Overview Card 2 */}
                <div className="glass-panel" style={{ padding: '26px' }}>
                  <h4 className="section-headline">
                    <MapPin size={18} color="#0284c7" />
                    <span>Address Book ({addresses.length})</span>
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                    {defaultAddress
                      ? `Primary delivery: ${defaultAddress.recipient_name}, ${defaultAddress.city} (${defaultAddress.postal_code})`
                      : 'No delivery address saved yet.'}
                  </p>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActiveTab('addresses')}
                    style={{ width: 'auto', fontSize: '0.86rem', padding: '8px 16px' }}
                  >
                    <span>Manage Addresses</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                {/* Overview Card 3 */}
                <div className="glass-panel" style={{ padding: '26px' }}>
                  <h4 className="section-headline">
                    <FolderTree size={18} color="#059669" />
                    <span>Catalog & Taxonomy</span>
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                    Configure marketplace parent categories, hierarchical subcategories, banner images and status.
                  </p>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setActiveTab('categories')}
                    style={{ width: 'auto', fontSize: '0.86rem', padding: '8px 16px' }}
                  >
                    <span>Manage Categories</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
