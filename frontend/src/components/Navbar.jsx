import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, BookOpen, LogOut, User, Sun, Moon, ChevronDown, Sparkles, ArrowRight, Eye } from 'lucide-react';
import { headerMenuApi, bannerApi } from '../services/api';

export const Navbar = ({ user, onLogout, onNavigate, currentView, theme, onToggleTheme, branding }) => {
  const activeLogo = theme === 'dark' && branding?.site_dark_logo ? branding.site_dark_logo : branding?.site_logo;

  const [headerMenus, setHeaderMenus] = useState([]);
  const [hoveredMenuId, setHoveredMenuId] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [activeHeroBanner, setActiveHeroBanner] = useState(null);
  const hoverTimeoutRef = useRef(null);

  // Load Storefront Header Menus
  useEffect(() => {
    headerMenuApi
      .getStorefrontHeaderMenu()
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setHeaderMenus(res.data);
          // Set first menu (HOME & LIVING) as default active
          setSelectedMenu(res.data[0]);
          if (res.data[0]?.banner) {
            setActiveHeroBanner(res.data[0].banner);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleMouseEnter = (menu) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredMenuId(menu.id);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMenuId(null);
    }, 200);
  };

  const handleSelectMenu = (menu) => {
    setSelectedMenu(menu);
    if (menu.banner) {
      setActiveHeroBanner(menu.banner);
    }
  };

  const handleSelectSubmenu = (col) => {
    if (col.banner) {
      setActiveHeroBanner(col.banner);
    }
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
              const isSelected = selectedMenu?.id === menu.id;

              return (
                <div
                  key={menu.id}
                  onClick={() => handleSelectMenu(menu)}
                  onMouseEnter={() => handleMouseEnter(menu)}
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
                      color: (isHovered || isSelected)
                        ? '#b45309' // Gold accent color from Image 3
                        : menu.slug === 'sale'
                        ? '#dc2626' // Red accent for SALE
                        : 'var(--text-main, #334155)',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    <span>{menu.name}</span>
                  </div>

                  {/* Gold active underline bar on hover & select (just like in Image 3) */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: menu.slug === 'sale' ? '#dc2626' : '#b45309',
                      borderRadius: '2px 2px 0 0',
                      opacity: (isHovered || isSelected) ? 1 : 0,
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
              onMouseEnter={() => handleMouseEnter(currentHoveredMenu)}
              onMouseLeave={handleMouseLeave}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                boxShadow: '0 20px 30px rgba(0, 0, 0, 0.1)',
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
                      onClick={() => handleSelectSubmenu(col)}
                      style={{
                        margin: '0 0 16px 0',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#b45309', // Warm gold / bronze from Image 3
                        letterSpacing: '0.02em',
                        cursor: 'pointer',
                      }}
                      title="Click to view category banner"
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
                              onClick={(e) => {
                                if (col.banner) {
                                  setActiveHeroBanner(col.banner);
                                }
                              }}
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

                {/* Promotional Banner inside Mega Menu */}
                {currentHoveredMenu.banner && (
                  <div style={{
                    borderLeft: '1px solid #f1f5f9',
                    paddingLeft: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}>
                    <div
                      onClick={() => handleSelectMenu(currentHoveredMenu)}
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        background: '#f8fafc',
                        cursor: 'pointer',
                      }}
                    >
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

      {/* =========================================================================
          DYNAMIC STOREFRONT HERO BANNER (Changes dynamically on menu click!)
          ========================================================================= */}
      {currentView !== 'profile' && activeHeroBanner && (
        <div style={{ position: 'relative', width: '100%', background: '#0f172a', overflow: 'hidden' }}>
          <div style={{
            position: 'relative',
            maxWidth: '1440px',
            margin: '0 auto',
            minHeight: '320px',
            display: 'flex',
            alignItems: 'center',
            padding: '40px 32px',
          }}>
            {/* Background Image with Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url('${activeHeroBanner.image_url}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.65)',
                transition: 'all 0.5s ease-in-out',
              }}
            />

            {/* Banner Text Content */}
            <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', color: '#ffffff' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                background: 'rgba(180, 83, 9, 0.85)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}>
                <Sparkles size={14} />
                <span>Featured Collection</span>
              </div>

              <h1 style={{
                fontSize: '36px',
                fontWeight: 900,
                lineHeight: '1.2',
                margin: '0 0 10px 0',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}>
                {activeHeroBanner.title}
              </h1>

              {activeHeroBanner.subtitle && (
                <p style={{
                  fontSize: '18px',
                  color: '#e2e8f0',
                  margin: '0 0 20px 0',
                  fontWeight: 500,
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}>
                  {activeHeroBanner.subtitle}
                </p>
              )}

              {selectedMenu && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                  <span>Active Menu:</span>
                  <span style={{ fontWeight: 700, color: '#fde68a' }}>{selectedMenu.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
