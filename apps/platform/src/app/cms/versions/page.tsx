'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  UploadIcon,
} from '@/components/Icons';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export interface VersionRecord {
  id: string;
  version: number;
  isLive: boolean;
  isHead: boolean;
  publishedAt: string;
  publishedBy: string;
  notes: string;
  checksum: string;
}

interface SiteState {
  id: string;
  liveVersion: number;
  headVersion: number;
  theme: string;
  status: string;
}

export default function VersionHistoryPage() {
  const [site, setSite] = useState<SiteState | null>(null);
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setErrorMessage(null);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const loadVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/sites/${DEMO_TENANT_ID}/publish`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.title || 'Failed to load site versions');
      setSite(data.site);
      setVersions(data.versions || []);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to fetch version history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handlePublishSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/sites/${DEMO_TENANT_ID}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedHeadVersion: site?.headVersion,
          notes: releaseNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.title || 'Publish failed');
      setReleaseNotes('');
      await loadVersions();
      showToast(`Published release v${data.version} live and queued edge purge.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollback = async (targetVersion: number) => {
    if (!confirm(`Rollback live site pointer to v${targetVersion}? This preserves all newer snapshots in history.`)) {
      return;
    }
    setIsRollingBack(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/sites/${DEMO_TENANT_ID}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.title || 'Rollback failed');
      await loadVersions();
      showToast(`Rolled back live site to v${data.liveVersion} and queued CDN purge.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Rollback failed');
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
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
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
            Version History &amp; Publishing Rollback
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Audit immutable content snapshots, publish new releases, and execute atomic 1-click rollbacks.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: '#D1FAE5',
              border: '1px solid #A7F3D0',
              fontSize: '12px',
              fontWeight: 700,
              color: '#065F46',
            }}
          >
            <ShieldCheckIcon size={14} />
            <span>Active Live Version: v{site?.liveVersion ?? '-'}</span>
          </span>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          <AlertCircleIcon size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quick Publish Snapshot Bar */}
      <form
        onSubmit={handlePublishSnapshot}
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <input
          type="text"
          placeholder="Release notes (e.g. Updated OPD winter timings and consultation fee)..."
          value={releaseNotes}
          onChange={(e) => setReleaseNotes(e.target.value)}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            fontSize: '13px',
          }}
        />
        <button
          type="submit"
          disabled={isPublishing || loading}
          style={{
            padding: '9px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#0D5C46',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: isPublishing || loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
          }}
        >
          <UploadIcon size={14} />
          <span>{isPublishing ? 'Publishing...' : 'Publish New Release'}</span>
        </button>
      </form>

      {/* Version timeline list */}
      {loading ? (
        <p style={{ fontSize: '13px', color: '#64748B' }}>Loading published snapshots...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {versions.map((ver) => (
            <div
              key={ver.id}
              style={{
                padding: '20px 24px',
                borderRadius: '12px',
                background: '#FFFFFF',
                border: `1px solid ${ver.isLive ? '#0D5C46' : '#E2E8F0'}`,
                boxShadow: ver.isLive ? '0 2px 8px rgba(13, 92, 70, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '16px', color: '#0F172A' }}>Version v{ver.version}</strong>
                  {ver.isLive ? (
                    <span
                      style={{
                        background: '#0D5C46',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Live on Edge
                    </span>
                  ) : (
                    <span
                      style={{
                        background: '#F1F5F9',
                        color: '#64748B',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      Archived Snapshot
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>
                    {ver.checksum}
                  </span>
                </div>

                {!ver.isLive && (
                  <button
                    type="button"
                    onClick={() => handleRollback(ver.version)}
                    disabled={isRollingBack}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#0D5C46',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: isRollingBack ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RefreshCwIcon size={13} />
                    <span>Rollback to v{ver.version}</span>
                  </button>
                )}
              </div>

              <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                {ver.notes}
              </p>

              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ClockIcon size={13} />
                  <span>Published: {new Date(ver.publishedAt).toLocaleString()}</span>
                </span>
                <span>&bull;</span>
                <span>Operator: {ver.publishedBy}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0D5C46', color: '#FFFFFF', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 200, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleIcon size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
