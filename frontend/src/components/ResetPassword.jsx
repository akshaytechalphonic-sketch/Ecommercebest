import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

export const ResetPassword = ({ onResetPassword, onNavigate, initialToken, loading }) => {
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!token.trim()) {
      setErrorMsg('Please enter or paste your reset token');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    try {
      await onResetPassword({
        token: token.trim(),
        new_password: newPassword,
      });
      setSuccessMsg('Your password has been reset successfully! Redirecting to login...');
      setTimeout(() => {
        onNavigate('login');
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. The token may be invalid or expired.');
    }
  };

  return (
    <div className="glass-panel auth-card">
      <div className="auth-header">
        <h2>Set New Password</h2>
        <p>Enter your single-use reset token and choose a new password</p>
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

      {successMsg && (
        <div
          style={{
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            color: '#065f46',
            padding: '14px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="reset-token">
            Reset Token
          </label>
          <div className="input-container">
            <span className="input-icon">
              <KeyRound size={18} />
            </span>
            <input
              id="reset-token"
              type="text"
              className="input-field"
              placeholder="Paste 64-character token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reset-new-password">
            New Password
          </label>
          <div className="input-container">
            <span className="input-icon">
              <Lock size={18} />
            </span>
            <input
              id="reset-new-password"
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="input-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reset-confirm-password">
            Confirm New Password
          </label>
          <div className="input-container">
            <span className="input-icon">
              <Lock size={18} />
            </span>
            <input
              id="reset-confirm-password"
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading || Boolean(successMsg)}
          style={{ marginTop: '16px' }}
        >
          {loading ? (
            <span>Updating Password...</span>
          ) : (
            <>
              <span>Reset Password</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          type="button"
          className="btn-link"
          onClick={() => onNavigate('login')}
        >
          Cancel & Return to Sign In
        </button>
      </div>
    </div>
  );
};
