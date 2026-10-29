import React, { useState } from 'react';
import { User, Mail, Lock, Phone, Eye, EyeOff, UserPlus, CheckCircle2, Store, ShoppingBag } from 'lucide-react';

export const Register = ({ onRegister, onNavigate, loading }) => {
  const [role, setRole] = useState('customer'); // 'customer' | 'vendor'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    store_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({
        ...fieldErrors,
        [e.target.name]: null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setFieldErrors({});

    // Client-side quick checks
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Please provide a valid email address';
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (role === 'vendor' && (!formData.store_name.trim() || formData.store_name.trim().length < 2)) {
      errors.store_name = 'Store name is required for vendor registration';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await onRegister({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
        role,
        store_name: role === 'vendor' ? formData.store_name.trim() : undefined,
      });
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        const mapped = {};
        err.errors.forEach((e) => {
          mapped[e.field] = e.message;
        });
        setFieldErrors(mapped);
      }
      setErrorMsg(err.message || 'Registration failed');
    }
  };

  return (
    <div className="glass-panel auth-card">
      <div className="auth-header">
        <h2>{role === 'vendor' ? 'Register as Seller' : 'Create Account'}</h2>
        <p>
          {role === 'vendor'
            ? 'Open your store and start selling in the marketplace'
            : 'Join the multivendor marketplace to browse and shop'}
        </p>
      </div>

      {/* Account Type Selector Pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'var(--bg-subtle)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '22px',
          border: '1px solid var(--border-color)',
        }}
      >
        <button
          type="button"
          onClick={() => setRole('customer')}
          style={{
            padding: '9px 12px',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: role === 'customer' ? 'var(--bg-card)' : 'transparent',
            color: role === 'customer' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: role === 'customer' ? 700 : 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: role === 'customer' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <User size={16} />
          <span>Customer</span>
        </button>

        <button
          type="button"
          onClick={() => setRole('vendor')}
          style={{
            padding: '9px 12px',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: role === 'vendor' ? 'var(--bg-card)' : 'transparent',
            color: role === 'vendor' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: role === 'vendor' ? 700 : 600,
            fontSize: '0.86rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: role === 'vendor' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <Store size={16} />
          <span>Vendor / Seller</span>
        </button>
      </div>

      {errorMsg && (
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
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="register-name">
            Full Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div className="input-container">
            <span className="input-icon">
              <User size={18} />
            </span>
            <input
              id="register-name"
              name="name"
              type="text"
              className="input-field"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              autoComplete="name"
            />
          </div>
          {fieldErrors.name && (
            <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
              {fieldErrors.name}
            </span>
          )}
        </div>

        {/* Store Name Input (visible when role is vendor) */}
        {role === 'vendor' && (
          <div className="form-group">
            <label className="form-label" htmlFor="register-store-name">
              Store / Business Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="input-container">
              <span className="input-icon">
                <Store size={18} color="var(--primary)" />
              </span>
              <input
                id="register-store-name"
                name="store_name"
                type="text"
                className="input-field"
                placeholder="e.g. Apex Electronics Hub"
                value={formData.store_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            {fieldErrors.store_name && (
              <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
                {fieldErrors.store_name}
              </span>
            )}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="register-email">
            Email Address <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div className="input-container">
            <span className="input-icon">
              <Mail size={18} />
            </span>
            <input
              id="register-email"
              name="email"
              type="email"
              className="input-field"
              placeholder="e.g. john@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          {fieldErrors.email && (
            <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-phone">
            Phone Number <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
          </label>
          <div className="input-container">
            <span className="input-icon">
              <Phone size={18} />
            </span>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              className="input-field"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              autoComplete="tel"
            />
          </div>
          {fieldErrors.phone && (
            <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
              {fieldErrors.phone}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-password">
            Password <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div className="input-container">
            <span className="input-icon">
              <Lock size={18} />
            </span>
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="input-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {fieldErrors.password && (
            <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>
              {fieldErrors.password}
            </span>
          )}

          {/* Password requirement bullet */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <CheckCircle2
              size={14}
              color={formData.password.length >= 8 ? '#10b981' : 'var(--text-muted)'}
            />
            <span
              style={{
                fontSize: '0.76rem',
                color: formData.password.length >= 8 ? '#10b981' : 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              At least 8 characters
            </span>
          </div>
        </div>

        <button
          id="btn-register-submit"
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ marginTop: '16px' }}
        >
          {loading ? (
            <span>Creating account...</span>
          ) : (
            <>
              <span>{role === 'vendor' ? 'Register Seller Account' : 'Create Customer Account'}</span>
              <UserPlus size={18} />
            </>
          )}
        </button>
      </form>

      <div
        style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
        }}
      >
        Already have an account?{' '}
        <button
          type="button"
          className="btn-link"
          onClick={() => onNavigate('login')}
          style={{ fontSize: '0.88rem' }}
        >
          Sign In here
        </button>
      </div>
    </div>
  );
};
