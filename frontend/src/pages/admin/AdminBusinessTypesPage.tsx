import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import api from '../../api/client.js';
import { IBusinessType, IBusinessCategory, CategoryStatus } from '../../types/index.js';
import {
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminBusinessTypesPage() {
  const [businessTypes, setBusinessTypes] = useState<IBusinessType[]>([]);
  const [categories, setCategories] = useState<IBusinessCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<IBusinessType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    status: CategoryStatus.ACTIVE,
    isCustom: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Deletion modal
  const [deletingType, setDeletingType] = useState<IBusinessType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load categories for dropdowns
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/admin/categories');
        if (res.data?.data?.categories) {
          setCategories(res.data.data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  const fetchBusinessTypes = async () => {
    try {
      setIsLoading(true);
      const params: any = { page, limit: 15 };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.categoryId = categoryFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/admin/business-types', { params });
      if (res.data?.data?.businessTypes) {
        setBusinessTypes(res.data.data.businessTypes);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      toast.error('Failed to load business types');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessTypes();
  }, [search, categoryFilter, statusFilter, page]);

  const openCreateModal = () => {
    setEditingType(null);
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      description: '',
      status: CategoryStatus.ACTIVE,
      isCustom: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (bt: IBusinessType) => {
    setEditingType(bt);
    setFormData({
      name: bt.name,
      categoryId: bt.categoryId,
      description: bt.description || '',
      status: bt.status,
      isCustom: bt.isCustom,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Please select an active category');
      return;
    }

    try {
      setIsSaving(true);
      if (editingType) {
        await api.patch(`/admin/business-types/${editingType.id}`, formData);
        toast.success('Business type updated successfully');
      } else {
        await api.post('/admin/business-types', formData);
        toast.success('Business type created successfully');
      }
      setIsModalOpen(false);
      fetchBusinessTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save business type');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (bt: IBusinessType) => {
    const newStatus = bt.status === CategoryStatus.ACTIVE ? CategoryStatus.INACTIVE : CategoryStatus.ACTIVE;
    try {
      await api.patch(`/admin/business-types/${bt.id}/status`, { status: newStatus });
      toast.success(`Business type marked as ${newStatus}`);
      fetchBusinessTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update business type status');
    }
  };

  const handleDelete = async () => {
    if (!deletingType) return;
    try {
      setIsDeleting(true);
      await api.delete(`/admin/business-types/${deletingType.id}`);
      toast.success('Business type deleted successfully');
      setDeletingType(null);
      fetchBusinessTypes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete business type');
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
          <h1 style={{ fontSize: '26px', marginTop: '4px' }}>Business Types & Subcategories</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage specific business profiles, subcategories, and industry presets.
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          <span>Add Business Type</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by name, slug..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-field"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ width: '200px' }}>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value={CategoryStatus.ACTIVE}>Active</option>
              <option value={CategoryStatus.INACTIVE}>Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Business Types Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading business types...</p>
          </div>
        ) : businessTypes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Briefcase size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px' }} />
            <h3>No Business Types Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              No business types match your search criteria.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business Type Name</th>
                  <th>Assigned Category</th>
                  <th>Registered Businesses</th>
                  <th>Type Kind</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {businessTypes.map((bt) => (
                  <tr key={bt.id}>
                    <td>
                      <b style={{ fontSize: '14px' }}>{bt.name}</b>
                      <small style={{ color: 'var(--text-secondary)', display: 'block' }}>/{bt.slug}</small>
                    </td>
                    <td>
                      <span className="badge badge-role">
                        {bt.category?.name || 'Category'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-role" style={{ fontSize: '12px' }}>
                        {bt.businessCount || 0} active
                      </span>
                    </td>
                    <td>
                      {bt.isCustom ? (
                        <span className="badge badge-suspended" style={{ fontSize: '11px' }}>Custom Type</span>
                      ) : (
                        <span className="badge badge-inactive" style={{ fontSize: '11px' }}>Global Predefined</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(bt)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                        title="Click to toggle status"
                      >
                        <span className={`badge ${bt.status === CategoryStatus.ACTIVE ? 'badge-active' : 'badge-inactive'}`}>
                          {bt.status}
                        </span>
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(bt)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Edit Type"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingType(bt)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px', color: '#DC2626' }}
                          title="Delete Type"
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary btn-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
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
                {editingType ? 'Edit Business Type' : 'Create Business Type'}
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
                <label className="label">Parent Business Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Business Type Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Company, Dental Clinic, Cafe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  rows={3}
                  placeholder="Optional details or instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="isCustomCheckbox"
                    checked={formData.isCustom}
                    onChange={(e) => setFormData({ ...formData, isCustom: e.target.checked })}
                  />
                  <label htmlFor="isCustomCheckbox" style={{ fontSize: '13px', cursor: 'pointer' }}>
                    Custom Business Type
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>{editingType ? 'Save Changes' : 'Create Type'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingType && (
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
              <h3 style={{ fontSize: '18px', color: '#172B24' }}>Delete Business Type</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Are you sure you want to delete <b>{deletingType.name}</b>? If businesses are currently registered under this type, deletion will be blocked to protect tenant data.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDeletingType(null)} className="btn btn-secondary" disabled={isDeleting}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-primary"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Delete Type</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
