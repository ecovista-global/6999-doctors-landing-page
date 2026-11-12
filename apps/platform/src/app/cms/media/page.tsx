'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CopyIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UploadIcon,
} from '@/components/Icons';

const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export type MediaRole = 'hero_doctor_portrait' | 'clinic_facade' | 'nav_logo' | 'unassigned';

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  assignedTo?: MediaRole;
  category: 'doctor' | 'clinic' | 'brand' | 'blog' | string;
  fileSizeBytes?: number;
  fileSize?: string;
  dimensions?: string;
  uploadedAt?: string;
}

interface QuotaInfo {
  usedBytes: number;
  limitBytes: number;
  usedMb: number;
  limitMb: number;
  percentUsed: number;
}

const ROLE_LABELS: Record<Exclude<MediaRole, 'unassigned'>, string> = {
  hero_doctor_portrait: 'Hero Doctor',
  clinic_facade: 'Clinic Facade',
  nav_logo: 'Brand Logo',
};

function formatAssetSize(asset: MediaAsset): string {
  if (asset.fileSize) return asset.fileSize;
  const bytes = asset.fileSizeBytes ?? 0;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [quota, setQuota] = useState<QuotaInfo>({
    usedBytes: 0,
    limitBytes: 1_073_741_824,
    usedMb: 0,
    limitMb: 1024,
    percentUsed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('clinic');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [replacingAsset, setReplacingAsset] = useState<MediaAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setErrorMessage(null);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const loadMedia = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/cms/media?tenantId=${DEMO_TENANT_ID}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.title || data.error?.message || 'Failed to load media library');
      setAssets(data.assets || []);
      if (data.quota) setQuota(data.quota);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load media assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const finishReplacementIfNeeded = async (newAssetId: string) => {
    if (!replacingAsset) return;
    const prevRole = replacingAsset.assignedTo;
    if (prevRole && prevRole !== 'unassigned') {
      await fetch(`/api/v1/cms/media/${newAssetId}?tenantId=${DEMO_TENANT_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: prevRole }),
      });
    }
    await fetch(`/api/v1/cms/media/${replacingAsset.id}?tenantId=${DEMO_TENANT_ID}`, {
      method: 'DELETE',
    });
    setReplacingAsset(null);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', uploadTitle.trim() || replacingAsset?.title || file.name.replace(/\.[^.]+$/, ''));
      formData.append('category', replacingAsset?.category || uploadCategory);

      const res = await fetch(`/api/v1/cms/media?tenantId=${DEMO_TENANT_ID}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.title || data.error?.message || 'Upload rejected');

      await finishReplacementIfNeeded(data.asset.id);
      setUploadTitle('');
      await loadMedia();
      showToast(replacingAsset ? 'Photo replaced successfully.' : 'Image verified & saved to R2 storage.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) return;

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/cms/media?tenantId=${DEMO_TENANT_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle.trim() || replacingAsset?.title || 'Clinical Media Asset',
          url: uploadUrl.trim(),
          category: replacingAsset?.category || uploadCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.title || data.error?.message || 'Failed to register asset');

      await finishReplacementIfNeeded(data.asset.id);
      setUploadUrl('');
      setUploadTitle('');
      await loadMedia();
      showToast(replacingAsset ? 'Photo URL replaced successfully.' : 'External asset registered.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to register URL');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAssignAsset = async (id: string, role: Exclude<MediaRole, 'unassigned'>) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/cms/media/${id}?tenantId=${DEMO_TENANT_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.title || data.error?.message || 'Assignment failed');
      await loadMedia();
      showToast(`Assigned as ${ROLE_LABELS[role]}.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Assignment failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media asset and reclaim its quota?')) return;
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/cms/media/${id}?tenantId=${DEMO_TENANT_ID}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.title || data.error?.message || 'Delete failed');
      if (replacingAsset?.id === id) setReplacingAsset(null);
      await loadMedia();
      showToast('Asset deleted and storage quota reclaimed.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleCopyUrl = (url: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast('Asset URL copied to clipboard.');
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'all' || a.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const quotaBarColor =
    quota.percentUsed >= 95 ? '#DC2626' : quota.percentUsed >= 80 ? '#D97706' : '#183C4A';
  const usedDisplay =
    quota.usedBytes < 1_048_576 && quota.usedBytes > 0
      ? `${(quota.usedBytes / 1024).toFixed(1)} KB`
      : `${quota.usedMb} MB`;

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header bar */}
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
            Media &amp; <span className="ms-serif-italic" style={{ fontSize: '30px', fontWeight: 400 }}>asset library</span>
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted, #54666E)', margin: 0 }}>
            Manage clinic photos, doctor cutouts, facade imagery, and brand SVG assets backed by R2 quota tracking.
          </p>
        </div>

        {/* Live Storage Quota Meter */}
        <div
          className="ms-bento-tile-light"
          style={{
            borderRadius: '16px',
            padding: '12px 18px',
            minWidth: '260px',
            cursor: 'default',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            <span>Storage Quota</span>
            <span style={{ color: quotaBarColor }}>
              {usedDisplay} / 1 GB ({quota.percentUsed}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--color-border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.max(quota.usedBytes > 0 ? 1 : 0, quota.percentUsed))}%`, height: '100%', background: quotaBarColor }} />
          </div>
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
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          <AlertCircleIcon size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Dropzone + URL Registration Card */}
      <div
        className="ms-card"
        style={{
          border: `1px solid ${replacingAsset ? '#183C4A' : 'var(--color-border-subtle)'}`,
          padding: '22px 24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadIcon size={16} color="var(--color-brand-primary, #183C4A)" />
            <span>{replacingAsset ? `Replace Photo: ${replacingAsset.title}` : 'Upload Image File or Register CDN URL'}</span>
          </h3>
          {replacingAsset && (
            <button
              type="button"
              onClick={() => setReplacingAsset(null)}
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Cancel Replace
            </button>
          )}
        </div>

        {/* File Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileUpload(file);
          }}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          style={{
            border: `1.5px dashed ${isDragging ? '#183C4A' : 'var(--color-border-strong)'}`,
            background: isDragging ? 'var(--color-brand-surface, #E7F2F5)' : 'var(--ms-hero-mist)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            marginBottom: '16px',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
            {isUploading ? 'Validating magic bytes & uploading...' : 'Drop an image here or click to browse (JPEG, PNG, WebP, SVG, GIF — max 5 MB)'}
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>
            SVGs are automatically sanitized against script tags and inline event handlers.
          </p>
        </div>

        {/* Optional Title, Category & URL Form */}
        <form onSubmit={handleManualUpload} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2.2fr 120px', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
              Asset Title
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Maanvita Consultation Desk"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
              Category
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFFFFF', boxSizing: 'border-box' }}
            >
              <option value="clinic">Clinic Facade &amp; Rooms</option>
              <option value="doctor">Doctor Photos</option>
              <option value="brand">Brand &amp; Logo</option>
              <option value="blog">Blog Covers</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
              Or Register Image URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/... or /assets/..."
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            disabled={isUploading}
            className="ms-pill-dark"
            style={{
              padding: '9px 18px',
              height: '38px',
              justifyContent: 'center',
              cursor: isUploading ? 'not-allowed' : 'pointer',
            }}
          >
            {isUploading ? 'Saving...' : replacingAsset ? 'Replace URL' : 'Add URL'}
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <SearchIcon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search media assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 14px 9px 38px', borderRadius: '9999px', border: '1px solid var(--color-border-subtle)', fontSize: '13px', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Assets' },
            { id: 'doctor', label: 'Doctor Photos' },
            { id: 'clinic', label: 'Clinic Facade & Rooms' },
            { id: 'brand', label: 'Brand Logo' },
            { id: 'blog', label: 'Blog Covers' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              style={{
                padding: '7px 14px',
                borderRadius: '9999px',
                border: `1px solid ${filterCategory === cat.id ? '#183C4A' : 'var(--color-border-subtle)'}`,
                background: filterCategory === cat.id ? '#183C4A' : 'var(--color-bg-base)',
                color: filterCategory === cat.id ? '#FFFFFF' : 'var(--color-text-muted)',
                fontSize: '12px',
                fontWeight: filterCategory === cat.id ? 600 : 500,
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Loading media assets...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="ms-card"
              style={{
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Image Preview Container */}
              <div style={{ height: '180px', background: 'var(--color-bg-surface)', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={asset.url}
                  alt={asset.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                {asset.assignedTo && asset.assignedTo !== 'unassigned' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: '#183C4A',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 4px 10px rgba(24,60,74,0.25)',
                    }}
                  >
                    <ShieldCheckIcon size={12} />
                    <span>{ROLE_LABELS[asset.assignedTo] || asset.assignedTo}</span>
                  </div>
                )}
              </div>

              {/* Content info */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {asset.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                    <span>{asset.dimensions || 'Auto'}</span>
                    <span>&bull;</span>
                    <span>{formatAssetSize(asset)}</span>
                    <span>&bull;</span>
                    <span>{asset.uploadedAt ? asset.uploadedAt.slice(0, 10) : 'Live'}</span>
                  </div>
                </div>

                {/* Role Assignment & Actions */}
                <div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {(['hero_doctor_portrait', 'clinic_facade', 'nav_logo'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleAssignAsset(asset.id, role)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          border: '1px solid var(--color-border-subtle)',
                          background: asset.assignedTo === role ? 'var(--color-brand-surface, #E7F2F5)' : 'var(--color-bg-base)',
                          color: asset.assignedTo === role ? 'var(--color-brand-primary, #183C4A)' : 'var(--color-text-muted)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(asset.url)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '9999px',
                          border: '1px solid var(--color-border-subtle)',
                          background: 'var(--color-bg-base)',
                          color: 'var(--color-text-muted)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CopyIcon size={12} />
                        <span>Copy URL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplacingAsset(asset);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '9999px',
                          border: '1px solid var(--color-border-subtle)',
                          background: 'var(--color-brand-surface, #E7F2F5)',
                          color: 'var(--color-brand-primary, #183C4A)',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <RefreshCwIcon size={12} />
                        <span>Replace</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(asset.id)}
                      title="Delete Asset"
                      style={{
                        padding: '6px 8px',
                        borderRadius: '9999px',
                        border: '1px solid #FEE2E2',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2Icon size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#183C4A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 10px 24px rgba(24, 60, 74, 0.28)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircleIcon size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
