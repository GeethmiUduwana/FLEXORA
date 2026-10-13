import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import api from '../../api/client.js';
import { IBusinessModule, IModuleCategory, ModuleStatus } from '../../types/index.js';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Link2,
  Tag,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminModulesPage() {
  const navigate = useNavigate();

  const [modules, setModules] = useState<IBusinessModule[]>([]);
  const [categories, setCategories] = useState<IModuleCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Deletion modal
  const [deletingModule, setDeletingModule] = useState<IBusinessModule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load module categories for dropdown
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/admin/module-categories');
        if (res.data?.data?.categories) {
          setCategories(res.data.data.categories);
        }
      } catch (err) {
        console.error('Failed to load module categories', err);
      }
    };
    loadCategories();
  }, []);

  const fetchModules = async () => {
    try {
      setIsLoading(true);
      const params: any = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.moduleCategoryId = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (sortBy) params.sortBy = sortBy;

      const res = await api.get('/admin/modules', { params });
      if (res.data?.data?.modules) {
        setModules(res.data.data.modules);
        setTotalPages(res.data.data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      toast.error('Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [search, categoryFilter, statusFilter, sortBy, page]);

  const toggleStatus = async (mod: IBusinessModule) => {
    const nextStatus =
      mod.status === ModuleStatus.ACTIVE ? ModuleStatus.INACTIVE : ModuleStatus.ACTIVE;
    try {
      await api.patch(`/admin/modules/${mod.id}/status`, { status: nextStatus });
      toast.success(`Module marked as ${nextStatus}`);
      fetchModules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update module status');
    }
  };

  const handleDelete = async () => {
    if (!deletingModule) return;
    try {
      setIsDeleting(true);
      await api.delete(`/admin/modules/${deletingModule.id}`);
      toast.success('Module deleted successfully');
      setDeletingModule(null);
      fetchModules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete module');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            System Architecture
          </span>
          <h1 style={{ fontSize: '26px', marginTop: '4px' }}>Reusable Business Modules</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Configure modular features, pricing models, prerequisites, and business recommendations.
          </p>
        </div>
        <Link to="/admin/modules/create" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          <span>Create Module</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search modules by name, slug..."
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
              <option value={ModuleStatus.ACTIVE}>Active</option>
              <option value={ModuleStatus.INACTIVE}>Inactive</option>
              <option value={ModuleStatus.ARCHIVED}>Archived</option>
            </select>
          </div>

          <div style={{ width: '170px' }}>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">Sort: Default</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modules Table */}
      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading reusable modules...</p>
          </div>
        ) : modules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Package size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px' }} />
            <h3>No Modules Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              No modules match your current filters. Create a new module to populate the catalog.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Module Name</th>
                  <th>Category</th>
                  <th>Monthly Price</th>
                  <th>Yearly Price</th>
                  <th>Annual Savings</th>
                  <th>Prerequisites</th>
                  <th>Recommended For</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => {
                  const savings = mod.monthlyPrice * 12 - mod.yearlyPrice;
                  const depCount = mod.dependencies?.length || 0;
                  const recCount = mod.recommendedBusinessTypes?.length || 0;

                  return (
                    <tr key={mod.id}>
                      <td>
                        <b style={{ fontSize: '14px' }}>{mod.name}</b>
                        <small style={{ color: 'var(--text-secondary)', display: 'block' }}>/{mod.slug}</small>
                      </td>
                      <td>
                        <span className="badge badge-role">
                          {mod.moduleCategory?.name || 'Category'}
                        </span>
                      </td>
                      <td>
                        <b>${mod.monthlyPrice}</b>
                        <small style={{ color: 'var(--text-secondary)' }}>/mo</small>
                      </td>
                      <td>
                        <b>${mod.yearlyPrice}</b>
                        <small style={{ color: 'var(--text-secondary)' }}>/yr</small>
                      </td>
                      <td>
                        {savings > 0 ? (
                          <span className="badge badge-active" style={{ fontSize: '11px' }}>
                            Save ${savings}/yr
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>$0</span>
                        )}
                      </td>
                      <td>
                        {depCount > 0 ? (
                          <span className="badge badge-role" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                            <Link2 size={12} />
                            <span>{depCount} required</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>None</span>
                        )}
                      </td>
                      <td>
                        {recCount > 0 ? (
                          <span className="badge badge-role" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                            <Tag size={12} />
                            <span>{recCount} types</span>
                          </span>
                        ) : (
                          <span style={{ color: '#D97706', fontSize: '12px', fontWeight: 500 }}>Unmapped</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleStatus(mod)}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                          title="Click to toggle active/inactive"
                        >
                          <span
                            className={`badge ${
                              mod.status === ModuleStatus.ACTIVE
                                ? 'badge-active'
                                : mod.status === ModuleStatus.ARCHIVED
                                ? 'badge-suspended'
                                : 'badge-inactive'
                            }`}
                          >
                            {mod.status}
                          </span>
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <Link
                            to={`/admin/modules/${mod.id}/edit`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 10px' }}
                            title="Edit Module Details & Dependencies"
                          >
                            <Edit2 size={14} />
                          </Link>
                          <button
                            onClick={() => setDeletingModule(mod)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 10px', color: '#DC2626' }}
                            title="Delete Module"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Delete Confirmation Modal */}
      {deletingModule && (
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
              <h3 style={{ fontSize: '18px', color: '#172B24' }}>Delete Reusable Module</h3>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Are you sure you want to delete <b>{deletingModule.name}</b>? If other active modules require this module as a prerequisite, deletion will be safely rejected.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDeletingModule(null)} className="btn btn-secondary" disabled={isDeleting}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-primary"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Delete Module</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
