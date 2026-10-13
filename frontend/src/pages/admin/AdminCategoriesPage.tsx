import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import api from '../../api/client.js';
import { IBusinessCategory, CategoryStatus } from '../../types/index.js';
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<IBusinessCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('order');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IBusinessCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'Layers',
    status: CategoryStatus.ACTIVE,
    displayOrder: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Deletion modal
  const [deletingCategory, setDeletingCategory] = useState<IBusinessCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (sortBy) params.sortBy = sortBy;

      const res = await api.get('/admin/categories', { params });
      if (res.data?.data?.categories) {
        setCategories(res.data.data.categories);
      }
    } catch (err: any) {
      toast.error('Failed to load business categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search, statusFilter, sortBy]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: 'Layers',
      status: CategoryStatus.ACTIVE,
      displayOrder: categories.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: IBusinessCategory) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      icon: cat.icon || 'Layers',
      status: cat.status,
      displayOrder: cat.displayOrder,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error('Category name must be at least 2 characters');
      return;
    }

    try {
      setIsSaving(true);
      if (editingCategory) {
        await api.patch(`/admin/categories/${editingCategory.id}`, formData);
        toast.success('Category updated successfully');
      } else {
        await api.post('/admin/categories', formData);
        toast.success('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (cat: IBusinessCategory) => {
    const newStatus = cat.status === CategoryStatus.ACTIVE ? CategoryStatus.INACTIVE : CategoryStatus.ACTIVE;
    try {
      await api.patch(`/admin/categories/${cat.id}/status`, { status: newStatus });
      toast.success(`Category marked as ${newStatus}`);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update category status');
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      await api.delete(`/admin/categories/${deletingCategory.id}`);
      toast.success('Category deleted successfully');
      setDeletingCategory(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Taxonomy Management
          </span>
          <h1 style={{ fontSize: '26px', marginTop: '4px' }}>Business Categories</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Configure industry sectors and high-level business classifications.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search categories by name, slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ width: '160px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value={CategoryStatus.ACTIVE}>Active</option>
              <option value={CategoryStatus.INACTIVE}>Inactive</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="order">Sort: Display Order</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading business categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Layers size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px' }} />
            <h3>No Categories Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              No categories match your filters. Create a new category to get started.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Order</th>
                  <th>Category Name</th>
                  <th>Slug</th>
                  <th>Business Types</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <span className="badge badge-role" style={{ fontSize: '11px' }}>
                        #{cat.displayOrder}
                      </span>
                    </td>
                    <td>
                      <b style={{ fontSize: '14px' }}>{cat.name}</b>
                      {cat.description && (
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0', maxWidth: '300px' }}>
                          {cat.description}
                        </p>
                      )}
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
                        {cat.slug}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-role" style={{ fontSize: '12px' }}>
                        {cat.businessTypeCount || 0} types
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(cat)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                        title="Click to toggle status"
                      >
                        <span className={`badge ${cat.status === CategoryStatus.ACTIVE ? 'badge-active' : 'badge-inactive'}`}>
                          {cat.status}
                        </span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(cat)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Edit Category"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingCategory(cat)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px', color: '#DC2626' }}
                          title="Delete Category"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 61, 46, 0.4)',
            backdropFilter: 'blur(3px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px' }}>
                {editingCategory ? 'Edit Business Category' : 'Create Business Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Professional Services, Health & Wellness"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  placeholder="Short description of this industry category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as CategoryStatus })}
                    className="input-field"
                  >
                    <option value={CategoryStatus.ACTIVE}>Active</option>
                    <option value={CategoryStatus.INACTIVE}>Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 61, 46, 0.4)',
            backdropFilter: 'blur(3px)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', color: '#DC2626' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '18px', color: '#172B24' }}>Delete Category</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Are you sure you want to delete <b>{deletingCategory.name}</b>? Categories referenced by business types or existing business registrations cannot be deleted.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDeletingCategory(null)} className="btn btn-secondary" disabled={isDeleting}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-primary"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Delete Category</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
