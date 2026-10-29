import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

export const Login = ({ onLogin, onNavigate, loading }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your email or phone number');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    try {
      await onLogin({ identifier: identifier.trim(), password });
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email/phone or password');
    }
  };

  return (
    <div className="glass-panel auth-card">
      <div className="auth-header">
        <h2>Welcome Back</h2>
        <p>Sign in to your Multivendor Marketplace account</p>
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

      {/* Quick Fill Demo Credentials */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '18px',
          padding: '10px 12px',
          background: 'var(--bg-subtle, #f8fafc)',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px dashed var(--border-color, #e2e8f0)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Quick Demo:
        </span>
        <button
          type="button"
          onClick={() => {
            setIdentifier('admin@gmail.com');
            setPassword('Admin@123');
            setErrorMsg('');
          }}
          style={{
            padding: '4px 10px',
            fontSize: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #3b82f6',
            background: '#eff6ff',
            color: '#1d4ed8',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🛡️ Admin Demo
        </button>
        <button
          type="button"
          onClick={() => {
            setIdentifier('democustomer@example.com');
            setPassword('Admin@123');
            setErrorMsg('');
          }}
          style={{
            padding: '4px 10px',
            fontSize: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #10b981',
            background: '#ecfdf5',
            color: '#047857',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🛍️ Customer Demo
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-identifier">
            Email or Phone Number
          </label>
          <div className="input-container">
            <span className="input-icon">
              <Mail size={18} />
            </span>
            <input
              id="login-identifier"
              type="text"
              className="input-field"
              placeholder="e.g. name@example.com or 9876543210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <button
              type="button"
              className="btn-link"
              onClick={() => onNavigate('forgot-password')}
              style={{ marginBottom: '6px' }}
            >
              Forgot Password?
            </button>
          </div>
          <div className="input-container">
            <span className="input-icon">
              <Lock size={18} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
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
        </div>

        <button
          id="btn-login-submit"
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ marginTop: '10px' }}
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={18} />
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
        Don't have an account?{' '}
        <button
          type="button"
          className="btn-link"
          onClick={() => onNavigate('register')}
          style={{ fontSize: '0.88rem' }}
        >
          Create one now
        </button>
      </div>

      <div
        style={{
          marginTop: '24px',
          padding: '12px 14px',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}
      >
        <ShieldCheck size={18} color="#10b981" />
        <span>Rate-limited protection & generic responses prevent credential enumeration.</span>
      </div>
    </div>
  );
};
