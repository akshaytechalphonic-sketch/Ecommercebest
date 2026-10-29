import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Phone, Home, Briefcase, Tag, Trash2, Check, Star, Edit3, X } from 'lucide-react';
import { addressApi } from '../services/api';

export const AddressManager = ({ onToast }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    recipient_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    type: 'home',
    is_default: false,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await addressApi.getAddresses();
      if (res?.data) {
        setAddresses(res.data);
      }
    } catch (err) {
      onToast?.(err.message || 'Failed to load addresses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setFormData({
      recipient_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      type: 'home',
      is_default: addresses.length === 0,
    });
    setEditingId(null);
    setFormError('');
    setShowForm(false);
  };

  const handleEdit = (addr) => {
    setFormData({
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      country: addr.country || 'India',
      type: addr.type || 'home',
      is_default: addr.is_default,
    });
    setEditingId(addr.id);
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (editingId) {
        await addressApi.updateAddress(editingId, formData);
        onToast?.('Delivery address updated successfully', 'success');
      } else {
        await addressApi.createAddress(formData);
        onToast?.('New delivery address added successfully', 'success');
      }
      resetForm();
      await fetchAddresses();
    } catch (err) {
      setFormError(err.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressApi.setDefault(id);
      onToast?.('Default delivery address updated', 'success');
      await fetchAddresses();
    } catch (err) {
      onToast?.(err.message || 'Failed to update default address', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressApi.deleteAddress(id);
      onToast?.('Address deleted successfully', 'info');
      await fetchAddresses();
    } catch (err) {
      onToast?.(err.message || 'Failed to delete address', 'error');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'work':
        return <Briefcase size={14} />;
      case 'other':
        return <Tag size={14} />;
      default:
        return <Home size={14} />;
    }
  };

  return (
    <div style={{ marginTop: '32px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h4
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Delivery Addresses
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Manage delivery locations for marketplace orders
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{ padding: '8px 16px', fontSize: '0.88rem', width: 'auto' }}
          >
            <Plus size={16} />
            <span>Add Address</span>
          </button>
        )}
      </div>

      {showForm && (
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1.5px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <h5 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {editingId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h5>
            <button
              type="button"
              onClick={resetForm}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                marginBottom: '16px',
              }}
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>Recipient Name *</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. John Doe"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>Phone Number *</label>
                <input
                  type="tel"
                  className="input-field"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ marginBottom: '4px' }}>Address Line 1 (Flat, House no., Street) *</label>
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '14px' }}
                placeholder="e.g. Flat 301, Sunshine Heights"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ marginBottom: '4px' }}>Address Line 2 (Area, Landmark)</label>
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '14px' }}
                placeholder="e.g. Opposite City Mall"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>City *</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '14px' }}
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>State *</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '14px' }}
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '4px' }}>Pincode *</label>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. 110001"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="form-label" style={{ margin: 0 }}>Type:</span>
                {['home', 'work', 'other'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t })}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: formData.type === t ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                      background: formData.type === t ? 'var(--primary-light)' : 'var(--bg-card)',
                      color: formData.type === t ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer', marginLeft: 'auto' }}>
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
                <span>Set as default address</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ width: 'auto' }}>
                {submitting ? 'Saving...' : editingId ? 'Update Address' : 'Save Address'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          Loading addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div
          style={{
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '36px',
            textAlign: 'center',
            background: 'var(--bg-subtle)',
          }}
        >
          <MapPin size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
          <h5 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            No delivery addresses saved yet
          </h5>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
            Add your primary shipping location for faster checkout
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{ width: 'auto', margin: '0 auto' }}
          >
            <Plus size={16} />
            <span>Add First Address</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                background: addr.is_default ? 'var(--bg-card)' : 'var(--bg-subtle)',
                border: addr.is_default ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                position: 'relative',
                boxShadow: addr.is_default ? '0 4px 14px rgba(79, 70, 229, 0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {addr.recipient_name}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {getTypeIcon(addr.type)}
                    {addr.type}
                  </span>

                  {addr.is_default && (
                    <span
                      style={{
                        padding: '2px 9px',
                        background: 'var(--primary-light)',
                        border: '1px solid rgba(79, 70, 229, 0.25)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Star size={11} fill="currentColor" />
                      Default
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleEdit(addr)}
                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    title="Edit address"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleDelete(addr.id)}
                    style={{ padding: '4px 8px', color: '#ef4444' }}
                    title="Delete address"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '6px' }}>
                {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                {addr.city}, {addr.state} - {addr.postal_code}, {addr.country}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', marginTop: '10px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Phone size={13} />
                  {addr.phone}
                </span>

                {!addr.is_default && (
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => handleSetDefault(addr.id)}
                    style={{ fontSize: '0.82rem', fontWeight: 600 }}
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
