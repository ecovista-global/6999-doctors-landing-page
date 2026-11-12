'use client';

import React, { useEffect, useState } from 'react';
import {
  ActivityIcon,
  ShieldCheckIcon,
  RefreshCwIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@/components/Icons';

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

interface OperationsStatus {
  plan: string;
  quota: {
    contentUpdatesUsed: number;
    contentUpdatesLimit: number;
    minorChangeMinutesUsed: number;
    minorChangeMinutesLimit: number;
    periodMonth: string;
  };
  sla: {
    bugFixWindowDays: number;
    daysRemaining: number;
    active: boolean;
    launchDate: string;
  };
  health: {
    status: string;
    dbConnected: boolean;
    dbLatencyMs: number;
    rlsIsolation: string;
    sslStatus: string;
    lastBackupAt: string;
    backupSchedule: string;
    checkedAt: string;
  };
  requests: Array<{
    id: string;
    kind: string;
    title: string;
    minutesSpent: number;
    status: string;
    createdAt: string;
  }>;
}

export function OperationsGovernancePanel() {
  const [data, setData] = useState<OperationsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestKind, setRequestKind] = useState<'content_update' | 'minor_change'>('content_update');
  const [requestTitle, setRequestTitle] = useState('');
  const [minutesSpent, setMinutesSpent] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  const getTenantId = () => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('demo_tenant_id') || DEFAULT_TENANT_ID
      : DEFAULT_TENANT_ID;
  };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const tenantId = getTenantId();
      const res = await fetch(`/api/v1/cms/operations?tenantId=${tenantId}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load operations status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleLogRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTitle.trim()) return;
    setSubmitting(true);
    try {
      const tenantId = getTenantId();
      const res = await fetch(`/api/v1/cms/operations?tenantId=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          kind: requestKind,
          title: requestTitle.trim(),
          minutesSpent: requestKind === 'minor_change' ? minutesSpent : 0,
        }),
      });
      if (res.ok) {
        setRequestTitle('');
        await loadStatus();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRunHealthCheck = async () => {
    setSubmitting(true);
    try {
      const tenantId = getTenantId();
      await fetch(`/api/v1/cms/operations?tenantId=${tenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId,
        },
        body: JSON.stringify({
          kind: 'health_check',
          title: 'Manual App & Database Health Verification',
          minutesSpent: 0,
        }),
      });
      await loadStatus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="ms-card"
      style={{
        maxWidth: '860px',
        margin: '28px auto 0 auto',
        padding: '22px 24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>
            Monthly Support Quota, App Health &amp; 30-Day Bug-Fix SLA
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', margin: 0 }}>
            Included maintenance governance: up to {data?.quota.contentUpdatesLimit ?? 5} content updates + 1 hr minor changes/month, scheduled backups, and health telemetry.
          </p>
        </div>
        <button
          type="button"
          disabled={submitting}
          onClick={handleRunHealthCheck}
          className="ms-pill-light"
          style={{ padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
        >
          <RefreshCwIcon size={13} />
          <span>Run Health Check</span>
        </button>
      </div>

      {loading || !data ? (
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading governance metrics...</p>
      ) : (
        <>
          {/* Quota + SLA + Health Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-base, #F5F8F9)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                Content Updates ({data.quota.periodMonth})
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {data.quota.contentUpdatesUsed} / {data.quota.contentUpdatesLimit}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Up to {data.quota.contentUpdatesLimit} updates / month included
              </div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-bg-base, #F5F8F9)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                Minor Design / Tech Changes
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                {data.quota.minorChangeMinutesUsed} / {data.quota.minorChangeMinutesLimit || 60} mins
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                1 hr minor changes / month allowance
              </div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--color-brand-surface, #E7F2F5)', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-brand-primary, #183C4A)', marginBottom: '6px' }}>
                <ShieldCheckIcon size={13} />
                <span>Post-Launch Bug-Fix SLA</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-primary, #183C4A)' }}>
                {data.sla.bugFixWindowDays}-Day Window
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-brand-primary, #183C4A)', marginTop: '4px' }}>
                {data.sla.daysRemaining} days remaining active coverage
              </div>
            </div>
          </div>

          {/* Health & Backups Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              fontSize: '12px',
              color: '#065F46',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <ActivityIcon size={15} />
              <span>App &amp; PG16 Health: HEALTHY ({data.health.dbLatencyMs} ms) &bull; RLS: {data.health.rlsIsolation.toUpperCase()} &bull; SSL: {data.health.sslStatus.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ClockIcon size={13} />
              <span>{data.health.backupSchedule} (Last: {new Date(data.health.lastBackupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
            </div>
          </div>

          {/* Log Monthly Update Request */}
          <form
            onSubmit={handleLogRequest}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '14px' }}
          >
            <select
              value={requestKind}
              onChange={(e) => setRequestKind(e.target.value as any)}
              style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px', background: '#FFFFFF' }}
            >
              <option value="content_update">Content Update (1 credit)</option>
              <option value="minor_change">Minor Change (mins)</option>
            </select>
            <input
              type="text"
              required
              value={requestTitle}
              onChange={(e) => setRequestTitle(e.target.value)}
              placeholder="e.g. Update Monsoon Dengue FAQ & OPD banner..."
              style={{ flex: 1, minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px' }}
            />
            {requestKind === 'minor_change' && (
              <input
                type="number"
                min={5}
                max={60}
                value={minutesSpent}
                onChange={(e) => setMinutesSpent(Number(e.target.value))}
                style={{ width: '80px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12.5px' }}
                aria-label="Estimated minutes"
              />
            )}
            <button
              type="submit"
              disabled={submitting}
              className="ms-pill-dark"
              style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Log Monthly Request
            </button>
          </form>

          {data.requests.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {data.requests.slice(0, 4).map((req) => (
                <div
                  key={req.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'var(--color-bg-base, #F5F8F9)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircleIcon size={13} color="#059669" />
                    <strong>{req.title}</strong>
                    <span style={{ color: 'var(--color-text-muted)' }}>({req.kind})</span>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--color-brand-primary, #183C4A)' }}>
                    {req.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

