'use client';

import React, { useState, useEffect } from 'react';
import { useCmsShell } from '@/components/cms/CmsShellContext';
import {
  HelpCircleIcon,
  MessageCircleIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  Edit3Icon,
  StarIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  XIcon,
} from '@/components/Icons';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
}

export interface ReviewItem {
  id: string;
  patientInitials: string;
  rating: number;
  treatment: string;
  reviewText: string;
  source: string;
  consentObtained: boolean;
  status: 'approved' | 'draft' | 'archived';
  date: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I schedule an appointment with Dr. Maanvita Kumari?',
    answer: 'You can book appointments directly via our website booking form, call our clinic at +91 98765 43210, or send a quick WhatsApp message. Walk-ins are also accommodated during morning and evening OPD shifts.',
    category: 'Appointments',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'faq-2',
    question: 'What is the consultation fee, and does it include follow-up?',
    answer: 'The initial consultation fee is ₹600. This includes one complimentary in-person or WhatsApp follow-up consultation within 7 days of your visit.',
    category: 'Fees & Billing',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'faq-3',
    question: 'Can I share lab reports via WhatsApp for review?',
    answer: 'Yes! Existing patients can securely transmit diagnostic lab reports, ECGs, and blood sugar logs directly to our verified clinic WhatsApp (+91 98765 43210) for review between 01:00 PM and 04:00 PM.',
    category: 'Consultations',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'faq-4',
    question: 'How are clinical emergencies handled after operating hours?',
    answer: 'For acute emergencies after 08:00 PM (severe chest pain, breathing difficulty, acute trauma), patients are advised to visit the nearest tertiary emergency department (Jaypee Hospital / Max Super Speciality Hospital, Noida).',
    category: 'Emergencies',
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'faq-5',
    question: 'What medical conditions does Dr. Maanvita specialize in treating?',
    answer: 'Dr. Maanvita specializes in adult internal medicine, Type-2 diabetes management, hypertension, seasonal fevers (Dengue, Typhoid), thyroid disorders, and geriatric wellness.',
    category: 'Services',
    displayOrder: 5,
    isActive: true,
  },
];

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    patientInitials: 'Priya K.',
    rating: 5,
    treatment: 'Diabetes Management',
    reviewText: 'Dr. Maanvita listened very patiently to my elderly mother’s concerns. Her explanation of insulin timing made an immediate difference to morning readings.',
    source: 'Verified Patient',
    consentObtained: true,
    status: 'approved',
    date: '2026-10-24',
  },
  {
    id: 'rev-2',
    patientInitials: 'Rajesh M.',
    rating: 5,
    treatment: 'Seasonal Fever Care',
    reviewText: 'Visited during high fever. Accurate blood work diagnosis and minimal medications prescribed without unnecessary antibiotic abuse. Highly recommended.',
    source: 'Verified Patient',
    consentObtained: true,
    status: 'approved',
    date: '2026-10-29',
  },
  {
    id: 'rev-3',
    patientInitials: 'Ananya S.',
    rating: 5,
    treatment: 'Hypertension Consultation',
    reviewText: 'Excellent clinical demeanor. Clinic staff Sunita at front desk is courteous, and the WhatsApp report follow-up saved me an extra trip during work hours.',
    source: 'Verified Patient',
    consentObtained: true,
    status: 'approved',
    date: '2026-11-03',
  },
];

export default function ReviewsFaqsPage() {
  const { searchQuery: shellSearch } = useCmsShell();
  const [activeTab, setActiveTab] = useState<'faqs' | 'reviews'>('faqs');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // FAQ Modal state
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'Appointments',
    displayOrder: 1,
    isActive: true,
  });

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [reviewForm, setReviewForm] = useState({
    patientInitials: '',
    rating: 5,
    treatment: 'General Consultation',
    reviewText: '',
    consentObtained: true,
    status: 'approved' as 'approved' | 'draft' | 'archived',
  });

  const [isSaving, setIsSaving] = useState(false);

  const getTenantId = () =>
    typeof window !== 'undefined'
      ? localStorage.getItem('demo_tenant_id') || '00000000-0000-0000-0000-000000000001'
      : '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    async function loadData() {
      const tenantId = getTenantId();
      try {
        const faqRes = await fetch(`/api/v1/cms/faqs?tenantId=${tenantId}`);
        if (faqRes.ok) {
          const data = await faqRes.json();
          if (data.faqs && data.faqs.length > 0) {
            setFaqs(data.faqs);
            if (typeof window !== 'undefined') {
              localStorage.setItem('demo_clinic_faqs', JSON.stringify(data.faqs));
            }
          } else {
            const cached = typeof window !== 'undefined' ? localStorage.getItem('demo_clinic_faqs') : null;
            setFaqs(cached ? JSON.parse(cached) : DEFAULT_FAQS);
          }
        } else {
          const cached = typeof window !== 'undefined' ? localStorage.getItem('demo_clinic_faqs') : null;
          setFaqs(cached ? JSON.parse(cached) : DEFAULT_FAQS);
        }
      } catch {
        const cached = typeof window !== 'undefined' ? localStorage.getItem('demo_clinic_faqs') : null;
        setFaqs(cached ? JSON.parse(cached) : DEFAULT_FAQS);
      }

      try {
        const revRes = await fetch(`/api/v1/cms/testimonials?tenantId=${tenantId}`);
        if (revRes.ok) {
          const data = await revRes.json();
          if (data.testimonials && data.testimonials.length > 0) {
            const mapped: ReviewItem[] = data.testimonials.map((t: any) => ({
              id: t.id,
              patientInitials: t.patientInitials,
              rating: t.rating,
              treatment: t.treatment,
              reviewText: t.reviewText,
              source: 'Verified Patient',
              consentObtained: t.consentRecorded,
              status: t.moderationStatus as 'approved' | 'draft' | 'archived',
              date: t.createdAt ? t.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            }));
            setReviews(mapped);
            if (typeof window !== 'undefined') {
              localStorage.setItem('demo_clinic_reviews', JSON.stringify(mapped));
            }
          } else {
            const cached = typeof window !== 'undefined' ? localStorage.getItem('demo_clinic_reviews') : null;
            setReviews(cached ? JSON.parse(cached) : DEFAULT_REVIEWS);
          }
        } else {
          const cached = typeof window !== 'undefined' ? localStorage.getItem('demo_clinic_reviews') : null;
          setReviews(cached ? JSON.parse(cached) : DEFAULT_REVIEWS);
        }
      } catch {
        const cached = typeof window !== 'undefined' ? localStorage.getItem('demo_clinic_reviews') : null;
        setReviews(cached ? JSON.parse(cached) : DEFAULT_REVIEWS);
      }
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // FAQ Handlers
  const handleOpenFaqModal = (item?: FaqItem) => {
    if (item) {
      setEditingFaq(item);
      setFaqForm({
        question: item.question,
        answer: item.answer,
        category: item.category,
        displayOrder: item.displayOrder,
        isActive: item.isActive,
      });
    } else {
      setEditingFaq(null);
      setFaqForm({
        question: '',
        answer: '',
        category: 'Consultations',
        displayOrder: faqs.length + 1,
        isActive: true,
      });
    }
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
    setIsSaving(true);
    const tenantId = getTenantId();
    const isUuid =
      !!editingFaq &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingFaq.id);

    try {
      if (editingFaq && isUuid) {
        const res = await fetch(`/api/v1/cms/faqs/${editingFaq.id}?tenantId=${tenantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
          body: JSON.stringify(faqForm),
        });
        if (res.ok) {
          const data = await res.json();
          const updated = faqs.map((f) => (f.id === editingFaq.id ? { ...f, ...data.faq } : f));
          setFaqs(updated);
          if (typeof window !== 'undefined') localStorage.setItem('demo_clinic_faqs', JSON.stringify(updated));
          showToast('FAQ updated successfully.');
        } else {
          throw new Error('Update failed');
        }
      } else {
        const res = await fetch(`/api/v1/cms/faqs?tenantId=${tenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
          body: JSON.stringify(faqForm),
        });
        if (res.ok) {
          const data = await res.json();
          const updated = editingFaq
            ? faqs.map((f) => (f.id === editingFaq.id ? data.faq : f))
            : [...faqs, data.faq];
          setFaqs(updated);
          if (typeof window !== 'undefined') localStorage.setItem('demo_clinic_faqs', JSON.stringify(updated));
          showToast(editingFaq ? 'FAQ saved to database.' : 'New clinical FAQ added.');
        } else {
          throw new Error('Create failed');
        }
      }
    } catch {
      showToast('Save failed. Please retry.');
    } finally {
      setIsSaving(false);
    }
    setIsFaqModalOpen(false);
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    const tenantId = getTenantId();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    try {
      if (isUuid) {
        const res = await fetch(`/api/v1/cms/faqs/${id}?tenantId=${tenantId}`, {
          method: 'DELETE',
          headers: { 'x-tenant-id': tenantId },
        });
        if (!res.ok) {
          showToast('Delete failed. Please retry.');
          return;
        }
      }
      const updated = faqs.filter((f) => f.id !== id);
      setFaqs(updated);
      if (typeof window !== 'undefined') localStorage.setItem('demo_clinic_faqs', JSON.stringify(updated));
      showToast('FAQ deleted.');
    } catch {
      showToast('Delete failed. Please retry.');
    }
  };

  // Review Handlers
  const handleOpenReviewModal = (item?: ReviewItem) => {
    if (item) {
      setEditingReview(item);
      setReviewForm({
        patientInitials: item.patientInitials,
        rating: item.rating,
        treatment: item.treatment,
        reviewText: item.reviewText,
        consentObtained: item.consentObtained,
        status: item.status,
      });
    } else {
      setEditingReview(null);
      setReviewForm({
        patientInitials: '',
        rating: 5,
        treatment: 'General Consultation',
        reviewText: '',
        consentObtained: true,
        status: 'approved',
      });
    }
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.patientInitials.trim() || !reviewForm.reviewText.trim()) return;

    // DPDP Act 2023 Enforcement: require consent checkbox for approved testimonials
    if (reviewForm.status === 'approved' && !reviewForm.consentObtained) {
      alert('DPDP Act 2023 compliance requires patient consent confirmation before publishing reviews.');
      return;
    }

    setIsSaving(true);
    const tenantId = getTenantId();
    const payload = {
      patientInitials: reviewForm.patientInitials,
      rating: reviewForm.rating,
      treatment: reviewForm.treatment,
      reviewText: reviewForm.reviewText,
      consentRecorded: reviewForm.consentObtained,
      moderationStatus: reviewForm.status,
    };

    const isReviewUuid =
      !!editingReview &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingReview.id);

    try {
      if (editingReview && isReviewUuid) {
        const res = await fetch(`/api/v1/cms/testimonials/${editingReview.id}?tenantId=${tenantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          const mapped: ReviewItem = {
            id: data.testimonial.id,
            patientInitials: data.testimonial.patientInitials,
            rating: data.testimonial.rating,
            treatment: data.testimonial.treatment,
            reviewText: data.testimonial.reviewText,
            source: 'Verified Patient',
            consentObtained: data.testimonial.consentRecorded,
            status: data.testimonial.moderationStatus,
            date: data.testimonial.createdAt ? data.testimonial.createdAt.slice(0, 10) : editingReview.date,
          };
          const updated = reviews.map((r) => (r.id === editingReview.id ? mapped : r));
          setReviews(updated);
          if (typeof window !== 'undefined') localStorage.setItem('demo_clinic_reviews', JSON.stringify(updated));
          showToast('Patient testimonial updated.');
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || err.title || 'Update failed');
        }
      } else {
        const res = await fetch(`/api/v1/cms/testimonials?tenantId=${tenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          const mapped: ReviewItem = {
            id: data.testimonial.id,
            patientInitials: data.testimonial.patientInitials,
            rating: data.testimonial.rating,
            treatment: data.testimonial.treatment,
            reviewText: data.testimonial.reviewText,
            source: 'Verified Patient',
            consentObtained: data.testimonial.consentRecorded,
            status: data.testimonial.moderationStatus,
            date: data.testimonial.createdAt ? data.testimonial.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          };
          const updated = editingReview
            ? reviews.map((r) => (r.id === editingReview.id ? mapped : r))
            : [mapped, ...reviews];
          setReviews(updated);
          if (typeof window !== 'undefined') localStorage.setItem('demo_clinic_reviews', JSON.stringify(updated));
          showToast(editingReview ? 'Patient testimonial saved to database.' : 'Patient testimonial added.');
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || err.title || 'Create failed');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Save failed. Please retry.');
    } finally {
      setIsSaving(false);
    }
    setIsReviewModalOpen(false);
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    const tenantId = getTenantId();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    try {
      if (isUuid) {
        const res = await fetch(`/api/v1/cms/testimonials/${id}?tenantId=${tenantId}`, {
          method: 'DELETE',
          headers: { 'x-tenant-id': tenantId },
        });
        if (!res.ok) {
          showToast('Delete failed. Please retry.');
          return;
        }
      }
      const updated = reviews.filter((r) => r.id !== id);
      setReviews(updated);
      if (typeof window !== 'undefined') localStorage.setItem('demo_clinic_reviews', JSON.stringify(updated));
      showToast('Testimonial deleted.');
    } catch {
      showToast('Delete failed. Please retry.');
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--color-text-main, #162228)', margin: '0 0 6px 0' }}>
            FAQs &amp; <span className="ms-serif-italic" style={{ fontSize: '30px', fontWeight: 400 }}>patient testimonials</span>
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted, #54666E)', margin: 0 }}>
            Manage verified clinical FAQs and DPDP-compliant patient reviews for the Reviews & FAQ page (/testimonials-faq).
          </p>
        </div>

        <button
          type="button"
          onClick={() => (activeTab === 'faqs' ? handleOpenFaqModal() : handleOpenReviewModal())}
          className="ms-pill-dark"
        >
          <span className="ms-pill-circle">
            <PlusIcon size={14} color="#183C4A" />
          </span>
          <span>{activeTab === 'faqs' ? 'Add FAQ' : 'Add Testimonial'}</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--color-border-subtle)', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          style={{
            padding: '8px 18px',
            borderRadius: '9999px',
            border: activeTab === 'faqs' ? '1px solid #183C4A' : '1px solid var(--color-border-subtle)',
            background: activeTab === 'faqs' ? '#183C4A' : 'var(--color-bg-base)',
            color: activeTab === 'faqs' ? '#FFFFFF' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'faqs' ? 600 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <HelpCircleIcon size={15} />
          <span>Clinical FAQs ({faqs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          style={{
            padding: '8px 18px',
            borderRadius: '9999px',
            border: activeTab === 'reviews' ? '1px solid #183C4A' : '1px solid var(--color-border-subtle)',
            background: activeTab === 'reviews' ? '#183C4A' : 'var(--color-bg-base)',
            color: activeTab === 'reviews' ? '#FFFFFF' : 'var(--color-text-muted)',
            fontWeight: activeTab === 'reviews' ? 600 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <MessageCircleIcon size={15} />
          <span>Patient Testimonials ({reviews.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '380px' }}>
        <SearchIcon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          placeholder={`Search ${activeTab === 'faqs' ? 'FAQs' : 'reviews'}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 38px',
            borderRadius: '9999px',
            border: '1px solid var(--color-border-subtle)',
            fontSize: '13px',
            background: 'var(--color-bg-base)',
            color: 'var(--color-text-main)',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Tab 1: FAQs */}
      {activeTab === 'faqs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs
            .filter((f) => {
              const q = (shellSearch || search).trim().toLowerCase();
              if (!q) return true;
              return (
                f.question.toLowerCase().includes(q) ||
                f.answer.toLowerCase().includes(q) ||
                f.category.toLowerCase().includes(q)
              );
            })
            .map((faq) => (
              <div
                key={faq.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#475569' }}>
                      {faq.category}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: faq.isActive ? '#D1FAE5' : '#F1F5F9',
                        color: faq.isActive ? '#065F46' : '#94A3B8',
                      }}
                    >
                      {faq.isActive ? 'Active' : 'Disabled'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>Order: #{faq.displayOrder}</span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0' }}>
                    {faq.question}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                    {faq.answer}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenFaqModal(faq)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit3Icon size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(faq.id)}
                    style={{
                      padding: '7px',
                      borderRadius: '6px',
                      border: '1px solid #FEE2E2',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2Icon size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Tab 2: Reviews */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reviews
            .filter((r) => {
              const q = (shellSearch || search).trim().toLowerCase();
              if (!q) return true;
              return (
                r.patientInitials.toLowerCase().includes(q) ||
                r.reviewText.toLowerCase().includes(q) ||
                r.treatment.toLowerCase().includes(q)
              );
            })
            .map((rev) => (
              <div
                key={rev.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '14px', color: '#0F172A' }}>{rev.patientInitials}</strong>
                    <div style={{ display: 'flex', color: '#F59E0B' }}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <StarIcon key={i} size={14} />
                      ))}
                    </div>
                    <span style={{ fontSize: '11px', background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', color: '#475569' }}>
                      {rev.treatment}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 9px',
                        borderRadius: '9999px',
                        background: rev.status === 'approved' ? 'var(--color-brand-surface, #E7F2F5)' : '#FEF3C7',
                        color: rev.status === 'approved' ? 'var(--color-brand-primary, #183C4A)' : '#92400E',
                        fontWeight: 700,
                      }}
                    >
                      {rev.status.toUpperCase()}
                    </span>
                    {rev.consentObtained && (
                      <span style={{ fontSize: '11px', color: 'var(--color-brand-primary, #183C4A)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <ShieldCheckIcon size={12} /> DPDP Consent
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 6px 0', lineHeight: 1.5 }}>
                    "{rev.reviewText}"
                  </p>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>Verified Date: {rev.date}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenReviewModal(rev)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Edit3Icon size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    style={{
                      padding: '7px',
                      borderRadius: '6px',
                      border: '1px solid #FEE2E2',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2Icon size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* FAQ Modal */}
      {isFaqModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '600px', padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{editingFaq ? 'Edit Clinical FAQ' : 'Add New Clinical FAQ'}</h2>
              <button type="button" onClick={() => setIsFaqModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveFaq} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Question *</label>
                <input type="text" required value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Category</label>
                  <select value={faqForm.category} onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', boxSizing: 'border-box' }}>
                    <option value="Appointments">Appointments</option>
                    <option value="Fees & Billing">Fees & Billing</option>
                    <option value="Consultations">Consultations</option>
                    <option value="Emergencies">Emergencies</option>
                    <option value="Services">Services</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Display Order</label>
                  <input type="number" min={1} value={faqForm.displayOrder} onChange={(e) => setFaqForm({ ...faqForm, displayOrder: parseInt(e.target.value) || 1 })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Clinical Answer *</label>
                <textarea rows={4} required value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: 1.5, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="faqActive" checked={faqForm.isActive} onChange={(e) => setFaqForm({ ...faqForm, isActive: e.target.checked })} />
                <label htmlFor="faqActive" style={{ fontSize: '13px', fontWeight: 600 }}>Active (Visible on public FAQ accordion)</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsFaqModalOpen(false)} className="ms-pill-light">Cancel</button>
                <button type="submit" disabled={isSaving} className="ms-pill-dark" style={{ padding: '9px 20px', cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving...' : 'Save FAQ'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '600px', padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>{editingReview ? 'Edit Patient Review' : 'Add Verified Patient Review'}</h2>
              <button type="button" onClick={() => setIsReviewModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Patient Initials (DPDP compliant) *</label>
                  <input type="text" required placeholder="e.g. Priya K." value={reviewForm.patientInitials} onChange={(e) => setReviewForm({ ...reviewForm, patientInitials: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Rating (1-5 Stars)</label>
                  <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) || 5 })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', boxSizing: 'border-box' }}>
                    <option value={5}>5 Stars (Exceptional Care)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Satisfactory)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Treatment Tag</label>
                <input type="text" placeholder="e.g. Diabetes Management, Seasonal Fever" value={reviewForm.treatment} onChange={(e) => setReviewForm({ ...reviewForm, treatment: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>Review Feedback *</label>
                <textarea rows={3} required value={reviewForm.reviewText} onChange={(e) => setReviewForm({ ...reviewForm, reviewText: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: 1.5, boxSizing: 'border-box' }} />
              </div>
              <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="dpdpConsent" checked={reviewForm.consentObtained} onChange={(e) => setReviewForm({ ...reviewForm, consentObtained: e.target.checked })} />
                  <label htmlFor="dpdpConsent" style={{ fontSize: '12px', fontWeight: 700, color: '#1E40AF' }}>
                    Verified patient digital/written consent obtained (DPDP Act 2023)
                  </label>
                </div>
                <p style={{ fontSize: '11px', color: '#3B82F6', margin: '4px 0 0 24px' }}>
                  Compliance requirement: Testimonials cannot be displayed publicly without recorded patient consent.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsReviewModalOpen(false)} className="ms-pill-light">Cancel</button>
                <button type="submit" disabled={isSaving} className="ms-pill-dark" style={{ padding: '9px 20px', cursor: isSaving ? 'wait' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>{isSaving ? 'Saving...' : 'Save Testimonial'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#183C4A', color: '#FFFFFF', padding: '12px 20px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, boxShadow: '0 10px 24px rgba(24,60,74,0.28)', zIndex: 200, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleIcon size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
