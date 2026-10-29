import React, { useState } from 'react';
import { Mail, ArrowLeft, KeyRound, CheckCircle, Copy } from 'lucide-react';

export const ForgotPassword = ({ onForgotPassword, onNavigate, onPreFillResetToken, loading }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [debugToken, setDebugToken] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    try {
      const res = await onForgotPassword(email.trim());
      setSubmitted(true);
      if (res?.data?.reset_token) {
        setDebugToken(res.data.reset_token);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process request');
    }
  };

  const handleCopy = () => {
    if (debugToken) {
      navigator.clipboard.writeText(debugToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleProceedWithToken = () => {
    if (debugToken) {
      onPreFillResetToken(debugToken);
      onNavigate('reset-password');
    }
  };

  return (
    <div className="glass-panel auth-card">
      <div className="auth-header">
        <h2>Reset Password</h2>
        <p>Enter your email address to receive password reset instructions</p>
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

      {submitted ? (
        <div>
          <div
            style={{
              background: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              color: '#065f46',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <CheckCircle size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#065f46' }}>Request Generated</strong>
              <p style={{ marginTop: '4px', fontSize: '0.85rem', color: '#047857' }}>
                If an account with that email exists, password reset instructions have been generated.
              </p>
            </div>
          </div>

          {debugToken && (
            <div
              style={{
                background: 'var(--primary-light)',
                border: '1px solid rgba(79, 70, 229, 0.25)',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '20px',
              }}
            >
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Development Test Token (Expires in 15 mins)
              </span>
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  wordBreak: 'break-all',
                  marginBottom: '12px',
                  border: '1px solid var(--border-color)',
                }}
              >
                {debugToken}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopy}
                  style={{ flex: 1, fontSize: '0.82rem', padding: '8px 12px' }}
                >
                  <Copy size={14} />
                  <span>{copied ? 'Copied!' : 'Copy Token'}</span>
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleProceedWithToken}
                  style={{ flex: 1.5, fontSize: '0.82rem', padding: '8px 12px' }}
                >
                  <KeyRound size={14} />
                  <span>Reset Password Now</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigate('login')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <ArrowLeft size={16} />
            <span>Return to Sign In</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="forgot-email">
              Your Registered Email
            </label>
            <div className="input-container">
              <span className="input-icon">
                <Mail size={18} />
              </span>
              <input
                id="forgot-email"
                type="email"
                className="input-field"
                placeholder="e.g. name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '12px' }}
          >
            {loading ? <span>Processing...</span> : <span>Send Reset Instructions</span>}
          </button>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              className="btn-link"
              onClick={() => onNavigate('login')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
