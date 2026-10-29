import React, { useState, useEffect } from 'react';
import {
  Store,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  RefreshCw,
  Percent,
  Phone,
  MapPin,
  Eye,
  Check,
  X,
  ShieldCheck,
  UserCheck,
  Building,
  Mail,
  Sliders,
} from 'lucide-react';
import { adminVendorApi } from '../services/api';

export const VendorManager = ({ user, onToast }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected' | 'suspended'
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  // Modal State
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject' | 'view'
  const [commissionRate, setCommissionRate] = useState(10);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Vendors
  const fetchVendors = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 12 };
      if (filterStatus !== 'all') params.status = filterStatus;
      if (search.trim()) params.search = search.trim();

      const res = await adminVendorApi.getVendors(params);
      if (res?.data) {
        setVendors(res.data.vendors || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      onToast?.(err.message || 'Failed to fetch sellers list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(1);
  }, [filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVendors(1);
  };

  // Open Approval/Rejection Modal
  const openActionModal = (vendor, type) => {
    setSelectedVendor(vendor);
    setActionType(type);
    setCommissionRate(vendor.commission_rate ?? 10);
    setRejectionReason(vendor.rejection_reason || '');
    setErrorMsg('');
  };

  const closeActionModal = () => {
    setSelectedVendor(null);
    setErrorMsg('');
  };

  // Submit Approval or Rejection
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;

    if (actionType === 'reject' && !rejectionReason.trim()) {
      setErrorMsg('A rejection explanation is mandatory to notify the applicant.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload = {
        status: actionType === 'approve' ? 'approved' : 'rejected',
        commission_rate: Number(commissionRate) || 10,
        rejection_reason: actionType === 'reject' ? rejectionReason.trim() : null,
      };

      await adminVendorApi.updateVendorStatus(selectedVendor.id, payload);
      onToast?.(
        `Seller store marked as ${payload.status.toUpperCase()} successfully`,
        actionType === 'approve' ? 'success' : 'info'
      );
      closeActionModal();
      fetchVendors(pagination.page);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update seller status');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = vendors.filter((v) => v.status === 'pending').length;
  const approvedCount = vendors.filter((v) => v.status === 'approved').length;
  const rejectedCount = vendors.filter((v) => v.status === 'rejected').length;

  return (
    <div className="vendor-manager-module" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Store size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              Sellers & Stores
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Review merchant registrations, commission rates and store status
            </span>
          </div>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={() => fetchVendors(pagination.page)}
            title="Refresh list"
            style={{ height: '36px', padding: '0 14px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Pills & Search */}
      <div className="admin-filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="admin-filter-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            className={`admin-filter-pill ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            <span>All Sellers</span>
            <span className="pill-count">{pagination.total || vendors.length}</span>
          </button>

          <button
            type="button"
            className={`admin-filter-pill pending ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            <Clock size={13} />
            <span>Pending Approvals</span>
            {pendingCount > 0 && <span className="pill-count pulse">{pendingCount}</span>}
          </button>

          <button
            type="button"
            className={`admin-filter-pill approved ${filterStatus === 'approved' ? 'active' : ''}`}
            onClick={() => setFilterStatus('approved')}
          >
            <CheckCircle2 size={13} />
            <span>Approved</span>
            <span className="pill-count">{approvedCount}</span>
          </button>

          <button
            type="button"
            className={`admin-filter-pill rejected ${filterStatus === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilterStatus('rejected')}
          >
            <XCircle size={13} />
            <span>Rejected</span>
            <span className="pill-count">{rejectedCount}</span>
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="admin-search-form" style={{ minWidth: '260px' }}>
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search store name, email, owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-field"
          />
          {search && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => {
                setSearch('');
                fetchVendors(1);
              }}
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      {/* 3. Sellers Table */}
      <div className="admin-table-wrapper" style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        {loading ? (
          <div className="admin-table-loading" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <RefreshCw size={28} className="spin-anim" />
            <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading marketplace sellers...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="admin-empty-table" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <Store size={44} style={{ opacity: 0.35, margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>No sellers found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '6px 0 16px' }}>
              No seller accounts match your current filter selection.
            </p>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                setFilterStatus('all');
                setSearch('');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px' }}>Store / Brand</th>
                <th style={{ padding: '12px 16px' }}>Owner Account</th>
                <th style={{ padding: '12px 16px' }}>Contact & Location</th>
                <th style={{ padding: '12px 16px' }}>Commission Rate</th>
                <th style={{ padding: '12px 16px' }}>Approval Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="admin-table-row"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  {/* Store Name & Logo */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {vendor.logo_url ? (
                          <img src={vendor.logo_url} alt={vendor.store_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span>{vendor.store_name?.charAt(0) || 'S'}</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                          {vendor.store_name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          slug: /{vendor.store_slug}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Owner */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                        {vendor.user?.name || 'Store Applicant'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {vendor.user?.email || vendor.store_email || '—'}
                      </span>
                    </div>
                  </td>

                  {/* Contact */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Phone size={12} color="var(--text-muted)" />
                        <span>{vendor.store_phone || vendor.user?.phone || 'No phone'}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={12} color="var(--text-muted)" />
                        <span>{vendor.city ? `${vendor.city}, ${vendor.state || ''}` : 'India'}</span>
                      </span>
                    </div>
                  </td>

                  {/* Commission */}
                  <td style={{ padding: '14px 16px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(99, 102, 241, 0.08)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                      }}
                    >
                      <Percent size={12} />
                      <span>{vendor.commission_rate ?? 10}%</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span className={`admin-status-tag ${vendor.status}`}>
                        {vendor.status === 'approved' && <CheckCircle2 size={12} />}
                        {vendor.status === 'pending' && <Clock size={12} />}
                        {vendor.status === 'rejected' && <XCircle size={12} />}
                        <span>{vendor.status}</span>
                      </span>
                      {vendor.status === 'rejected' && vendor.rejection_reason && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            color: '#dc2626',
                            maxWidth: '180px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={vendor.rejection_reason}
                        >
                          Reason: {vendor.rejection_reason}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="admin-action-btn view"
                        onClick={() => openActionModal(vendor, 'view')}
                        title="View Store Details"
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)', cursor: 'pointer' }}
                      >
                        <Eye size={14} />
                      </button>

                      {vendor.status !== 'approved' && (
                        <button
                          type="button"
                          className="admin-action-btn approve"
                          onClick={() => openActionModal(vendor, 'approve')}
                          title="Approve Seller"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #10b981',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#059669',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                        </button>
                      )}

                      {vendor.status !== 'rejected' && (
                        <button
                          type="button"
                          className="admin-action-btn reject"
                          onClick={() => openActionModal(vendor, 'reject')}
                          title="Reject Seller"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #ef4444',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#dc2626',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Action Modal (Approve / Reject / View) */}
      {selectedVendor && (
        <div className="admin-modal-backdrop" onClick={closeActionModal}>
          <div
            className="admin-modal-card"
            style={{ maxWidth: '540px', width: '92%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Store size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  {actionType === 'approve'
                    ? 'Approve Merchant Store'
                    : actionType === 'reject'
                    ? 'Reject Store Application'
                    : 'Merchant Store Dossier'}
                </h3>
              </div>
              <button type="button" className="admin-modal-close" onClick={closeActionModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleActionSubmit}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Store Header Details */}
                <div style={{ padding: '14px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {selectedVendor.store_name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Owner: {selectedVendor.user?.name} ({selectedVendor.user?.email})
                  </div>
                  {selectedVendor.store_description && (
                    <p style={{ margin: '8px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      {selectedVendor.store_description}
                    </p>
                  )}
                </div>

                {/* Approve Form */}
                {actionType === 'approve' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                      Marketplace Commission Fee (%)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="admin-search-field"
                        style={{ width: '100%', borderRadius: '6px' }}
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        required
                      />
                      <Percent size={18} style={{ opacity: 0.5 }} />
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Standard marketplace commission is between 5% and 15%.
                    </span>
                  </div>
                )}

                {/* Reject Form */}
                {actionType === 'reject' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '6px' }}>
                      Rejection Explanation <span style={{ color: '#ef4444' }}>* (Required)</span>
                    </label>
                    <textarea
                      rows={3}
                      className="admin-search-field"
                      style={{ width: '100%', borderRadius: '6px', padding: '10px' }}
                      placeholder="e.g. Missing valid GST / PAN credentials, or policy non-compliance..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                    />
                  </div>
                )}

                {errorMsg && (
                  <div style={{ padding: '10px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '6px', fontSize: '0.84rem' }}>
                    {errorMsg}
                  </div>
                )}
              </div>

              <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={closeActionModal}
                  disabled={submitting}
                >
                  {actionType === 'view' ? 'Close' : 'Cancel'}
                </button>

                {actionType !== 'view' && (
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    disabled={submitting}
                    style={{
                      background: actionType === 'approve' ? '#10b981' : '#ef4444',
                      color: '#ffffff',
                    }}
                  >
                    {submitting ? 'Updating...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
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

export default VendorManager;
