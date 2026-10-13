import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/DashboardLayout.js';
import api from '../../api/client.js';
import {
  IBusinessModule,
  IModuleCategory,
  IBusinessType,
  ModuleStatus,
} from '../../types/index.js';
import {
  Package,
  ArrowLeft,
  Save,
  Loader2,
  DollarSign,
  Link2,
  Tag,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminModuleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Package');
  const [moduleCategoryId, setModuleCategoryId] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(19);
  const [yearlyPrice, setYearlyPrice] = useState<number>(190);
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState<ModuleStatus>(ModuleStatus.ACTIVE);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([]);

  // Reference Data
  const [moduleCategories, setModuleCategories] = useState<IModuleCategory[]>([]);
  const [availableModules, setAvailableModules] = useState<IBusinessModule[]>([]);
  const [availableBusinessTypes, setAvailableBusinessTypes] = useState<IBusinessType[]>([]);

  // Search filters for selectors
  const [depSearch, setDepSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch reference data (Categories, All Modules, Business Types)
  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        setIsLoading(true);
        const [catRes, modRes, typesRes] = await Promise.all([
          api.get('/admin/module-categories'),
          api.get('/admin/modules', { params: { limit: 100 } }),
          api.get('/admin/business-types', { params: { limit: 100 } }),
        ]);

        if (catRes.data?.data?.categories) {
          setModuleCategories(catRes.data.data.categories);
          if (!isEditing && catRes.data.data.categories.length > 0) {
            setModuleCategoryId(catRes.data.data.categories[0].id);
          }
        }

        if (modRes.data?.data?.modules) {
          setAvailableModules(modRes.data.data.modules);
        }

        if (typesRes.data?.data?.businessTypes) {
          setAvailableBusinessTypes(typesRes.data.data.businessTypes);
        }

        // If editing, load module details
        if (id) {
          const res = await api.get(`/admin/modules/${id}`);
          if (res.data?.data?.module) {
            const m: IBusinessModule = res.data.data.module;
            setName(m.name);
            setDescription(m.description);
            setIcon(m.icon || 'Package');
            setModuleCategoryId(m.moduleCategoryId);
            setMonthlyPrice(m.monthlyPrice);
            setYearlyPrice(m.yearlyPrice);
            setCurrency(m.currency || 'USD');
            setStatus(m.status);
            setDisplayOrder(m.displayOrder || 0);
            setSelectedDependencies(m.dependencies || []);
            setSelectedRecommendations(m.recommendedBusinessTypes || []);
          }
        }
      } catch (err: any) {
        toast.error('Failed to load module configuration data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrerequisites();
  }, [id, isEditing]);

  // Annual savings calculation
  const annualSavings = monthlyPrice * 12 - yearlyPrice;

  const handleToggleDependency = (depId: string) => {
    if (selectedDependencies.includes(depId)) {
      setSelectedDependencies(selectedDependencies.filter((d) => d !== depId));
    } else {
      setSelectedDependencies([...selectedDependencies, depId]);
    }
  };

  const handleToggleRecommendation = (typeId: string) => {
    if (selectedRecommendations.includes(typeId)) {
      setSelectedRecommendations(selectedRecommendations.filter((t) => t !== typeId));
    } else {
      setSelectedRecommendations([...selectedRecommendations, typeId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Module name must be at least 2 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage('Please provide a descriptive summary of at least 5 characters.');
      return;
    }
    if (!moduleCategoryId) {
      setErrorMessage('Please assign a module category.');
      return;
    }
    if (monthlyPrice < 0 || yearlyPrice < 0) {
      setErrorMessage('Prices cannot be negative numbers.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim() || 'Package',
        moduleCategoryId,
        monthlyPrice: Number(monthlyPrice),
        yearlyPrice: Number(yearlyPrice),
        currency: currency.trim().toUpperCase(),
        status,
        displayOrder: Number(displayOrder),
        dependencies: selectedDependencies,
        recommendedBusinessTypes: selectedRecommendations,
      };

      if (isEditing) {
        await api.patch(`/admin/modules/${id}`, payload);
        toast.success('Module updated successfully');
      } else {
        await api.post('/admin/modules', payload);
        toast.success('Module created successfully');
      }

      navigate('/admin/modules');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save module configuration';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter available modules for dependencies (exclude current module when editing)
  const candidateDependencies = availableModules
    .filter((m) => (!isEditing || m.id !== id) && m.status !== ModuleStatus.ARCHIVED)
    .filter((m) => !depSearch.trim() || m.name.toLowerCase().includes(depSearch.toLowerCase()));

  // Filter business types for recommendations
  const candidateTypes = availableBusinessTypes.filter(
    (bt) => !typeSearch.trim() || bt.name.toLowerCase().includes(typeSearch.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading module editor...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '920px', margin: '0 auto', paddingBottom: '40px' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '20px' }}>
          <Link
            to="/admin/modules"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Module Catalog</span>
          </Link>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Catalog Architect
          </span>
          <h1 style={{ fontSize: '26px', marginTop: '4px' }}>
            {isEditing ? `Edit Module: ${name}` : 'Create Reusable Business Module'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Define feature capabilities, pricing tiers, technical dependencies, and industry recommendations.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '14px 18px',
              background: '#FEE2E2',
              color: '#991B1B',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #FCA5A5',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
            }}
          >
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Module Identity */}
          <div className="card">
            <h3 style={{ fontSize: '17px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="var(--primary)" />
              <span>1. Module Identity & Classification</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label">Module Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Appointment Management, Inventory Management"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Module Category *</label>
                  <select
                    required
                    value={moduleCategoryId}
                    onChange={(e) => setModuleCategoryId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select Category</option>
                    {moduleCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Module Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain what this reusable module provides to business owners..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="label">Icon Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. Package, Calendar, Users"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ModuleStatus)}
                    className="input-field"
                  >
                    <option value={ModuleStatus.ACTIVE}>Active</option>
                    <option value={ModuleStatus.INACTIVE}>Inactive</option>
                    <option value={ModuleStatus.ARCHIVED}>Archived</option>
                  </select>
                </div>

                <div>
                  <label className="label">Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Pricing & Annual Savings */}
          <div className="card">
            <h3 style={{ fontSize: '17px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={18} color="var(--primary)" />
              <span>2. Module Pricing & Subscription Tiers</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label className="label">Monthly Price ($ USD) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(Math.max(0, Number(e.target.value)))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Yearly Price ($ USD) *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(Math.max(0, Number(e.target.value)))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Currency</label>
                <input
                  type="text"
                  disabled
                  value={currency}
                  className="input-field"
                  style={{ background: '#F3F4F6', color: '#6B7280' }}
                />
              </div>
            </div>

            {/* Live Pricing Preview Box */}
            <div
              style={{
                padding: '16px',
                background: '#F8FAF9',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>
                  Annual Subscription Economics
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Formula: monthlyPrice × 12 − yearlyPrice
                </span>
              </div>
              <div>
                {annualSavings > 0 ? (
                  <span className="badge badge-active" style={{ fontSize: '13px', padding: '6px 12px' }}>
                    Saves ${annualSavings} / year ({Math.round((annualSavings / (monthlyPrice * 12 || 1)) * 100)}% off)
                  </span>
                ) : annualSavings === 0 ? (
                  <span className="badge badge-role" style={{ fontSize: '13px' }}>
                    Neutral (Same as monthly total)
                  </span>
                ) : (
                  <span className="badge badge-suspended" style={{ fontSize: '13px' }}>
                    Notice: Yearly price is higher than 12x monthly
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Module Dependencies (Cycle Prevention) */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Link2 size={18} color="var(--primary)" />
                  <span>3. Technical Prerequisites (Dependencies)</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Select modules that must be activated before this module can be enabled.
                </p>
              </div>
              <span className="badge badge-role" style={{ fontSize: '12px' }}>
                {selectedDependencies.length} selected
              </span>
            </div>

            {/* Selected dependencies tags */}
            {selectedDependencies.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', padding: '12px', background: '#FBFDFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                {selectedDependencies.map((depId) => {
                  const dep = availableModules.find((m) => m.id === depId);
                  return (
                    <span
                      key={depId}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <span>{dep?.name || depId}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleDependency(depId)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#6B7280' }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Dependency Search Box */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search candidate dependency modules..."
                value={depSearch}
                onChange={(e) => setDepSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '32px', fontSize: '13px' }}
              />
            </div>

            {/* Candidate list */}
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '8px',
              }}
            >
              {candidateDependencies.map((mod) => {
                const isSelected = selectedDependencies.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleDependency(mod.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--light-green)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--dark-green)' : 'inherit' }}>
                      {mod.name}
                    </span>
                    {isSelected && <CheckCircle2 size={14} color="var(--primary)" />}
                  </div>
                );
              })}
            </div>
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '8px', fontSize: '11px' }}>
              🛡️ Note: The system automatically verifies that no circular dependency chains are created (e.g. A → B → A).
            </small>
          </div>

          {/* Card 4: Recommended Business Types */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={18} color="var(--primary)" />
                  <span>4. Recommended Business Types</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Target industries where this module is most beneficial (informs upcoming Step 4 recommendations).
                </p>
              </div>
              <span className="badge badge-role" style={{ fontSize: '12px' }}>
                {selectedRecommendations.length} mapped
              </span>
            </div>

            {/* Selected recommendation tags */}
            {selectedRecommendations.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', padding: '12px', background: '#FBFDFB', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                {selectedRecommendations.map((typeId) => {
                  const bt = availableBusinessTypes.find((b) => b.id === typeId);
                  return (
                    <span
                      key={typeId}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <span>{bt?.name || typeId}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleRecommendation(typeId)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#6B7280' }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Type Search Box */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search size={14} color="var(--text-secondary)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search business types (e.g. Dental Clinic, Salon, Grocery Store)..."
                value={typeSearch}
                onChange={(e) => setTypeSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '32px', fontSize: '13px' }}
              />
            </div>

            {/* Candidate Types List */}
            <div
              style={{
                maxHeight: '180px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '8px',
              }}
            >
              {candidateTypes.map((bt) => {
                const isSelected = selectedRecommendations.includes(bt.id);
                return (
                  <div
                    key={bt.id}
                    onClick={() => handleToggleRecommendation(bt.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--light-green)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--dark-green)' : 'inherit' }}>
                      {bt.name}
                    </span>
                    {isSelected && <CheckCircle2 size={14} color="var(--primary)" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Link to="/admin/modules" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>{isEditing ? 'Save Changes' : 'Publish to Catalog'}</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
