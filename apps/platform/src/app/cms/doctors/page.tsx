'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useCmsShell } from '@/components/cms/CmsShellContext';
import {
  StethoscopeIcon,
  PlusIcon,
  Edit3Icon,
  Trash2Icon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExternalLinkIcon,
  XIcon,
} from '@/components/Icons';
import type { DirectoryDoctor } from '@/lib/doctorsDirectory';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

interface DoctorFormState {
  id?: string;
  name: string;
  role: string;
  degrees: string;
  college: string;
  registration: string;
  department: string;
  specialtiesText: string;
  experience: string;
  schedule: string;
  fee: number;
  bio: string;
  isActive: boolean;
  weekdayHours: string;
  saturdayHours: string;
  slotIntervalMinutes: number;
}

const EMPTY_FORM: DoctorFormState = {
  name: '',
  role: 'Consultant Specialist',
  degrees: 'MBBS, MD',
  college: '',
  registration: '',
  department: 'Internal Medicine',
  specialtiesText: 'General Medicine, Preventive Care',
  experience: '8+ Years Experience',
  schedule: 'Mon - Fri: 10:00 AM - 02:00 PM | Sat: 10:00 AM - 01:00 PM',
  fee: 600,
  bio: '',
  isActive: true,
  weekdayHours: '09:00-18:00',
  saturdayHours: '09:00-14:00',
  slotIntervalMinutes: 30,
};

export default function DoctorsCmsPage() {
  const { searchQuery } = useCmsShell();
  const [doctors, setDoctors] = useState<DirectoryDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<DoctorFormState>(EMPTY_FORM);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getTenantId = () => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('demo_tenant_id') || DEFAULT_TENANT_ID
      : DEFAULT_TENANT_ID;
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const tenantId = getTenantId();
      const res = await fetch(`/api/v1/cms/doctors?tenantId=${tenantId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDoctors(Array.isArray(data.items) ? data.items : []);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const departments = useMemo(() => {
    const s = new Set<string>(['All']);
    for (const d of doctors) {
      if (d.department) s.add(d.department);
    }
    return Array.from(s);
  }, [doctors]);

  const visibleDoctors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return doctors.filter((d) => {
      if (departmentFilter !== 'All' && d.department !== departmentFilter) {
        return false;
      }
      if (!q) return true;
      const specialtiesText = Array.isArray(d.specialties) ? d.specialties.join(' ').toLowerCase() : '';
      return (
        d.name.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q) ||
        (d.role || '').toLowerCase().includes(q) ||
        (d.registration || '').toLowerCase().includes(q) ||
        specialtiesText.includes(q)
      );
    });
  }, [doctors, departmentFilter, searchQuery]);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (doc: DirectoryDoctor) => {
    setForm({
      id: doc.id,
      name: doc.name,
      role: doc.role,
      degrees: doc.degrees,
      college: doc.college || '',
      registration: doc.registration,
      department: doc.department,
      specialtiesText: doc.specialties.join(', '),
      experience: doc.experience || '',
      schedule: doc.schedule || '',
      fee: doc.fee,
      bio: doc.bio || '',
      isActive: doc.isActive,
      weekdayHours: String(doc.operatingHours?.monday || '09:00-18:00'),
      saturdayHours: String(doc.operatingHours?.saturday || '09:00-14:00'),
      slotIntervalMinutes: Number(doc.operatingHours?.slotIntervalMinutes || 30),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    const tenantId = getTenantId();

    const specialties = form.specialtiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name,
      role: form.role,
      degrees: form.degrees,
      college: form.college || null,
      registration: form.registration,
      department: form.department,
      specialties: specialties.length > 0 ? specialties : [form.department],
      experience: form.experience || null,
      schedule: form.schedule || null,
      fee: Number(form.fee) || 600,
      bio: form.bio || null,
      isActive: form.isActive,
      operatingHours: {
        monday: form.weekdayHours,
        tuesday: form.weekdayHours,
        wednesday: form.weekdayHours,
        thursday: form.weekdayHours,
        friday: form.weekdayHours,
        saturday: form.saturdayHours,
        sunday: 'closed',
        slotIntervalMinutes: Number(form.slotIntervalMinutes) || 30,
      },
    };

    try {
      const url = form.id
        ? `/api/v1/cms/doctors/${form.id}?tenantId=${tenantId}`
        : `/api/v1/cms/doctors?tenantId=${tenantId}`;
      const res = await fetch(url, {
        method: form.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || data.title || 'Failed to save doctor profile');
      }

      setShowModal(false);
      setFeedback({
        type: 'success',
        message: form.id ? `Updated ${form.name} in live directory.` : `Added ${form.name} to live directory.`,
      });
      await loadDoctors();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc: DirectoryDoctor) => {
    const tenantId = getTenantId();
    try {
      const res = await fetch(`/api/v1/cms/doctors/${doc.id}?tenantId=${tenantId}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': tenantId },
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: `Removed ${doc.name} from directory.` });
        await loadDoctors();
      }
    } catch (err) {
      console.error('Delete doctor error:', err);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1120px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '22px',
          borderBottom: '1px solid var(--color-border-subtle, #DFE8EB)',
          paddingBottom: '18px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-text-main, #121B1F)', margin: '0 0 6px 0' }}>
            Multi-Doctor &amp; <span className="ms-serif-italic" style={{ fontSize: '30px', fontWeight: 400 }}>specialty directory</span>
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted, #5A6B72)', margin: 0 }}>
            Manage specialist profiles, medical registration numbers, department tags, consultation fees, and per-doctor booking slot hours.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/doctors"
            target="_blank"
            className="ms-pill-light"
            style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}
          >
            <ExternalLinkIcon size={13} />
            <span>View Public Directory</span>
          </Link>
          <button
            type="button"
            onClick={openCreateModal}
            className="ms-pill-dark"
            style={{ padding: '9px 18px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
          >
            <PlusIcon size={14} color="#FFFFFF" />
            <span>Add Specialist Profile</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            marginBottom: '18px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${feedback.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            color: feedback.type === 'success' ? '#065F46' : '#B91C1C',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircleIcon size={15} />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Department Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {departments.map((dept) => {
          const active = departmentFilter === dept;
          return (
            <button
              key={dept}
              type="button"
              onClick={() => setDepartmentFilter(dept)}
              className={active ? 'ms-pill-dark' : 'ms-pill-light'}
              style={{
                padding: '7px 15px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {dept}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="ms-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading multi-doctor directory...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {visibleDoctors.map((doc) => (
            <div
              key={doc.id}
              data-testid={`cms-doctor-card-${doc.slug}`}
              className="ms-card"
              style={{
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      background: 'var(--color-brand-surface, #E7F2F5)',
                      color: 'var(--color-brand-primary, #183C4A)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {doc.department}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: doc.isActive ? '#059669' : '#64748B' }}>
                    {doc.isActive ? 'Active on Site' : 'Hidden'}
                  </span>
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>
                  {doc.name}
                </h2>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand-primary, #183C4A)', marginBottom: '4px' }}>
                  {doc.degrees}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                  {doc.role} &bull; Reg: <strong>{doc.registration}</strong>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {doc.specialties.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: '11px',
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        background: 'var(--color-bg-base, #F5F8F9)',
                        border: '1px solid var(--color-border-subtle)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ClockIcon size={13} />
                  <span>{doc.schedule || 'Mon-Sat OPD Slots'}</span>
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--color-border-subtle)',
                  paddingTop: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  ₹{doc.fee}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '4px' }}>OPD Fee</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => openEditModal(doc)}
                    className="ms-pill-light"
                    style={{ padding: '7px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    <Edit3Icon size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    aria-label={`Delete ${doc.name}`}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '9999px',
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#B91C1C',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2Icon size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Doctor Profile Editor"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="ms-card"
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px 28px',
              background: 'var(--color-bg-surface, #FFFFFF)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StethoscopeIcon size={18} color="var(--color-brand-primary, #183C4A)" />
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  {form.id ? `Edit ${form.name}` : 'Add Specialist Doctor'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Dr. Ananya Verma"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Department *</label>
                <input
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Internal Medicine / Cardiology"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Role Title *</label>
                <input
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Degrees *</label>
                <input
                  required
                  value={form.degrees}
                  onChange={(e) => setForm({ ...form, degrees: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Medical Reg. Number *</label>
                <input
                  required
                  value={form.registration}
                  onChange={(e) => setForm({ ...form, registration: e.target.value })}
                  placeholder="DMC-71920"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Consultation Fee (₹) *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={form.fee}
                  onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Clinical Specialties (comma separated) *</label>
                <input
                  required
                  value={form.specialtiesText}
                  onChange={(e) => setForm({ ...form, specialtiesText: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Consulting Schedule Summary</label>
                <input
                  value={form.schedule}
                  onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Mon-Fri Slot Window (HH:MM-HH:MM)</label>
                <input
                  value={form.weekdayHours}
                  onChange={(e) => setForm({ ...form, weekdayHours: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Slot Interval (mins)</label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={form.slotIntervalMinutes}
                  onChange={(e) => setForm({ ...form, slotIntervalMinutes: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Biography</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="doc-active-toggle"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <label htmlFor="doc-active-toggle" style={{ fontSize: '12.5px', fontWeight: 600 }}>
                  Show doctor in public directory and appointment booking selector
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="ms-pill-light"
                style={{ padding: '9px 18px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="ms-pill-dark"
                style={{ padding: '9px 20px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                <ShieldCheckIcon size={14} color="#FFFFFF" />
                <span>{saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Profile'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

