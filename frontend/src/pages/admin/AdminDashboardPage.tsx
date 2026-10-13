import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import api from '../../api/client.js';
import { AdminStats, IUser, UserRole, AccountStatus } from '../../types/index.js';
import {
  Users,
  UserCheck,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Layers,
  Briefcase,
  Package,
  Clock,
  Loader2,
} from 'lucide-react';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        if (response.data?.data) {
          setStats(response.data.data.stats);
          setRecentUsers(response.data.data.recentUsers);
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
          Monitor system metrics, registered accounts, and future module configuration states.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <small>Total Accounts</small>
            <b>{stats?.totalUsers || 0}</b>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E8F5EE', color: '#16845B' }}>
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <small>Active Users</small>
            <b>{stats?.activeUsers || 0}</b>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E0E7FF', color: '#4F46E5' }}>
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <small>Business Owners</small>
            <b>{stats?.businessOwners || 0}</b>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <small>Managers & Staff</small>
            <b>{(stats?.managers || 0) + (stats?.staff || 0)}</b>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Users & Roadmap Placeholders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        {/* Recent Registered Users */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '17px' }}>Recently Registered Users</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Latest platform accounts created</p>
            </div>
            <Link to="/admin/users" className="btn btn-secondary btn-sm">
              <span>View All Users</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>{u.email}</small>
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>{getStatusBadge(u.status)}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Future Modules Placeholders */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '17px' }}>System Architecture Placeholders</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Configuration areas scheduled for subsequent implementation steps.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: '#FBFDFB',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Layers size={18} color="var(--primary)" />
              <b style={{ fontSize: '14px' }}>Business Categories</b>
              <span className="badge badge-inactive" style={{ marginLeft: 'auto' }}>Step 2</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Configure business categories (Retail, Services, F&B) and taxonomy rules.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: '#FBFDFB',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Briefcase size={18} color="var(--primary)" />
              <b style={{ fontSize: '14px' }}>Business Types & Templates</b>
              <span className="badge badge-inactive" style={{ marginLeft: 'auto' }}>Step 2</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Manage business type presets and starter layouts for incoming businesses.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              background: '#FBFDFB',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Package size={18} color="var(--primary)" />
              <b style={{ fontSize: '14px' }}>Module Marketplace Catalog</b>
              <span className="badge badge-inactive" style={{ marginLeft: 'auto' }}>Step 3</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Publish, price, and maintain modular business capabilities (e-commerce, booking, CRM).
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
