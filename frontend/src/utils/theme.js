/**
 * Dynamic Website Theme & Color Customizer Utility
 */

export const THEME_PRESETS = [
  {
    id: 'royal_indigo',
    name: 'Royal Indigo (Default)',
    primary: '#4f46e5',
    accent: '#4338ca',
    preview: '#4f46e5',
  },
  {
    id: 'ocean_blue',
    name: 'Ocean Blue',
    primary: '#2563eb',
    accent: '#1d4ed8',
    preview: '#2563eb',
  },
  {
    id: 'emerald_green',
    name: 'Emerald Green',
    primary: '#059669',
    accent: '#047857',
    preview: '#059669',
  },
  {
    id: 'crimson_ruby',
    name: 'Crimson Ruby',
    primary: '#dc2626',
    accent: '#b91c1c',
    preview: '#dc2626',
  },
  {
    id: 'sunset_amber',
    name: 'Sunset Amber',
    primary: '#d97706',
    accent: '#b45309',
    preview: '#d97706',
  },
  {
    id: 'midnight_violet',
    name: 'Midnight Violet',
    primary: '#7c3aed',
    accent: '#6d28d9',
    preview: '#7c3aed',
  },
  {
    id: 'deep_slate',
    name: 'Deep Slate Noir',
    primary: '#334155',
    accent: '#1e293b',
    preview: '#334155',
  },
  {
    id: 'rose_pink',
    name: 'Vibrant Rose',
    primary: '#e11d48',
    accent: '#be123c',
    preview: '#e11d48',
  },
];

/**
 * Apply dynamic theme colors to root document styling
 */
export const applyThemeColors = (branding, persistLocal = true) => {
  if (!branding || typeof document === 'undefined') return;

  const root = document.documentElement;
  const primary = branding.primary_color || '#4f46e5';
  const accent = branding.accent_color || '#4338ca';

  // Apply CSS Variables directly into :root
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--border-focus', primary);
  root.style.setProperty('--primary-hover', accent);
  root.style.setProperty('--accent', accent);

  // Derived translucent glow and tint
  root.style.setProperty('--primary-glow', `${primary}2e`);
  root.style.setProperty('--primary-light', `${primary}18`);

  if (branding.sidebar_color) {
    root.style.setProperty('--sidebar-custom-bg', branding.sidebar_color);
  }

  // Update dynamic page favicon if specified
  if (branding.site_favicon) {
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.head.appendChild(link);
    }
    link.href = branding.site_favicon;
  }

  // Update document title if site_name provided
  if (branding.site_name && !document.title.includes(branding.site_name)) {
    document.title = `${branding.site_name} | Multivendor Marketplace`;
  }

  if (persistLocal) {
    try {
      localStorage.setItem('marketplace_branding_theme', JSON.stringify({
        primary_color: primary,
        accent_color: accent,
        sidebar_color: branding.sidebar_color || '#ffffff',
        theme_preset: branding.theme_preset || 'royal_indigo',
        site_name: branding.site_name,
        site_logo: branding.site_logo,
        site_favicon: branding.site_favicon,
      }));
    } catch (e) {
      // Ignore storage errors
    }
  }
};

/**
 * Load cached theme colors on first load before API responds to eliminate flicker
 */
export const loadCachedThemeColors = () => {
  if (typeof window === 'undefined') return;
  try {
    const cached = localStorage.getItem('marketplace_branding_theme');
    if (cached) {
      const parsed = JSON.parse(cached);
      applyThemeColors(parsed, false);
    }
  } catch (e) {
    // Fallback gracefully
  }
};
