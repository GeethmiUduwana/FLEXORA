import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout.js';
import { useAuth } from '../context/AuthContext.js';
import { UserRole, AccountStatus } from '../types/index.js';
import api from '../api/client.js';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  LogOut,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, updateProfile, changePassword, logout } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  if (!user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      toast.error('First and last name cannot be empty');
      return;
    }
    try {
      setIsUpdatingProfile(true);
      await updateProfile({ firstName, lastName });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update password';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!window.confirm('Are you sure you want to log out from all devices? You will need to sign in again.')) {
      return;
    }
    try {
      await api.post('/auth/logout-all');
      await logout();
    } catch {
      await logout();
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
        <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Account & Security</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Manage your personal profile details, account credentials, and active sessions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Profile Summary & Name Edit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Account Overview Card */}
          <div className="card">
            <h3 style={{ fontSize: '17px', marginBottom: '16px' }}>Account Overview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Email Address</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{user.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Assigned Role</span>
                <span className="badge badge-role">{user.role.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Account Status</span>
                {getStatusBadge(user.status)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Email Verified</span>
                <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Verified
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Member Since</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              {user.lastLoginAt && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Last Login</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {new Date(user.lastLoginAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Information */}
          <div className="card">
            <h3 style={{ fontSize: '17px', marginBottom: '16px' }}>Personal Information</h3>
            <form onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isUpdatingProfile}
                style={{ width: '100%' }}
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  'Save Profile Details'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Password Change & Session Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Change Password Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <KeyRound size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '17px' }}>Change Password</h3>
            </div>

            {passwordError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--error-bg)',
                  color: 'var(--error)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="currentPassword">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="newPassword">
                  New Password (min 8 chars, 1 uppercase, 1 number)
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirmNewPassword">
                  Confirm New Password
                </label>
                <input
                  id="confirmNewPassword"
                  type="password"
                  className="form-input"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                disabled={isChangingPassword}
                style={{ width: '100%' }}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>

          {/* Active Sessions & Security */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Shield size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '17px' }}>Active Sessions & Devices</h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '18px' }}>
              Your session is secured using HttpOnly cookies with automatic token rotation. If you suspect unauthorized access or signed in from a shared computer, you can revoke all other active sessions immediately.
            </p>
            <button
              onClick={handleRevokeAllSessions}
              className="btn btn-danger btn-sm"
              style={{ width: '100%' }}
            >
              <LogOut size={16} />
              <span>Revoke All Other Sessions</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
