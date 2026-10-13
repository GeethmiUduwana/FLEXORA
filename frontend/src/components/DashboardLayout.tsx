import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';
import {
  Layers3,
  Users,
  LayoutDashboard,
  Building2,
  UserCheck,
  Briefcase,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

interface NavLinkItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  isPlaceholder?: boolean;
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const getNavLinks = (): NavLinkItem[] => {
    switch (user.role) {
      case UserRole.PLATFORM_ADMIN:
        return [
          { label: 'Admin Overview', path: '/admin/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'User Management', path: '/admin/users', icon: <Users size={18} /> },
          { label: 'Business Categories', path: '/admin/categories', icon: <Layers size={18} /> },
          { label: 'Business Types', path: '/admin/business-types', icon: <Briefcase size={18} /> },
          { label: 'Module Categories', path: '/admin/module-categories', icon: <Layers3 size={18} /> },
          { label: 'Reusable Modules', path: '/admin/modules', icon: <Package size={18} /> },
        ];
      case UserRole.BUSINESS_OWNER:
        return [
          { label: 'Business Hub', path: '/business/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'Business Workspace', path: '#workspace', icon: <Building2 size={18} />, isPlaceholder: true },
          { label: 'Team Members', path: '#team', icon: <Users size={18} />, isPlaceholder: true },
          { label: 'Website Builder', path: '#builder', icon: <Sparkles size={18} />, isPlaceholder: true },
        ];
      case UserRole.MANAGER:
        return [
          { label: 'Manager Hub', path: '/manager/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'Assigned Workspace', path: '#workspace', icon: <Building2 size={18} />, isPlaceholder: true },
          { label: 'Operations & Tasks', path: '#tasks', icon: <Briefcase size={18} />, isPlaceholder: true },
        ];
      case UserRole.STAFF:
        return [
          { label: 'Staff Hub', path: '/staff/dashboard', icon: <LayoutDashboard size={18} /> },
          { label: 'Assigned Workspace', path: '#workspace', icon: <Building2 size={18} />, isPlaceholder: true },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatRoleName = (role: UserRole) => {
    switch (role) {
      case UserRole.PLATFORM_ADMIN:
        return 'Platform Admin';
      case UserRole.BUSINESS_OWNER:
        return 'Business Owner';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.STAFF:
        return 'Staff Member';
    }
  };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <Layers3 size={20} />
          </div>
          <span className="sidebar-logo-text">Flexora</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', display: mobileMenuOpen ? 'block' : 'none' }}
          >
            <X size={20} color="var(--text-secondary)" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <small style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 10px 8px' }}>
            Main Menu
          </small>
          {navLinks.map((item, idx) => {
            const isActive = location.pathname === item.path;
            if (item.isPlaceholder) {
              return (
                <div
                  key={idx}
                  className="nav-item"
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  title="Coming in future development steps"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              );
            }
            return (
              <Link
                key={idx}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}

          <small style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '16px 10px 8px' }}>
            Account
          </small>
          <Link
            to="/profile"
            className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <UserIcon size={18} />
            <span>My Profile</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'none' }}
              id="mobile-menu-toggle"
            >
              <Menu size={18} />
            </button>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
              {formatRoleName(user.role)}
            </h2>
          </div>

          <div className="topbar-right">
            <div className="user-badge-wrap">
              <div className="avatar">{initials}</div>
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {user.firstName} {user.lastName}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="dashboard-page">{children}</main>
      </div>
    </div>
  );
}
