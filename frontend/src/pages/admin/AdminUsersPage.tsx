import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import api from '../../api/client.js';
import { IUser, UserRole, AccountStatus } from '../../types/index.js';
import { Search, Filter, Shield, Loader2, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminUsersPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedRole) params.append('role', selectedRole);
      if (selectedStatus) params.append('status', selectedStatus);
      params.append('page', page.toString());
      params.append('limit', '10');

      const response = await api.get(`/admin/users?${params.toString()}`);
      if (response.data?.data) {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalCount(response.data.data.pagination.totalCount);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, selectedRole, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleStatusChange = async (userId: string, newStatus: AccountStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      toast.success('Account status updated');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

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

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>User Management</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          View, audit, activate, suspend, or reassign roles across registered platform accounts.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flex: '1', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">
            Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Roles</option>
            <option value={UserRole.PLATFORM_ADMIN}>Platform Admin</option>
            <option value={UserRole.BUSINESS_OWNER}>Business Owner</option>
            <option value={UserRole.MANAGER}>Manager</option>
            <option value={UserRole.STAFF}>Staff</option>
          </select>

          <select
            className="form-input"
            style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value={AccountStatus.ACTIVE}>Active</option>
            <option value={AccountStatus.INACTIVE}>Inactive</option>
            <option value={AccountStatus.SUSPENDED}>Suspended</option>
            <option value={AccountStatus.PENDING_VERIFICATION}>Pending</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Account Details</th>
              <th>Current Role</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Manage Status</th>
              <th>Manage Role</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px' }}>
                  <Loader2 size={24} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Loading accounts...</span>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                  No user accounts match the current filter.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-role">{u.role.replace('_', ' ')}</span>
                  </td>
                  <td>{getStatusBadge(u.status)}</td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <select
                      className="form-input"
                      style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
                      value={u.status}
                      onChange={(e) => handleStatusChange(u.id, e.target.value as AccountStatus)}
                    >
                      <option value={AccountStatus.ACTIVE}>Active</option>
                      <option value={AccountStatus.INACTIVE}>Inactive</option>
                      <option value={AccountStatus.SUSPENDED}>Suspended</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-input"
                      style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                    >
                      <option value={UserRole.PLATFORM_ADMIN}>Platform Admin</option>
                      <option value={UserRole.BUSINESS_OWNER}>Business Owner</option>
                      <option value={UserRole.MANAGER}>Manager</option>
                      <option value={UserRole.STAFF}>Staff</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Showing {users.length} of {totalCount} total accounts
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span style={{ fontSize: '13px', padding: '6px 10px', fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
