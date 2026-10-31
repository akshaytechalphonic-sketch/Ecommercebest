import React, { useState, useEffect } from 'react';
import {
  Menu,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  FolderTree,
  Check,
  X,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Tag,
  Eye,
  EyeOff,
  RefreshCw,
  Search,
} from 'lucide-react';
import { headerMenuApi, categoryApi, bannerApi, adminBannerApi } from '../services/api';

export const HeaderMenuManager = ({ user, onToast }) => {
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    slug: '',
    url: '',
    icon: '',
    image: '',
    status: 'active',
    display_order: 0,
    banner_id: '',
    category_id: '',
  });

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedMenuForItems, setSelectedMenuForItems] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    slug: '',
    parent_id: '',
    redirect_url: '',
    image: '',
    display_order: 0,
    is_active: true,
    banner_id: '',
    category_id: '',
  });

  const [saving, setSaving] = useState(false);

  // Load all menus, categories, and banners
  const loadData = async () => {
    setLoading(true);
    try {
      const getBannersFn = adminBannerApi?.getBanners || bannerApi?.getBanners;
      const [menuRes, catRes, banRes] = await Promise.allSettled([
        headerMenuApi.getAdminHeaderMenus(),
        categoryApi.adminGetCategories(),
        getBannersFn ? getBannersFn({ limit: 100 }) : Promise.resolve({ data: [] }),
      ]);

      if (menuRes.status === 'fulfilled' && menuRes.value?.data) {
        const list = Array.isArray(menuRes.value.data) ? menuRes.value.data : menuRes.value.data?.menus || [];
        setMenus(list);
        // Expand first menu by default for great UX
        if (list.length > 0 && Object.keys(expandedMenus).length === 0) {
          setExpandedMenus({ [list[0].id]: true });
        }
      } else if (menuRes.status === 'rejected') {
        console.error('Error fetching admin header menus:', menuRes.reason);
        onToast?.(menuRes.reason?.message || 'Failed to load header menus', 'error');
      }
      if (catRes.status === 'fulfilled' && catRes.value?.data) {
        setCategories(Array.isArray(catRes.value.data) ? catRes.value.data : catRes.value.data?.categories || []);
      }
      if (banRes.status === 'fulfilled' && banRes.value?.data) {
        const rawBanners = banRes.value.data?.banners || (Array.isArray(banRes.value.data) ? banRes.value.data : []);
        setBanners(rawBanners);
      }
    } catch (err) {
      onToast?.(err.message || 'Failed to load menu data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  // Open Create Menu Modal
  const openCreateMenuModal = () => {
    setEditingMenu(null);
    setMenuForm({
      name: '',
      slug: '',
      url: '',
      icon: '',
      image: '',
      status: 'active',
      display_order: menus.length ? Math.max(...menus.map((m) => m.display_order || 0)) + 1 : 1,
      banner_id: '',
      category_id: '',
    });
    setMenuModalOpen(true);
  };

  // Open Edit Menu Modal
  const openEditMenuModal = (menu) => {
    setEditingMenu(menu);
    setMenuForm({
      name: menu.name || '',
      slug: menu.slug || '',
      url: menu.url || '',
      icon: menu.icon || '',
      image: menu.image || '',
      status: menu.status || 'active',
      display_order: menu.display_order ?? 0,
      banner_id: menu.banner_id ? String(menu.banner_id) : '',
      category_id: menu.category_id ? String(menu.category_id) : '',
    });
    setMenuModalOpen(true);
  };

  // Submit Menu Form (Create / Update)
  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    if (!menuForm.name.trim()) {
      onToast?.('Menu name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: menuForm.name.trim(),
        slug: menuForm.slug.trim() || undefined,
        url: menuForm.url.trim() || null,
        icon: menuForm.icon.trim() || null,
        image: menuForm.image.trim() || null,
        status: menuForm.status,
        display_order: parseInt(menuForm.display_order, 10) || 0,
        banner_id: menuForm.banner_id ? parseInt(menuForm.banner_id, 10) : null,
        category_id: menuForm.category_id ? parseInt(menuForm.category_id, 10) : null,
      };

      if (editingMenu) {
        await headerMenuApi.updateHeaderMenu(editingMenu.id, payload);
        onToast?.('Header menu updated successfully!', 'success');
      } else {
        await headerMenuApi.createHeaderMenu(payload);
        onToast?.('Header menu created successfully!', 'success');
      }

      setMenuModalOpen(false);
      await loadData();
    } catch (err) {
      onToast?.(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Menu Status
  const handleToggleMenuStatus = async (menu) => {
    const newStatus = menu.status === 'active' ? 'inactive' : 'active';
    try {
      await headerMenuApi.updateHeaderMenuStatus(menu.id, { status: newStatus });
      onToast?.(`Menu marked as ${newStatus}!`, 'info');
      setMenus((prev) =>
        prev.map((m) => (m.id === menu.id ? { ...m, status: newStatus } : m))
      );
    } catch (err) {
      onToast?.(err.message || 'Failed to update status', 'error');
    }
  };

  // Delete Menu
  const handleDeleteMenu = async (menu) => {
    if (!window.confirm(`Are you sure you want to delete '${menu.name}' and all its submenus?`)) {
      return;
    }
    try {
      await headerMenuApi.deleteHeaderMenu(menu.id);
      onToast?.('Header menu deleted successfully', 'success');
      setMenus((prev) => prev.filter((m) => m.id !== menu.id));
    } catch (err) {
      onToast?.(err.message || 'Failed to delete menu', 'error');
    }
  };

  // Move Menu Up / Down (Reorder)
  const handleMoveMenu = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= menus.length) return;

    const newMenus = [...menus];
    const temp = newMenus[index];
    newMenus[index] = newMenus[targetIndex];
    newMenus[targetIndex] = temp;

    const reorderPayload = newMenus.map((m, idx) => ({
      id: m.id,
      display_order: idx + 1,
    }));

    setMenus(newMenus);

    try {
      await headerMenuApi.reorderHeaderMenus({ items: reorderPayload });
      onToast?.('Menu order saved successfully!', 'success');
    } catch (err) {
      onToast?.(err.message || 'Failed to save menu order', 'error');
      loadData();
    }
  };

  // Open Create Submenu Item Modal
  const openCreateItemModal = (menu, parentItem = null) => {
    setSelectedMenuForItems(menu);
    setEditingItem(null);
    setItemForm({
      name: '',
      slug: '',
      parent_id: parentItem ? String(parentItem.id) : '',
      redirect_url: '',
      image: '',
      display_order: 1,
      is_active: true,
      banner_id: '',
      category_id: '',
    });
    setItemModalOpen(true);
  };

  // Open Edit Submenu Item Modal
  const openEditItemModal = (menu, item) => {
    setSelectedMenuForItems(menu);
    setEditingItem(item);
    setItemForm({
      name: item.name || '',
      slug: item.slug || '',
      parent_id: item.parent_id ? String(item.parent_id) : '',
      redirect_url: item.redirect_url || '',
      image: item.image || '',
      display_order: item.display_order ?? 0,
      is_active: item.is_active !== false,
      banner_id: item.banner_id ? String(item.banner_id) : '',
      category_id: item.category_id ? String(item.category_id) : '',
    });
    setItemModalOpen(true);
  };

  // Submit Submenu Item Form
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      onToast?.('Item name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: itemForm.name.trim(),
        slug: itemForm.slug.trim() || undefined,
        parent_id: itemForm.parent_id ? parseInt(itemForm.parent_id, 10) : null,
        redirect_url: itemForm.redirect_url.trim() || null,
        image: itemForm.image.trim() || null,
        display_order: parseInt(itemForm.display_order, 10) || 0,
        is_active: Boolean(itemForm.is_active),
        banner_id: itemForm.banner_id ? parseInt(itemForm.banner_id, 10) : null,
        category_id: itemForm.category_id ? parseInt(itemForm.category_id, 10) : null,
      };

      if (editingItem) {
        await headerMenuApi.updateHeaderMenuItem(editingItem.id, payload);
        onToast?.('Submenu item updated!', 'success');
      } else {
        await headerMenuApi.createHeaderMenuItem(selectedMenuForItems.id, payload);
        onToast?.('Submenu item added successfully!', 'success');
      }

      setItemModalOpen(false);
      await loadData();
    } catch (err) {
      onToast?.(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Submenu Item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this submenu item and its child links?')) return;
    try {
      await headerMenuApi.deleteHeaderMenuItem(itemId);
      onToast?.('Submenu item deleted!', 'success');
      await loadData();
    } catch (err) {
      onToast?.(err.message || 'Failed to delete item', 'error');
    }
  };

  // Filtered menus
  const filteredMenus = menus.filter((m) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '8px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Header Card */}
      <div style={{
        background: 'var(--card-bg, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: '14px',
            borderRadius: '14px',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}>
            <Menu size={26} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-main, #0f172a)', letterSpacing: '-0.02em' }}>
              Dynamic Header Menus
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
              Configure public storefront header navigation, multi-column mega menus, and promo banners.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={loadData}
            title="Refresh menu list"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #e2e8f0)',
              background: 'var(--card-bg, #ffffff)',
              color: 'var(--text-main, #334155)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={openCreateMenuModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
            }}
          >
            <Plus size={16} />
            <span>Add Header Menu</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL MENUS</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginTop: '6px' }}>{menus.length}</div>
        </div>
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE ON STOREFRONT</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
            {menus.filter((m) => m.status === 'active').length}
          </div>
        </div>
        <div style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', fontWeight: 700, letterSpacing: '0.05em' }}>TOTAL SUBMENU ITEMS</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#6366f1', marginTop: '6px' }}>
            {menus.reduce((acc, m) => acc + (m.items?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          placeholder="Filter menus by name or slug (e.g. Home, Women, Kids)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px 12px 44px',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #e2e8f0)',
            background: 'var(--card-bg, #ffffff)',
            color: 'var(--text-main, #0f172a)',
            fontSize: '14px',
            outline: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        />
      </div>

      {/* Menus Accordion List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px', color: 'var(--primary, #4f46e5)' }} />
          <div>Loading Header Menus & Submenus...</div>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '16px',
          border: '2px dashed var(--border-color, #e2e8f0)',
        }}>
          <Menu size={48} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700 }}>No Menus Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 20px 0' }}>
            Click "Add Header Menu" to add your first menu.
          </p>
          <button
            type="button"
            onClick={openCreateMenuModal}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              background: '#4f46e5',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Add Header Menu
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredMenus.map((menu, index) => {
            const isExpanded = Boolean(expandedMenus[menu.id]);
            const submenus = menu.items || [];

            return (
              <div
                key={menu.id}
                style={{
                  background: 'var(--card-bg, #ffffff)',
                  border: isExpanded ? '1px solid #c7d2fe' : '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '14px',
                  boxShadow: isExpanded ? '0 4px 16px rgba(79, 70, 229, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Header Menu Item Card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    gap: '16px',
                    background: isExpanded ? 'rgba(79, 70, 229, 0.03)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid var(--border-color, #e2e8f0)' : 'none',
                  }}
                >
                  {/* Left: Reorder Arrows & Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveMenu(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.25 : 0.7,
                          padding: '2px',
                        }}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMenu(index, 'down')}
                        disabled={index === menus.length - 1}
                        title="Move Down"
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: index === menus.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === menus.length - 1 ? 0.25 : 0.7,
                          padding: '2px',
                        }}
                      >
                        <ArrowDown size={15} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(menu.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: 0,
                        textAlign: 'left',
                        flex: 1,
                      }}
                    >
                      <div style={{
                        color: isExpanded ? '#4f46e5' : '#64748b',
                        transition: 'transform 0.2s',
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                      }}>
                        <ChevronRight size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main, #0f172a)' }}>
                            {menu.name}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: '#f1f5f9',
                            color: '#475569',
                          }}>
                            Order: {menu.display_order}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: '#e0e7ff',
                            color: '#4338ca',
                          }}>
                            {submenus.length} Columns
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                          slug: <code style={{ background: '#f8fafc', padding: '1px 5px', borderRadius: '4px' }}>{menu.slug}</code>
                          {menu.url && <span style={{ marginLeft: '8px' }}>• URL: {menu.url}</span>}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Status & Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleMenuStatus(menu)}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: menu.status === 'active' ? '#ecfdf5' : '#fef2f2',
                        color: menu.status === 'active' ? '#059669' : '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                      title="Click to toggle status"
                    >
                      {menu.status === 'active' ? <Eye size={13} /> : <EyeOff size={13} />}
                      <span>{menu.status === 'active' ? 'Active' : 'Inactive'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openCreateItemModal(menu)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #c7d2fe',
                        background: '#eef2ff',
                        color: '#4f46e5',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={14} />
                      <span>Add Column / Submenu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditMenuModal(menu)}
                      title="Edit menu"
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: '#475569',
                      }}
                    >
                      <Edit2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteMenu(menu)}
                      title="Delete menu"
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid #fee2e2',
                        background: '#fef2f2',
                        cursor: 'pointer',
                        color: '#ef4444',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Submenus Mega Columns Layout */}
                {isExpanded && (
                  <div style={{ padding: '20px', background: '#fafafb', borderTop: '1px solid var(--border-color, #e2e8f0)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                          Mega Menu Columns for "{menu.name}"
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                          (Hovering this menu on storefront will show these columns side-by-side)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCreateItemModal(menu)}
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        + Add Column
                      </button>
                    </div>

                    {submenus.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                        No columns added yet. Click "+ Add Column" to add items like "Bed & Bath", "Decor", etc.
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                        gap: '16px',
                        alignItems: 'start',
                      }}>
                        {submenus.map((col) => (
                          <div
                            key={col.id}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '14px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                            }}
                          >
                            {/* Column Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #b45309', paddingBottom: '8px', marginBottom: '10px' }}>
                              <span style={{ fontWeight: 800, fontSize: '14px', color: '#92400e', textTransform: 'uppercase' }}>
                                {col.name}
                              </span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => openCreateItemModal(menu, col)}
                                  title={`Add child item under ${col.name}`}
                                  style={{ border: 'none', background: '#ecfdf5', color: '#059669', cursor: 'pointer', padding: '3px 6px', borderRadius: '4px' }}
                                >
                                  <Plus size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditItemModal(menu, col)}
                                  title="Edit column header"
                                  style={{ border: 'none', background: '#f1f5f9', cursor: 'pointer', padding: '3px 6px', borderRadius: '4px' }}
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(col.id)}
                                  title="Delete column"
                                  style={{ border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer', padding: '3px 6px', borderRadius: '4px' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Column Children Items */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {col.children && col.children.length > 0 ? (
                                col.children.map((child) => (
                                  <div
                                    key={child.id}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '6px 8px',
                                      background: '#f8fafc',
                                      borderRadius: '6px',
                                      fontSize: '13px',
                                    }}
                                  >
                                    <span style={{ color: child.name?.toLowerCase().includes('sale') ? '#ef4444' : '#334155', fontWeight: child.name?.toLowerCase().includes('sale') ? 700 : 500 }}>
                                      {child.name}
                                    </span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      <button
                                        type="button"
                                        onClick={() => openEditItemModal(menu, child)}
                                        title="Edit item"
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: '#64748b' }}
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteItem(child.id)}
                                        title="Delete item"
                                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '2px', color: '#ef4444' }}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '4px' }}>
                                  No child items yet.
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ADD / EDIT HEADER MENU (Sleek Centered Modal)
          ========================================================================= */}
      {menuModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            padding: '28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                {editingMenu ? 'Edit Header Menu' : 'Add New Header Menu'}
              </h3>
              <button
                type="button"
                onClick={() => setMenuModalOpen(false)}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMenuSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Menu Name * (e.g. HOME & LIVING, WOMEN, MEN, KIDS, SALE)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HOME & LIVING"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Slug (Auto-generated if empty)
                  </label>
                  <input
                    type="text"
                    placeholder="home-and-living"
                    value={menuForm.slug}
                    onChange={(e) => setMenuForm({ ...menuForm, slug: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={menuForm.display_order}
                    onChange={(e) => setMenuForm({ ...menuForm, display_order: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Destination URL
                </label>
                <input
                  type="text"
                  placeholder="/category/home-and-living"
                  value={menuForm.url}
                  onChange={(e) => setMenuForm({ ...menuForm, url: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Link Category
                  </label>
                  <select
                    value={menuForm.category_id}
                    onChange={(e) => setMenuForm({ ...menuForm, category_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="">-- None --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={menuForm.status}
                    onChange={(e) => setMenuForm({ ...menuForm, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setMenuModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : editingMenu ? 'Update Menu' : 'Create Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ADD / EDIT SUBMENU / CHILD ITEM (Sleek Centered Modal)
          ========================================================================= */}
      {itemModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            padding: '28px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                {editingItem ? 'Edit Submenu Item' : `Add Item under '${selectedMenuForItems?.name}'`}
              </h3>
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Item Name * (e.g. Bed & Bath, Bedsheets, Towels)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bed & Bath"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Parent Column / Level
                </label>
                <select
                  value={itemForm.parent_id}
                  onChange={(e) => setItemForm({ ...itemForm, parent_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">-- Level 1 Column Header (e.g. Bed & Bath, Decor) --</option>
                  {selectedMenuForItems?.items
                    ?.filter((i) => !editingItem || i.id !== editingItem.id)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        Child Under: {i.name}
                      </option>
                    ))}
                </select>
                <small style={{ color: '#64748b', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Choose a parent to make this a nested child (e.g. "Bedsheets" under "Bed & Bath").
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Slug (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="bed-and-bath"
                    value={itemForm.slug}
                    onChange={(e) => setItemForm({ ...itemForm, slug: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={itemForm.display_order}
                    onChange={(e) => setItemForm({ ...itemForm, display_order: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Redirect URL
                </label>
                <input
                  type="text"
                  placeholder="/category/bed-bath"
                  value={itemForm.redirect_url}
                  onChange={(e) => setItemForm({ ...itemForm, redirect_url: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="modal_item_active"
                  checked={itemForm.is_active}
                  onChange={(e) => setItemForm({ ...itemForm, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="modal_item_active" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Active and visible in mega menu
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
