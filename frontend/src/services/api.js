/**
 * Centralized API Client for Authentication, User Profile & Delivery Addresses
 */

export const getStoredTokens = () => {
  return {
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
  };
};

export const setStoredTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('access_token', accessToken);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
};

export const clearStoredTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_profile');
};

const request = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Allow browser to calculate multipart boundary for FormData uploads
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const { accessToken } = getStoredTokens();
  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    // If access token expired and we have a refresh token, try to rotate once
    if (res.status === 401 && !url.includes('/refresh') && !url.includes('/login')) {
      const { refreshToken } = getStoredTokens();
      if (refreshToken) {
        try {
          const refreshRes = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.success) {
            setStoredTokens(
              refreshData.data.access_token,
              refreshData.data.refresh_token
            );
            // Retry original request with new token
            headers.Authorization = `Bearer ${refreshData.data.access_token}`;
            const retryRes = await fetch(url, { ...options, headers });
            return await retryRes.json();
          } else {
            clearStoredTokens();
          }
        } catch (e) {
          clearStoredTokens();
        }
      }
    }

    if (!res.ok) {
      const error = new Error(data.message || 'Request failed');
      error.status = res.status;
      error.code = data.code;
      error.errors = data.errors || [];
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
};

export const authApi = {
  register: (payload) =>
    request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    request('/api/v1/auth/me', {
      method: 'GET',
    }),

  refresh: (refreshToken) =>
    request('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: (refreshToken) =>
    request('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  forgotPassword: (email) =>
    request('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload) =>
    request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const userApi = {
  getProfile: () =>
    request('/api/v1/users/profile', {
      method: 'GET',
    }),

  updateProfile: (payload) =>
    request('/api/v1/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload) =>
    request('/api/v1/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

export const addressApi = {
  getAddresses: () =>
    request('/api/v1/addresses', {
      method: 'GET',
    }),

  getAddressById: (id) =>
    request(`/api/v1/addresses/${id}`, {
      method: 'GET',
    }),

  createAddress: (payload) =>
    request('/api/v1/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAddress: (id, payload) =>
    request(`/api/v1/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  setDefault: (id) =>
    request(`/api/v1/addresses/${id}/default`, {
      method: 'PATCH',
    }),

  deleteAddress: (id) =>
    request(`/api/v1/addresses/${id}`, {
      method: 'DELETE',
    }),
};

export const categoryApi = {
  // Public APIs
  getCategories: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/categories${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  getCategoryById: (id) =>
    request(`/api/v1/categories/${id}`, { method: 'GET' }),

  getSubcategories: (id) =>
    request(`/api/v1/categories/${id}/subcategories`, { method: 'GET' }),

  // Admin APIs
  adminGetCategories: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/admin/categories${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  createCategory: (payload) =>
    request('/api/v1/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCategory: (id, payload) =>
    request(`/api/v1/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteCategory: (id, deactivate = false) =>
    request(`/api/v1/admin/categories/${id}${deactivate ? '?deactivate=true' : ''}`, {
      method: 'DELETE',
    }),

  createSubcategory: (parentId, payload) =>
    request(`/api/v1/admin/categories/${parentId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export const adminVendorApi = {
  getVendors: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/admin/vendors${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  updateVendorStatus: (id, payload) =>
    request(`/api/v1/admin/vendors/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const adminProductApi = {
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/admin/products${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  updateProductStatus: (id, payload) =>
    request(`/api/v1/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const productApi = {
  getPublicProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/products${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  getProductDetails: (idOrSlug) =>
    request(`/api/v1/products/${idOrSlug}`, { method: 'GET' }),

  getSellerProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/products/seller/me${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  getSellerProductById: (id) =>
    request(`/api/v1/products/seller/me/${id}`, { method: 'GET' }),

  createProduct: (payload) =>
    request('/api/v1/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProduct: (id, payload) =>
    request(`/api/v1/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id, deactivate = false) =>
    request(`/api/v1/products/${id}${deactivate ? '?deactivate=true' : ''}`, {
      method: 'DELETE',
    }),
};

export const uploadApi = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request('/api/v1/upload/image', {
      method: 'POST',
      body: formData,
    });
  },

  uploadImages: async (files) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }
    return request('/api/v1/upload/images', {
      method: 'POST',
      body: formData,
    });
  },
};

export const cartApi = {
  getCart: () => request('/api/v1/cart', { method: 'GET' }),
  addToCart: (payload) =>
    request('/api/v1/cart/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCartItem: (itemId, quantity) =>
    request(`/api/v1/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    }),
  removeFromCart: (itemId) =>
    request(`/api/v1/cart/items/${itemId}`, {
      method: 'DELETE',
    }),
  clearCart: () =>
    request('/api/v1/cart', {
      method: 'DELETE',
    }),
};

export const wishlistApi = {
  getWishlist: () => request('/api/v1/wishlist', { method: 'GET' }),
  addToWishlist: (productId) =>
    request('/api/v1/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    }),
  removeFromWishlist: (id) =>
    request(`/api/v1/wishlist/${id}`, {
      method: 'DELETE',
    }),
  moveToCart: (id) =>
    request(`/api/v1/wishlist/${id}/move-to-cart`, {
      method: 'POST',
    }),
  clearWishlist: () =>
    request('/api/v1/wishlist', {
      method: 'DELETE',
    }),
};

export const adminCartApi = {
  getCarts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/admin/carts${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getWishlistStats: () =>
    request('/api/v1/admin/carts/wishlists', { method: 'GET' }),
};

export const inventoryApi = {
  getInventory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/inventory${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getLowStock: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/inventory/low-stock${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getProductStock: (productId) =>
    request(`/api/v1/inventory/${productId}`, { method: 'GET' }),
  adjustStock: (productId, payload) =>
    request(`/api/v1/inventory/${productId}/adjust`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateThreshold: (productId, threshold) =>
    request(`/api/v1/inventory/${productId}/threshold`, {
      method: 'PATCH',
      body: JSON.stringify({ low_stock_threshold: threshold }),
    }),
  getProductLogs: (productId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/inventory/${productId}/logs${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },
  getAllLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/v1/inventory/logs${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
};

export const bannerApi = {
  getBanners: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
    const qs = new URLSearchParams(clean).toString();
    return request(`/api/v1/banners${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getBannerById: (id) =>
    request(`/api/v1/banners/${id}`, { method: 'GET' }),
  recordClick: (id) =>
    request(`/api/v1/banners/${id}/click`, { method: 'POST' }),
};

export const adminBannerApi = {
  getBanners: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
    const qs = new URLSearchParams(clean).toString();
    return request(`/api/v1/admin/banners${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  createBanner: (payload) =>
    request('/api/v1/admin/banners', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBanner: (id, payload) =>
    request(`/api/v1/admin/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateStatus: (id, isActive) =>
    request(`/api/v1/admin/banners/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),
  deleteBanner: (id) =>
    request(`/api/v1/admin/banners/${id}`, { method: 'DELETE' }),
};

export const settingApi = {
  getBranding: () =>
    request('/api/v1/settings/branding', { method: 'GET' }),
  getPublicSettings: () =>
    request('/api/v1/settings/public', { method: 'GET' }),
};

export const adminSettingApi = {
  getAllSettings: () =>
    request('/api/v1/admin/settings', { method: 'GET' }),
  updateBranding: (payload) =>
    request('/api/v1/admin/settings/branding', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  bulkUpdateSettings: (settings) =>
    request('/api/v1/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    }),
};

export const financialApi = {
  // Payments
  getPayments: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
    const qs = new URLSearchParams(clean).toString();
    return request(`/api/v1/payments${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  recordPayment: (payload) =>
    request('/api/v1/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Commissions & Vendor Earnings
  getCommissions: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
    const qs = new URLSearchParams(clean).toString();
    return request(`/api/v1/commissions${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getCommissionReportsOverview: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
    const qs = new URLSearchParams(clean).toString();
    return request(`/api/v1/commissions/reports/overview${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  getVendorEarnings: (vendorId) =>
    request(`/api/v1/commissions/vendor${vendorId ? `/${vendorId}` : ''}`, { method: 'GET' }),

  // Withdrawals / Payouts
  getWithdrawals: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
    const qs = new URLSearchParams(clean).toString();
    return request(`/api/v1/payouts${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  requestWithdrawal: (payload) =>
    request('/api/v1/payouts/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  processWithdrawal: (id, payload) =>
    request(`/api/v1/payouts/${id}/process`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Orders
  getOrders: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
    const qs = new URLSearchParams(clean).toString();
    return request(`/api/v1/orders${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  createOrder: (payload) =>
    request('/api/v1/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancelOrder: (orderId, payload = {}) =>
    request(`/api/v1/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Returns & Refunds
  getRefunds: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== ''));
    const qs = new URLSearchParams(clean).toString();
    return request(`/api/v1/orders/refunds${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },
  requestRefund: (payload) =>
    request('/api/v1/orders/refund', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  processRefund: (id, payload) =>
    request(`/api/v1/orders/refunds/${id}/process`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

export const headerMenuApi = {
  // Public Storefront Navigation
  getStorefrontHeaderMenu: () => request('/api/v1/storefront/header-menu', { method: 'GET' }),

  // Admin Header Menus
  getAdminHeaderMenus: () => request('/api/v1/admin/header-menus', { method: 'GET' }),
  getHeaderMenuById: (id) => request(`/api/v1/admin/header-menus/${id}`, { method: 'GET' }),
  createHeaderMenu: (payload) =>
    request('/api/v1/admin/header-menus', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateHeaderMenu: (id, payload) =>
    request(`/api/v1/admin/header-menus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteHeaderMenu: (id) =>
    request(`/api/v1/admin/header-menus/${id}`, {
      method: 'DELETE',
    }),
  updateHeaderMenuStatus: (id, payload) =>
    request(`/api/v1/admin/header-menus/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  reorderHeaderMenus: (items) =>
    request('/api/v1/admin/header-menus/reorder', {
      method: 'PATCH',
      body: JSON.stringify(items),
    }),

  // Admin Submenu Items
  createHeaderMenuItem: (menuId, payload) =>
    request(`/api/v1/admin/header-menus/${menuId}/items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getHeaderMenuItems: (menuId) =>
    request(`/api/v1/admin/header-menus/${menuId}/items`, {
      method: 'GET',
    }),
  updateHeaderMenuItem: (itemId, payload) =>
    request(`/api/v1/admin/header-menu-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteHeaderMenuItem: (itemId) =>
    request(`/api/v1/admin/header-menu-items/${itemId}`, {
      method: 'DELETE',
    }),
};




