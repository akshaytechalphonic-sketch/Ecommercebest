import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';
import { ProfileDashboard } from './components/ProfileDashboard';
import {
  authApi,
  settingApi,
  getStoredTokens,
  setStoredTokens,
  clearStoredTokens,
} from './services/api';
import { applyThemeColors } from './utils/theme';

export function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [preFilledResetToken, setPreFilledResetToken] = useState('');
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'light';
  });
  const [branding, setBranding] = useState(null);

  // Apply theme to html root element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Reset window scroll when switching views
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Check existing session on initial load
  useEffect(() => {
    const { accessToken } = getStoredTokens();
    if (accessToken) {
      setLoading(true);
      authApi
        .getMe()
        .then((res) => {
          if (res?.data) {
            setUser(res.data);
            setCurrentView('profile');
          }
        })
        .catch(() => {
          clearStoredTokens();
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }

    // Load store dynamic branding, logo & theme colors
    settingApi
      .getBranding()
      .then((res) => {
        if (res?.data) {
          setBranding(res.data);
          applyThemeColors(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (res?.data?.tokens) {
        setStoredTokens(
          res.data.tokens.access_token,
          res.data.tokens.refresh_token
        );
        setUser(res.data.user);
        setCurrentView('profile');
        showToast(`Welcome back, ${res.data.user.name}!`, 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload) => {
    setLoading(true);
    try {
      const res = await authApi.register(payload);
      if (res?.data?.tokens) {
        setStoredTokens(
          res.data.tokens.access_token,
          res.data.tokens.refresh_token
        );
        setUser(res.data.user);
        setCurrentView('profile');
        showToast('Registration successful! Welcome aboard.', 'success');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { refreshToken } = getStoredTokens();
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (e) {
      // Continue client cleanup even if network fails
    } finally {
      clearStoredTokens();
      setUser(null);
      setCurrentView('login');
      showToast('You have been signed out.', 'info');
    }
  };

  const handleForgotPassword = async (email) => {
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      showToast('Password reset request processed.', 'success');
      return res;
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (payload) => {
    setLoading(true);
    try {
      const res = await authApi.resetPassword(payload);
      showToast('Password has been reset successfully!', 'success');
      return res;
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    const { refreshToken } = getStoredTokens();
    if (!refreshToken) {
      throw new Error('No refresh token available in storage');
    }
    const res = await authApi.refresh(refreshToken);
    if (res?.data) {
      setStoredTokens(res.data.access_token, res.data.refresh_token);
      showToast('Session tokens rotated successfully!', 'success');
    }
    return res;
  };

  const handleTestMeApi = async () => {
    const res = await authApi.getMe();
    if (res?.data) {
      setUser(res.data);
    }
    return res;
  };

  return (
    <div className="app-container">
      {currentView === 'profile' && user ? (
        <ProfileDashboard
          user={user}
          onLogout={handleLogout}
          onRefreshSession={handleRefreshSession}
          onTestMeApi={handleTestMeApi}
          onUpdateUser={(updated) => setUser({ ...user, ...updated })}
          onToast={showToast}
          theme={theme}
          onToggleTheme={toggleTheme}
          branding={branding}
          onBrandingUpdated={(newB) => {
            setBranding(newB);
            applyThemeColors(newB);
          }}
          onNavigateToStore={() => setCurrentView('storefront')}
        />
      ) : (
        <>
          <Navbar
            user={user}
            onLogout={handleLogout}
            onNavigate={(view) => setCurrentView(view)}
            currentView={currentView}
            theme={theme}
            onToggleTheme={toggleTheme}
            branding={branding}
          />
        <main className="main-content">
          {currentView === 'storefront' ? (
            <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 24px', textAlign: 'center' }}>
              {user?.role === 'admin' && (
                <div style={{
                  marginBottom: '24px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: 'rgba(180, 83, 9, 0.1)',
                  border: '1px solid rgba(180, 83, 9, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#b45309' }}>
                    ⚡ Storefront Live Preview Active: Hover or click on the header menus above to switch dynamic hero banners and view mega submenus.
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentView('profile')}
                    style={{
                      padding: '6px 14px',
                      background: '#7c3aed',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ⚙️ Back to Admin Panel
                  </button>
                </div>
              )}
              <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-main, #0f172a)' }}>
                Curated Luxury Collections
              </h2>
              <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '640px', margin: '0 auto 24px' }}>
                Select any tab in the header navigation bar above (HOME & LIVING, WOMEN, MEN, KIDS, JEWELLERY, NEW IN, SALE) or hover to view nested sub-categories.
              </p>
            </div>
          ) : (
            <div className="auth-wrapper">
            <div className="tabs-nav">
              <button
                type="button"
                className={`tab-btn ${currentView === 'login' ? 'active' : ''}`}
                onClick={() => setCurrentView('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`tab-btn ${currentView === 'register' ? 'active' : ''}`}
                onClick={() => setCurrentView('register')}
              >
                Create Account
              </button>
            </div>

            {currentView === 'login' && (
              <Login
                onLogin={handleLogin}
                onNavigate={(view) => setCurrentView(view)}
                loading={loading}
              />
            )}

            {currentView === 'register' && (
              <Register
                onRegister={handleRegister}
                onNavigate={(view) => setCurrentView(view)}
                loading={loading}
              />
            )}

            {currentView === 'forgot-password' && (
              <ForgotPassword
                onForgotPassword={handleForgotPassword}
                onNavigate={(view) => setCurrentView(view)}
                onPreFillResetToken={(token) => setPreFilledResetToken(token)}
                loading={loading}
              />
            )}

            {currentView === 'reset-password' && (
              <ResetPassword
                onResetPassword={handleResetPassword}
                onNavigate={(view) => setCurrentView(view)}
                initialToken={preFilledResetToken}
                loading={loading}
              />
            )}
          </div>
          )}
        </main>
        </>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
