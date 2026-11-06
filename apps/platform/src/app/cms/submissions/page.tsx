'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SubmissionsTable } from '@/components/cms/SubmissionsTable';
import { SubmissionDrawer } from '@/components/cms/SubmissionDrawer';
import { CmsAppointmentItem, FetchCmsAppointmentsResult } from '@/lib/cms-submissions';

function SubmissionsDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'today' ? 'today' : 'all';

  const [items, setItems] = useState<CmsAppointmentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'all'>(initialTab);
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
    if (tabParam === 'today' || tabParam === 'all') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Load submissions from API
  const loadSubmissions = useCallback(
    async (isLoadMore: boolean = false, cursorToUse: string | null = null) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('tab', activeTab);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (serviceFilter !== 'all') params.set('service', serviceFilter);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (cursorToUse) params.set('cursor', cursorToUse);
        params.set('limit', '20');

        // Optional tenantId header or query (fallback to default dev clinic tenant for demo)
        const tenantId =
          typeof window !== 'undefined'
            ? localStorage.getItem('demo_tenant_id') || '00000000-0000-0000-0000-000000000001'
            : '00000000-0000-0000-0000-000000000001';

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
        console.error('Failed to load appointments:', err);
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

  const handleTabChange = (tab: 'today' | 'all') => {
    setActiveTab(tab);
    setNextCursor(null);
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

  return (
    <div>
      <SubmissionsTable
        items={items}
        activeTab={activeTab}
        onTabChange={handleTabChange}
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
        <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
          Loading Submissions Dashboard...
        </div>
      }
    >
      <SubmissionsDashboardContent />
    </Suspense>
  );
}
