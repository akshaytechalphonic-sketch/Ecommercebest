import React, { useState, useEffect } from 'react';
import {
  Image,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Check,
  X,
  Eye,
  TrendingUp,
  Layout,
  Sliders,
  Globe,
  Save,
  RefreshCw,
  AlertCircle,
  MousePointerClick,
  Tag,
  Palette,
} from 'lucide-react';
import {
  adminBannerApi,
  bannerApi,
  settingApi,
  adminSettingApi,
  categoryApi,
} from '../services/api';
import { ImageUploadInput } from './ImageUploadInput';
import { applyThemeColors, THEME_PRESETS } from '../utils/theme';

export const BannerBrandingManager = ({ user, onToast, onBrandingUpdated }) => {
  const [activeSubTab, setActiveSubTab] = useState('banners'); // 'banners' | 'branding'
  const [loading, setLoading] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  // Branding State
  const [brandingForm, setBrandingForm] = useState({
    site_name: '',
    site_tagline: '',
    site_logo: '',
    site_dark_logo: '',
    site_favicon: '',
    contact_email: '',
    contact_phone: '',
    primary_color: '#4f46e5',
    accent_color: '#4338ca',
    sidebar_color: '#ffffff',
    theme_preset: 'royal_indigo',
  });

  // Banners & Categories State
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bannerStats, setBannerStats] = useState({
    total_banners: 0,
    active_banners: 0,
    total_clicks: 0,
    category_banners: 0,
  });
  const [bannerTypeFilter, setBannerTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [modalForm, setModalForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    mobile_image_url: '',
    link_url: '',
    banner_type: 'home_hero',
    category_id: null,
    position: 0,
    is_active: true,
  });
  const [submittingBanner, setSubmittingBanner] = useState(false);

  // Fetch initial branding, categories, and banners
  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Branding
      const resBranding = await settingApi.getBranding();
      if (resBranding?.data) {
        setBrandingForm((prev) => ({
          ...prev,
          ...resBranding.data,
        }));
      }

      // 2. Fetch Categories for Dropdown
      const resCategories = await categoryApi.getCategories({ all: true });
      if (resCategories?.data) {
        setCategories(resCategories.data);
      }

      // 3. Fetch Admin Banners with filters
      const queryParams = { limit: 50 };
      if (bannerTypeFilter) queryParams.banner_type = bannerTypeFilter;
      if (categoryFilter) queryParams.category_id = categoryFilter;

      const resBanners = await adminBannerApi.getBanners(queryParams);
      if (resBanners?.data) {
        setBanners(resBanners.data.banners || []);
        if (resBanners.data.stats) {
          setBannerStats(resBanners.data.stats);
        }
      }
    } catch (err) {
      onToast?.(err.message || 'Failed to load banners and settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [bannerTypeFilter, categoryFilter]);

  // Handle Preset Selection with instant live preview
  const handleSelectPreset = (preset) => {
    const updated = {
      ...brandingForm,
      primary_color: preset.primary,
      accent_color: preset.accent,
      theme_preset: preset.id,
    };
    setBrandingForm(updated);
    applyThemeColors(updated, false); // Real-time preview without page reload
    onToast?.(`Theme preset '${preset.name}' applied! Click Save to make permanent.`, 'info');
  };

  // Handle Custom Color Pick with instant live preview
  const handleCustomColorChange = (key, val) => {
    const updated = {
      ...brandingForm,
      [key]: val,
      theme_preset: 'custom',
    };
    setBrandingForm(updated);
    applyThemeColors(updated, false); // Instant live preview
  };

  // Handle Save Branding
  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await adminSettingApi.updateBranding(brandingForm);
      onToast?.('Dynamic logo, theme colors, and store branding saved successfully!', 'success');
      if (res?.data) {
        setBrandingForm(res.data);
        applyThemeColors(res.data, true); // Persist in localStorage and apply
        onBrandingUpdated?.(res.data);
      }
    } catch (err) {
      onToast?.(err.message || 'Failed to update branding', 'error');
    } finally {
      setSavingBranding(false);
    }
  };

  // Open Modal for Create or Edit
  const openModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setModalForm({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        image_url: banner.image_url || '',
        mobile_image_url: banner.mobile_image_url || '',
        link_url: banner.link_url || '',
        banner_type: banner.banner_type || 'home_hero',
        category_id: banner.category_id || null,
        position: banner.position || 0,
        is_active: banner.is_active !== undefined ? banner.is_active : true,
      });
    } else {
      setEditingBanner(null);
      setModalForm({
        title: '',
        subtitle: '',
        description: '',
        image_url: '',
        mobile_image_url: '',
        link_url: '',
        banner_type: 'home_hero',
        category_id: categoryFilter && categoryFilter !== 'null' ? Number(categoryFilter) : null,
        position: banners.length + 1,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  // Save Banner (Create or Update)
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!modalForm.title || !modalForm.image_url) {
      onToast?.('Title and Image URL are required', 'error');
      return;
    }

    setSubmittingBanner(true);
    try {
      const payload = {
        ...modalForm,
        category_id: modalForm.category_id ? Number(modalForm.category_id) : null,
      };

      if (editingBanner) {
        await adminBannerApi.updateBanner(editingBanner.id, payload);
        onToast?.('Banner updated successfully!', 'success');
      } else {
        await adminBannerApi.createBanner(payload);
        onToast?.('Banner created successfully!', 'success');
      }
      setIsModalOpen(false);
      fetchAllData();
    } catch (err) {
      onToast?.(err.message || 'Failed to save banner', 'error');
    } finally {
      setSubmittingBanner(false);
    }
  };

  // Toggle Banner Status
  const handleToggleStatus = async (banner) => {
    try {
      const nextStatus = !banner.is_active;
      await adminBannerApi.updateStatus(banner.id, nextStatus);
      onToast?.(`Banner ${nextStatus ? 'activated' : 'paused'}`, 'info');
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, is_active: nextStatus } : b))
      );
    } catch (err) {
      onToast?.(err.message || 'Status toggle failed', 'error');
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotional banner?')) return;
    try {
      await adminBannerApi.deleteBanner(id);
      onToast?.('Banner deleted successfully', 'success');
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      onToast?.(err.message || 'Failed to delete banner', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-card, #ffffff)',
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #e2e8f0)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
            Banner & Dynamic Branding Hub
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Manage homepage banners, category-specific promotional banners, and dynamic store logo & branding
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-subtle, #f1f5f9)', borderRadius: '10px', padding: '3px' }}>
            <button
              type="button"
              onClick={() => setActiveSubTab('banners')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeSubTab === 'banners' ? '#3c3564' : 'transparent',
                color: activeSubTab === 'banners' ? '#ffffff' : '#64748b',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Layout size={15} />
              <span>Banners ({banners.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('branding')}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeSubTab === 'branding' ? '#3c3564' : 'transparent',
                color: activeSubTab === 'branding' ? '#ffffff' : '#64748b',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={15} />
              <span>Dynamic Logo & Branding</span>
            </button>
          </div>

          {activeSubTab === 'banners' && (
            <button
              type="button"
              onClick={() => openModal()}
              style={{
                background: '#3c3564',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={16} />
              <span>Add Banner</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="vd-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Total Banners</span>
            <Layout size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: '#0f172a' }}>
            {bannerStats.total_banners}
          </div>
        </div>

        <div className="vd-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Active Banners</span>
            <Check size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: '#10b981' }}>
            {bannerStats.active_banners}
          </div>
        </div>

        <div className="vd-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Category Specific</span>
            <Tag size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: '#8b5cf6' }}>
            {bannerStats.category_banners || 0}
          </div>
        </div>

        <div className="vd-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Total Banner Clicks</span>
            <MousePointerClick size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: '#0f172a' }}>
            {bannerStats.total_clicks}
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: BANNERS LIST */}
      {activeSubTab === 'banners' && (
        <div className="vd-card" style={{ padding: '20px' }}>
          {/* Filter Bar with Placement & Category filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
              Promotional Banners Feed
            </span>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.82rem',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                }}
              >
                <option value="">All Categories & Home</option>
                <option value="null">🌐 Homepage Only</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏷️ {c.name}
                  </option>
                ))}
              </select>

              {/* Placement Filter */}
              <select
                value={bannerTypeFilter}
                onChange={(e) => setBannerTypeFilter(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.82rem',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                }}
              >
                <option value="">All Placements</option>
                <option value="home_hero">Hero Slider</option>
                <option value="home_middle">Middle Grid</option>
                <option value="home_bottom">Bottom Carousel</option>
                <option value="promo_strip">Promo Strip</option>
                <option value="popup">Modal Popup</option>
                <option value="sidebar">Sidebar Banner</option>
              </select>

              <button
                type="button"
                onClick={fetchAllData}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  background: 'transparent',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.82rem',
                }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Banners Grid */}
          {banners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Layout size={40} style={{ opacity: 0.5, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No promotional banners found</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Click "Add Banner" above to create home or category-specific campaigns</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {banners.map((b) => (
                <div
                  key={b.id}
                  style={{
                    border: '1px solid var(--border-color, #e2e8f0)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'var(--bg-subtle, #f8fafc)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ position: 'relative', height: '140px', background: '#0f172a' }}>
                    <img
                      src={b.image_url}
                      alt={b.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600';
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {b.banner_type?.replace(/_/g, ' ')}
                    </span>

                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: b.is_active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {b.is_active ? 'Active' : 'Paused'}
                    </span>

                    {/* Category Target Tag on Banner Preview */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '10px',
                        background: b.category ? '#4f46e5' : '#0f172a',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {b.category ? `🏷️ ${b.category.name}` : '🌐 Homepage'}
                    </span>
                  </div>

                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
                          {b.title}
                        </h4>
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                          #{b.position}
                        </span>
                      </div>
                      {b.subtitle && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                          {b.subtitle}
                        </p>
                      )}
                      {b.link_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.72rem', color: '#6366f1' }}>
                          <ExternalLink size={12} />
                          <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.link_url}
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                        <MousePointerClick size={14} />
                        <span>{b.click_count || 0} clicks</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(b)}
                          title={b.is_active ? 'Pause banner' : 'Activate banner'}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color, #cbd5e1)',
                            background: b.is_active ? '#fee2e2' : '#dcfce7',
                            color: b.is_active ? '#dc2626' : '#15803d',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {b.is_active ? 'Pause' : 'Activate'}
                        </button>

                        <button
                          type="button"
                          onClick={() => openModal(b)}
                          title="Edit banner"
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color, #cbd5e1)',
                            background: '#ffffff',
                            color: '#334155',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={13} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(b.id)}
                          title="Delete banner"
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1px solid #fee2e2',
                            background: '#fee2e2',
                            color: '#ef4444',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: DYNAMIC LOGO & BRANDING SETTINGS */}
      {activeSubTab === 'branding' && (
        <form onSubmit={handleSaveBranding} className="vd-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              Store Dynamic Logo & Identity Configuration
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Changes made here dynamically reflect on the store header, mobile app, and client portal
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Site Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                Marketplace Name
              </label>
              <input
                type="text"
                value={brandingForm.site_name}
                onChange={(e) => setBrandingForm({ ...brandingForm, site_name: e.target.value })}
                placeholder="e.g. Bada Vyapaar"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.86rem',
                }}
              />
            </div>

            {/* Site Tagline */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                Store Tagline
              </label>
              <input
                type="text"
                value={brandingForm.site_tagline}
                onChange={(e) => setBrandingForm({ ...brandingForm, site_tagline: e.target.value })}
                placeholder="e.g. India's Leading Multi-Vendor Marketplace"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.86rem',
                }}
              />
            </div>

            {/* Primary Logo URL */}
            <div style={{ gridColumn: '1 / -1' }}>
              <ImageUploadInput
                label="Store Logo (Light Mode)"
                value={brandingForm.site_logo}
                onChange={(url) => setBrandingForm({ ...brandingForm, site_logo: url })}
                placeholder="https://example.com/logo.png or browse local file..."
                helperText="Accepted: PNG, JPG, WEBP, SVG (Max 5MB)"
                onToast={onToast}
              />
            </div>

            {/* Dark Mode Logo URL */}
            <div style={{ gridColumn: '1 / -1' }}>
              <ImageUploadInput
                label="Dark Mode Logo (Optional)"
                value={brandingForm.site_dark_logo}
                onChange={(url) => setBrandingForm({ ...brandingForm, site_dark_logo: url })}
                placeholder="https://example.com/logo-dark.png or browse local file..."
                helperText="Used on dark header & theme"
                onToast={onToast}
              />
            </div>

            {/* Favicon URL */}
            <div style={{ gridColumn: '1 / -1' }}>
              <ImageUploadInput
                label="Favicon (.ico / .png / .svg)"
                value={brandingForm.site_favicon}
                onChange={(url) => setBrandingForm({ ...brandingForm, site_favicon: url })}
                placeholder="https://example.com/favicon.ico or browse local file..."
                onToast={onToast}
              />
            </div>

            {/* Support Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                Official Support Email
              </label>
              <input
                type="email"
                value={brandingForm.contact_email}
                onChange={(e) => setBrandingForm({ ...brandingForm, contact_email: e.target.value })}
                placeholder="support@multivendor.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.86rem',
                }}
              />
            </div>

            {/* Support Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                Customer Care Helpline
              </label>
              <input
                type="text"
                value={brandingForm.contact_phone}
                onChange={(e) => setBrandingForm({ ...brandingForm, contact_phone: e.target.value })}
                placeholder="+91 98765 43210"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '0.86rem',
                }}
              />
            </div>
          </div>

          {/* DYNAMIC WEBSITE THEME & COLOR PALETTE SECTION */}
          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--primary-light, #eef2ff)',
                  color: 'var(--primary, #4f46e5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Palette size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                  Dynamic Website Theme & Color Palette
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Pick from curated color schemes or define custom HEX colors. Changes update all buttons, headers, and highlights dynamically!
                </p>
              </div>
            </div>

            {/* 1. Theme Presets Grid */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '8px', color: '#334155' }}>
                Quick Theme Presets
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '10px',
                }}
              >
                {THEME_PRESETS.map((preset) => {
                  const isSelected = brandingForm.theme_preset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--primary, #4f46e5)' : '1px solid #cbd5e1',
                        background: isSelected ? 'var(--primary-light, #eef2ff)' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: preset.primary,
                          border: '2px solid #ffffff',
                          boxShadow: '0 0 0 1px #cbd5e1',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? 'var(--primary, #4f46e5)' : '#334155',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Custom Color Pickers & Live Element Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Primary Color Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Primary Brand Color
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandingForm.primary_color || '#4f46e5'}
                    onChange={(e) => handleCustomColorChange('primary_color', e.target.value)}
                    style={{
                      width: '46px',
                      height: '40px',
                      padding: '2px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer',
                      background: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={brandingForm.primary_color || ''}
                    onChange={(e) => handleCustomColorChange('primary_color', e.target.value)}
                    placeholder="#4f46e5"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Primary buttons, active tabs, links, and badges
                </span>
              </div>

              {/* Accent / Hover Color Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Accent / Hover Color
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandingForm.accent_color || '#4338ca'}
                    onChange={(e) => handleCustomColorChange('accent_color', e.target.value)}
                    style={{
                      width: '46px',
                      height: '40px',
                      padding: '2px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer',
                      background: 'none',
                    }}
                  />
                  <input
                    type="text"
                    value={brandingForm.accent_color || ''}
                    onChange={(e) => handleCustomColorChange('accent_color', e.target.value)}
                    placeholder="#4338ca"
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.86rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Interactive button hover states and subtle gradients
                </span>
              </div>
            </div>

            {/* 3. Live Component Preview Box */}
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
              }}
            >
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Real-Time Component Preview
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: brandingForm.primary_color || 'var(--primary)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'default',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  Primary Action
                </button>

                <button
                  type="button"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: `1.5px solid ${brandingForm.primary_color || 'var(--primary)'}`,
                    background: 'transparent',
                    color: brandingForm.primary_color || 'var(--primary)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'default',
                  }}
                >
                  Outline Button
                </button>

                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: `${brandingForm.primary_color || '#4f46e5'}18`,
                    color: brandingForm.primary_color || 'var(--primary)',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                  }}
                >
                  Active Badge
                </span>

                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                  Headline with <span style={{ color: brandingForm.primary_color || 'var(--primary)', fontWeight: 800 }}>Accent Link</span>
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              disabled={savingBranding}
              style={{
                background: '#3c3564',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Save size={16} />
              <span>{savingBranding ? 'Saving Branding...' : 'Save Dynamic Branding'}</span>
            </button>
          </div>
        </form>
      )}

      {/* CREATE / EDIT BANNER MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {editingBanner ? 'Edit Promotional Banner' : 'Create Promotional Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  Banner Title *
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  placeholder="e.g. Diwali Mega Electronics Carnival"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              {/* Target Category Select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  Target Placement (Homepage or Specific Category)
                </label>
                <select
                  value={modalForm.category_id || ''}
                  onChange={(e) =>
                    setModalForm({
                      ...modalForm,
                      category_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">🌐 Homepage / Global (All Categories)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏷️ {c.name}
                    </option>
                  ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
                  Category select karne par ye banner us category page par dynamically show hoga
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  Subtitle / Promo Tagline
                </label>
                <input
                  type="text"
                  value={modalForm.subtitle}
                  onChange={(e) => setModalForm({ ...modalForm, subtitle: e.target.value })}
                  placeholder="e.g. Flat 60% Off on Top Brands"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <ImageUploadInput
                label="Banner Desktop Image"
                value={modalForm.image_url}
                onChange={(url) => setModalForm({ ...modalForm, image_url: url })}
                placeholder="https://example.com/banner.jpg or browse file..."
                required={true}
                helperText="Desktop / Standard View"
                onToast={onToast}
              />

              <ImageUploadInput
                label="Mobile Banner Image (Optional)"
                value={modalForm.mobile_image_url}
                onChange={(url) => setModalForm({ ...modalForm, mobile_image_url: url })}
                placeholder="https://example.com/mobile-banner.jpg or browse file..."
                helperText="Optimized for smartphones"
                onToast={onToast}
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  Destination Click Link (URL)
                </label>
                <input
                  type="text"
                  value={modalForm.link_url}
                  onChange={(e) => setModalForm({ ...modalForm, link_url: e.target.value })}
                  placeholder="/category/electronics or /deals"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                    Placement Type
                  </label>
                  <select
                    value={modalForm.banner_type}
                    onChange={(e) => setModalForm({ ...modalForm, banner_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="home_hero">Hero Slider</option>
                    <option value="home_middle">Middle Grid</option>
                    <option value="home_bottom">Bottom Carousel</option>
                    <option value="promo_strip">Promo Strip</option>
                    <option value="popup">Modal Popup</option>
                    <option value="sidebar">Sidebar Banner</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>
                    Sort Position
                  </label>
                  <input
                    type="number"
                    value={modalForm.position}
                    onChange={(e) => setModalForm({ ...modalForm, position: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="banner_active_check"
                  checked={modalForm.is_active}
                  onChange={(e) => setModalForm({ ...modalForm, is_active: e.target.checked })}
                />
                <label htmlFor="banner_active_check" style={{ fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' }}>
                  Enable banner immediately on website
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBanner}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#3c3564',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {submittingBanner ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerBrandingManager;
