'use client';

import React, { useState, useEffect } from 'react';
import {
  ImageIcon,
  UploadIcon,
  SearchIcon,
  Trash2Icon,
  CopyIcon,
  CheckCircleIcon,
  CheckIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
} from '@/components/Icons';

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  assignedTo?: 'doctor_portrait' | 'clinic_facade' | 'clinic_logo' | 'unassigned';
  category: 'doctor' | 'clinic' | 'brand' | 'blog';
  fileSize: string;
  dimensions: string;
  uploadedAt: string;
}

const DEFAULT_ASSETS: MediaAsset[] = [
  {
    id: 'asset-1',
    title: 'Dr. Maanvita Kumari - Verified Stethoscope Portrait',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800',
    assignedTo: 'doctor_portrait',
    category: 'doctor',
    fileSize: '482 KB',
    dimensions: '1200 x 1500 px',
    uploadedAt: '2026-11-01',
  },
  {
    id: 'asset-2',
    title: 'HealthConsult Family Clinic - Sector 18 Noida Exterior Facade',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800',
    assignedTo: 'clinic_facade',
    category: 'clinic',
    fileSize: '620 KB',
    dimensions: '1600 x 1060 px',
    uploadedAt: '2026-11-01',
  },
  {
    id: 'asset-3',
    title: 'Clinical Consultation Suite & Examination Bed',
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=800',
    assignedTo: 'unassigned',
    category: 'clinic',
    fileSize: '540 KB',
    dimensions: '1400 x 933 px',
    uploadedAt: '2026-11-02',
  },
  {
    id: 'asset-4',
    title: 'Clinical Blog Cover - Diabetes Management Guide',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=800',
    assignedTo: 'unassigned',
    category: 'blog',
    fileSize: '390 KB',
    dimensions: '1280 x 720 px',
    uploadedAt: '2026-11-03',
  },
];

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('demo_clinic_media');
      setAssets(saved ? JSON.parse(saved) : DEFAULT_ASSETS);
    }
  }, []);

  const saveAssets = (updated: MediaAsset[]) => {
    setAssets(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_clinic_media', JSON.stringify(updated));
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyUrl = (url: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(url);
      showToast('Asset CDN URL copied to clipboard.');
    }
  };

  const handleAssignAsset = (id: string, role: 'doctor_portrait' | 'clinic_facade' | 'clinic_logo') => {
    const updated = assets.map((a) => {
      if (a.id === id) {
        return { ...a, assignedTo: role };
      }
      if (a.assignedTo === role) {
        return { ...a, assignedTo: 'unassigned' as const };
      }
      return a;
    });
    saveAssets(updated);
    const roleLabels = {
      doctor_portrait: 'Hero Doctor Portrait',
      clinic_facade: 'Clinic Exterior Facade',
      clinic_logo: 'Brand Nav Logo',
    };
    showToast(`Assigned as ${roleLabels[role]}.`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this media asset?')) {
      const updated = assets.filter((a) => a.id !== id);
      saveAssets(updated);
      showToast('Asset removed.');
    }
  };

  const handleManualUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) return;

    setIsUploading(true);
    setTimeout(() => {
      const newAsset: MediaAsset = {
        id: `asset-${Date.now()}`,
        title: uploadTitle.trim() || 'Uploaded Clinical Photo',
        url: uploadUrl.trim(),
        assignedTo: 'unassigned',
        category: 'clinic',
        fileSize: '450 KB',
        dimensions: '1200 x 800 px',
        uploadedAt: new Date().toISOString().slice(0, 10),
      };
      saveAssets([newAsset, ...assets]);
      setUploadUrl('');
      setUploadTitle('');
      setIsUploading(false);
      showToast('Image uploaded and optimized to Cloudflare R2 bucket.');
    }, 400);
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'all' || a.category === filterCategory;
    return matchesSearch && matchesCat;
  });

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
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
            Media & Asset Library
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
            Manage clinic photos, doctor cutouts, exterior facade images, and brand assets hosted on Cloudflare R2 edge.
          </p>
        </div>

        {/* Storage Quota Meter */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '10px 16px',
            minWidth: '240px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
            <span>R2 Storage Quota</span>
            <span style={{ color: '#0D5C46' }}>24.5 MB / 1 GB (2.4%)</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: '2.4%', height: '100%', background: '#0D5C46' }} />
          </div>
        </div>
      </div>

      {/* Upload Zone Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UploadIcon size={16} color="#0D5C46" />
          <span>Upload Image / Photo Asset</span>
        </h3>
        <form onSubmit={handleManualUpload} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 120px', gap: '12px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
              Asset Title / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Maanvita Consultation Desk"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
              Image URL / Source *
            </label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/... or data:image/..."
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isUploading}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#0D5C46',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13px',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              height: '38px',
            }}
          >
            {isUploading ? 'Uploading...' : 'Add Asset'}
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search media assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              background: '#FFFFFF',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Assets' },
            { id: 'doctor', label: 'Doctor Photos' },
            { id: 'clinic', label: 'Clinic Facade & Rooms' },
            { id: 'blog', label: 'Blog Covers' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: `1px solid ${filterCategory === cat.id ? '#0D5C46' : '#E2E8F0'}`,
                background: filterCategory === cat.id ? '#E6F4F1' : '#FFFFFF',
                color: filterCategory === cat.id ? '#0D5C46' : '#64748B',
                fontSize: '12px',
                fontWeight: filterCategory === cat.id ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Image Preview Container */}
            <div style={{ height: '180px', background: '#F1F5F9', position: 'relative', overflow: 'hidden' }}>
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
                    background: '#0D5C46',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }}
                >
                  <ShieldCheckIcon size={12} />
                  <span>
                    {asset.assignedTo === 'doctor_portrait' && 'Doctor Portrait'}
                    {asset.assignedTo === 'clinic_facade' && 'Clinic Facade'}
                    {asset.assignedTo === 'clinic_logo' && 'Brand Logo'}
                  </span>
                </div>
              )}
            </div>

            {/* Content info */}
            <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                  {asset.title}
                </h4>
                <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#94A3B8', marginBottom: '14px' }}>
                  <span>{asset.dimensions}</span>
                  <span>&bull;</span>
                  <span>{asset.fileSize}</span>
                  <span>&bull;</span>
                  <span>{asset.uploadedAt}</span>
                </div>
              </div>

              {/* Assignment Actions & Copy */}
              <div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleAssignAsset(asset.id, 'doctor_portrait')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #CBD5E1',
                      background: asset.assignedTo === 'doctor_portrait' ? '#D1FAE5' : '#FFFFFF',
                      color: asset.assignedTo === 'doctor_portrait' ? '#065F46' : '#475569',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Hero Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAssignAsset(asset.id, 'clinic_facade')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #CBD5E1',
                      background: asset.assignedTo === 'clinic_facade' ? '#D1FAE5' : '#FFFFFF',
                      color: asset.assignedTo === 'clinic_facade' ? '#065F46' : '#475569',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Clinic Facade
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyUrl(asset.url)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      color: '#475569',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CopyIcon size={12} />
                    <span>Copy CDN</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(asset.id)}
                    style={{
                      padding: '6px',
                      borderRadius: '6px',
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

      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0D5C46', color: '#FFFFFF', padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 200, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircleIcon size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
