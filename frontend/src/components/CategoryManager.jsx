import React, { useState, useEffect, useRef } from 'react';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  Search,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  CheckCircle,
  Tag,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  ExternalLink,
  UploadCloud,
} from 'lucide-react';
import { categoryApi, uploadApi } from '../services/api';

export const CategoryManager = ({ user, onToast }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [expandedCats, setExpandedCats] = useState({});

  // Category Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubcategoryModal, setIsSubcategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null when creating
  const [parentForSubcategory, setParentForSubcategory] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    banner_image: '',
    thumbnail_image: '',
    status: 'active',
    display_order: 0,
    parent_id: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Image Upload State & Refs
  const thumbFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Delete / Deactivate Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Categories from Backend
  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Fetch with admin endpoint if available to see active & inactive, fallback to public
      let res;
      try {
        res = await categoryApi.adminGetCategories();
      } catch (adminErr) {
        // Fallback for regular view
        res = await categoryApi.getCategories();
      }

      if (res?.data) {
        setCategories(res.data);
        // By default, expand categories that have subcategories
        const initialExpanded = {};
        res.data.forEach((cat) => {
          if (cat.subcategories && cat.subcategories.length > 0) {
            initialExpanded[cat.id] = true;
          }
        });
        setExpandedCats(initialExpanded);
      }
    } catch (err) {
      onToast?.(err.message || 'Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (catId) => {
    setExpandedCats((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleExpandAll = () => {
    const all = {};
    categories.forEach((cat) => {
      all[cat.id] = true;
    });
    setExpandedCats(all);
  };

  const handleCollapseAll = () => {
    setExpandedCats({});
  };

  // Open Create Top-Level Category Modal
  const openCreateModal = () => {
    setEditingCategory(null);
    setIsSubcategoryModal(false);
    setParentForSubcategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      banner_image: '',
      thumbnail_image: '',
      status: 'active',
      display_order: 0,
      parent_id: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  // Open Create Subcategory Modal
  const openCreateSubcategoryModal = (parentCat) => {
    setEditingCategory(null);
    setIsSubcategoryModal(true);
    setParentForSubcategory(parentCat);
    setFormData({
      name: '',
      slug: '',
      description: '',
      banner_image: '',
      thumbnail_image: '',
      status: 'active',
      display_order: 0,
      parent_id: parentCat.id,
    });
    setFormError('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (cat, parent = null) => {
    setEditingCategory(cat);
    setIsSubcategoryModal(Boolean(cat.parent_id || parent));
    setParentForSubcategory(parent);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      banner_image: cat.banner_image || '',
      thumbnail_image: cat.thumbnail_image || '',
      status: cat.status || 'active',
      display_order: cat.display_order ?? 0,
      parent_id: cat.parent_id || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  // Handle Thumbnail File Selection & Upload
  const handleThumbUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024;

    if (!isValidType) {
      onToast?.(`File '${file.name}' is not an accepted format (JPG, PNG, WEBP, GIF)`, 'error');
      return;
    }
    if (!isValidSize) {
      onToast?.(`File '${file.name}' exceeds the 5MB size limit`, 'error');
      return;
    }

    try {
      setUploadingThumb(true);
      const res = await uploadApi.uploadImage(file);
      if (res?.data?.url) {
        setFormData((prev) => ({ ...prev, thumbnail_image: res.data.url }));
        onToast?.('Thumbnail image uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Thumbnail upload failed:', err);
      onToast?.(err.message || 'Failed to upload thumbnail image', 'error');
    } finally {
      setUploadingThumb(false);
      if (thumbFileInputRef.current) thumbFileInputRef.current.value = '';
    }
  };

  // Handle Banner File Selection & Upload
  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
    const isValidSize = file.size <= 5 * 1024 * 1024;

    if (!isValidType) {
      onToast?.(`File '${file.name}' is not an accepted format (JPG, PNG, WEBP, GIF)`, 'error');
      return;
    }
    if (!isValidSize) {
      onToast?.(`File '${file.name}' exceeds the 5MB size limit`, 'error');
      return;
    }

    try {
      setUploadingBanner(true);
      const res = await uploadApi.uploadImage(file);
      if (res?.data?.url) {
        setFormData((prev) => ({ ...prev, banner_image: res.data.url }));
        onToast?.('Banner image uploaded successfully!', 'success');
      }
    } catch (err) {
      console.error('Banner upload failed:', err);
      onToast?.(err.message || 'Failed to upload banner image', 'error');
    } finally {
      setUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  // Save (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description && formData.description.trim() ? formData.description.trim() : null,
        banner_image: formData.banner_image && formData.banner_image.trim() ? formData.banner_image.trim() : null,
        thumbnail_image: formData.thumbnail_image && formData.thumbnail_image.trim() ? formData.thumbnail_image.trim() : null,
        status: formData.status,
        display_order: Number(formData.display_order) || 0,
      };

      if (formData.slug && formData.slug.trim()) {
        payload.slug = formData.slug.trim().toLowerCase();
      }

      if (editingCategory) {
        // Update existing category / subcategory
        if (formData.parent_id) {
          payload.parent_id = Number(formData.parent_id);
        } else {
          payload.parent_id = null;
        }
        await categoryApi.updateCategory(editingCategory.id, payload);
        onToast?.(`Category "${formData.name}" updated successfully`, 'success');
      } else if (isSubcategoryModal && parentForSubcategory) {
        // Create subcategory
        await categoryApi.createSubcategory(parentForSubcategory.id, payload);
        onToast?.(`Subcategory "${formData.name}" added under ${parentForSubcategory.name}`, 'success');
      } else {
        // Create top-level category
        if (formData.parent_id) {
          payload.parent_id = Number(formData.parent_id);
        }
        await categoryApi.createCategory(payload);
        onToast?.(`Category "${formData.name}" created successfully`, 'success');
      }

      setModalOpen(false);
      await fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  // Prompt Delete or Deactivate
  const openDeleteModal = (cat) => {
    setTargetCategory(cat);
    setDeleteModalOpen(true);
  };

  // Execute Deactivation or Hard Delete
  const handleDeleteAction = async (safeDeactivate = false) => {
    if (!targetCategory) return;
    try {
      setDeleting(true);
      await categoryApi.deleteCategory(targetCategory.id, safeDeactivate);
      onToast?.(
        safeDeactivate
          ? `Category "${targetCategory.name}" safely deactivated`
          : `Category "${targetCategory.name}" permanently deleted`,
        'success'
      );
      setDeleteModalOpen(false);
      setTargetCategory(null);
      await fetchCategories();
    } catch (err) {
      onToast?.(err.message || 'Operation failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filter Categories
  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.subcategories &&
        cat.subcategories.some(
          (sub) =>
            sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.slug.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    const matchesStatus =
      statusFilter === 'all' || cat.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalCategories = categories.length;
  const totalSubcategories = categories.reduce(
    (acc, cat) => acc + (cat.subcategories ? cat.subcategories.length : 0),
    0
  );
  const activeCount = categories.filter((c) => c.status === 'active').length;

  return (
    <div className="category-manager-container">
      {/* 1. Header & Quick Metrics */}
      {/* 1. Header Banner & Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FolderTree size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              Categories & Taxonomy
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Manage top-level store categories, subcategories and catalog visibility
            </span>
          </div>
        </div>

        <div className="cat-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="cat-btn cat-btn-secondary"
            onClick={fetchCategories}
            title="Refresh Catalog"
            style={{ height: '36px', padding: '0 14px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="cat-btn cat-btn-primary"
            onClick={openCreateModal}
            style={{ height: '36px', padding: '0 16px' }}
          >
            <Plus size={15} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* 2. Metrics Cards */}
      <div className="cat-metrics-grid">
        <div className="cat-metric-card">
          <div className="cat-metric-icon bg-indigo">
            <Layers size={20} />
          </div>
          <div className="cat-metric-info">
            <span className="cat-metric-num">{totalCategories}</span>
            <span className="cat-metric-label">Parent Categories</span>
          </div>
        </div>

        <div className="cat-metric-card">
          <div className="cat-metric-icon bg-cyan">
            <FolderTree size={20} />
          </div>
          <div className="cat-metric-info">
            <span className="cat-metric-num">{totalSubcategories}</span>
            <span className="cat-metric-label">Subcategories</span>
          </div>
        </div>

        <div className="cat-metric-card">
          <div className="cat-metric-icon bg-emerald">
            <CheckCircle size={20} />
          </div>
          <div className="cat-metric-info">
            <span className="cat-metric-num">{activeCount}</span>
            <span className="cat-metric-label">Active Catalogs</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Control Bar */}
      <div className="cat-control-bar">
        <div className="cat-search-box">
          <Search size={18} className="cat-search-icon" />
          <input
            type="text"
            placeholder="Search categories or subcategories by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cat-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="cat-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="cat-controls-right">
          <div className="cat-status-filter-wrap">
            <SlidersHorizontal size={15} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cat-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="cat-expand-toggles">
            <button
              type="button"
              onClick={handleExpandAll}
              className="cat-text-btn"
            >
              Expand All
            </button>
            <span className="cat-sep">|</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="cat-text-btn"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* 4. Category Tree / Cards */}
      {loading && categories.length === 0 ? (
        <div className="cat-loading-state">
          <RefreshCw size={32} className="spin-anim" />
          <p>Loading categories & subcategories...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="cat-empty-state">
          <div className="cat-empty-icon">
            <FolderTree size={40} />
          </div>
          <h3>No Categories Found</h3>
          <p>
            {searchQuery
              ? `No categories match your search "${searchQuery}". Try different keywords.`
              : 'Your store catalog has no categories yet. Create your first parent category to get started.'}
          </p>
          <button
            type="button"
            className="cat-btn cat-btn-primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            <span>Create First Category</span>
          </button>
        </div>
      ) : (
        <div className="cat-tree-list">
          {filteredCategories.map((cat) => {
            const isExpanded = !!expandedCats[cat.id];
            const subCount = cat.subcategories?.length || 0;

            return (
              <div
                key={cat.id}
                className={`cat-card ${cat.status === 'inactive' ? 'is-inactive' : ''}`}
              >
                {/* Category Header Row */}
                <div className="cat-card-header">
                  <div className="cat-header-left">
                    <button
                      type="button"
                      className="cat-chevron-btn"
                      onClick={() => toggleExpand(cat.id)}
                      title={isExpanded ? 'Collapse subcategories' : 'Expand subcategories'}
                    >
                      {subCount > 0 ? (
                        isExpanded ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )
                      ) : (
                        <span className="cat-bullet" />
                      )}
                    </button>

                    {/* Thumbnail Preview */}
                    <div className="cat-thumb-box">
                      {cat.thumbnail_image ? (
                        <img
                          src={cat.thumbnail_image}
                          alt={cat.name}
                          className="cat-thumb-img"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="cat-thumb-fallback"
                        style={{ display: cat.thumbnail_image ? 'none' : 'flex' }}
                      >
                        <Layers size={18} />
                      </div>
                    </div>

                    {/* Title & Slug */}
                    <div className="cat-meta-box">
                      <div className="cat-title-row">
                        <span className="cat-name">{cat.name}</span>
                        <span className="cat-slug-pill">/{cat.slug}</span>
                        <span
                          className={`cat-status-badge ${
                            cat.status === 'active' ? 'active' : 'inactive'
                          }`}
                        >
                          {cat.status}
                        </span>
                        {cat.display_order > 0 && (
                          <span className="cat-order-pill">
                            Order: {cat.display_order}
                          </span>
                        )}
                      </div>

                      {cat.description && (
                        <p className="cat-desc-preview">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="cat-header-right">
                    <span className="cat-sub-count-badge">
                      {subCount} {subCount === 1 ? 'subcategory' : 'subcategories'}
                    </span>

                    <button
                      type="button"
                      className="cat-action-btn cat-action-sub"
                      onClick={() => openCreateSubcategoryModal(cat)}
                      title="Add Subcategory under this category"
                    >
                      <Plus size={15} />
                      <span>Subcategory</span>
                    </button>

                    <button
                      type="button"
                      className="cat-action-btn cat-action-edit"
                      onClick={() => openEditModal(cat)}
                      title="Edit Category"
                    >
                      <Edit2 size={15} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="cat-action-btn cat-action-delete"
                      onClick={() => openDeleteModal(cat)}
                      title="Delete or Deactivate Category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Subcategories Container */}
                {isExpanded && subCount > 0 && (
                  <div className="cat-subcategories-drawer">
                    <div className="cat-drawer-line" />
                    <div className="cat-sub-list">
                      {cat.subcategories.map((sub) => (
                        <div
                          key={sub.id}
                          className={`cat-sub-card ${
                            sub.status === 'inactive' ? 'is-inactive' : ''
                          }`}
                        >
                          <div className="cat-sub-left">
                            <div className="cat-sub-tree-pointer">
                              <ArrowRight size={14} />
                            </div>

                            <div className="cat-sub-thumb">
                              {sub.thumbnail_image ? (
                                <img
                                  src={sub.thumbnail_image}
                                  alt={sub.name}
                                  className="cat-sub-thumb-img"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className="cat-sub-thumb-fallback"
                                style={{ display: sub.thumbnail_image ? 'none' : 'flex' }}
                              >
                                <Tag size={14} />
                              </div>
                            </div>

                            <div className="cat-sub-meta">
                              <div className="cat-sub-title-row">
                                <span className="cat-sub-name">{sub.name}</span>
                                <span className="cat-sub-slug">/{sub.slug}</span>
                                <span
                                  className={`cat-status-badge ${
                                    sub.status === 'active' ? 'active' : 'inactive'
                                  }`}
                                >
                                  {sub.status}
                                </span>
                              </div>
                              {sub.description && (
                                <p className="cat-sub-desc">{sub.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="cat-sub-actions">
                            <button
                              type="button"
                              className="cat-sub-btn cat-sub-edit"
                              onClick={() => openEditModal(sub, cat)}
                              title="Edit Subcategory"
                            >
                              <Edit2 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              className="cat-sub-btn cat-sub-del"
                              onClick={() => openDeleteModal(sub)}
                              title="Delete Subcategory"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Create / Edit Category Modal */}
      {modalOpen && (
        <div className="cat-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div
            className="cat-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cat-modal-header">
              <div>
                <div className="cat-modal-badge">
                  {isSubcategoryModal ? (
                    <>
                      <Tag size={14} />
                      <span>
                        Subcategory under{' '}
                        <strong>{parentForSubcategory?.name || 'Parent'}</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      <Layers size={14} />
                      <span>Top-Level Category</span>
                    </>
                  )}
                </div>
                <h3 className="cat-modal-title">
                  {editingCategory
                    ? `Edit ${isSubcategoryModal ? 'Subcategory' : 'Category'}`
                    : `Create New ${isSubcategoryModal ? 'Subcategory' : 'Category'}`}
                </h3>
              </div>
              <button
                type="button"
                className="cat-modal-close"
                onClick={() => setModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="cat-form-alert error">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="cat-modal-form">
              {/* Name & Slug */}
              <div className="cat-form-row two-col">
                <div className="cat-field-group">
                  <label>
                    Category Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Consumer Electronics"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="cat-field-group">
                  <label>
                    Slug <span className="opt">(auto-generated if empty)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. consumer-electronics"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="cat-field-group">
                <label>Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description for SEO, marketplace navigation, and buyers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Thumbnail Image (Icon / Logo) */}
              <div className="cat-field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    Category Thumbnail (Square Icon / Logo)
                  </label>
                  {formData.thumbnail_image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnail_image: '' })}
                      style={{
                        fontSize: '0.74rem',
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <X size={12} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={thumbFileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleThumbUpload}
                />

                {/* URL Input + Choose File Button */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter image URL or choose file from device..."
                    value={formData.thumbnail_image}
                    onChange={(e) => setFormData({ ...formData, thumbnail_image: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="cat-btn cat-btn-secondary"
                    onClick={() => !uploadingThumb && thumbFileInputRef.current?.click()}
                    disabled={uploadingThumb}
                    title="Choose thumbnail image from device"
                    style={{
                      padding: '0 14px',
                      height: '38px',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.82rem',
                      cursor: uploadingThumb ? 'not-allowed' : 'pointer',
                      borderColor: 'var(--primary)',
                      color: 'var(--primary)',
                      fontWeight: 600,
                    }}
                  >
                    {uploadingThumb ? <RefreshCw size={14} className="spin-anim" /> : <UploadCloud size={14} />}
                    <span>{uploadingThumb ? 'Uploading...' : 'Choose File'}</span>
                  </button>
                </div>

                {/* Thumbnail Preview */}
                {formData.thumbnail_image && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
                      <img
                        src={formData.thumbnail_image}
                        alt="Thumb Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Preview: {formData.thumbnail_image.startsWith('http') || formData.thumbnail_image.startsWith('/') ? formData.thumbnail_image.split('/').pop() : 'Custom URL'}
                    </span>
                  </div>
                )}
              </div>

              {/* Banner Image (Cover Header) */}
              <div className="cat-field-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    Category Banner (Wide Header Cover)
                  </label>
                  {formData.banner_image && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, banner_image: '' })}
                      style={{
                        fontSize: '0.74rem',
                        color: '#ef4444',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <X size={12} />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleBannerUpload}
                />

                {/* URL Input + Choose File Button */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Enter banner URL or choose file from device..."
                    value={formData.banner_image}
                    onChange={(e) => setFormData({ ...formData, banner_image: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="cat-btn cat-btn-secondary"
                    onClick={() => !uploadingBanner && bannerFileInputRef.current?.click()}
                    disabled={uploadingBanner}
                    title="Choose banner image from device"
                    style={{
                      padding: '0 14px',
                      height: '38px',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.82rem',
                      cursor: uploadingBanner ? 'not-allowed' : 'pointer',
                      borderColor: 'var(--primary)',
                      color: 'var(--primary)',
                      fontWeight: 600,
                    }}
                  >
                    {uploadingBanner ? <RefreshCw size={14} className="spin-anim" /> : <UploadCloud size={14} />}
                    <span>{uploadingBanner ? 'Uploading...' : 'Choose File'}</span>
                  </button>
                </div>

                {/* Banner Preview */}
                {formData.banner_image && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ width: '100%', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
                      <img
                        src={formData.banner_image}
                        alt="Banner Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Display Order */}
              <div className="cat-form-row two-col">
                <div className="cat-field-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active (Visible in Store)</option>
                    <option value="inactive">Inactive (Hidden / Draft)</option>
                  </select>
                </div>

                <div className="cat-field-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  />
                </div>
              </div>

              {/* Parent Category selection (when editing or creating custom hierarchy) */}
              {!isSubcategoryModal && categories.length > 0 && (
                <div className="cat-field-group">
                  <label>Parent Category</label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  >
                    <option value="">None (Top-Level Category)</option>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="cat-modal-footer">
                <button
                  type="button"
                  className="cat-btn cat-btn-secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cat-btn cat-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={16} className="spin-anim" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete / Deactivate Confirmation Modal */}
      {deleteModalOpen && targetCategory && (
        <div className="cat-modal-backdrop" onClick={() => setDeleteModalOpen(false)}>
          <div
            className="cat-modal-dialog delete-confirm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cat-confirm-icon">
              <ShieldAlert size={36} />
            </div>

            <h3 className="cat-confirm-title">
              Delete or Deactivate "{targetCategory.name}"?
            </h3>
            <p className="cat-confirm-text">
              Choose whether to safely deactivate this category (hides it and all subcategories from buyers while keeping data safe) or permanently delete it.
            </p>

            <div className="cat-confirm-actions">
              <button
                type="button"
                className="cat-confirm-btn deactivate"
                onClick={() => handleDeleteAction(true)}
                disabled={deleting}
              >
                <Eye size={16} />
                <span>Safely Deactivate (Recommended)</span>
              </button>

              <button
                type="button"
                className="cat-confirm-btn hard-delete"
                onClick={() => handleDeleteAction(false)}
                disabled={deleting}
              >
                <Trash2 size={16} />
                <span>Permanently Delete</span>
              </button>

              <button
                type="button"
                className="cat-confirm-btn cancel"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
