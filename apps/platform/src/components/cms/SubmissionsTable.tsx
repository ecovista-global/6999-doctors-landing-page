'use client';

import React from 'react';
import { CmsAppointmentItem } from '@/lib/cms-submissions';
import {
  CalendarIcon,
  ClockIcon,
  SearchIcon,
  FilterIcon,
  RefreshCwIcon,
  PhoneIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XCircleIcon,
  ActivityIcon,
  DownloadIcon,
} from '@/components/Icons';

export interface SubmissionsTableProps {
  items: CmsAppointmentItem[];
  activeTab: 'today' | 'all';
  onTabChange: (tab: 'today' | 'all') => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (service: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  onExportCsv?: () => void;
  onSelectSubmission?: (item: CmsAppointmentItem) => void;
  onQuickStatusChange?: (id: string, newStatus: CmsAppointmentItem['status']) => void;
  servicesList?: string[];
}

export function StatusBadge({ status }: { status: CmsAppointmentItem['status'] }) {
  switch (status) {
    case 'pending':
      return (
        <span
          className="cms-status-badge pending"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            background: '#FEF3C7',
            color: '#B45309',
            border: '1px solid #FDE68A',
          }}
        >
          <ClockIcon size={12} />
          Pending
        </span>
      );
    case 'confirmed':
      return (
        <span
          className="cms-status-badge confirmed"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            background: '#CCFBF1',
            color: '#0D9488',
            border: '1px solid #99F6E4',
          }}
        >
          <CheckCircleIcon size={12} />
          Confirmed
        </span>
      );
    case 'completed':
      return (
        <span
          className="cms-status-badge completed"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            background: '#D1FAE5',
            color: '#059669',
            border: '1px solid #A7F3D0',
          }}
        >
          <CheckCircleIcon size={12} />
          Completed
        </span>
      );
    case 'cancelled':
      return (
        <span
          className="cms-status-badge cancelled"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            background: '#F3F4F6',
            color: '#4B5563',
            border: '1px solid #E5E7EB',
          }}
        >
          <XCircleIcon size={12} />
          Cancelled
        </span>
      );
    default:
      return <span>{status}</span>;
  }
}

export function SubmissionsTable({
  items,
  activeTab,
  onTabChange,
  statusFilter,
  onStatusFilterChange,
  serviceFilter,
  onServiceFilterChange,
  searchQuery,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  loading,
  hasMore,
  onLoadMore,
  onRefresh,
  onExportCsv,
  onSelectSubmission,
  onQuickStatusChange,
  servicesList = [
    'General Consultation',
    'Cardiology Screening',
    'Follow-up Review',
    'Preventive Health Checkup',
    'Pediatric Care',
    'Orthopedic Evaluation',
  ],
}: SubmissionsTableProps) {
  return (
    <div
      className="cms-submissions-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px',
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Top Header / Nav Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--color-text-main, #0F172A)',
              margin: '0 0 4px 0',
            }}
          >
            Submissions Inbox & Appointments
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--color-text-muted, #64748B)',
              margin: 0,
            }}
          >
            Clinical front-desk queue, today OPD board, and patient appointment requests.
          </p>
        </div>

        {/* Tab Controls: Today OPD vs All */}
        <div
          role="tablist"
          style={{
            display: 'inline-flex',
            background: 'var(--color-bg-subtle, #F1F5F9)',
            borderRadius: '8px',
            padding: '4px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'today'}
            data-testid="tab-today-opd"
            onClick={() => onTabChange('today')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: activeTab === 'today' ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              background:
                activeTab === 'today'
                  ? 'var(--color-brand-primary, #0D5C46)'
                  : 'transparent',
              color: activeTab === 'today' ? '#FFFFFF' : 'var(--color-text-main, #334155)',
              transition: 'all 150ms ease',
            }}
          >
            <ActivityIcon size={14} />
            Today OPD Board
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            data-testid="tab-all-submissions"
            onClick={() => onTabChange('all')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: activeTab === 'all' ? 700 : 500,
              border: 'none',
              cursor: 'pointer',
              background:
                activeTab === 'all'
                  ? 'var(--color-brand-primary, #0D5C46)'
                  : 'transparent',
              color: activeTab === 'all' ? '#FFFFFF' : 'var(--color-text-main, #334155)',
              transition: 'all 150ms ease',
            }}
          >
            <CalendarIcon size={14} />
            All Submissions
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Search, Status, Service, Date range */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          background: 'var(--color-bg-base, #FFFFFF)',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <label
            htmlFor="cms-search-input"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-text-muted, #64748B)',
              marginBottom: '4px',
            }}
          >
            Search Patient / Phone
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                color: 'var(--color-text-muted, #94A3B8)',
                pointerEvents: 'none',
              }}
            >
              <SearchIcon size={14} />
            </span>
            <input
              id="cms-search-input"
              data-testid="cms-search-input"
              type="text"
              placeholder="e.g. Ramesh or 9876543210"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--color-border-subtle, #CBD5E1)',
                background: 'var(--color-bg-base, #FFFFFF)',
                color: 'var(--color-text-main, #0F172A)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label
            htmlFor="cms-status-filter"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-text-muted, #64748B)',
              marginBottom: '4px',
            }}
          >
            Status
          </label>
          <select
            id="cms-status-filter"
            data-testid="cms-status-filter"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid var(--color-border-subtle, #CBD5E1)',
              background: 'var(--color-bg-base, #FFFFFF)',
              color: 'var(--color-text-main, #0F172A)',
              outline: 'none',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Service Filter */}
        <div>
          <label
            htmlFor="cms-service-filter"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-text-muted, #64748B)',
              marginBottom: '4px',
            }}
          >
            Service
          </label>
          <select
            id="cms-service-filter"
            data-testid="cms-service-filter"
            value={serviceFilter}
            onChange={(e) => onServiceFilterChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid var(--color-border-subtle, #CBD5E1)',
              background: 'var(--color-bg-base, #FFFFFF)',
              color: 'var(--color-text-main, #0F172A)',
              outline: 'none',
            }}
          >
            <option value="all">All Services</option>
            {servicesList.map((srv) => (
              <option key={srv} value={srv}>
                {srv}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor="cms-start-date"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-text-muted, #64748B)',
              marginBottom: '4px',
            }}
          >
            Start Date
          </label>
          <input
            id="cms-start-date"
            data-testid="cms-start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid var(--color-border-subtle, #CBD5E1)',
              background: 'var(--color-bg-base, #FFFFFF)',
              color: 'var(--color-text-main, #0F172A)',
              outline: 'none',
            }}
          />
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="cms-end-date"
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--color-text-muted, #64748B)',
              marginBottom: '4px',
            }}
          >
            End Date
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              id="cms-end-date"
              data-testid="cms-end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--color-border-subtle, #CBD5E1)',
                background: 'var(--color-bg-base, #FFFFFF)',
                color: 'var(--color-text-main, #0F172A)',
                outline: 'none',
              }}
            />
            <button
              type="button"
              aria-label="Refresh submissions"
              onClick={onRefresh}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--color-border-subtle, #CBD5E1)',
                background: 'var(--color-bg-subtle, #F8FAFC)',
                color: 'var(--color-text-main, #334155)',
                cursor: 'pointer',
              }}
            >
              <RefreshCwIcon size={14} />
            </button>
            {onExportCsv && (
              <button
                type="button"
                data-testid="btn-export-csv"
                aria-label="Export submissions to CSV"
                onClick={onExportCsv}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-subtle, #CBD5E1)',
                  background: 'var(--color-bg-base, #FFFFFF)',
                  color: 'var(--color-brand-primary, #0D5C46)',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <DownloadIcon size={14} />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: 'var(--color-bg-base, #FFFFFF)',
          borderRadius: '10px',
          border: '1px solid var(--color-border-subtle, #E2E8F0)',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            role="table"
            aria-label="Patient Submissions"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--color-bg-subtle, #F8FAFC)',
                  borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
                  color: 'var(--color-text-muted, #475569)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                <th style={{ padding: '12px 16px' }}>Patient</th>
                <th style={{ padding: '12px 16px' }}>Contact</th>
                <th style={{ padding: '12px 16px' }}>Service</th>
                <th style={{ padding: '12px 16px' }}>Preferred Slot</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Booked At</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: '48px 16px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted, #64748B)',
                    }}
                  >
                    {loading ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCwIcon size={16} />
                        Loading appointments...
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 4px 0' }}>
                          No appointments found
                        </p>
                        <p style={{ fontSize: '12px', margin: 0 }}>
                          Try adjusting your filters or date range.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.id}
                    data-testid={`submission-row-${row.id}`}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle, #F1F5F9)',
                      transition: 'background-color 100ms ease',
                    }}
                  >
                    {/* Patient Name */}
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0F172A' }}>
                      {row.patientName}
                    </td>

                    {/* Contact */}
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <PhoneIcon size={12} color="#64748B" />
                        <span>{row.patientPhone}</span>
                      </div>
                      {row.patientEmail && (
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {row.patientEmail}
                        </div>
                      )}
                    </td>

                    {/* Service */}
                    <td style={{ padding: '12px 16px', color: '#1E293B', fontWeight: 500 }}>
                      {row.serviceName}
                    </td>

                    {/* Preferred Slot */}
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon size={12} color="#0D5C46" />
                        <span style={{ fontWeight: 600 }}>{row.preferredDate}</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#64748B',
                          marginTop: '2px',
                        }}
                      >
                        <ClockIcon size={11} />
                        <span>{row.preferredTimeSlot}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={row.status} />
                    </td>

                    {/* Booked At */}
                    <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '12px' }}>
                      {row.createdAt.slice(0, 10)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {onQuickStatusChange && row.status === 'pending' && (
                          <button
                            type="button"
                            data-testid={`quick-confirm-${row.id}`}
                            onClick={() => onQuickStatusChange(row.id, 'confirmed')}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #99F6E4',
                              background: '#CCFBF1',
                              color: '#0D9488',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          type="button"
                          data-testid={`view-detail-${row.id}`}
                          onClick={() => onSelectSubmission?.(row)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border-subtle, #CBD5E1)',
                            background: '#FFFFFF',
                            color: 'var(--color-brand-primary, #0D5C46)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Details
                          <ChevronRightIcon size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Keyset Pagination Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderTop: '1px solid var(--color-border-subtle, #E2E8F0)',
            background: 'var(--color-bg-subtle, #F8FAFC)',
            fontSize: '12px',
            color: 'var(--color-text-muted, #64748B)',
          }}
        >
          <div>
            Showing <strong style={{ color: '#0F172A' }}>{items.length}</strong> records
          </div>

          <div>
            {hasMore ? (
              <button
                type="button"
                data-testid="cms-load-more"
                disabled={loading}
                onClick={onLoadMore}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-brand-primary, #0D5C46)',
                  background: 'var(--color-brand-primary, #0D5C46)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Loading...' : 'Load More (Next Page)'}
              </button>
            ) : (
              <span>End of records</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
