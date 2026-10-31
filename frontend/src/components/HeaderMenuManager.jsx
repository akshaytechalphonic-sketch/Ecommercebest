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
import { headerMenuApi, categoryApi, bannerApi } from '../services/api';

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
      const [menuRes, catRes, banRes] = await Promise.allSettled([
        headerMenuApi.getAdminHeaderMenus(),
        categoryApi.adminGetCategories(),
        bannerApi.getAdminBanners({ limit: 100 }),
      ]);

      if (menuRes.status === 'fulfilled' && menuRes.value?.data) {
        setMenus(menuRes.value.data);
      }
      if (catRes.status === 'fulfilled' && catRes.value?.data) {
        setCategories(Array.isArray(catRes.value.data) ? catRes.value.data : catRes.value.data?.categories || []);
      }
      if (banRes.status === 'fulfilled' && banRes.value?.data) {
        setBanners(banRes.value.data?.banners || []);
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
    <div style={{ padding: '4px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '10px', color: 'var(--primary)' }}>
              <Menu size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Dynamic Header Menus</h2>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Manage storefront navigation bar, multi-level nested submenus, and promotional mega banners.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadData}
            title="Refresh menu list"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateMenuModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>Add Header Menu</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL MENUS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{menus.length}</div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE ON STOREFRONT</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {menus.filter((m) => m.status === 'active').length}
          </div>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>LINKED BANNERS</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
            {menus.filter((m) => m.banner_id).length}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '16px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search header menus by name or slug..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px 10px 40px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg)',
            color: 'var(--text-main)',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Menus List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
          <div>Loading header menus...</div>
        </div>
      ) : filteredMenus.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <Menu size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>No Header Menus Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 16px 0' }}>
            Click "Add Header Menu" to create your first top-level storefront menu item.
          </p>
          <button type="button" className="btn btn-primary" onClick={openCreateMenuModal}>
            Add Header Menu
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredMenus.map((menu, index) => {
            const isExpanded = Boolean(expandedMenus[menu.id]);
            const itemCount = menu.items?.length || 0;

            return (
              <div
                key={menu.id}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.2s',
                }}
              >
                {/* Menu Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    gap: '12px',
                    borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                    background: isExpanded ? 'var(--hover-bg)' : 'transparent',
                  }}
                >
                  {/* Left: Reorder & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={() => handleMoveMenu(index, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                        style={{ border: 'none', background: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', opacity: index === 0 ? 0.3 : 0.8, padding: 0 }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMenu(index, 'down')}
                        disabled={index === menus.length - 1}
                        title="Move Down"
                        style={{ border: 'none', background: 'none', cursor: index === menus.length - 1 ? 'not-allowed' : 'pointer', opacity: index === menus.length - 1 ? 0.3 : 0.8, padding: 0 }}
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(menu.id)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, textAlign: 'left' }}
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>{menu.name}</span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' }}>
                            order: {menu.display_order}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          slug: <code>{menu.slug}</code> {menu.url && `• ${menu.url}`}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Badges: Category & Banner */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {menu.category && (
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={12} /> Cat: {menu.category.name}
                      </span>
                    )}

                    {menu.banner && (
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px' }} title={menu.banner.title}>
                        <Sparkles size={12} /> Banner: {menu.banner.title}
                      </span>
                    )}

                    <span
                      onClick={() => handleToggleMenuStatus(menu)}
                      style={{
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: menu.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: menu.status === 'active' ? '#10b981' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="Click to toggle status"
                    >
                      {menu.status === 'active' ? <Eye size={12} /> : <EyeOff size={12} />}
                      {menu.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => openCreateItemModal(menu)}
                      title="Add submenu item"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                    >
                      <Plus size={14} />
                      <span>Add Submenu</span>
                    </button>

                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => openEditMenuModal(menu)}
                      title="Edit menu"
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleDeleteMenu(menu)}
                      title="Delete menu"
                      style={{ color: '#ef4444' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Submenus Drawer */}
                {isExpanded && (
                  <div style={{ padding: '16px 20px', background: 'var(--sub-bg, rgba(0,0,0,0.02))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Nested Submenu Items ({itemCount})
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => openCreateItemModal(menu)}
                        style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Plus size={13} />
                        <span>Add Level-1 Submenu</span>
                      </button>
                    </div>

                    {!menu.items || menu.items.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No submenus added yet. Click "+ Add Submenu" to add categories under {menu.name}.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {menu.items.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              background: 'var(--card-bg)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '10px 14px',
                            }}
                          >
                            {/* Level 1 Item */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FolderTree size={16} color="var(--primary)" />
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    slug: <code>{item.slug}</code> {item.redirect_url && `• ${item.redirect_url}`}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {item.banner && (
                                  <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                    Banner: {item.banner.title}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => openCreateItemModal(menu, item)}
                                  title="Add child sub-item under this category"
                                  style={{ fontSize: '11px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Plus size={12} />
                                  <span>Add Child</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => openEditItemModal(menu, item)}
                                  title="Edit submenu item"
                                  style={{ padding: '4px' }}
                                >
                                  <Edit2 size={13} />
                                </button>

                                <button
                                  type="button"
                                  className="btn-icon"
                                  onClick={() => handleDeleteItem(item.id)}
                                  title="Delete submenu item"
                                  style={{ color: '#ef4444', padding: '4px' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Level 2 Children (if any) */}
                            {item.children && item.children.length > 0 && (
                              <div style={{ marginTop: '8px', paddingLeft: '24px', borderLeft: '2px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {item.children.map((child) => (
                                  <div
                                    key={child.id}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '6px 10px',
                                      background: 'rgba(0,0,0,0.02)',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontWeight: 500 }}>{child.name}</span>
                                      {child.redirect_url && <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({child.redirect_url})</span>}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={() => openEditItemModal(menu, child)}
                                        title="Edit child item"
                                        style={{ padding: '2px' }}
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-icon"
                                        onClick={() => handleDeleteItem(child.id)}
                                        title="Delete child item"
                                        style={{ color: '#ef4444', padding: '2px' }}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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
          MODAL 1: ADD / EDIT HEADER MENU
          ========================================================================= */}
      {menuModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {editingMenu ? 'Edit Header Menu' : 'Add New Header Menu'}
              </h3>
              <button type="button" className="btn-icon" onClick={() => setMenuModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMenuSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label className="form-label">Menu Name * (e.g. Women, Men, Kids, Home & Living, Sale)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Home & Living"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Slug (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="home-and-living"
                    value={menuForm.slug}
                    onChange={(e) => setMenuForm({ ...menuForm, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={menuForm.display_order}
                    onChange={(e) => setMenuForm({ ...menuForm, display_order: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Destination URL</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="/category/home-and-living or https://..."
                  value={menuForm.url}
                  onChange={(e) => setMenuForm({ ...menuForm, url: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Link Existing Category</label>
                  <select
                    className="form-control"
                    value={menuForm.category_id}
                    onChange={(e) => setMenuForm({ ...menuForm, category_id: e.target.value })}
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
                  <label className="form-label">Link Promotional Banner</label>
                  <select
                    className="form-control"
                    value={menuForm.banner_id}
                    onChange={(e) => setMenuForm({ ...menuForm, banner_id: e.target.value })}
                  >
                    <option value="">-- None --</option>
                    {banners.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.banner_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={menuForm.status}
                  onChange={(e) => setMenuForm({ ...menuForm, status: e.target.value })}
                >
                  <option value="active">Active (Visible on Storefront)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMenuModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingMenu ? 'Update Menu' : 'Create Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ADD / EDIT SUBMENU ITEM
          ========================================================================= */}
      {itemModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                {editingItem ? 'Edit Submenu Item' : `Add Submenu to '${selectedMenuForItems?.name}'`}
              </h3>
              <button type="button" className="btn-icon" onClick={() => setItemModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div>
                <label className="form-label">Item Name * (e.g. Bed & Bath, Bedsheets, Decor)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Bed & Bath"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label">Parent Submenu (For Multi-Level Nesting)</label>
                <select
                  className="form-control"
                  value={itemForm.parent_id}
                  onChange={(e) => setItemForm({ ...itemForm, parent_id: e.target.value })}
                >
                  <option value="">-- Level 1 (Top Submenu Level) --</option>
                  {selectedMenuForItems?.items
                    ?.filter((i) => !editingItem || i.id !== editingItem.id)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        Under: {i.name}
                      </option>
                    ))}
                </select>
                <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '3px' }}>
                  Select a parent to make this a nested child item (e.g. "Bedsheets" under "Bed & Bath").
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Slug (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="bed-and-bath"
                    value={itemForm.slug}
                    onChange={(e) => setItemForm({ ...itemForm, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={itemForm.display_order}
                    onChange={(e) => setItemForm({ ...itemForm, display_order: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Redirect URL</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="/category/bed-bath"
                  value={itemForm.redirect_url}
                  onChange={(e) => setItemForm({ ...itemForm, redirect_url: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Link Category</label>
                  <select
                    className="form-control"
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
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
                  <label className="form-label">Link Submenu Banner</label>
                  <select
                    className="form-control"
                    value={itemForm.banner_id}
                    onChange={(e) => setItemForm({ ...itemForm, banner_id: e.target.value })}
                  >
                    <option value="">-- None --</option>
                    {banners.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="item_is_active"
                  checked={itemForm.is_active}
                  onChange={(e) => setItemForm({ ...itemForm, is_active: e.target.checked })}
                />
                <label htmlFor="item_is_active" style={{ fontSize: '13px', cursor: 'pointer' }}>
                  Active and visible in mega menu
                </label>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setItemModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Add Submenu Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
