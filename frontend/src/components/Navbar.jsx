import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, BookOpen, LogOut, User, Sun, Moon, ChevronDown, Sparkles } from 'lucide-react';
import { headerMenuApi } from '../services/api';

export const Navbar = ({ user, onLogout, onNavigate, currentView, theme, onToggleTheme, branding }) => {
  const activeLogo = theme === 'dark' && branding?.site_dark_logo ? branding.site_dark_logo : branding?.site_logo;

  const [headerMenus, setHeaderMenus] = useState([]);
  const [hoveredMenuId, setHoveredMenuId] = useState(null);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    headerMenuApi
      .getStorefrontHeaderMenu()
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setHeaderMenus(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleMouseEnter = (menuId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredMenuId(menuId);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMenuId(null);
    }, 180);
  };

  const currentHoveredMenu = headerMenus.find((m) => m.id === hoveredMenuId);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--card-bg, #ffffff)', borderBottom: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Top Navbar Row */}
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <div onClick={() => onNavigate('login')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeLogo ? (
            <img
              src={activeLogo}
              alt={branding?.site_name || 'Marketplace Logo'}
              style={{ height: '34px', maxWidth: '150px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, #78350f 0%, #b45309 100%)',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '18px',
              letterSpacing: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span>LUXE</span>
            </div>
          )}
          <div>
            <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '0.04em', color: 'var(--text-main, #0f172a)' }}>
              {branding?.site_name || 'MARKETPLACE'}
            </span>
          </div>
        </div>

        {/* Right Nav Actions (Theme, User, Sign in) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e2e8f0)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className={`nav-link ${currentView === 'profile' ? 'active' : ''}`}
                onClick={() => onNavigate('profile')}
                style={{
                  color: user.role === 'admin' ? '#7c3aed' : 'var(--primary, #4f46e5)',
                  background: user.role === 'admin' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(79, 70, 229, 0.1)',
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <User size={16} />
                <span>{user.name.split(' ')[0]}</span>
                {user.role === 'admin' && (
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#7c3aed', color: '#fff', borderRadius: '999px', fontWeight: 700 }}>
                    Admin
                  </span>
                )}
              </button>
              <button
                onClick={onLogout}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.84rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
                title="Logout"
              >
                <LogOut size={14} color="#ef4444" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onNavigate('login')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  background: 'transparent',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Header Menus Bar (Exact 1:1 match to Image 3) */}
      {headerMenus.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', background: 'var(--card-bg, #ffffff)', position: 'relative' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '28px', overflowX: 'auto' }}>
            {headerMenus.map((menu) => {
              const isHovered = hoveredMenuId === menu.id;

              return (
                <div
                  key={menu.id}
                  onMouseEnter={() => handleMouseEnter(menu.id)}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    position: 'relative',
                    padding: '12px 2px',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: isHovered
                        ? '#b45309' // Gold accent color from Image 3
                        : menu.slug === 'sale'
                        ? '#dc2626' // Red accent for SALE
                        : 'var(--text-main, #334155)',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    <span>{menu.name}</span>
                  </div>

                  {/* Gold active underline bar on hover (just like in Image 3) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: menu.slug === 'sale' ? '#dc2626' : '#b45309',
                      borderRadius: '2px 2px 0 0',
                      opacity: isHovered ? 1 : 0,
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* =========================================================================
              FULL-WIDTH MEGA MENU DROPDOWN (Matching Image 3)
              ========================================================================= */}
          {currentHoveredMenu && currentHoveredMenu.items && currentHoveredMenu.items.length > 0 && (
            <div
              onMouseEnter={() => handleMouseEnter(currentHoveredMenu.id)}
              onMouseLeave={handleMouseLeave}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                boxShadow: '0 20px 30px rgba(0, 0, 0, 0.08)',
                zIndex: 999,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div
                style={{
                  maxWidth: '1440px',
                  margin: '0 auto',
                  padding: '36px 32px 42px',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(currentHoveredMenu.items.length + (currentHoveredMenu.banner ? 1 : 0), 6)}, 1fr)`,
                  gap: '36px',
                }}
              >
                {/* Mega Menu Category Columns */}
                {currentHoveredMenu.items.map((col) => (
                  <div key={col.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Gold Category Title */}
                    <h4
                      style={{
                        margin: '0 0 16px 0',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#b45309', // Warm gold / bronze from Image 3
                        letterSpacing: '0.02em',
                        fontFamily: 'inherit',
                      }}
                    >
                      {col.name}
                    </h4>

                    {/* Column Items Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                      {col.children && col.children.length > 0 ? (
                        col.children.map((child) => {
                          const isSale = child.name?.toLowerCase().includes('sale');
                          return (
                            <a
                              key={child.id}
                              href={child.redirect_url || '#'}
                              style={{
                                color: isSale ? '#dc2626' : '#475569',
                                fontSize: '14px',
                                textDecoration: 'none',
                                fontWeight: isSale ? 600 : 400,
                                transition: 'color 0.15s ease',
                                lineHeight: '1.4',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#b45309';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = isSale ? '#dc2626' : '#475569';
                              }}
                            >
                              {child.name}
                            </a>
                          );
                        })
                      ) : (
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>View all {col.name}</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Optional Promotional Banner inside Mega Menu */}
                {currentHoveredMenu.banner && (
                  <div style={{
                    borderLeft: '1px solid #f1f5f9',
                    paddingLeft: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      background: '#f8fafc',
                    }}>
                      <img
                        src={currentHoveredMenu.banner.image_url}
                        alt={currentHoveredMenu.banner.title}
                        style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                      />
                      <div style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                          {currentHoveredMenu.banner.title}
                        </div>
                        {currentHoveredMenu.banner.subtitle && (
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {currentHoveredMenu.banner.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
