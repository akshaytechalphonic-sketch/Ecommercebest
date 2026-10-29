import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  DollarSign,
  Layers,
  Store,
  ExternalLink,
  Percent,
  SlidersHorizontal,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Building,
  Mail,
  Box,
  UploadCloud,
  Sparkles,
} from 'lucide-react';
import { adminProductApi, productApi, categoryApi, uploadApi, adminVendorApi } from '../services/api';

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

// Fallback high quality placeholder
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';

export const ProductManager = ({ user, onToast, isAdminMode = true }) => {
  const isAdmin = user?.role === 'admin' || isAdminMode;

  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive' | 'draft'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Categories list for dropdown filters
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Vendors list for Admin product creation & assignment
  const [vendorsList, setVendorsList] = useState([]);

  // Modals state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Admin Approval / Rejection Modal
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [targetApprovalAction, setTargetApprovalAction] = useState('approve'); // 'approve' | 'reject'
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [approvalError, setApprovalError] = useState('');

  // Seller / Admin Create / Edit Product Modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    subcategory_id: '',
    price: '',
    discount_price: '',
    sku: '',
    stock: 20,
    status: 'active',
    images: [],
    vendor_id: '',
  });

  // Image Upload State
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Delete / Deactivate Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Load Categories
  const fetchCategories = async () => {
    try {
      let res;
      if (isAdmin) {
        res = await categoryApi.adminGetCategories();
      } else {
        res = await categoryApi.getCategories();
      }
      if (res?.data) {
        setCategories(res.data);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  // Load Vendors for Admin product assignment
  const fetchVendorsList = async () => {
    if (!isAdmin) return;
    try {
      const res = await adminVendorApi.getVendors({ limit: 100 });
      if (res?.data?.vendors) {
        setVendorsList(res.data.vendors);
      }
    } catch (e) {
      console.error('Failed to load vendors', e);
    }
  };

  // Load Products
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 12 };

      if (search.trim()) params.search = search.trim();
      if (approvalStatusFilter !== 'all') params.approval_status = approvalStatusFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter !== 'all') params.category_id = categoryFilter;

      let res;
      if (isAdmin) {
        res = await adminProductApi.getProducts(params);
      } else {
        res = await productApi.getSellerProducts(params);
      }

      if (res?.data) {
        setProducts(res.data.products || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      onToast?.(err.message || 'Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (isAdmin) {
      fetchVendorsList();
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchProducts(1);
  }, [approvalStatusFilter, statusFilter, categoryFilter]);

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts(1);
  };

  // Update dynamic subcategories when category changes in product form
  const handleFormCategoryChange = (catId) => {
    setProductForm((prev) => ({
      ...prev,
      category_id: catId,
      subcategory_id: '',
    }));
    const found = categories.find((c) => String(c.id) === String(catId));
    if (found && found.subcategories) {
      setSubcategories(found.subcategories);
    } else {
      setSubcategories([]);
    }
  };

  // Handle Admin Approve / Reject Submit
  const handleAdminApprovalSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (targetApprovalAction === 'reject' && !rejectionReason.trim()) {
      setApprovalError('A clear rejection reason is mandatory to reject a product');
      return;
    }

    try {
      setApprovalSubmitting(true);
      setApprovalError('');
      const payload = {
        approval_status: targetApprovalAction === 'approve' ? 'approved' : 'rejected',
        rejection_reason: targetApprovalAction === 'reject' ? rejectionReason.trim() : null,
      };

      await adminProductApi.updateProductStatus(selectedProduct.id, payload);
      onToast?.(
        `Product marked as ${payload.approval_status.toUpperCase()} successfully`,
        targetApprovalAction === 'approve' ? 'success' : 'info'
      );
      setApprovalModalOpen(false);
      setSelectedProduct(null);
      setRejectionReason('');
      fetchProducts(pagination.page);
    } catch (err) {
      setApprovalError(err.message || 'Failed to update product approval status');
    } finally {
      setApprovalSubmitting(false);
    }
  };

  // Generate random unique SKU helper
  const generateSku = () => {
    const prefix = 'SKU';
    const rand = Math.floor(100000 + Math.random() * 900000);
    setProductForm((prev) => ({ ...prev, sku: `${prefix}-${rand}` }));
  };

  // Open Create Modal
  const openCreateModal = () => {
    setIsEditing(false);
    setFormError('');
    const approvedVendor = vendorsList.find((v) => v.status === 'approved') || vendorsList[0];
    const initialVendorId = approvedVendor ? approvedVendor.id : '';
    const initialCatId = categories[0]?.id || '';

    setProductForm({
      name: '',
      slug: '',
      description: '',
      category_id: initialCatId,
      subcategory_id: '',
      price: '',
      discount_price: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      stock: 25,
      status: 'active',
      images: [],
      vendor_id: initialVendorId,
    });
    setCustomUrl('');

    if (categories[0]?.subcategories) {
      setSubcategories(categories[0].subcategories);
    } else {
      setSubcategories([]);
    }
    setFormModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (prod) => {
    setIsEditing(true);
    setFormError('');
    setSelectedProduct(prod);
    setProductForm({
      name: prod.name || '',
      slug: prod.slug || '',
      description: prod.description || '',
      category_id: prod.category_id || '',
      subcategory_id: prod.subcategory_id || '',
      price: prod.price || '',
      discount_price: prod.discount_price || '',
      sku: prod.sku || '',
      stock: prod.stock ?? 0,
      status: prod.status || 'active',
      images: Array.isArray(prod.images) ? prod.images.filter(Boolean) : [],
      vendor_id: prod.vendor_id || '',
    });
    setCustomUrl('');

    const parentCat = categories.find((c) => String(c.id) === String(prod.category_id));
    if (parentCat && parentCat.subcategories) {
      setSubcategories(parentCat.subcategories);
    } else {
      setSubcategories([]);
    }
    setFormModalOpen(true);
  };

  // Image file selection & upload handler
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => {
      const isValidType = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type);
      const isValidSize = f.size <= 5 * 1024 * 1024;
      if (!isValidType) onToast?.(`File '${f.name}' is not an accepted format (JPG, PNG, WEBP, GIF)`, 'error');
      if (!isValidSize) onToast?.(`File '${f.name}' exceeds the 5MB size limit`, 'error');
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    try {
      setUploadingImage(true);
      let uploadedUrls = [];

      if (validFiles.length === 1) {
        const res = await uploadApi.uploadImage(validFiles[0]);
        if (res?.data?.url) {
          uploadedUrls = [res.data.url];
        }
      } else {
        const res = await uploadApi.uploadImages(validFiles);
        if (res?.data?.urls) {
          uploadedUrls = res.data.urls;
        }
      }

      if (uploadedUrls.length > 0) {
        setProductForm((prev) => {
          const existing = (prev.images || []).filter((img) => img && img.trim() !== '');
          return {
            ...prev,
            images: [...existing, ...uploadedUrls].slice(0, 5),
          };
        });
        onToast?.(`${uploadedUrls.length} image(s) uploaded successfully!`, 'success');
      }
    } catch (err) {
      console.error('File upload failed:', err);
      onToast?.(err.message || 'Image upload failed. Please try again.', 'error');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    setProductForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const setPrimaryImage = (indexToPrimary) => {
    setProductForm((prev) => {
      const current = [...(prev.images || [])];
      const target = current[indexToPrimary];
      const remaining = current.filter((_, idx) => idx !== indexToPrimary);
      return {
        ...prev,
        images: [target, ...remaining],
      };
    });
  };

  const addCustomUrl = () => {
    if (!customUrl.trim()) return;
    setProductForm((prev) => {
      const existing = (prev.images || []).filter((img) => img && img.trim() !== '');
      return {
        ...prev,
        images: [...existing, customUrl.trim()].slice(0, 5),
      };
    });
    setCustomUrl('');
  };

  // Handle Product Form Submit (Create or Update)
  const handleProductFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Client validations
    if (!productForm.name.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (!productForm.category_id) {
      setFormError('Please select a product category');
      return;
    }
    if (!productForm.price || Number(productForm.price) <= 0) {
      setFormError('Price must be greater than 0');
      return;
    }
    if (
      productForm.discount_price &&
      Number(productForm.discount_price) >= Number(productForm.price)
    ) {
      setFormError('Discount price must be less than regular price');
      return;
    }
    if (!productForm.sku.trim()) {
      setFormError('Product SKU is required');
      return;
    }

    const cleanedImages = (productForm.images || [])
      .map((img) => img.trim())
      .filter((img) => img.length > 0);

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim() || null,
      category_id: Number(productForm.category_id),
      subcategory_id: productForm.subcategory_id ? Number(productForm.subcategory_id) : null,
      price: Number(productForm.price),
      discount_price: productForm.discount_price ? Number(productForm.discount_price) : null,
      sku: productForm.sku.trim(),
      stock: Number(productForm.stock),
      status: productForm.status,
      images: cleanedImages,
    };

    if (isAdmin && productForm.vendor_id) {
      payload.vendor_id = Number(productForm.vendor_id);
    }

    if (productForm.slug.trim()) {
      payload.slug = productForm.slug.trim();
    }

    try {
      setFormSubmitting(true);
      if (isEditing) {
        await productApi.updateProduct(selectedProduct.id, payload);
        onToast?.('Product updated successfully', 'success');
      } else {
        await productApi.createProduct(payload);
        onToast?.(
          isAdmin
            ? 'Product created & published directly to catalog'
            : 'Product submitted successfully for review',
          'success'
        );
      }
      setFormModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err) {
      setFormError(err.message || 'Failed to save product');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete / Deactivate Submit
  const handleDeleteProduct = async (deactivate = false) => {
    if (!deletingProduct) return;
    try {
      setDeleting(true);
      await productApi.deleteProduct(deletingProduct.id, deactivate);
      onToast?.(
        deactivate
          ? 'Product status changed to inactive (safe deactivation)'
          : 'Product permanently removed from database',
        'info'
      );
      setDeleteModalOpen(false);
      setDeletingProduct(null);
      fetchProducts(pagination.page);
    } catch (err) {
      onToast?.(err.message || 'Failed to delete/deactivate product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Metrics summary
  const pendingCount = products.filter((p) => p.approval_status === 'pending').length;
  const approvedCount = products.filter((p) => p.approval_status === 'approved').length;
  const rejectedCount = products.filter((p) => p.approval_status === 'rejected').length;

  return (
    <div className="pm-wrap">
      {/* 1. Header Banner & Action Bar */}
      <div className="pm-header-card">
        <div className="pm-header-info">
          <div className="pm-header-icon">
            <Package size={22} />
          </div>
          <div>
            <h2 className="pm-header-title">
              {isAdmin ? 'Product Inventory & Moderation' : 'Product Inventory'}
            </h2>
            <div className="pm-header-subtitle">
              {isAdmin
                ? 'Manage catalog products, stock levels and seller listing approvals'
                : 'Manage your store products, pricing, stock and media'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="pm-btn pm-btn-secondary"
            onClick={() => fetchProducts(pagination.page)}
            title="Refresh product list"
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="pm-btn pm-btn-primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. Key Performance Metric Cards */}
      <div className="pm-kpi-grid">
        <div
          className="pm-kpi-card total"
          style={{ cursor: 'pointer' }}
          onClick={() => setApprovalStatusFilter('all')}
        >
          <div className="pm-kpi-head">
            <span className="pm-kpi-label">Total Listings</span>
            <div className="pm-kpi-icon-wrap" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
              <Box size={18} />
            </div>
          </div>
          <div className="pm-kpi-value">{pagination.total || products.length}</div>
        </div>

        <div
          className="pm-kpi-card pending"
          style={{ cursor: 'pointer' }}
          onClick={() => setApprovalStatusFilter('pending')}
        >
          <div className="pm-kpi-head">
            <span className="pm-kpi-label">Pending Review</span>
            <div className="pm-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="pm-kpi-value" style={{ color: '#d97706' }}>{pendingCount}</div>
        </div>

        <div
          className="pm-kpi-card approved"
          style={{ cursor: 'pointer' }}
          onClick={() => setApprovalStatusFilter('approved')}
        >
          <div className="pm-kpi-head">
            <span className="pm-kpi-label">Approved & Live</span>
            <div className="pm-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="pm-kpi-value" style={{ color: '#059669' }}>{approvedCount}</div>
        </div>

        <div
          className="pm-kpi-card rejected"
          style={{ cursor: 'pointer' }}
          onClick={() => setApprovalStatusFilter('rejected')}
        >
          <div className="pm-kpi-head">
            <span className="pm-kpi-label">Rejected Listings</span>
            <div className="pm-kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div className="pm-kpi-value" style={{ color: '#dc2626' }}>{rejectedCount}</div>
        </div>
      </div>

      {/* 3. Filter Bar & Search Input */}
      <div className="pm-filter-bar">
        <div className="pm-pills">
          <button
            type="button"
            className={`pm-pill ${approvalStatusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setApprovalStatusFilter('all')}
          >
            <span>All Listings</span>
          </button>

          <button
            type="button"
            className={`pm-pill ${approvalStatusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setApprovalStatusFilter('pending')}
          >
            <Clock size={13} />
            <span>Pending Review</span>
            {pendingCount > 0 && <span className="pm-pill-count">{pendingCount}</span>}
          </button>

          <button
            type="button"
            className={`pm-pill ${approvalStatusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setApprovalStatusFilter('approved')}
          >
            <CheckCircle2 size={13} />
            <span>Approved</span>
          </button>

          <button
            type="button"
            className={`pm-pill ${approvalStatusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setApprovalStatusFilter('rejected')}
          >
            <XCircle size={13} />
            <span>Rejected</span>
          </button>
        </div>

        <div className="pm-search-wrap">
          <select
            className="pm-select-box"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <form onSubmit={handleSearchSubmit} className="pm-search-input-box">
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search product, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchProducts(1);
                }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* 4. Products Table View */}
      <div className="pm-table-card">
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <RefreshCw size={28} className="spin-anim" style={{ color: 'var(--primary)', margin: '0 auto' }} />
            <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Loading marketplace product catalog...
            </p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Package size={48} style={{ opacity: 0.3, margin: '0 auto 12px', color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 6px' }}>
              No products found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 16px' }}>
              No products match your current search or status filter. Click Add Product to create your first listing!
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="pm-btn pm-btn-secondary"
                onClick={() => {
                  setApprovalStatusFilter('all');
                  setCategoryFilter('all');
                  setSearch('');
                }}
              >
                Reset Filters
              </button>
              <button
                type="button"
                className="pm-btn pm-btn-primary"
                onClick={openCreateModal}
              >
                <Plus size={15} />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        ) : (
          <table className="pm-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU & Category</th>
                {isAdmin && <th>Seller Store</th>}
                <th>Price & Discount</th>
                <th>Inventory</th>
                <th>Approval Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => {
                const firstImg =
                  Array.isArray(prod.images) && prod.images.length > 0
                    ? prod.images[0]
                    : null;
                const hasDiscount = prod.discount_price && Number(prod.discount_price) < Number(prod.price);

                return (
                  <tr key={prod.id}>
                    {/* Product Basic Info */}
                    <td>
                      <div className="pm-prod-cell">
                        <img
                          src={getProductImageUrl(firstImg) || PLACEHOLDER_IMG}
                          alt={prod.name}
                          className="pm-prod-img"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = PLACEHOLDER_IMG;
                          }}
                        />
                        <div>
                          <div className="pm-prod-name">{prod.name}</div>
                          <div className="pm-prod-slug">slug: /{prod.slug}</div>
                        </div>
                      </div>
                    </td>

                    {/* SKU & Category */}
                    <td>
                      <div>
                        <span className="pm-sku-chip">{prod.sku}</span>
                        <div className="pm-cat-text">
                          {prod.category?.name || 'Category'}
                          {prod.subcategory?.name && (
                            <span style={{ color: 'var(--text-muted)' }}> → {prod.subcategory.name}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Seller Store (Admin view only) */}
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                            {prod.vendor?.store_name || `Vendor #${prod.vendor_id}`}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {prod.vendor?.store_email || 'Verified Seller'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Pricing */}
                    <td>
                      <div className="pm-price-block">
                        {hasDiscount ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="pm-current-price">
                              ₹{Number(prod.discount_price).toLocaleString()}
                            </span>
                            <span className="pm-old-price">
                              ₹{Number(prod.price).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="pm-current-price" style={{ color: 'var(--text-primary)' }}>
                            ₹{Number(prod.price).toLocaleString()}
                          </span>
                        )}
                        {hasDiscount && prod.discount_percent && (
                          <span className="pm-discount-pill">
                            {prod.discount_percent}% OFF
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock */}
                    <td>
                      <span
                        className={`pm-stock-pill ${
                          prod.stock > 5 ? 'in-stock' : prod.stock > 0 ? 'low-stock' : 'out-of-stock'
                        }`}
                      >
                        <span className="pm-stock-dot" />
                        <span>
                          {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of Stock'}
                        </span>
                      </span>
                    </td>

                    {/* Approval Status Badge */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className={`pm-approval-badge ${prod.approval_status}`}>
                          {prod.approval_status === 'approved' && <CheckCircle2 size={12} />}
                          {prod.approval_status === 'pending' && <Clock size={12} />}
                          {prod.approval_status === 'rejected' && <XCircle size={12} />}
                          <span>{prod.approval_status}</span>
                        </span>
                        {prod.status !== 'active' && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                            }}
                          >
                            [{prod.status}]
                          </span>
                        )}
                        {prod.approval_status === 'rejected' && prod.rejection_reason && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: '#dc2626',
                              maxWidth: '180px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={prod.rejection_reason}
                          >
                            Reason: {prod.rejection_reason}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* View Details */}
                        <button
                          type="button"
                          className="pm-act-btn"
                          onClick={() => {
                            setSelectedProduct(prod);
                            setDetailModalOpen(true);
                          }}
                          title="View Product Details"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Admin Quick Approve / Reject Actions */}
                        {isAdmin && prod.approval_status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="pm-act-btn approve"
                              onClick={() => {
                                setSelectedProduct(prod);
                                setTargetApprovalAction('approve');
                                setApprovalError('');
                                setApprovalModalOpen(true);
                              }}
                              title="Approve Product"
                            >
                              <Check size={15} />
                            </button>

                            <button
                              type="button"
                              className="pm-act-btn reject"
                              onClick={() => {
                                setSelectedProduct(prod);
                                setTargetApprovalAction('reject');
                                setRejectionReason('');
                                setApprovalError('');
                                setApprovalModalOpen(true);
                              }}
                              title="Reject Product"
                            >
                              <X size={15} />
                            </button>
                          </>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          className="pm-act-btn"
                          onClick={() => openEditModal(prod)}
                          title="Edit Product"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          className="pm-act-btn delete"
                          onClick={() => {
                            setDeletingProduct(prod);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete / Deactivate"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-subtle)',
            }}
          >
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Showing {products.length} of {pagination.total} listings
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="pm-btn pm-btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => fetchProducts(pagination.page - 1)}
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              >
                Previous
              </button>
              <button
                type="button"
                className="pm-btn pm-btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchProducts(pagination.page + 1)}
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: PRODUCT DETAILS INSPECTION MODAL
          ===================================================================== */}
      {detailModalOpen && selectedProduct && (
        <div className="admin-modal-backdrop" onClick={() => setDetailModalOpen(false)}>
          <div
            className="pm-modal-box"
            style={{ maxWidth: '680px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={22} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  Product Details Inspection
                </h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setDetailModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="pm-modal-scroll">
              {/* Product Gallery */}
              {Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0 && (
                <div>
                  <div className="pm-sec-title">
                    <ImageIcon size={14} /> Product Gallery Photos
                  </div>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '6px' }}>
                    {selectedProduct.images.map((img, i) => (
                      <img
                        key={i}
                        src={getProductImageUrl(img) || PLACEHOLDER_IMG}
                        alt={`Product ${i + 1}`}
                        style={{
                          width: '90px',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = PLACEHOLDER_IMG;
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Status Banner */}
              {selectedProduct.approval_status === 'rejected' && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#dc2626',
                    fontSize: '0.86rem',
                  }}
                >
                  <strong>Listing Rejected:</strong> {selectedProduct.rejection_reason || 'Guidelines not met'}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Product Name
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {selectedProduct.name}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    SKU Code
                  </span>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)', marginTop: '2px' }}>
                    {selectedProduct.sku}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Price & Discount
                  </span>
                  <div style={{ fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    ₹{Number(selectedProduct.price).toLocaleString()}
                    {selectedProduct.discount_price && (
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        (Discount: ₹{Number(selectedProduct.discount_price).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Stock Level
                  </span>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>
                    {selectedProduct.stock} Units Available
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Category Hierarchy
                  </span>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedProduct.category?.name || 'Category'}
                    {selectedProduct.subcategory?.name && ` → ${selectedProduct.subcategory.name}`}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Seller Store
                  </span>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, marginTop: '2px' }}>
                    {selectedProduct.vendor?.store_name || `Vendor #${selectedProduct.vendor_id}`}
                  </div>
                </div>
              </div>

              {selectedProduct.description && (
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Description
                  </span>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '0.86rem',
                      lineHeight: '1.5',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-subtle)',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {selectedProduct.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pm-modal-foot">
              <button
                type="button"
                className="pm-btn pm-btn-secondary"
                onClick={() => setDetailModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: ADMIN APPROVAL / REJECTION WORKFLOW MODAL
          ===================================================================== */}
      {approvalModalOpen && selectedProduct && (
        <div className="admin-modal-backdrop" onClick={() => setApprovalModalOpen(false)}>
          <div
            className="pm-modal-box"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {targetApprovalAction === 'approve' ? (
                  <CheckCircle2 size={22} color="#10b981" />
                ) : (
                  <XCircle size={22} color="#ef4444" />
                )}
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  {targetApprovalAction === 'approve' ? 'Approve Product Listing' : 'Reject Product Listing'}
                </h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setApprovalModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdminApprovalSubmit}>
              <div className="pm-modal-scroll">
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                  Product: <strong>{selectedProduct.name}</strong> (SKU: {selectedProduct.sku})
                </p>

                {targetApprovalAction === 'approve' ? (
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '8px',
                      fontSize: '0.86rem',
                      color: '#059669',
                      lineHeight: '1.5',
                    }}
                  >
                    Approving this product will make it immediately active and visible in the public marketplace catalog for all customers.
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      Rejection Reason <span style={{ color: '#ef4444' }}>* (Mandatory)</span>
                    </label>
                    <textarea
                      rows={3}
                      className="pm-input-field"
                      placeholder="e.g. Inappropriate images, prohibited item, or invalid pricing..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                    />
                  </div>
                )}

                {approvalError && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#dc2626',
                      fontSize: '0.84rem',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    {approvalError}
                  </div>
                )}
              </div>

              <div className="pm-modal-foot">
                <button
                  type="button"
                  className="pm-btn pm-btn-secondary"
                  onClick={() => setApprovalModalOpen(false)}
                  disabled={approvalSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pm-btn"
                  disabled={approvalSubmitting}
                  style={{
                    background: targetApprovalAction === 'approve' ? '#10b981' : '#ef4444',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  {approvalSubmitting
                    ? 'Updating...'
                    : targetApprovalAction === 'approve'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: CREATE / EDIT PRODUCT FORM MODAL
          ===================================================================== */}
      {formModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => setFormModalOpen(false)}>
          <div
            className="pm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Package size={22} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.22rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  {isEditing ? 'Edit Product Details' : 'Add New Marketplace Product'}
                </h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setFormModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductFormSubmit}>
              <div className="pm-modal-scroll">
                {formError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#dc2626',
                      fontSize: '0.86rem',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                {/* SECTION 1: BASIC INFORMATION */}
                <div>
                  <div className="pm-sec-title">
                    <Box size={14} /> 1. Basic Product Information
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="pm-field">
                      <label className="pm-lbl">
                        Product Name <span className="pm-req">*</span>
                      </label>
                      <input
                        type="text"
                        className="pm-input-field"
                        placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="pm-form-row">
                      <div className="pm-field">
                        <label className="pm-lbl">
                          Category <span className="pm-req">*</span>
                        </label>
                        <select
                          className="pm-input-field"
                          value={productForm.category_id}
                          onChange={(e) => handleFormCategoryChange(e.target.value)}
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pm-field">
                        <label className="pm-lbl">Subcategory (Optional)</label>
                        <select
                          className="pm-input-field"
                          value={productForm.subcategory_id}
                          onChange={(e) => setProductForm({ ...productForm, subcategory_id: e.target.value })}
                        >
                          <option value="">None / Top-level</option>
                          {subcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Admin Store Assignment */}
                    {isAdmin && (
                      <div className="pm-field">
                        <label className="pm-lbl">
                          Assign to Seller Store <span className="pm-req">*</span>
                        </label>
                        <select
                          className="pm-input-field"
                          value={productForm.vendor_id}
                          onChange={(e) => setProductForm({ ...productForm, vendor_id: e.target.value })}
                        >
                          <option value="">Marketplace Official Store (Default)</option>
                          {vendorsList.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.store_name} ({v.store_email || `ID #${v.id}`}) — {v.status.toUpperCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 2: PRICING & INVENTORY */}
                <div>
                  <div className="pm-sec-title">
                    <DollarSign size={14} /> 2. Pricing & Inventory
                  </div>

                  <div className="pm-form-row-3" style={{ marginBottom: '12px' }}>
                    <div className="pm-field">
                      <label className="pm-lbl">
                        Price (₹) <span className="pm-req">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="pm-input-field"
                        placeholder="2999.00"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        required
                      />
                    </div>

                    <div className="pm-field">
                      <label className="pm-lbl">Discount Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="pm-input-field"
                        placeholder="2499.00"
                        value={productForm.discount_price}
                        onChange={(e) => setProductForm({ ...productForm, discount_price: e.target.value })}
                      />
                    </div>

                    <div className="pm-field">
                      <label className="pm-lbl">
                        Stock Quantity <span className="pm-req">*</span>
                      </label>
                      <input
                        type="number"
                        className="pm-input-field"
                        placeholder="50"
                        value={productForm.stock}
                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="pm-form-row">
                    <div className="pm-field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="pm-lbl">
                          SKU Code <span className="pm-req">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={generateSku}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Auto Generate SKU
                        </button>
                      </div>
                      <input
                        type="text"
                        className="pm-input-field"
                        placeholder="SKU-847291"
                        value={productForm.sku}
                        onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                        required
                      />
                    </div>

                    <div className="pm-field">
                      <label className="pm-lbl">Lifecycle Status</label>
                      <select
                        className="pm-input-field"
                        value={productForm.status}
                        onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                      >
                        <option value="active">Active (Available for purchase)</option>
                        <option value="inactive">Inactive (Hidden from search)</option>
                        <option value="draft">Draft (Work in progress)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: PRODUCT IMAGES (CHOOSE FILE + WEB URL) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div className="pm-sec-title" style={{ margin: 0 }}>
                      <ImageIcon size={14} /> 3. Product Images (Choose File or Web URL)
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {(productForm.images || []).filter(Boolean).length}/5 Photos
                    </span>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    multiple
                    onChange={handleFileSelect}
                  />

                  {/* Choose File Dropzone */}
                  <div
                    className="pm-dropzone"
                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                  >
                    <div className="pm-dropzone-icon">
                      {uploadingImage ? (
                        <RefreshCw size={22} className="spin-anim" />
                      ) : (
                        <UploadCloud size={24} />
                      )}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {uploadingImage ? 'Uploading image...' : 'Click to Choose File from Device'}
                      </span>
                      <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        PNG, JPG, WEBP or GIF up to 5MB (Max 5 photos)
                      </p>
                    </div>
                    <button
                      type="button"
                      className="pm-btn pm-btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.78rem', pointerEvents: 'none', background: '#ffffff', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }}
                    >
                      <ImageIcon size={14} />
                      <span>Browse Files</span>
                    </button>
                  </div>

                  {/* Direct Web URL Input */}
                  <div style={{ marginTop: '12px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Or paste direct image Web URL:
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        className="pm-input-field"
                        style={{ flex: 1 }}
                        placeholder="https://images.unsplash.com/photo-..."
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomUrl();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="pm-btn pm-btn-secondary"
                        onClick={addCustomUrl}
                      >
                        + Add URL
                      </button>
                    </div>
                  </div>

                  {/* Live Thumbnails Preview Gallery */}
                  {(productForm.images || []).filter(Boolean).length > 0 && (
                    <div style={{ marginTop: '14px' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                        Selected Product Images (First photo is Primary Catalog Cover):
                      </span>
                      <div className="pm-gallery-grid">
                        {(productForm.images || []).filter(Boolean).map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className={`pm-gallery-item ${idx === 0 ? 'primary' : ''}`}
                          >
                            <img
                              src={getProductImageUrl(imgUrl) || PLACEHOLDER_IMG}
                              alt={`Product ${idx + 1}`}
                              className="pm-gallery-img"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = PLACEHOLDER_IMG;
                              }}
                            />

                            {/* Primary Badge */}
                            {idx === 0 && (
                              <span className="pm-gallery-primary-tag">
                                PRIMARY
                              </span>
                            )}

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(idx);
                              }}
                              title="Remove photo"
                              className="pm-gallery-del-btn"
                            >
                              <X size={11} />
                            </button>

                            {/* Set Primary Button if not already */}
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => setPrimaryImage(idx)}
                                title="Set as main catalog photo"
                                className="pm-gallery-make-primary-btn"
                              >
                                Set Main
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 4: DESCRIPTION */}
                <div>
                  <div className="pm-sec-title">
                    <Tag size={14} /> 4. Product Description
                  </div>
                  <textarea
                    rows={4}
                    className="pm-input-field"
                    placeholder="Provide detailed description of specifications, key features, packaging, warranty..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="pm-modal-foot">
                <button
                  type="button"
                  className="pm-btn pm-btn-secondary"
                  onClick={() => setFormModalOpen(false)}
                  disabled={formSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pm-btn pm-btn-primary"
                  disabled={formSubmitting}
                >
                  {formSubmitting
                    ? 'Saving...'
                    : isEditing
                    ? 'Update Product'
                    : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: DELETE OR DEACTIVATE CONFIRMATION MODAL
          ===================================================================== */}
      {deleteModalOpen && deletingProduct && (
        <div className="admin-modal-backdrop" onClick={() => setDeleteModalOpen(false)}>
          <div
            className="pm-modal-box"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle size={22} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  Manage Product Status
                </h3>
              </div>
              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setDeleteModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="pm-modal-scroll">
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                Choose action for product: <strong>{deletingProduct.name}</strong>
              </p>
              <div
                style={{
                  padding: '14px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                }}
              >
                <strong>Safe Deactivate:</strong> Sets status to inactive. The product will be hidden from shoppers but can be reactivated anytime.
                <br /><br />
                <strong>Permanent Delete:</strong> Completely removes the product and inventory record from MySQL.
              </div>
            </div>

            <div className="pm-modal-foot">
              <button
                type="button"
                className="pm-btn pm-btn-secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pm-btn"
                onClick={() => handleDeleteProduct(true)}
                disabled={deleting}
                style={{ background: '#f59e0b', color: '#ffffff', fontWeight: 700 }}
              >
                Safe Deactivate
              </button>
              <button
                type="button"
                className="pm-btn"
                onClick={() => handleDeleteProduct(false)}
                disabled={deleting}
                style={{ background: '#ef4444', color: '#ffffff', fontWeight: 700 }}
              >
                Permanent Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
