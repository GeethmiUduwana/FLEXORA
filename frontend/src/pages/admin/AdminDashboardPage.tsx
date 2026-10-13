import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import api from '../../api/client.js';
import { AdminStats, IUser, IBusinessModule, UserRole, AccountStatus } from '../../types/index.js';
import {
  Users,
  UserCheck,
  Building2,
  ShieldCheck,
  ArrowRight,
  Layers,
  Briefcase,
  Package,
  Layers3,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Link2,
} from 'lucide-react';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<IUser[]>([]);
  const [recentModules, setRecentModules] = useState<IBusinessModule[]>([]);
  const [modulesByCategory, setModulesByCategory] = useState<{ _id: string; name: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        if (response.data?.data) {
          setStats(response.data.data.stats);
          setRecentUsers(response.data.data.recentUsers || []);
          setRecentModules(response.data.data.recentModules || []);
          setModulesByCategory(response.data.data.modulesByCategoryGroup || []);
        }
      } catch (err) {
        console.error('Failed to fetch admin dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case AccountStatus.ACTIVE:
        return <span className="badge badge-active">Active</span>;
      case AccountStatus.SUSPENDED:
        return <span className="badge badge-suspended">Suspended</span>;
      case AccountStatus.INACTIVE:
        return <span className="badge badge-inactive">Inactive</span>;
      case AccountStatus.PENDING_VERIFICATION:
        return <span className="badge badge-pending">Pending</span>;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    return <span className="badge badge-role">{role.replace('_', ' ')}</span>;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading platform statistics...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Platform Administration Overview</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Manage business taxonomy, module categories, reusable features, pricing, and system users.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E8F5EE', color: '#16845B' }}>
            <Layers size={24} />
          </div>
          <div className="stat-info">
            <small>Business Categories</small>
            <b>{stats?.totalBusinessCategories || 0}</b>
            <span style={{ fontSize: '11px', color: 'var(--primary)' }}>
              {stats?.activeBusinessCategories || 0} Active
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E0E7FF', color: '#4F46E5' }}>
            <Briefcase size={24} />
          </div>
          <div className="stat-info">
            <small>Business Types</small>
            <b>{stats?.totalBusinessTypes || 0}</b>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Available Presets</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Layers3 size={24} />
          </div>
          <div className="stat-info">
            <small>Module Categories</small>
            <b>{stats?.totalModuleCategories || 0}</b>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Functional Groups</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
            <Package size={24} />
          </div>
          <div className="stat-info">
            <small>Reusable Modules</small>
            <b>{stats?.totalModules || 0}</b>
            <span style={{ fontSize: '11px', color: '#15803D' }}>
              {stats?.activeModules || 0} Active · {stats?.inactiveModules || 0} Inactive
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Banners */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <Link
          to="/admin/categories"
          className="card"
          style={{ textDecoration: 'none', color: 'inherit', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'transform 0.15s ease' }}
        >
          <div style={{ padding: '10px', background: 'var(--light-green)', borderRadius: '10px', color: 'var(--primary)' }}>
            <Layers size={22} />
          </div>
          <div>
            <b style={{ fontSize: '14px', display: 'block', color: 'var(--dark-green)' }}>Business Categories</b>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Manage industry taxonomies →</span>
          </div>
        </Link>

        <Link
          to="/admin/business-types"
          className="card"
          style={{ textDecoration: 'none', color: 'inherit', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}
        >
          <div style={{ padding: '10px', background: '#EEF2FF', borderRadius: '10px', color: '#4F46E5' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <b style={{ fontSize: '14px', display: 'block', color: 'var(--dark-green)' }}>Business Types</b>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Subcategories & presets →</span>
          </div>
        </Link>

        <Link
          to="/admin/module-categories"
          className="card"
          style={{ textDecoration: 'none', color: 'inherit', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}
        >
          <div style={{ padding: '10px', background: '#FEF3C7', borderRadius: '10px', color: '#D97706' }}>
            <Layers3 size={22} />
          </div>
          <div>
            <b style={{ fontSize: '14px', display: 'block', color: 'var(--dark-green)' }}>Module Categories</b>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Organize features →</span>
          </div>
        </Link>

        <Link
          to="/admin/modules"
          className="card"
          style={{ textDecoration: 'none', color: 'inherit', padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}
        >
          <div style={{ padding: '10px', background: '#DCFCE7', borderRadius: '10px', color: '#15803D' }}>
            <Package size={22} />
          </div>
          <div>
            <b style={{ fontSize: '14px', display: 'block', color: 'var(--dark-green)' }}>Reusable Modules</b>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Catalog, pricing & deps →</span>
          </div>
        </Link>
      </div>

      {/* Grid: Modules by Category & Recent Modules */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Modules Grouped by Category */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '17px' }}>Modules by Category</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Distribution across functional groups</p>
            </div>
            <Link to="/admin/modules" className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {modulesByCategory.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>No modules seeded yet.</p>
            ) : (
              modulesByCategory.map((cat) => (
                <div
                  key={cat._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: '#FBFDFB',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{cat.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-role" style={{ fontSize: '12px' }}>
                      {cat.count} modules
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Catalog Diagnostics & Alerts */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px' }}>Catalog Diagnostics</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Health checks for module configurations</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: '#F8FAF9',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ padding: '8px', background: '#E0E7FF', borderRadius: '8px', color: '#4F46E5' }}>
                <Link2 size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: '13px', display: 'block' }}>Modules with Dependencies</b>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {stats?.modulesWithDependencies || 0} modules enforce technical prerequisites
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: '#F8FAF9',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ padding: '8px', background: '#FEF3C7', borderRadius: '8px', color: '#D97706' }}>
                <Tag size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: '13px', display: 'block' }}>Needs Recommendation Mapping</b>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {stats?.modulesWithoutRecommendations || 0} modules have no industry recommendations yet
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: '#F8FAF9',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div style={{ padding: '8px', background: '#DCFCE7', borderRadius: '8px', color: '#15803D' }}>
                <CheckCircle2 size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: '13px', display: 'block' }}>Platform Security & RBAC</b>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {stats?.totalUsers || 0} total accounts · {stats?.businessOwners || 0} business owners
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Created / Updated Modules */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '17px' }}>Recently Updated Modules</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Catalog entries recently modified</p>
          </div>
          <Link to="/admin/modules" className="btn btn-secondary btn-sm">
            <span>Manage Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Module Name</th>
                <th>Category</th>
                <th>Monthly Price</th>
                <th>Yearly Price</th>
                <th>Annual Savings</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentModules.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                    No modules found
                  </td>
                </tr>
              ) : (
                recentModules.map((m) => {
                  const savings = m.monthlyPrice * 12 - m.yearlyPrice;
                  return (
                    <tr key={m.id}>
                      <td>
                        <b style={{ fontSize: '14px' }}>{m.name}</b>
                        <small style={{ color: 'var(--text-secondary)', display: 'block' }}>/{m.slug}</small>
                      </td>
                      <td>
                        <span className="badge badge-role">
                          {m.moduleCategory?.name || 'Category'}
                        </span>
                      </td>
                      <td>
                        <b>${m.monthlyPrice}</b>
                        <small style={{ color: 'var(--text-secondary)' }}>/mo</small>
                      </td>
                      <td>
                        <b>${m.yearlyPrice}</b>
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
                        <span className={`badge ${m.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                          {m.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/modules/${m.id}/edit`} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px' }}>
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
