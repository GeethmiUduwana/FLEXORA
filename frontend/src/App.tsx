import React from 'react';
import { Link, Route, Routes, Navigate } from 'react-router-dom';
import { Layers3, ShieldCheck, WandSparkles } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { UserRole } from './types/index.js';

// Auth Pages
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { UnauthorizedPage } from './pages/UnauthorizedPage.js';
import { DashboardRedirect } from './pages/DashboardRedirect.js';
import { ProfilePage } from './pages/ProfilePage.js';

// Role Dashboards
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.js';
import { BusinessDashboardPage } from './pages/business/BusinessDashboardPage.js';
import { BusinessSetupPage } from './pages/business/BusinessSetupPage.js';
import { BusinessSettingsPage } from './pages/business/BusinessSettingsPage.js';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage.js';
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage.js';

function Home() {
  const { user } = useAuth();

  return (
    <main className="page">
      <nav className="nav">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Layers3 size={22} />
          </span>{' '}
          Flexora
        </Link>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          {user ? (
            <Link className="button button-primary" to="/dashboard">
              Go to Dashboard ({user.role.replace('_', ' ')})
            </Link>
          ) : (
            <>
              <Link className="button button-light" to="/login">
                Log in
              </Link>
              <Link className="button button-primary" to="/register">
                Start building
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="hero">
        <div className="eyebrow">
          <WandSparkles size={16} /> YOUR BUSINESS. YOUR SYSTEM.
        </div>
        <h1>
          Build your system.
          <br />
          <span>Your way.</span>
        </h1>
        <p className="hero-copy">
          Choose the features your business needs. Design your website visually. Grow your system as your business grows.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link className="button button-primary" to="/dashboard">
              Go to Dashboard <span>→</span>
            </Link>
          ) : (
            <Link className="button button-primary" to="/register">
              Start building <span>→</span>
            </Link>
          )}
          <a className="button button-light" href="#how-it-works">
            Explore how it works
          </a>
        </div>
        <div className="trust">
          <ShieldCheck size={17} /> One platform. Custom-built for your business.
        </div>

        <div className="preview">
          <aside className="preview-sidebar">
            <div className="preview-logo">
              <Layers3 size={17} /> Flexora
            </div>
            <div className="preview-active">▦ &nbsp; Overview</div>
            <div>◇ &nbsp; Website builder</div>
            <div>▧ &nbsp; Features</div>
            <div>⚙ &nbsp; Settings</div>
          </aside>
          <div className="preview-main">
            <div className="preview-top">
              <div>
                <small>YOUR WORKSPACE</small>
                <h3>Business overview</h3>
              </div>
              <span className="status">Workspace preview</span>
            </div>
            <div className="metric-grid">
              <div className="metric">
                <small>Active modules</small>
                <b>08</b>
                <span>Configured for you</span>
              </div>
              <div className="metric">
                <small>Website status</small>
                <b>Draft</b>
                <span>Ready to customize</span>
              </div>
              <div className="metric">
                <small>Workspace</small>
                <b>My Business</b>
                <span>Your data stays yours</span>
              </div>
            </div>
            <div className="preview-bottom">
              <div>
                <small>WEBSITE BUILDER</small>
                <h3>Bring your business online</h3>
                <p>Start with a template, then customize every section.</p>
              </div>
              <div className="mock-canvas">
                <div className="mock-pill">YOUR BUSINESS</div>
                <b>Made for your next chapter.</b>
                <div className="mock-button">Explore services ↗</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section">
        <p className="section-kicker">SIMPLE BY DESIGN</p>
        <h2>From idea to business system</h2>
        <div className="steps">
          <article>
            <span>01</span>
            <h3>Choose</h3>
            <p>Tell Flexora about your business and choose the modules you need.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Customize</h3>
            <p>Build your website visually with reusable sections and elements.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Grow</h3>
            <p>Publish your site and add features when your business needs them.</p>
          </article>
        </div>
      </section>

      <section id="features" className="section feature-section">
        <p className="section-kicker">ONE FLEXIBLE PLATFORM</p>
        <h2>Everything works together</h2>
        <p>
          Website builder, business modules, subscriptions and administration are designed as one connected system.
        </p>
      </section>

      <footer>© Flexora · Build. Customize. Scale.</footer>
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-body)',
            borderRadius: '10px',
            background: '#172B24',
            color: '#fff',
            fontSize: '13px',
          },
          success: {
            iconTheme: {
              primary: '#16845B',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Smart Role Dashboard Redirector */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* Platform Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PLATFORM_ADMIN]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={[UserRole.PLATFORM_ADMIN]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        {/* Business Owner Routes */}
        <Route
          path="/business/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
              <BusinessDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/setup"
          element={
            <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
              <BusinessSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/setup/review"
          element={
            <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
              <BusinessSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/settings"
          element={
            <ProtectedRoute allowedRoles={[UserRole.BUSINESS_OWNER]}>
              <BusinessSettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Manager Routes */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.MANAGER]}>
              <ManagerDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Staff Routes */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.STAFF]}>
              <StaffDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Common Profile Route */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
