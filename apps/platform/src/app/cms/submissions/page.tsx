'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCmsShell } from '@/components/cms/CmsShellContext';
import { SubmissionsTable } from '@/components/cms/SubmissionsTable';
import { SubmissionDrawer } from '@/components/cms/SubmissionDrawer';
import { CmsAppointmentItem, FetchCmsAppointmentsResult } from '@/lib/cms-submissions';

interface CmsEnquiryRow {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  service: string | null;
  status: string;
  consentAt: string;
  createdAt: string;
}

type SubmissionsTab = 'today' | 'all' | 'enquiries';

function SubmissionsDashboardContent() {
  const searchParams = useSearchParams();
  const { searchQuery: shellSearch } = useCmsShell();
  const rawTab = searchParams.get('tab');
  const initialTab: SubmissionsTab =
    rawTab === 'today' ? 'today' : rawTab === 'enquiries' ? 'enquiries' : 'all';

  const [items, setItems] = useState<CmsAppointmentItem[]>([]);
  const [enquiries, setEnquiries] = useState<CmsEnquiryRow[]>([]);
  const [activeTab, setActiveTab] = useState<SubmissionsTab>(initialTab);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<CmsAppointmentItem | null>(null);

  // Sync tab with URL if param changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'today' || tabParam === 'all' || tabParam === 'enquiries') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Sync top header search bar with submissions search filter
  useEffect(() => {
    setSearchQuery(shellSearch);
  }, [shellSearch]);

  // Load submissions or enquiries from API
  const loadSubmissions = useCallback(
    async (isLoadMore: boolean = false, cursorToUse: string | null = null) => {
      setLoading(true);
      try {
        const tenantId =
          typeof window !== 'undefined'
            ? localStorage.getItem('demo_tenant_id') || '00000000-0000-0000-0000-000000000001'
            : '00000000-0000-0000-0000-000000000001';

        if (activeTab === 'enquiries') {
          const params = new URLSearchParams();
          params.set('tenantId', tenantId);
          if (searchQuery.trim()) params.set('search', searchQuery.trim());
          const res = await fetch(`/api/v1/cms/enquiries?${params.toString()}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setEnquiries(Array.isArray(data.items) ? data.items : []);
          setNextCursor(null);
          setHasMore(false);
          return;
        }

        const params = new URLSearchParams();
        params.set('tab', activeTab);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (serviceFilter !== 'all') params.set('service', serviceFilter);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (cursorToUse) params.set('cursor', cursorToUse);
        params.set('limit', '20');
        params.set('tenantId', tenantId);

        const res = await fetch(`/api/v1/cms/submissions/appointments?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data: FetchCmsAppointmentsResult = await res.json();

        if (isLoadMore) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }

        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, statusFilter, serviceFilter, startDate, endDate, searchQuery]
  );

  // Initial and reactive fetch on filter changes
  useEffect(() => {
    loadSubmissions(false, null);
  }, [loadSubmissions]);

  const handleTabChange = (tab: SubmissionsTab) => {
    setActiveTab(tab);
    setNextCursor(null);
  };

  const handleEnquiryStatusChange = async (id: string, nextStatus: 'pending' | 'contacted' | 'resolved') => {
    const tenantId =
      typeof window !== 'undefined'
        ? localStorage.getItem('demo_tenant_id') || '00000000-0000-0000-0000-000000000001'
        : '00000000-0000-0000-0000-000000000001';
    try {
      const res = await fetch(`/api/v1/cms/enquiries?tenantId=${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status: nextStatus } : e)));
      }
    } catch (err) {
      console.error('Failed updating enquiry status:', err);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && nextCursor) {
      loadSubmissions(true, nextCursor);
    }
  };

  const handleRefresh = () => {
    setNextCursor(null);
    loadSubmissions(false, null);
  };

  const handleNoteSaved = (id: string, newNotes: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, notes: newNotes } : it))
    );
    if (selectedSubmission && selectedSubmission.id === id) {
      setSelectedSubmission({ ...selectedSubmission, notes: newNotes });
    }
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (serviceFilter !== 'all') params.set('service', serviceFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const tenantId =
      typeof window !== 'undefined'
        ? localStorage.getItem('demo_tenant_id') || '00000000-0000-0000-0000-000000000001'
        : '00000000-0000-0000-0000-000000000001';
    params.set('tenantId', tenantId);

    window.open(`/api/v1/cms/submissions/export?${params.toString()}`, '_blank');
  };

  const handleStatusChanged = (id: string, newStatus: CmsAppointmentItem['status']) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: newStatus } : it))
    );
    if (selectedSubmission && selectedSubmission.id === id) {
      setSelectedSubmission({ ...selectedSubmission, status: newStatus });
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: CmsAppointmentItem['status']) => {
    try {
      const item = items.find((it) => it.id === id);
      const tenantId = item ? item.tenantId : '00000000-0000-0000-0000-000000000001';
      const res = await fetch(`/api/v1/cms/submissions/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        handleStatusChanged(id, newStatus);
      }
    } catch (err) {
      console.error('Failed quick status change:', err);
    }
  };

  const enquiriesSlot = (
    <div className="ms-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--color-border-subtle, #DFE8EB)', background: 'var(--color-bg-surface, #FFFFFF)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--color-border-subtle, #DFE8EB)' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main, #121B1F)' }}>
          Patient Enquiries ({enquiries.length})
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          style={{
            padding: '6px 12px',
            borderRadius: '9999px',
            border: '1px solid var(--color-border-subtle, #DFE8EB)',
            background: 'var(--color-bg-base, #F5F8F9)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Refresh Enquiries
        </button>
      </div>
      {loading && enquiries.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted, #5A6B72)', fontSize: '13px' }}>
          Loading patient enquiries...
        </div>
      ) : enquiries.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted, #5A6B72)', fontSize: '13px' }}>
          No patient enquiries submitted yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border-subtle, #DFE8EB)', background: 'var(--color-bg-base, #F5F8F9)', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-muted, #5A6B72)' }}>
                <th style={{ padding: '12px 16px' }}>Patient</th>
                <th style={{ padding: '12px 16px' }}>Service</th>
                <th style={{ padding: '12px 16px' }}>Message</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enq) => (
                <tr key={enq.id} style={{ borderBottom: '1px solid var(--color-border-subtle, #DFE8EB)' }}>
                  <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-main, #121B1F)' }}>{enq.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #5A6B72)' }}>{enq.phone}</div>
                    {enq.email && <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted, #5A6B72)' }}>{enq.email}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'top', color: 'var(--color-text-main, #121B1F)' }}>
                    {enq.service || 'General Enquiry'}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'top', maxWidth: '340px', color: 'var(--color-text-muted, #5A6B72)', lineHeight: 1.45 }}>
                    {enq.message}
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: enq.status === 'resolved' ? '#D1FAE5' : enq.status === 'contacted' ? '#E7F2F5' : '#FEF3C7',
                        color: enq.status === 'resolved' ? '#065F46' : enq.status === 'contacted' ? '#183C4A' : '#B45309',
                      }}
                    >
                      {enq.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {enq.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleEnquiryStatusChange(enq.id, 'contacted')}
                          style={{ padding: '5px 10px', borderRadius: '9999px', border: '1px solid #183C4A', background: '#E7F2F5', color: '#183C4A', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Mark Contacted
                        </button>
                      )}
                      {enq.status !== 'resolved' && (
                        <button
                          type="button"
                          onClick={() => handleEnquiryStatusChange(enq.id, 'resolved')}
                          style={{ padding: '5px 10px', borderRadius: '9999px', border: '1px solid #047857', background: '#D1FAE5', color: '#065F46', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <SubmissionsTable
        items={items}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        enquiriesSlot={enquiriesSlot}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        serviceFilter={serviceFilter}
        onServiceFilterChange={setServiceFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onRefresh={handleRefresh}
        onExportCsv={handleExportCsv}
        onSelectSubmission={(item) => setSelectedSubmission(item)}
        onQuickStatusChange={handleQuickStatusChange}
      />

      <SubmissionDrawer
        submission={selectedSubmission}
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onNoteSaved={handleNoteSaved}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  );
}

export default function SubmissionsDashboardPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-main, #0F172A)', margin: '0 0 6px 0' }}>
                Appointments &amp; Patient Submissions
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #64748B)', margin: 0 }}>
                Unified patient inbox with audit trail and DPDP Act 2023 compliance.
              </p>
            </div>
          </div>
        </div>
      }
    >
      <SubmissionsDashboardContent />
    </Suspense>
  );
}
