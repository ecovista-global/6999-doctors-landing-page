'use client';

import React, { useState } from 'react';
import {
  RefreshCwIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
} from '@/components/Icons';

export interface VersionRecord {
  version: string;
  isLive: boolean;
  publishedAt: string;
  publishedBy: string;
  notes: string;
  checksum: string;
}

const DEFAULT_VERSIONS: VersionRecord[] = [
  {
    version: '1.2.0',
    isLive: true,
    publishedAt: '2026-11-06 18:30:00',
    publishedBy: 'Dr. Maanvita Kumari (Clinic Owner)',
    notes: 'Enabled 7-Page Architecture, updated winter viral fever advisory, and refreshed consultation slot intervals to 30 minutes.',
    checksum: 'sha256-8a7f1e9b',
  },
  {
    version: '1.1.0',
    isLive: false,
    publishedAt: '2026-11-04 14:15:00',
    publishedBy: 'Aarti (Front Desk Staff)',
    notes: 'Updated OPD morning shifts and updated DMC medical registration number badge.',
    checksum: 'sha256-4c9d2f1a',
  },
  {
    version: '1.0.0',
    isLive: false,
    publishedAt: '2026-11-02 09:00:00',
    publishedBy: 'System Scaffold (Initial Launch)',
    notes: 'Initial production deployment of HealthConsult Family Clinic landing presence.',
    checksum: 'sha256-1b3e5a7c',
  },
];

export default function VersionHistoryPage() {
  const [versions, setVersions] = useState<VersionRecord[]>(DEFAULT_VERSIONS);
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRollback = (targetVersion: string) => {
    if (confirm(`Are you sure you want to rollback live site to version ${targetVersion}? This will revert the live edge pointer within 10 seconds.`)) {
      setIsRollingBack(true);
      setTimeout(() => {
        const updated = versions.map((v) => ({
          ...v,
          isLive: v.version === targetVersion,
        }));
        setVersions(updated);
        setIsRollingBack(false);
        showToast(`Rolled back live site to version ${targetVersion}. Cloudflare CDN cache purged.`);
      }, 500);
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
          marginBottom: '24px',
          borderBottom: '1px solid var(--color-border-subtle, #E2E8F0)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
            Version History & Publishing Rollback
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Audit deployment history, inspect release changelogs, and execute 1-click rollbacks across published content versions.
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
            <span>Active Live Version: v{versions.find((v) => v.isLive)?.version}</span>
          </span>
        </div>
      </div>

      {/* Version timeline list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {versions.map((ver) => (
          <div
            key={ver.version}
            style={{
              padding: '20px 24px',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: `1px solid ${ver.isLive ? '#0D5C46' : '#E2E8F0'}`,
              boxShadow: ver.isLive ? '0 2px 8px rgba(13, 92, 70, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ClockIcon size={13} />
                <span>Published: {ver.publishedAt}</span>
              </span>
              <span>&bull;</span>
              <span>Operator: {ver.publishedBy}</span>
            </div>
          </div>
        ))}
      </div>

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
