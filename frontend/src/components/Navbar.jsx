import React from 'react';
import { ShoppingBag, BookOpen, LogOut, User, Sun, Moon } from 'lucide-react';

export const Navbar = ({ user, onLogout, onNavigate, currentView, theme, onToggleTheme, branding }) => {
  const activeLogo = theme === 'dark' && branding?.site_dark_logo ? branding.site_dark_logo : branding?.site_logo;

  return (
    <nav className="navbar">
      <div className="brand" onClick={() => onNavigate('login')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {activeLogo ? (
          <img
            src={activeLogo}
            alt={branding?.site_name || 'Marketplace Logo'}
            style={{ height: '32px', maxWidth: '140px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="brand-icon">
            <ShoppingBag size={22} />
          </div>
        )}
        <div>
          <span className="brand-title">{branding?.site_name || 'Multivendor'}</span>
          <span className="brand-badge">Auth v1.0</span>
        </div>
      </div>

      <div className="nav-actions">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className={`nav-link ${currentView === 'profile' ? 'active' : ''}`}
              onClick={() => onNavigate('profile')}
              style={{
                color: user.role === 'admin' ? '#7c3aed' : 'var(--primary)',
                background: user.role === 'admin' ? 'rgba(124, 58, 237, 0.12)' : 'var(--primary-light)',
                fontWeight: 600,
              }}
            >
              <User size={16} />
              <span>{user.name.split(' ')[0]}</span>
              {user.role === 'admin' && (
                <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: '#7c3aed', color: '#fff', borderRadius: '999px', marginLeft: '4px' }}>
                  Admin
                </span>
              )}
            </button>
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.84rem' }}
              title="Logout"
            >
              <LogOut size={14} color="#ef4444" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`nav-link ${currentView === 'login' ? 'active' : ''}`}
              onClick={() => onNavigate('login')}
            >
              Sign In
            </button>
            <button
              className="btn-primary"
              onClick={() => onNavigate('register')}
              style={{
                padding: '8px 16px',
                fontSize: '0.88rem',
                width: 'auto',
                boxShadow: 'none',
              }}
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
