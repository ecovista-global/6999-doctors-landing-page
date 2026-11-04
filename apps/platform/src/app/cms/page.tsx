'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DoctorContent, AppointmentRecord } from '@/lib/contentStore';
import {
  StethoscopeIcon,
  PhoneIcon,
  MessageCircleIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  BanknoteIcon,
  BuildingIcon,
  ShieldCheckIcon,
  AwardIcon,
  FileTextIcon,
  ActivityIcon,
  GlobeIcon,
  PillIcon,
  ZapIcon,
  LockIcon,
  MicroscopeIcon,
  HeartPulseIcon,
  ThermometerIcon,
  UserCheckIcon,
  SyringeIcon,
  CheckIcon,
  CheckCircleIcon,
  StarIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  LayoutDashboardIcon,
  Edit3Icon,
  ImageIcon,
  PaletteIcon,
  SettingsIcon,
  PlusIcon,
  XIcon,
  SearchIcon,
  UploadIcon,
  DownloadIcon,
  SmartphoneIcon,
  TabletIcon,
  MonitorIcon,
  SendIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoIcon,
  EyeIcon,
  Trash2Icon,
  ArrowRightIcon,
  UserIcon,
  HelpCircleIcon,
  SparklesIcon,
  XCircleIcon,
  BellIcon,
  UsersIcon,
  TrendingUpIcon,
  FilterIcon,
  PrinterIcon,
  Share2Icon,
  CopyIcon,
} from '@/components/Icons';

type Tab =
  | 'dashboard'
  | 'opd_board'
  | 'appointments'
  | 'editor'
  | 'services'
  | 'reviews'
  | 'clinic_hours'
  | 'themes'
  | 'media'
  | 'settings';

type EditorSection = 'clinic' | 'hero' | 'doctor' | 'pillars' | 'services' | 'reviews' | 'faqs';

const THEME_PRESETS: Array<{
  name: string;
  primary: string;
  accent: string;
  bg: string;
  specialty: string;
  description: string;
}> = [
  {
    name: 'Green Trust',
    primary: '#0F766E',
    accent: '#047857',
    bg: '#F0FDF4',
    specialty: 'General Physicians, Internal Medicine, Family Clinics',
    description: 'Calm clinical emerald inspiring confidence, hygiene, and trusted primary care.',
  },
  {
    name: 'Teal Poster',
    primary: '#0284C7',
    accent: '#0EA5E9',
    bg: '#F0F9FF',
    specialty: 'Pediatrics, Diagnostic Labs, Pulmonology',
    description: 'Fresh clinical sky-blue optimal for modern diagnostics and children wellness.',
  },
  {
    name: 'Navy Gold',
    primary: '#1E3A8A',
    accent: '#D97706',
    bg: '#F8FAFC',
    specialty: 'Cardiology, Neurology, Multi-Specialty Supercenters',
    description: 'Prestigious deep sapphire paired with warm amber for senior specialists.',
  },
  {
    name: 'Sand Warmth',
    primary: '#78350F',
    accent: '#B45309',
    bg: '#FFFBEB',
    specialty: 'Orthopedics, Dermatology, Ayurvedic & Holistic',
    description: 'Earthy amber warmth providing comfort for chronic rehab and skin therapies.',
  },
  {
    name: 'Slate Clean',
    primary: '#334155',
    accent: '#475569',
    bg: '#F8FAFC',
    specialty: 'Dental Clinics, Ophthalmology, Daycare Surgery',
    description: 'Ultra-minimal architectural slate for high-tech precision procedures.',
  },
  {
    name: 'Rose Clinic',
    primary: '#BE123C',
    accent: '#E11D48',
    bg: '#FFF1F2',
    specialty: 'Obstetrics & Gynecology, IVF, Fertility Centres',
    description: 'Gentle crimson rose radiating warmth and empathetic maternal care.',
  },
];

function renderEditorIconPreview(iconName: string, color = '#0F766E') {
  switch (iconName) {
    case 'heartPulse': return <HeartPulseIcon size={20} color={color} />;
    case 'thermometer': return <ThermometerIcon size={20} color={color} />;
    case 'pill': return <PillIcon size={20} color={color} />;
    case 'userCheck': return <UserCheckIcon size={20} color={color} />;
    case 'syringe': return <SyringeIcon size={20} color={color} />;
    case 'activity': return <ActivityIcon size={20} color={color} />;
    case 'microscope': return <MicroscopeIcon size={20} color={color} />;
    case 'shield': return <ShieldCheckIcon size={20} color={color} />;
    case 'clock': return <ClockIcon size={20} color={color} />;
    case 'message': return <MessageCircleIcon size={20} color={color} />;
    default: return <StethoscopeIcon size={20} color={color} />;
  }
}

export default function CmsPanelPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editorSection, setEditorSection] = useState<EditorSection>('clinic');
  const [deviceViewport, setDeviceViewport] = useState<'360px' | '768px' | '100%'>('100%');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastPublishedAt, setLastPublishedAt] = useState<string>('Synced on startup');
  const [previewKey, setPreviewKey] = useState<number>(1);

  // Live Content Store
  const [content, setContent] = useState<DoctorContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);

  // Live Appointments Store
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [aptFilter, setAptFilter] = useState<'all' | 'new' | 'contacted' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // OPD Board & Workflow State
  const [showWeeklySummaryModal, setShowWeeklySummaryModal] = useState(false);
  const [printSlipPatient, setPrintSlipPatient] = useState<AppointmentRecord | null>(null);
  const [quickWalkIn, setQuickWalkIn] = useState({
    patientName: '',
    phone: '',
    service: 'General Health Checkup',
    shift: 'Evening' as 'Morning' | 'Evening',
  });
  const [inContextEditActive, setInContextEditActive] = useState(false);

  // Media Library State
  const mediaFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<'all' | 'doctor' | 'clinic' | 'logo'>('all');

  // Quick Walk-in Appointment Modal state
  const [showAddAptModal, setShowAddAptModal] = useState(false);
  const [newAptData, setNewAptData] = useState({
    patientName: '',
    phone: '',
    service: 'General Health Checkup',
    preferredDate: new Date().toISOString().split('T')[0],
    shift: 'Morning' as 'Morning' | 'Afternoon' | 'Evening',
    notes: 'Walk-in booking recorded by front desk',
  });

  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Live Content from /api/content
  const fetchContent = async () => {
    try {
      const res = await fetch('/api/content', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      }
    } catch (err) {
      console.error('Failed to load content in CMS', err);
    } finally {
      setLoadingContent(false);
    }
  };

  // 2. Fetch Live Appointments from /api/appointments
  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments', { cache: 'no-store' });
      if (res.ok) {
        const data: AppointmentRecord[] = await res.json();
        setAppointments(data);
      }
    } catch (err) {
      console.error('Failed to load appointments in CMS', err);
    }
  };

  useEffect(() => {
    fetchContent();
    fetchAppointments();

    const interval = setInterval(() => {
      fetchAppointments();
    }, 4000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Content field modifier helper
  const handleContentChange = (section: keyof DoctorContent, field: string, value: any) => {
    if (!content) return;
    setHasUnsavedChanges(true);

    if (section === 'doctor') {
      setContent({
        ...content,
        doctor: { ...content.doctor, [field]: value },
      });
    } else if (section === 'clinic') {
      if (field.startsWith('schedule.')) {
        const scheduleKey = field.split('.')[1] as 'weekdayHours' | 'saturdayHours' | 'sundayHours';
        setContent({
          ...content,
          clinic: {
            ...content.clinic,
            schedule: {
              ...content.clinic.schedule,
              [scheduleKey]: value,
            },
          },
        });
      } else {
        setContent({
          ...content,
          clinic: { ...content.clinic, [field]: value },
        });
      }
    } else if (section === 'hero') {
      setContent({
        ...content,
        hero: { ...content.hero, [field]: value },
      });
    } else {
      setContent({
        ...content,
        [section]: value,
      });
    }
  };

  // 3. Publish Changes to /api/content & notify live patient page
  const handlePublish = async (overrideContent?: DoctorContent) => {
    const payload = overrideContent || content;
    if (!payload) return;

    setPublishStatus('publishing');
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.content) {
          setContent(data.content);
        }
        setHasUnsavedChanges(false);
        setPublishStatus('published');
        setLastPublishedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

        try {
          localStorage.setItem('doctorsite_sync_event', Date.now().toString());
        } catch (_) {}
        setPreviewKey((k) => k + 1);

        setTimeout(() => setPublishStatus('idle'), 4000);
      } else {
        setPublishStatus('error');
        alert('Failed to publish changes. Check server logs.');
      }
    } catch (err) {
      console.error(err);
      setPublishStatus('error');
      alert('Network error while publishing.');
    }
  };

  // 4. Update Appointment Status via /api/appointments/[id]
  const updateStatus = async (id: string, newStatus: AppointmentRecord['status'], notes?: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (res.ok) {
        const result = await res.json();
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? result.appointment : apt))
        );
        showToast(`Appointment ${id} updated to "${newStatus}"`);
      } else {
        alert('Failed to update appointment status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating appointment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Create Walk-in / Phone Consultation
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAptData.patientName || !newAptData.phone) {
      alert('Please provide patient name and phone.');
      return;
    }
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAptData),
      });
      if (res.ok) {
        const result = await res.json();
        setAppointments((prev) => [result.appointment, ...prev]);
        setShowAddAptModal(false);
        showToast(`Consultation booked for ${result.appointment.patientName} (${result.appointment.id})`);
        setNewAptData({
          patientName: '',
          phone: '',
          service: content?.services[0]?.title || 'General Health Checkup',
          preferredDate: new Date().toISOString().split('T')[0],
          shift: 'Morning',
          notes: 'Walk-in booking recorded by front desk',
        });
      } else {
        alert('Failed to add appointment.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating appointment.');
    }
  };

  // 5b. Update OPD Stage & Auto-Sync Serving Token
  const handleUpdateOpdStage = async (
    id: string,
    newStage: 'waiting' | 'in_consultation' | 'done',
    extra?: { notes?: string; whatsappConfirmationSent?: boolean; googleReviewSent?: boolean }
  ) => {
    setActionLoadingId(id);
    const targetApt = appointments.find((a) => a.id === id);
    const newStatus: AppointmentRecord['status'] =
      newStage === 'done' ? 'completed' : 'confirmed';

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opdStage: newStage,
          status: newStatus,
          ...extra,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? result.appointment : apt))
        );

        if (newStage === 'in_consultation' && targetApt?.tokenNumber && content) {
          const updatedContent = {
            ...content,
            availability: {
              ...content.availability,
              currentServingToken: targetApt.tokenNumber,
            },
          };
          setContent(updatedContent);
          await handlePublish(updatedContent);
          showToast(`Token #${String(targetApt.tokenNumber).padStart(2, '0')} called inside. Live site updated!`);
        } else if (newStage === 'done') {
          showToast(`Consultation completed for ${targetApt?.patientName || 'patient'}`);
        } else {
          showToast(`Patient moved to ${newStage}`);
        }
      } else {
        alert('Failed to update OPD stage.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating OPD stage');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5c. 10-Second Quick Walk-in Add for Front Desk Sunita
  const handleAddQuickWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWalkIn.patientName.trim() || !quickWalkIn.phone.trim()) {
      alert('Please provide patient name and phone number.');
      return;
    }

    const nextTokenNum = appointments.reduce((max, a) => Math.max(max, a.tokenNumber || 0), 0) + 1;

    try {
      const payload = {
        patientName: quickWalkIn.patientName.trim(),
        phone: quickWalkIn.phone.trim(),
        service: quickWalkIn.service || (content?.services[0]?.title ?? 'General Health Checkup'),
        shift: quickWalkIn.shift,
        preferredDate: new Date().toISOString().split('T')[0],
        notes: '10-second walk-in added at OPD reception',
        tokenNumber: nextTokenNum,
        opdStage: 'waiting' as const,
        status: 'confirmed' as const,
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setAppointments((prev) => [result.appointment, ...prev]);
        showToast(`Token #${String(nextTokenNum).padStart(2, '0')} issued to walk-in patient ${quickWalkIn.patientName}`);
        setQuickWalkIn({
          patientName: '',
          phone: '',
          service: content?.services[0]?.title || 'General Health Checkup',
          shift: 'Evening',
        });
      } else {
        alert('Failed to add walk-in patient.');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding walk-in patient.');
    }
  };

  // 5d. Broadcast Doctor Running Late to Patient Site
  const handleBroadcastLate = async (minutes: number) => {
    if (!content) return;
    const reason = minutes > 0 ? 'Emergency patient handling in clinic' : '';
    const updated = {
      ...content,
      availability: {
        ...content.availability,
        runningLateMinutes: minutes,
        runningLateReason: reason,
      },
    };
    setContent(updated);
    await handlePublish(updated);
    showToast(minutes > 0 ? `Doctor running ~${minutes}m late broadcasted to patient site` : 'Delay notice cleared: Doctor is on time!');
  };

  // 5e. Advance Serving Token
  const handleStepServingToken = async (delta: number) => {
    if (!content) return;
    const currentNum = content.availability?.currentServingToken || 1;
    const nextNum = Math.max(1, currentNum + delta);

    const updated = {
      ...content,
      availability: {
        ...content.availability,
        currentServingToken: nextNum,
      },
    };
    setContent(updated);
    await handlePublish(updated);
    showToast(`Patient site now showing: Serving Token #${String(nextNum).padStart(2, '0')}`);
  };

  // 5f. Update Next Available Slot Chip on Site
  const handleUpdateNextSlot = async (slotStr: string) => {
    if (!content) return;
    const updated = {
      ...content,
      availability: {
        ...content.availability,
        nextAvailableSlot: slotStr,
      },
    };
    setContent(updated);
    await handlePublish(updated);
    showToast(`Live slot chip updated to "${slotStr}"`);
  };

  // 5g. Send WhatsApp Booking Confirmation
  const handleSendWhatsAppConfirmation = (apt: AppointmentRecord) => {
    const cleanPhone = apt.phone.replace(/\D/g, '');
    const token = `#${String(apt.tokenNumber || 1).padStart(2, '0')}`;
    const text = `Namaste ${apt.patientName}, your consultation at HealthConsult Clinic with Dr. Maanvita Kumari is confirmed for ${apt.preferredDate} (${apt.shift} shift). Token: ${token}.\n\nAddress: Plot 14, Health Plaza, Sector 18, Noida.\nGoogle Maps: https://maps.google.com/?q=HealthConsult+Clinic+Noida\n\nPlease reply:\n1 to Confirm attendance\n2 to Reschedule\n3 to Cancel`;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    handleUpdateOpdStage(apt.id, apt.opdStage || 'waiting', { whatsappConfirmationSent: true });
  };

  // 5h. Send WhatsApp 2-Hour Reminder
  const handleSendWhatsAppReminder = (apt: AppointmentRecord) => {
    const cleanPhone = apt.phone.replace(/\D/g, '');
    const token = `#${String(apt.tokenNumber || 1).padStart(2, '0')}`;
    const text = `HealthConsult Reminder: Dr. Maanvita Kumari consultation is scheduled in 2 hours for ${apt.patientName} (Token ${token}).\nClinic: Sector 18 Noida (Near Metro Gate 2).\nReply 1 if on your way, 2 if running late.`;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 5i. Send Google Review on WhatsApp (Google Non-Gating Compliant)
  const handleSendGoogleReview = (apt: AppointmentRecord) => {
    const cleanPhone = apt.phone.replace(/\D/g, '');
    const reviewUrl = content?.clinic?.googleReviewUrl || 'https://g.page/r/healthconsult-noida/review';
    const text = `Namaste ${apt.patientName}! Thank you for visiting Dr. Maanvita Kumari at HealthConsult Clinic today.\n\nCould you take 30 seconds to share your experience on Google? Your feedback helps other families find trusted primary care:\n${reviewUrl}`;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    handleUpdateOpdStage(apt.id, 'done', { googleReviewSent: true });
  };

  // 5j. Weekly Doctor Summary Generator
  const getWeeklySummaryStats = () => {
    const totalBookings = appointments.length;
    const completed = appointments.filter((a) => a.opdStage === 'done' || a.status === 'completed').length;
    const walkins = appointments.filter((a) => a.notes?.toLowerCase().includes('walk-in')).length;
    const cancelled = appointments.filter((a) => a.status === 'cancelled').length;
    const reviewsSent = appointments.filter((a) => a.googleReviewSent).length;

    const srvCounts: Record<string, number> = {};
    appointments.forEach((a) => {
      srvCounts[a.service] = (srvCounts[a.service] || 0) + 1;
    });
    let topService = 'General Health Checkup';
    let maxSrvCount = 0;
    for (const [srv, cnt] of Object.entries(srvCounts)) {
      if (cnt > maxSrvCount) {
        maxSrvCount = cnt;
        topService = srv;
      }
    }

    const shiftCounts: Record<string, number> = { Morning: 0, Evening: 0, Afternoon: 0 };
    appointments.forEach((a) => {
      if (a.shift) shiftCounts[a.shift] = (shiftCounts[a.shift] || 0) + 1;
    });
    const busiestShift = (shiftCounts.Evening || 0) >= (shiftCounts.Morning || 0) ? 'Evening OPD (5:00 PM - 8:00 PM)' : 'Morning OPD (9:00 AM - 1:00 PM)';

    const text = `*Weekly Practice Summary for Dr. Maanvita Kumari*\n*HealthConsult Family Clinic (Noida Sec 18)*\n\n• *${totalBookings}* Total patient appointments\n• *${completed}* Completed consultations\n• *${walkins}* Front-desk walk-in patients\n• *${cancelled}* Cancellations / no-shows\n• Busiest shift: *${busiestShift}*\n• Top clinical demand: *${topService}*\n• *${reviewsSent}* Google Review requests dispatched\n\nLive Control Plane: http://localhost:3000/cms`;

    return { totalBookings, completed, walkins, cancelled, busiestShift, topService, reviewsSent, text };
  };

  // 5k. Media Library Upload & Assignment Handlers
  const handleUploadMediaFile = async (file: File) => {
    if (!content) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newAsset = data.asset;
        const currentMedia = content.media || [];
        const updated = {
          ...content,
          media: [newAsset, ...currentMedia],
        };
        setContent(updated);
        await handlePublish(updated);
        showToast(`Uploaded "${file.name}" to Media Library`);
      } else {
        // Fallback to client-side FileReader
        const reader = new FileReader();
        reader.onload = async (event) => {
          const dataUrl = event.target?.result as string;
          const newAsset = {
            id: `med-${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            fileName: file.name,
            fileType: file.type || 'image/jpeg',
            fileSize: `${Math.round(file.size / 1024)} KB`,
            url: dataUrl,
            assignedTo: 'unassigned' as const,
            uploadedAt: 'Just now',
          };
          const currentMedia = content.media || [];
          const updated = {
            ...content,
            media: [newAsset, ...currentMedia],
          };
          setContent(updated);
          await handlePublish(updated);
          showToast(`Uploaded "${file.name}" to Media Library`);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload file');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSetDoctorPhoto = async (url: string) => {
    if (!content) return;
    const updatedMedia = (content.media || []).map((m) => ({
      ...m,
      assignedTo: m.url === url ? ('hero_doctor_portrait' as const) : m.assignedTo === 'hero_doctor_portrait' ? ('unassigned' as const) : m.assignedTo,
    }));
    const updated = {
      ...content,
      doctor: { ...content.doctor, photoUrl: url },
      media: updatedMedia,
    };
    setContent(updated);
    await handlePublish(updated);
    showToast('Updated Doctor Portrait on live patient site!');
  };

  const handleSetClinicPhoto = async (url: string) => {
    if (!content) return;
    const updatedMedia = (content.media || []).map((m) => ({
      ...m,
      assignedTo: m.url === url ? ('clinic_facade' as const) : m.assignedTo === 'clinic_facade' ? ('unassigned' as const) : m.assignedTo,
    }));
    const updated = {
      ...content,
      clinic: { ...content.clinic, photoUrl: url },
      media: updatedMedia,
    };
    setContent(updated);
    await handlePublish(updated);
    showToast('Updated Clinic Facade photo on live patient site!');
  };

  const handleSetNavLogo = async (url: string) => {
    if (!content) return;
    const updatedMedia = (content.media || []).map((m) => ({
      ...m,
      assignedTo: m.url === url ? ('nav_logo' as const) : m.assignedTo === 'nav_logo' ? ('unassigned' as const) : m.assignedTo,
    }));
    const updated = {
      ...content,
      clinic: { ...content.clinic, logoUrl: url },
      media: updatedMedia,
    };
    setContent(updated);
    await handlePublish(updated);
    showToast('Updated Navigation Brand Logo on live site!');
  };

  const handleDeleteMedia = async (id: string) => {
    if (!content) return;
    const updatedMedia = (content.media || []).filter((m) => m.id !== id);
    const updated = {
      ...content,
      media: updatedMedia,
    };
    setContent(updated);
    await handlePublish(updated);
    showToast('Asset removed from Media Library');
  };

  // 6. Direct Theme Switcher with Instant Publish
  const selectAndPublishTheme = async (themeName: string) => {
    if (!content) return;
    const updated = { ...content, theme: themeName };
    setContent(updated);
    setHasUnsavedChanges(true);
    await handlePublish(updated);
  };

  // Array item helpers
  const updateService = (idx: number, field: string, val: string) => {
    if (!content) return;
    const newServices = [...content.services];
    newServices[idx] = { ...newServices[idx], [field]: val } as any;
    setContent({ ...content, services: newServices });
    setHasUnsavedChanges(true);
  };

  const addService = () => {
    if (!content) return;
    const newService = {
      id: `srv-${Date.now()}`,
      title: 'New Clinical Procedure',
      description: 'Comprehensive evaluation and treatment protocol for adult and family health.',
      icon: 'stethoscope',
    };
    setContent({ ...content, services: [...content.services, newService] });
    setHasUnsavedChanges(true);
  };

  const removeService = (idx: number) => {
    if (!content) return;
    const newServices = content.services.filter((_, i) => i !== idx);
    setContent({ ...content, services: newServices });
    setHasUnsavedChanges(true);
  };

  const updateReview = (idx: number, field: string, val: any) => {
    if (!content) return;
    const newReviews = [...content.reviews];
    newReviews[idx] = { ...newReviews[idx], [field]: val } as any;
    setContent({ ...content, reviews: newReviews });
    setHasUnsavedChanges(true);
  };

  const addReview = () => {
    if (!content) return;
    const newReview = {
      id: `rev-${Date.now()}`,
      patientName: 'New Verified Patient',
      location: 'Sector 18, Noida',
      treatment: 'General Health Review',
      rating: 5,
      reviewText: 'Excellent medical consultation. The doctor took ample time to listen and explain everything clearly.',
    };
    setContent({ ...content, reviews: [...content.reviews, newReview] });
    setHasUnsavedChanges(true);
  };

  const removeReview = (idx: number) => {
    if (!content) return;
    const newReviews = content.reviews.filter((_, i) => i !== idx);
    setContent({ ...content, reviews: newReviews });
    setHasUnsavedChanges(true);
  };

  const updateFaq = (idx: number, field: string, val: string) => {
    if (!content) return;
    const newFaqs = [...content.faqs];
    newFaqs[idx] = { ...newFaqs[idx], [field]: val } as any;
    setContent({ ...content, faqs: newFaqs });
    setHasUnsavedChanges(true);
  };

  const addFaq = () => {
    if (!content) return;
    const newFaq = {
      id: `faq-${Date.now()}`,
      question: 'New Frequently Asked Question?',
      answer: 'Clear, concise clinical response provided by the doctor or clinic desk.',
    };
    setContent({ ...content, faqs: [...content.faqs, newFaq] });
    setHasUnsavedChanges(true);
  };

  const removeFaq = (idx: number) => {
    if (!content) return;
    const newFaqs = content.faqs.filter((_, i) => i !== idx);
    setContent({ ...content, faqs: newFaqs });
    setHasUnsavedChanges(true);
  };

  const updateAmenity = (idx: number, val: string) => {
    if (!content) return;
    const newAmenities = [...content.clinic.amenities];
    newAmenities[idx] = val;
    setContent({ ...content, clinic: { ...content.clinic, amenities: newAmenities } });
    setHasUnsavedChanges(true);
  };

  const addAmenity = () => {
    if (!content) return;
    setContent({
      ...content,
      clinic: { ...content.clinic, amenities: [...content.clinic.amenities, 'New Clinic Facility'] },
    });
    setHasUnsavedChanges(true);
  };

  const removeAmenity = (idx: number) => {
    if (!content) return;
    const newAmenities = content.clinic.amenities.filter((_, i) => i !== idx);
    setContent({ ...content, clinic: { ...content.clinic, amenities: newAmenities } });
    setHasUnsavedChanges(true);
  };

  const updateWhyChooseUs = (idx: number, field: string, val: string) => {
    if (!content) return;
    const newPillars = [...content.whyChooseUs];
    newPillars[idx] = { ...newPillars[idx], [field]: val } as any;
    setContent({ ...content, whyChooseUs: newPillars });
    setHasUnsavedChanges(true);
  };

  // DPDP Patient Data Export
  const downloadDPDPExport = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      complianceStandard: 'Digital Personal Data Protection Act (DPDP) 2023',
      clinic: content?.clinic.name,
      doctor: content?.doctor.name,
      totalRecords: appointments.length,
      appointments: appointments.map((a) => ({
        id: a.id,
        patientName: a.patientName,
        phone: a.phone,
        service: a.service,
        date: a.preferredDate,
        shift: a.shift,
        status: a.status,
        recordedAt: a.createdAt,
        consentPurpose: 'In-clinic medical consultation and OPD slot scheduling',
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpdp-appointments-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesFilter = aptFilter === 'all' ? true : apt.status === aptFilter;
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.phone.includes(searchQuery) ||
      apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const newAppointmentsCount = appointments.filter((a) => a.status === 'new').length;

  if (loadingContent || !content) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center', color: '#0F766E' }}>
          <StethoscopeIcon size={48} color="#0F766E" style={{ marginBottom: '14px' }} />
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Loading DoctorSite Pro Control Plane...</div>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>Connecting to Control Plane API (/api/content)...</div>
        </div>
      </div>
    );
  }

  // Left Sidebar Menu Groups
  const sidebarGroups = [
    {
      groupTitle: 'CLINICAL OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboardIcon size={18} /> },
        {
          id: 'opd_board',
          label: "Today's OPD Board",
          icon: <ActivityIcon size={18} />,
          badge: `${appointments.filter((a) => (a.opdStage || 'waiting') === 'waiting' && a.status !== 'cancelled').length} Waiting`,
          badgeColor: '#0F766E',
        },
        {
          id: 'appointments',
          label: 'Appointments',
          icon: <CalendarIcon size={18} />,
          badge: newAppointmentsCount > 0 ? `${newAppointmentsCount} New` : `${appointments.length}`,
          badgeColor: newAppointmentsCount > 0 ? '#DC2626' : '#64748B',
        },
      ],
    },
    {
      groupTitle: 'LIVE WEBSITE MANAGEMENT',
      items: [
        { id: 'editor', label: 'Site Block Editor', icon: <Edit3Icon size={18} /> },
        { id: 'services', label: 'Services Catalog', icon: <MicroscopeIcon size={18} /> },
        { id: 'reviews', label: 'Patient Reviews', icon: <MessageCircleIcon size={18} /> },
        { id: 'clinic_hours', label: 'Clinic Hours & Map', icon: <BuildingIcon size={18} /> },
        { id: 'themes', label: '6 Clinical Themes', icon: <PaletteIcon size={18} />, badge: content.theme, badgeColor: '#0F766E' },
        { id: 'media', label: 'Media Library', icon: <ImageIcon size={18} /> },
      ],
    },
    {
      groupTitle: 'GOVERNANCE & AUDIT',
      items: [
        { id: 'settings', label: 'Settings & Compliance', icon: <SettingsIcon size={18} /> },
      ],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', display: 'flex', fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}>
      
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION (INSPIRATION: MEDICORE AI)     */}
      {/* ========================================================= */}
      <aside
        style={{
          width: '270px',
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
          boxShadow: '1px 0 3px rgba(0,0,0,0.02)',
          flexShrink: 0,
        }}
      >
        <div>
          {/* Brand Header */}
          <div style={{ padding: '22px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', flexShrink: 0 }}>
              <StethoscopeIcon size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '16px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.2 }}>
                DoctorSite Pro
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>
                Control Plane &bull; {content.clinic.name.split(' ')[0] || 'Clinic'}
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
            {sidebarGroups.map((group, gIdx) => (
              <div key={gIdx}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 12px 8px 12px' }}>
                  {group.groupTitle}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id as Tab)}
                        className="ux-btn"
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isActive ? '#0F766E' : 'transparent',
                          color: isActive ? '#FFFFFF' : '#475569',
                          fontWeight: isActive ? '700' : '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease-in-out',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', color: isActive ? '#FFFFFF' : '#0F766E' }}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            style={{
                              background: isActive ? 'rgba(255,255,255,0.25)' : item.badgeColor,
                              color: '#FFFFFF',
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 7px',
                              borderRadius: '999px',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: Mobile PWA Card & Active Doctor Identity */}
        <div style={{ padding: '16px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '12px 14px', borderRadius: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
              <strong style={{ fontSize: '12px', color: '#166534' }}>Patient Site Live Sync</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#14532D', marginBottom: '8px' }}>
              Connected to <code>localhost:3000</code>. Edits push immediately.
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#0F766E',
                textDecoration: 'none',
              }}
            >
              <span>View Client Website</span>
              <ExternalLinkIcon size={12} color="#0F766E" />
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0F766E', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
              {content.doctor.name.replace('Dr. ', '')[0]}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {content.doctor.name}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Staff: Sunita (Front Desk)
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN APP CANVAS (HEADER + DASHBOARD BODY)               */}
      {/* ========================================================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        
        {/* Top Header Bar */}
        <header
          style={{
            height: '68px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 40,
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          {/* Global Search Input */}
          <div style={{ position: 'relative', width: '380px' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search patients, appointments, services, reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 36px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '13px',
                background: '#F8FAFC',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }}>
              <SearchIcon size={16} color="#94A3B8" />
            </span>
            <span style={{ position: 'absolute', right: '10px', top: '9px', background: '#E2E8F0', color: '#64748B', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
              ⌘K
            </span>
          </div>

          {/* Right Action Icons & Publish Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="ux-btn"
              title="Open live patient website in a new tab"
              style={{
                background: '#F0FDF4',
                color: '#166534',
                border: '1px solid #BBF7D0',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <GlobeIcon size={15} color="#166534" />
              <span>View Patient Site (localhost:3000)</span>
              <ExternalLinkIcon size={13} color="#166534" />
            </a>

            <button
              onClick={() => handlePublish()}
              disabled={publishStatus === 'publishing'}
              className="ux-btn"
              title="Save changes and immediately update the live patient page"
              style={{
                background:
                  publishStatus === 'published'
                    ? '#047857'
                    : hasUnsavedChanges
                    ? '#D97706'
                    : '#0F766E',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: publishStatus === 'publishing' ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap',
              }}
            >
              {publishStatus === 'publishing' && (
                <>
                  <RefreshCwIcon size={14} color="#FFFFFF" className="spin" />
                  <span>Publishing...</span>
                </>
              )}
              {publishStatus === 'published' && (
                <>
                  <CheckCircleIcon size={15} color="#FFFFFF" />
                  <span>Live on Patient Page!</span>
                </>
              )}
              {publishStatus === 'idle' && (
                <>
                  <SendIcon size={14} color="#FFFFFF" />
                  <span>{hasUnsavedChanges ? 'Publish Changes (Unsaved)' : 'Publish to Live Site'}</span>
                </>
              )}
              {publishStatus === 'error' && (
                <>
                  <XCircleIcon size={15} color="#FFFFFF" />
                  <span>Retry Publishing</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('appointments');
                setAptFilter('new');
              }}
              className="ux-btn"
              title="Patient inquiries notification"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <BellIcon size={18} color="#475569" />
              {newAppointmentsCount > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', borderRadius: '50%', background: '#DC2626', color: '#FFF', fontSize: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {newAppointmentsCount}
                </span>
              )}
            </button>

            <div style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', lineHeight: 1.2 }}>
                  {content.doctor.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>{content.doctor.specialty}</div>
              </div>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0F766E', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {content.doctor.photoUrl ? (
                  <img src={content.doctor.photoUrl} alt="Dr. Maanvita" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserCheckIcon size={20} color="#0F766E" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div style={{ background: '#FEF3C7', borderBottom: '1px solid #FCD34D', padding: '10px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#92400E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangleIcon size={16} color="#D97706" />
              <span><strong>You have unsaved changes!</strong> Content updates will not appear on the patient site until published.</span>
            </div>
            <button
              onClick={() => handlePublish()}
              className="ux-btn"
              style={{
                background: '#D97706',
                color: '#FFFFFF',
                border: 'none',
                padding: '5px 14px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <SendIcon size={13} color="#FFFFFF" />
              <span>Publish Now</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. CONTENT WORKSPACE (SWITCHABLE PER ACTIVE TAB)          */}
        {/* ========================================================= */}
        <main style={{ padding: '28px', maxWidth: '1440px', width: '100%', boxSizing: 'border-box' }}>
          
          {/* ======================================================= */}
          {/* TAB 1: MEDICORE-INSPIRED DASHBOARD COMMAND CENTER       */}
          {/* ======================================================= */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Top Greeting & Clinical AI Assistant Card */}
              <div
                className="ux-card"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '28px 32px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#CCFBF1', color: '#0F766E', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                    <span className="pulse-beacon" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0F766E', display: 'inline-block' }} />
                    <span>Control Plane Live &bull; http://localhost:3000/</span>
                  </div>
                  <h1 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: '800', color: '#0F172A' }}>
                    Good morning, {content.doctor.name}!
                  </h1>
                  <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', maxWidth: '620px' }}>
                    Here is what is happening at <strong>{content.clinic.name}</strong> today. Your patient site is accepting appointment inquiries with real-time sync.
                  </p>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#475569' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ClockIcon size={15} color="#0F766E" />
                      <span>09:30 AM &bull; Today&apos;s OPD Active</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPinIcon size={15} color="#0F766E" />
                      <span>{content.clinic.area}, {content.clinic.city}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BanknoteIcon size={15} color="#0F766E" />
                      <span>Fee: ₹{content.doctor.consultationFee} (7-Day Free Follow-up)</span>
                    </span>
                  </div>
                </div>

                <div style={{ background: '#FFFFFF', border: '1px solid #BBF7D0', padding: '18px 22px', borderRadius: '12px', maxWidth: '360px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px', color: '#0F766E' }}>
                      <SparklesIcon size={16} color="#0F766E" />
                      <span>Clinical Site Assistant</span>
                    </div>
                    <span style={{ background: '#0F766E', color: '#FFF', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' }}>
                      PRO 2.0
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                    All patient requests submitted on <code>localhost:3000</code> arrive instantly in your reception inbox.
                  </p>
                  <button
                    onClick={() => setActiveTab('editor')}
                    className="ux-btn"
                    style={{
                      width: '100%',
                      background: '#0F766E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>Open Live Block Editor</span>
                    <ArrowRightIcon size={13} color="#FFFFFF" />
                  </button>
                </div>
              </div>

              {/* 5 KPI Metric Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div
                  onClick={() => setActiveTab('appointments')}
                  className="ux-card"
                  style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B', fontSize: '12px', fontWeight: '600' }}>Total Inquiries</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UsersIcon size={16} color="#0F766E" />
                    </div>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#0F766E', margin: '2px 0' }}>
                    {appointments.length}
                  </div>
                  <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUpIcon size={13} color="#16A34A" />
                    <span>+12% web conversions</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('appointments')}
                  className="ux-card"
                  style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B', fontSize: '12px', fontWeight: '600' }}>Pending Action</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClockIcon size={16} color="#D97706" />
                    </div>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#D97706', margin: '2px 0' }}>
                    {newAppointmentsCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#B45309', fontWeight: '600' }}>
                    {newAppointmentsCount > 0 ? 'Awaiting WhatsApp outreach' : 'All confirmed'}
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('services')}
                  className="ux-card"
                  style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B', fontSize: '12px', fontWeight: '600' }}>Live Procedures</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MicroscopeIcon size={16} color="#0284C7" />
                    </div>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#0284C7', margin: '2px 0' }}>
                    {content.services.length}
                  </div>
                  <div style={{ fontSize: '11px', color: '#0369A1', fontWeight: '600' }}>
                    Displayed on patient site
                  </div>
                </div>

                <div
                  className="ux-card"
                  style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B', fontSize: '12px', fontWeight: '600' }}>Mobile Performance</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ZapIcon size={16} color="#15803D" />
                    </div>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: '#15803D', margin: '2px 0' }}>
                    0.9s
                  </div>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                    LCP &lt; 2.0s &bull; WCAG 2.2 AA
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('themes')}
                  className="ux-card"
                  style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ color: '#64748B', fontSize: '12px', fontWeight: '600' }}>Active Theme</span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PaletteIcon size={16} color="#0F766E" />
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#334155', margin: '4px 0' }}>
                    {content.theme}
                  </div>
                  <div style={{ fontSize: '11px', color: '#0F766E', fontWeight: '600' }}>
                    6 presets available &rarr;
                  </div>
                </div>
              </div>

              {/* Main Dashboard Two-Column Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'flex-start' }}>
                
                {/* Left Column: Today's Appointments & Quick Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Today's Schedule Timeline */}
                  <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CalendarIcon size={18} color="#0F766E" />
                          <span>Today&apos;s Appointments &bull; Patient Queue</span>
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                          Live bookings from web patient form. Confirm slots directly with patients via WhatsApp.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="ux-btn"
                        style={{ background: 'none', border: 'none', color: '#0F766E', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span>View All ({appointments.length})</span>
                        <ArrowRightIcon size={13} color="#0F766E" />
                      </button>
                    </div>

                    {searchQuery.trim() && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', fontSize: '12px', color: '#166534', marginBottom: '10px' }}>
                        <span>Search filter active: <strong>&quot;{searchQuery}&quot;</strong></span>
                        <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 'bold' }}>✕ Clear</button>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(searchQuery.trim()
                        ? appointments.filter(
                            (a) =>
                              a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              a.phone.includes(searchQuery) ||
                              a.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              a.id.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                        : appointments
                      ).slice(0, 5).map((apt) => (
                        <div
                          key={apt.id}
                          style={{
                            padding: '12px 16px',
                            background: '#F8FAFC',
                            borderRadius: '10px',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>
                              {apt.patientName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                              {apt.service} &bull; {apt.preferredDate} ({apt.shift})
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a
                              href={`https://wa.me/${apt.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(apt.patientName)},%20this%20is%20Sunita%20from%20${encodeURIComponent(content.clinic.name)}%20regarding%20your%20consultation%20request%20with%20${encodeURIComponent(content.doctor.name)}.`}
                              target="_blank"
                              rel="noreferrer"
                              className="ux-btn"
                              title="Chat with patient on WhatsApp"
                              style={{
                                background: '#DCFCE7',
                                color: '#166534',
                                border: '1px solid #86EFAC',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <MessageCircleIcon size={13} color="#166534" />
                              <span>WhatsApp</span>
                            </a>

                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                background:
                                  apt.status === 'new'
                                    ? '#FEF3C7'
                                    : apt.status === 'contacted'
                                    ? '#E0F2FE'
                                    : apt.status === 'confirmed'
                                    ? '#DCFCE7'
                                    : '#F1F5F9',
                                color:
                                  apt.status === 'new'
                                    ? '#92400E'
                                    : apt.status === 'contacted'
                                    ? '#0369A1'
                                    : apt.status === 'confirmed'
                                    ? '#15803D'
                                    : '#475569',
                              }}
                            >
                              {apt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 6 Quick Action Control Shortcuts */}
                  <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '22px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ZapIcon size={18} color="#0F766E" />
                      <span>Control Plane Quick Actions</span>
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <button
                        onClick={() => setActiveTab('editor')}
                        className="ux-btn"
                        style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <Edit3Icon size={18} color="#0F766E" />
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>Site Block Editor</div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Edit text &amp; announcements</div>
                      </button>

                      <button
                        onClick={() => setActiveTab('clinic_hours')}
                        className="ux-btn"
                        style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <BuildingIcon size={18} color="#D97706" />
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>Clinic Hours &amp; Map</div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>OPD shifts &amp; transit guide</div>
                      </button>

                      <button
                        onClick={() => setActiveTab('services')}
                        className="ux-btn"
                        style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <MicroscopeIcon size={18} color="#0284C7" />
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>Manage 9 Services</div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Clinical treatments</div>
                      </button>

                      <button
                        onClick={() => setActiveTab('reviews')}
                        className="ux-btn"
                        style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <MessageCircleIcon size={18} color="#BE123C" />
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>Patient Reviews</div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Testimonial moderation</div>
                      </button>

                      <button
                        onClick={() => setActiveTab('themes')}
                        className="ux-btn"
                        style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <PaletteIcon size={18} color="#334155" />
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>6 Themes Preset</div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Instant palette switch</div>
                      </button>

                      <button
                        onClick={downloadDPDPExport}
                        className="ux-btn"
                        style={{ padding: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <ShieldCheckIcon size={18} color="#4338CA" />
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A' }}>DPDP Data Export</div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Compliance consent audit</div>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Column: Mini Calendar & Live Activity Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Interactive Mini Calendar Widget */}
                  <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <strong style={{ fontSize: '15px', color: '#0F172A' }}>November 2026</strong>
                      <span style={{ fontSize: '12px', color: '#0F766E', fontWeight: '700' }}>OPD Calendar</span>
                    </div>

                    {/* Weekday Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#94A3B8', marginBottom: '10px' }}>
                      <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
                    </div>

                    {/* Month Days */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontSize: '12px' }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((d) => {
                        const isToday = d === 3;
                        return (
                          <div
                            key={d}
                            style={{
                              padding: '8px 0',
                              borderRadius: '8px',
                              background: isToday ? '#0F766E' : 'transparent',
                              color: isToday ? '#FFFFFF' : '#334155',
                              fontWeight: isToday ? '800' : '500',
                              border: isToday ? 'none' : '1px solid transparent',
                            }}
                          >
                            {d}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Today's Shift Card */}
                  <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ClockIcon size={16} color="#0F766E" />
                        <span>Today&apos;s OPD Shifts</span>
                      </h4>
                      <button
                        onClick={() => setActiveTab('clinic_hours')}
                        className="ux-btn"
                        style={{ background: 'none', border: 'none', color: '#0F766E', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Edit Hours &rarr;
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#F0FDF4', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
                        <span style={{ color: '#166534', fontWeight: '600' }}>Morning OPD</span>
                        <strong style={{ color: '#14532D' }}>{(content.clinic.schedule.weekdayHours.split('–')[0] ?? '').replace('Monday', '').trim()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                        <span style={{ color: '#475569' }}>Saturday Shift</span>
                        <strong style={{ color: '#0F172A' }}>{content.clinic.schedule.saturdayHours}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA' }}>
                        <span style={{ color: '#991B1B' }}>Sunday</span>
                        <strong style={{ color: '#991B1B' }}>Emergency On-Call</strong>
                      </div>
                    </div>
                  </div>

                  {/* Add Walk-in Patient Action */}
                  <button
                    onClick={() => setShowAddAptModal(true)}
                    className="ux-btn"
                    style={{
                      background: '#0F766E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '12px 18px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(15,118,110,0.2)',
                    }}
                  >
                    <PlusIcon size={16} color="#FFFFFF" />
                    <span>+ Add Walk-in / Phone Consultation</span>
                  </button>

                </div>

              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 1B: TODAY'S OPD BOARD (RECEPTIONIST SUNITA & CLINIC) */}
          {/* ======================================================= */}
          {activeTab === 'opd_board' && (
            <div>
              {/* Top Banner & Real-Time OPD Control Strip */}
              <div
                className="ux-card"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '22px 24px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                      <span className="pulse-beacon" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                      <span>Live Clinic Operations &bull; Receptionist Desk</span>
                    </div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ActivityIcon size={24} color="#0F766E" />
                      <span>Today&apos;s OPD Board &bull; Queue &amp; Availability Control</span>
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                      Control live patient token sequence, 1-tap WhatsApp notifications, broadcast doctor delays, and dispatch Google review requests.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowWeeklySummaryModal(true)}
                      className="ux-btn"
                      style={{
                        background: '#0F766E',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '9px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(15,118,110,0.2)',
                      }}
                    >
                      <Share2Icon size={15} color="#FFFFFF" />
                      <span>Dr. Maanvita Weekly WhatsApp Digest</span>
                    </button>

                    <button
                      onClick={() => {
                        fetchAppointments();
                        fetchContent();
                        showToast('OPD Board refreshed');
                      }}
                      className="ux-btn"
                      style={{
                        background: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        padding: '9px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <RefreshCwIcon size={14} color="#334155" />
                      <span>Refresh Board</span>
                    </button>
                  </div>
                </div>

                {/* 3 Real-time Control Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                  
                  {/* Control 1: Currently Serving Token */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Currently Serving In Cabin
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F766E', letterSpacing: '-0.5px' }}>
                          #{String(content?.availability?.currentServingToken || 1).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>Live on patient site</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleStepServingToken(-1)}
                          className="ux-btn"
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          title="Previous Token"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => handleStepServingToken(1)}
                          className="ux-btn"
                          style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', background: '#0F766E', color: '#FFF', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                          title="Advance to Next Token"
                        >
                          Next Token ▶
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Control 2: Running Late Broadcast */}
                  <div style={{ background: (content?.availability?.runningLateMinutes || 0) > 0 ? '#FFFBEB' : '#F8FAFC', border: (content?.availability?.runningLateMinutes || 0) > 0 ? '1px solid #FCD34D' : '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: (content?.availability?.runningLateMinutes || 0) > 0 ? '#B45309' : '#64748B', textTransform: 'uppercase' }}>
                        Doctor Delay Broadcast
                      </div>
                      {(content?.availability?.runningLateMinutes || 0) > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#D97706', background: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>
                          ~{content?.availability?.runningLateMinutes}m Late Live
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleBroadcastLate(0)}
                        className="ux-btn"
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: (content?.availability?.runningLateMinutes || 0) === 0 ? '2px solid #16A34A' : '1px solid #CBD5E1',
                          background: (content?.availability?.runningLateMinutes || 0) === 0 ? '#DCFCE7' : '#FFFFFF',
                          color: (content?.availability?.runningLateMinutes || 0) === 0 ? '#166534' : '#475569',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        ✓ On Time (Clear)
                      </button>
                      <button
                        onClick={() => handleBroadcastLate(15)}
                        className="ux-btn"
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: content?.availability?.runningLateMinutes === 15 ? '2px solid #D97706' : '1px solid #CBD5E1',
                          background: content?.availability?.runningLateMinutes === 15 ? '#FEF3C7' : '#FFFFFF',
                          color: content?.availability?.runningLateMinutes === 15 ? '#92400E' : '#475569',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        +15 min
                      </button>
                      <button
                        onClick={() => handleBroadcastLate(20)}
                        className="ux-btn"
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: content?.availability?.runningLateMinutes === 20 ? '2px solid #D97706' : '1px solid #CBD5E1',
                          background: content?.availability?.runningLateMinutes === 20 ? '#FEF3C7' : '#FFFFFF',
                          color: content?.availability?.runningLateMinutes === 20 ? '#92400E' : '#475569',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        +20 min
                      </button>
                      <button
                        onClick={() => handleBroadcastLate(30)}
                        className="ux-btn"
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: content?.availability?.runningLateMinutes === 30 ? '2px solid #DC2626' : '1px solid #CBD5E1',
                          background: content?.availability?.runningLateMinutes === 30 ? '#FEE2E2' : '#FFFFFF',
                          color: content?.availability?.runningLateMinutes === 30 ? '#991B1B' : '#475569',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        +30 min
                      </button>
                    </div>
                  </div>

                  {/* Control 3: Live Next Available Slot Chip */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Live Next Available Slot Chip
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        'Today, 05:30 PM',
                        'Today, 06:15 PM',
                        'Tomorrow, 09:30 AM',
                        'Walk-ins Only',
                      ].map((slot) => {
                        const isSelected = content?.availability?.nextAvailableSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => handleUpdateNextSlot(slot)}
                            className="ux-btn"
                            style={{
                              padding: '5px 9px',
                              borderRadius: '6px',
                              border: isSelected ? '2px solid #0F766E' : '1px solid #CBD5E1',
                              background: isSelected ? '#CCFBF1' : '#FFFFFF',
                              color: isSelected ? '#0F766E' : '#475569',
                              fontSize: '11px',
                              fontWeight: isSelected ? '700' : '500',
                              cursor: 'pointer',
                            }}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* 10-Second Quick Walk-in Add Bar */}
              <div
                className="ux-card"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid #E2E8F0',
                  padding: '16px 20px',
                  marginBottom: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusIcon size={16} color="#0F766E" />
                    <span>10-Second Walk-In Add (Front Desk Sunita)</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    Auto-assigns next sequential token number into the Waiting queue
                  </span>
                </div>

                <form onSubmit={handleAddQuickWalkIn} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    required
                    placeholder="Patient Name (e.g. Ramesh Verma)"
                    value={quickWalkIn.patientName}
                    onChange={(e) => setQuickWalkIn({ ...quickWalkIn, patientName: e.target.value })}
                    style={{ flex: '1 1 200px', minWidth: '180px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />

                  <input
                    type="tel"
                    required
                    placeholder="Phone (e.g. 98100 12345)"
                    value={quickWalkIn.phone}
                    onChange={(e) => setQuickWalkIn({ ...quickWalkIn, phone: e.target.value })}
                    style={{ flex: '1 1 160px', minWidth: '140px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                  />

                  <select
                    value={quickWalkIn.service}
                    onChange={(e) => setQuickWalkIn({ ...quickWalkIn, service: e.target.value })}
                    style={{ flex: '1 1 200px', minWidth: '180px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFF' }}
                  >
                    {content?.services.map((s) => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                  </select>

                  <select
                    value={quickWalkIn.shift}
                    onChange={(e) => setQuickWalkIn({ ...quickWalkIn, shift: e.target.value as 'Morning' | 'Evening' })}
                    style={{ flex: '0 0 130px', padding: '9px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', background: '#FFF' }}
                  >
                    <option value="Morning">Morning OPD</option>
                    <option value="Evening">Evening OPD</option>
                  </select>

                  <button
                    type="submit"
                    className="ux-btn"
                    style={{
                      background: '#0F766E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '9px 20px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <PlusIcon size={16} color="#FFFFFF" />
                    <span>Add Walk-In Patient</span>
                  </button>
                </form>
              </div>

              {/* 3-Column Kanban Board */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'flex-start' }}>
                
                {/* COLUMN 1: WAITING */}
                <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '2px solid #0F766E' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>WAITING</span>
                        <span style={{ background: '#CCFBF1', color: '#0F766E', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '999px' }}>
                          {appointments.filter((a) => (a.opdStage || 'waiting') === 'waiting' && a.status !== 'cancelled').length}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Patients in clinic waiting lounge</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '320px' }}>
                    {appointments
                      .filter((a) => (a.opdStage || 'waiting') === 'waiting' && a.status !== 'cancelled')
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className="ux-card"
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            padding: '14px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', fontWeight: '800', fontSize: '13px', padding: '3px 8px', borderRadius: '6px' }}>
                              Token #{String(apt.tokenNumber || 1).padStart(2, '0')}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>
                              {apt.shift || 'Evening'}
                            </span>
                          </div>

                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A', marginBottom: '2px' }}>
                            {apt.patientName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>
                            {apt.service}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <PhoneIcon size={12} color="#64748B" />
                            <span>{apt.phone}</span>
                            <span>&bull; {apt.preferredDate}</span>
                          </div>

                          {/* Quick 1-Tap Actions */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                            <button
                              onClick={() => handleUpdateOpdStage(apt.id, 'in_consultation')}
                              className="ux-btn"
                              style={{
                                flex: '1 1 100%',
                                background: '#0F766E',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '7px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>Call Inside Cabin &rarr;</span>
                            </button>

                            <button
                              onClick={() => handleSendWhatsAppConfirmation(apt)}
                              className="ux-btn"
                              title="Send WhatsApp confirmation & reply options"
                              style={{
                                flex: '1',
                                background: '#F0FDF4',
                                color: '#166534',
                                border: '1px solid #BBF7D0',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <MessageCircleIcon size={12} color="#166534" />
                              <span>{apt.whatsappConfirmationSent ? '✓ Sent' : 'WA Confirm'}</span>
                            </button>

                            <button
                              onClick={() => handleSendWhatsAppReminder(apt)}
                              className="ux-btn"
                              title="Send 2-hour reminder with quick reply"
                              style={{
                                flex: '1',
                                background: '#F0FDF4',
                                color: '#166534',
                                border: '1px solid #BBF7D0',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <ClockIcon size={12} color="#166534" />
                              <span>2h Remind</span>
                            </button>

                            <a
                              href={`tel:${apt.phone}`}
                              className="ux-btn"
                              style={{
                                flex: '1',
                                background: '#F8FAFC',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <PhoneIcon size={12} color="#334155" />
                              <span>Call</span>
                            </a>

                            <button
                              onClick={() => setPrintSlipPatient(apt)}
                              className="ux-btn"
                              title="Print Clinic Appointment Slip"
                              style={{
                                background: '#F8FAFC',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <PrinterIcon size={12} color="#334155" />
                              <span>Slip</span>
                            </button>
                          </div>
                        </div>
                      ))}

                    {appointments.filter((a) => (a.opdStage || 'waiting') === 'waiting' && a.status !== 'cancelled').length === 0 && (
                      <div style={{ textAlign: 'center', padding: '36px 12px', color: '#94A3B8', fontSize: '13px' }}>
                        Waiting lounge is clear. Add walk-in above or wait for arrivals.
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMN 2: IN CONSULTATION */}
                <div style={{ background: '#F0FDF4', borderRadius: '14px', border: '1px solid #BBF7D0', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '2px solid #16A34A' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="pulse-beacon" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                        <span>IN CONSULTATION</span>
                        <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '999px' }}>
                          {appointments.filter((a) => a.opdStage === 'in_consultation').length}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#15803D', marginTop: '2px' }}>Active inside doctor cabin</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '320px' }}>
                    {appointments
                      .filter((a) => a.opdStage === 'in_consultation')
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className="ux-card"
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            border: '2px solid #0F766E',
                            padding: '16px',
                            boxShadow: '0 4px 12px rgba(15,118,110,0.12)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ background: '#0F766E', color: '#FFFFFF', fontWeight: '800', fontSize: '13px', padding: '3px 8px', borderRadius: '6px' }}>
                              Token #{String(apt.tokenNumber || 1).padStart(2, '0')} &bull; In Cabin
                            </span>
                            <span style={{ fontSize: '11px', color: '#0F766E', fontWeight: '700' }}>Active Now</span>
                          </div>

                          <div style={{ fontWeight: '800', fontSize: '16px', color: '#0F172A', marginBottom: '4px' }}>
                            {apt.patientName}
                          </div>
                          <div style={{ fontSize: '13px', color: '#0F766E', fontWeight: '600', marginBottom: '8px' }}>
                            {apt.service}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '14px' }}>
                            Phone: {apt.phone} &bull; Ref: {apt.id}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleUpdateOpdStage(apt.id, 'done')}
                              className="ux-btn"
                              style={{
                                flex: '1 1 100%',
                                background: '#16A34A',
                                color: '#FFFFFF',
                                border: 'none',
                                padding: '9px 14px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <CheckCircleIcon size={16} color="#FFFFFF" />
                              <span>Mark Consultation Complete &rarr;</span>
                            </button>

                            <button
                              onClick={() => setPrintSlipPatient(apt)}
                              className="ux-btn"
                              style={{
                                flex: '1',
                                background: '#F8FAFC',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <PrinterIcon size={13} color="#334155" />
                              <span>Print Slip</span>
                            </button>
                          </div>
                        </div>
                      ))}

                    {appointments.filter((a) => a.opdStage === 'in_consultation').length === 0 && (
                      <div style={{ textAlign: 'center', padding: '36px 12px', color: '#166534', fontSize: '13px', background: '#FFFFFF', borderRadius: '10px', border: '1px dashed #BBF7D0' }}>
                        No patient currently in cabin. Click &quot;Call Inside Cabin&quot; from the Waiting queue.
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMN 3: DONE / COMPLETED */}
                <div style={{ background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '2px solid #64748B' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>DONE / COMPLETED</span>
                        <span style={{ background: '#E2E8F0', color: '#334155', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '999px' }}>
                          {appointments.filter((a) => a.opdStage === 'done' || a.status === 'completed').length}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Post-visit Google review &amp; pharmacy</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '320px' }}>
                    {appointments
                      .filter((a) => a.opdStage === 'done' || a.status === 'completed')
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className="ux-card"
                          style={{
                            background: '#FFFFFF',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            padding: '14px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <span style={{ background: '#E2E8F0', color: '#334155', fontWeight: '700', fontSize: '12px', padding: '2px 7px', borderRadius: '5px' }}>
                              Token #{String(apt.tokenNumber || 1).padStart(2, '0')} &bull; Done
                            </span>
                            <span style={{ fontSize: '11px', color: '#16A34A', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckIcon size={12} color="#16A34A" />
                              <span>Completed</span>
                            </span>
                          </div>

                          <div style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A', marginBottom: '2px' }}>
                            {apt.patientName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '10px' }}>
                            {apt.service} &bull; {apt.phone}
                          </div>

                          {/* Post-visit Google Review Request Trigger */}
                          <div style={{ paddingTop: '8px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleSendGoogleReview(apt)}
                              className="ux-btn"
                              style={{
                                flex: '1 1 100%',
                                background: apt.googleReviewSent ? '#F0FDF4' : '#FEF3C7',
                                color: apt.googleReviewSent ? '#166534' : '#92400E',
                                border: apt.googleReviewSent ? '1px solid #BBF7D0' : '1px solid #FCD34D',
                                padding: '7px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <StarIcon size={14} color={apt.googleReviewSent ? '#166534' : '#D97706'} />
                              <span>{apt.googleReviewSent ? '✓ Google Review Sent' : '★ Request Google Review on WhatsApp'}</span>
                            </button>

                            <button
                              onClick={() => setPrintSlipPatient(apt)}
                              className="ux-btn"
                              style={{
                                flex: '1',
                                background: '#F8FAFC',
                                color: '#334155',
                                border: '1px solid #CBD5E1',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <PrinterIcon size={12} color="#334155" />
                              <span>Print Discharge Slip</span>
                            </button>
                          </div>
                        </div>
                      ))}

                    {appointments.filter((a) => a.opdStage === 'done' || a.status === 'completed').length === 0 && (
                      <div style={{ textAlign: 'center', padding: '36px 12px', color: '#94A3B8', fontSize: '13px' }}>
                        No completed consultations yet today.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 2: APPOINTMENTS INBOX & CRM-LITE                    */}
          {/* ======================================================= */}
          {activeTab === 'appointments' && (
            <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarIcon size={22} color="#0F766E" />
                    <span>Patient Appointments &bull; Request-First Reception Inbox</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                    Per ADR-104: Receptionist verifies shift capacity and confirms time slot directly on WhatsApp. Live synced with /api/appointments.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowAddAptModal(true)}
                    className="ux-btn"
                    style={{
                      background: '#0F766E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <PlusIcon size={15} color="#FFFFFF" />
                    <span>Add Walk-in Patient</span>
                  </button>
                  <button
                    onClick={() => fetchAppointments()}
                    className="ux-btn"
                    style={{
                      background: '#F1F5F9',
                      color: '#334155',
                      border: '1px solid #CBD5E1',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <RefreshCwIcon size={14} color="#334155" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: `All (${appointments.length})`, dot: null },
                    { id: 'new', label: `New (${appointments.filter((a) => a.status === 'new').length})`, dot: '#EAB308' },
                    { id: 'contacted', label: `Contacted (${appointments.filter((a) => a.status === 'contacted').length})`, dot: '#0284C7' },
                    { id: 'confirmed', label: `Confirmed (${appointments.filter((a) => a.status === 'confirmed').length})`, dot: '#16A34A' },
                    { id: 'completed', label: `Completed (${appointments.filter((a) => a.status === 'completed').length})`, dot: '#64748B' },
                    { id: 'cancelled', label: `Cancelled (${appointments.filter((a) => a.status === 'cancelled').length})`, dot: '#DC2626' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setAptFilter(f.id as any)}
                      className="ux-btn"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: aptFilter === f.id ? '700' : '500',
                        border: aptFilter === f.id ? '1px solid #0F766E' : '1px solid #E2E8F0',
                        background: aptFilter === f.id ? '#F0FDF4' : '#FFFFFF',
                        color: aptFilter === f.id ? '#0F766E' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {f.dot && (
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.dot, display: 'inline-block' }} />
                      )}
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search patient, phone, service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '8px 14px 8px 32px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', width: '260px' }}
                  />
                  <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#94A3B8' }}>
                    <SearchIcon size={14} color="#94A3B8" />
                  </span>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
                      <th style={{ padding: '12px' }}>Token</th>
                      <th style={{ padding: '12px' }}>ID &amp; Patient</th>
                      <th style={{ padding: '12px' }}>Phone / WhatsApp</th>
                      <th style={{ padding: '12px' }}>Specialty</th>
                      <th style={{ padding: '12px' }}>Date &amp; Shift</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Front-Desk Notes</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Workflow Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                          No appointments match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <tr key={apt.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', fontWeight: '800', fontSize: '12px', padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                              Token #{String(apt.tokenNumber || 1).padStart(2, '0')}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>
                            <div>{apt.patientName}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{apt.id} &bull; {apt.createdAt}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <a
                              href={`https://wa.me/${apt.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(apt.patientName)},%20this%20is%20Sunita%20from%20${encodeURIComponent(content.clinic.name)}%20regarding%20your%20consultation%20request%20with%20${encodeURIComponent(content.doctor.name)}.%20Please%20let%20us%20know%20if%20you%20prefer%20morning%20or%20evening.`}
                              target="_blank"
                              rel="noreferrer"
                              className="ux-btn"
                              style={{ color: '#047857', fontWeight: '600', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              title="Open WhatsApp chat with patient"
                            >
                              <MessageCircleIcon size={14} color="#047857" />
                              <span>{apt.phone}</span>
                            </a>
                          </td>
                          <td style={{ padding: '12px', color: '#334155' }}>{apt.service}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontWeight: '600' }}>{apt.preferredDate}</span>
                            <span style={{ marginLeft: '6px', fontSize: '11px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                              {apt.shift}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                background:
                                  apt.status === 'new'
                                    ? '#FEF3C7'
                                    : apt.status === 'contacted'
                                    ? '#E0F2FE'
                                    : apt.status === 'confirmed'
                                    ? '#DCFCE7'
                                    : '#F1F5F9',
                                color:
                                  apt.status === 'new'
                                    ? '#92400E'
                                    : apt.status === 'contacted'
                                    ? '#0369A1'
                                    : apt.status === 'confirmed'
                                    ? '#15803D'
                                    : '#475569',
                              }}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#64748B', maxWidth: '220px', fontSize: '12px' }}>
                            {apt.notes}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleSendWhatsAppConfirmation(apt)}
                                className="ux-btn"
                                title="Send WhatsApp confirmation & reply options"
                                style={{ background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <MessageCircleIcon size={12} color="#166534" />
                                <span>{apt.whatsappConfirmationSent ? '✓ WA' : 'WA Confirm'}</span>
                              </button>

                              <button
                                onClick={() => setPrintSlipPatient(apt)}
                                className="ux-btn"
                                title="Print Clinic Appointment Slip"
                                style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <PrinterIcon size={12} color="#334155" />
                                <span>Slip</span>
                              </button>

                              {apt.status === 'new' && (
                                <button
                                  disabled={actionLoadingId === apt.id}
                                  onClick={() => updateStatus(apt.id, 'contacted', 'WhatsApp outreach performed')}
                                  className="ux-btn"
                                  style={{ background: '#0284C7', color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Mark Contacted
                                </button>
                              )}
                              {(apt.status === 'new' || apt.status === 'contacted') && (
                                <button
                                  disabled={actionLoadingId === apt.id}
                                  onClick={() => updateStatus(apt.id, 'confirmed', 'Time slot confirmed with patient')}
                                  className="ux-btn"
                                  style={{ background: '#16A34A', color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Confirm Slot
                                </button>
                              )}
                              {apt.status === 'confirmed' && (
                                <button
                                  disabled={actionLoadingId === apt.id}
                                  onClick={() => updateStatus(apt.id, 'completed', 'Consultation finished')}
                                  className="ux-btn"
                                  style={{ background: '#475569', color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Complete Visit
                                </button>
                              )}
                              {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                <button
                                  disabled={actionLoadingId === apt.id}
                                  onClick={() => updateStatus(apt.id, 'cancelled', 'Cancelled by patient or clinic')}
                                  className="ux-btn"
                                  style={{ background: '#F1F5F9', color: '#991B1B', border: '1px solid #FECACA', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 3: SITE BLOCK EDITOR & LIVE PREVIEW IFRAME          */}
          {/* ======================================================= */}
          {activeTab === 'editor' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Edit3Icon size={22} color="#0F766E" />
                    <span>Site Block Editor &bull; Live Device Preview</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                    Changes edit <code>fixtures/live-store.json</code> and reflect on the patient site at <code>http://localhost:3000/</code> in real time.
                  </p>
                </div>

                {/* Viewport Width Controls */}
                <div style={{ display: 'flex', gap: '6px', background: '#E2E8F0', padding: '4px', borderRadius: '8px' }}>
                  <button
                    onClick={() => setDeviceViewport('360px')}
                    className="ux-btn"
                    style={{
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: deviceViewport === '360px' ? '700' : '500',
                      background: deviceViewport === '360px' ? '#FFFFFF' : 'transparent',
                      color: deviceViewport === '360px' ? '#0F766E' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <SmartphoneIcon size={14} color={deviceViewport === '360px' ? '#0F766E' : '#475569'} />
                    <span>Mobile (360px)</span>
                  </button>
                  <button
                    onClick={() => setDeviceViewport('768px')}
                    className="ux-btn"
                    style={{
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: deviceViewport === '768px' ? '700' : '500',
                      background: deviceViewport === '768px' ? '#FFFFFF' : 'transparent',
                      color: deviceViewport === '768px' ? '#0F766E' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <TabletIcon size={14} color={deviceViewport === '768px' ? '#0F766E' : '#475569'} />
                    <span>Tablet (768px)</span>
                  </button>
                  <button
                    onClick={() => setDeviceViewport('100%')}
                    className="ux-btn"
                    style={{
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: deviceViewport === '100%' ? '700' : '500',
                      background: deviceViewport === '100%' ? '#FFFFFF' : 'transparent',
                      color: deviceViewport === '100%' ? '#0F766E' : '#475569',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <MonitorIcon size={14} color={deviceViewport === '100%' ? '#0F766E' : '#475569'} />
                    <span>Desktop (1400px)</span>
                  </button>
                </div>
              </div>

              {/* Sub-Navigation for Block Sections */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px', borderBottom: '1px solid #E2E8F0' }}>
                {[
                  { id: 'clinic', label: 'Clinic, Timings & Map (Photo Match)', icon: <BuildingIcon size={14} /> },
                  { id: 'hero', label: 'Hero & Announcements', icon: <ActivityIcon size={14} /> },
                  { id: 'doctor', label: 'Doctor Credentials & Pricing', icon: <UserCheckIcon size={14} /> },
                  { id: 'pillars', label: 'Why Choose Us (4 Pillars)', icon: <AwardIcon size={14} /> },
                  { id: 'services', label: `Clinical Services (${content.services.length})`, icon: <MicroscopeIcon size={14} /> },
                  { id: 'reviews', label: `Patient Reviews (${content.reviews.length})`, icon: <MessageCircleIcon size={14} /> },
                  { id: 'faqs', label: `FAQs (${content.faqs.length})`, icon: <HelpCircleIcon size={14} /> },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setEditorSection(sec.id as EditorSection)}
                    className="ux-btn"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: editorSection === sec.id ? '700' : '500',
                      border: editorSection === sec.id ? '1px solid #0F766E' : '1px solid #CBD5E1',
                      background: editorSection === sec.id ? '#0F766E' : '#FFFFFF',
                      color: editorSection === sec.id ? '#FFFFFF' : '#334155',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{sec.icon}</span>
                    <span>{sec.label}</span>
                  </button>
                ))}
              </div>

              {/* Split Grid: Left Editor Forms & Right Live Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 480px) 1fr', gap: '24px', alignItems: 'flex-start' }}>
                
                {/* Left Column: Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Save Banner */}
                  <div className="ux-card" style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F766E' }}>
                        Editing: {editorSection.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        {hasUnsavedChanges ? (
                          <>
                            <AlertTriangleIcon size={13} color="#D97706" />
                            <span style={{ color: '#D97706', fontWeight: '600' }}>Unsaved changes ready to publish</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon size={13} color="#047857" />
                            <span>All synced with live patient page</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePublish()}
                      disabled={publishStatus === 'publishing'}
                      className="ux-btn"
                      style={{
                        background: hasUnsavedChanges ? '#D97706' : '#0F766E',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {publishStatus === 'publishing' ? (
                        <>
                          <RefreshCwIcon size={13} className="spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <SendIcon size={13} color="#FFFFFF" />
                          <span>Publish Changes</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* SECTION: CLINIC, SCHEDULE & MAP */}
                  {editorSection === 'clinic' && (
                    <div className="ux-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BuildingIcon size={18} color="#0F766E" />
                        <span>Clinic Address, Schedule &amp; Map Facade</span>
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Tagline Quote</label>
                          <input
                            type="text"
                            value={content.clinic.taglineQuote || ''}
                            onChange={(e) => handleContentChange('clinic', 'taglineQuote', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Clinic Name</label>
                          <input
                            type="text"
                            value={content.clinic.name}
                            onChange={(e) => handleContentChange('clinic', 'name', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>
                            <MapPinIcon size={14} color="#0F766E" />
                            <span>Street Address</span>
                          </label>
                          <input
                            type="text"
                            value={content.clinic.street}
                            onChange={(e) => handleContentChange('clinic', 'street', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>Area</label>
                            <input
                              type="text"
                              value={content.clinic.area}
                              onChange={(e) => handleContentChange('clinic', 'area', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>City</label>
                            <input
                              type="text"
                              value={content.clinic.city}
                              onChange={(e) => handleContentChange('clinic', 'city', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>Pincode</label>
                            <input
                              type="text"
                              value={content.clinic.pincode}
                              onChange={(e) => handleContentChange('clinic', 'pincode', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Fee Policy Text</label>
                          <textarea
                            rows={2}
                            value={content.clinic.feePolicy || ''}
                            onChange={(e) => handleContentChange('clinic', 'feePolicy', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION: HERO & ANNOUNCEMENTS */}
                  {editorSection === 'hero' && (
                    <div className="ux-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ActivityIcon size={18} color="#0F766E" />
                        <span>Hero Section &amp; Announcements</span>
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Emergency &amp; Top Announcement Bar</label>
                          <input
                            type="text"
                            value={content.announcement}
                            onChange={(e) => handleContentChange('announcement' as any, '', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Hero Headline</label>
                          <input
                            type="text"
                            value={content.hero.headline}
                            onChange={(e) => handleContentChange('hero', 'headline', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Hero Subtitle</label>
                          <textarea
                            rows={2}
                            value={content.hero.subtitle}
                            onChange={(e) => handleContentChange('hero', 'subtitle', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION: DOCTOR CREDENTIALS */}
                  {editorSection === 'doctor' && (
                    <div className="ux-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheckIcon size={18} color="#0F766E" />
                        <span>Doctor Credentials, Fee &amp; Bio</span>
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Doctor Name</label>
                          <input
                            type="text"
                            value={content.doctor.name}
                            onChange={(e) => handleContentChange('doctor', 'name', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Consultation Fee (₹)</label>
                            <input
                              type="number"
                              value={content.doctor.consultationFee}
                              onChange={(e) => handleContentChange('doctor', 'consultationFee', Number(e.target.value))}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Languages</label>
                            <input
                              type="text"
                              value={content.doctor.languages || 'English & Hindi'}
                              onChange={(e) => handleContentChange('doctor', 'languages', e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Medical Degrees</label>
                          <input
                            type="text"
                            value={content.doctor.degree}
                            onChange={(e) => handleContentChange('doctor', 'degree', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Doctor Bio</label>
                          <textarea
                            rows={3}
                            value={content.doctor.bio}
                            onChange={(e) => handleContentChange('doctor', 'bio', e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OTHER SECTIONS: PILLARS, SERVICES, REVIEWS, FAQS (handled directly in editor) */}
                  {editorSection === 'pillars' && (
                    <div className="ux-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AwardIcon size={18} color="#0F766E" />
                        <span>Why Choose Us &bull; 4 Trust Pillars</span>
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {content.whyChooseUs?.map((pillar, idx) => (
                          <div key={pillar.id} style={{ border: '1px solid #E2E8F0', padding: '14px', borderRadius: '8px', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {renderEditorIconPreview(pillar.icon)}
                              </div>
                              <input
                                type="text"
                                value={pillar.title}
                                onChange={(e) => updateWhyChooseUs(idx, 'title', e.target.value)}
                                style={{ flex: 1, fontWeight: '700', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={pillar.description}
                              onChange={(e) => updateWhyChooseUs(idx, 'description', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editorSection === 'services' && (
                    <div className="ux-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#0F766E' }}>
                          Clinical Services ({content.services.length})
                        </h3>
                        <button
                          type="button"
                          onClick={addService}
                          className="ux-btn"
                          style={{ background: '#0F766E', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          + Add Service
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {content.services.map((srv, idx) => (
                          <div key={srv.id} style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <input
                                type="text"
                                value={srv.title}
                                onChange={(e) => updateService(idx, 'title', e.target.value)}
                                style={{ flex: 1, fontWeight: '700', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                              />
                              <button
                                type="button"
                                onClick={() => removeService(idx)}
                                style={{ background: '#FEE2E2', border: 'none', color: '#B91C1C', cursor: 'pointer', marginLeft: '8px', borderRadius: '6px', padding: '4px 8px' }}
                              >
                                <Trash2Icon size={13} color="#B91C1C" />
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={srv.description}
                              onChange={(e) => updateService(idx, 'description', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editorSection === 'reviews' && (
                    <div className="ux-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#0F766E' }}>
                          Patient Feedback ({content.reviews.length})
                        </h3>
                        <button
                          type="button"
                          onClick={addReview}
                          className="ux-btn"
                          style={{ background: '#0F766E', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          + Add Review
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {content.reviews.map((rev, idx) => (
                          <div key={rev.id} style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <input
                                type="text"
                                placeholder="Patient Name"
                                value={rev.patientName}
                                onChange={(e) => updateReview(idx, 'patientName', e.target.value)}
                                style={{ width: '140px', fontWeight: '700', padding: '5px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                              />
                              <input
                                type="text"
                                placeholder="Treatment Tag"
                                value={rev.treatment}
                                onChange={(e) => updateReview(idx, 'treatment', e.target.value)}
                                style={{ flex: 1, marginLeft: '6px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                              />
                              <button
                                type="button"
                                onClick={() => removeReview(idx)}
                                style={{ background: '#FEE2E2', border: 'none', color: '#B91C1C', cursor: 'pointer', marginLeft: '6px', borderRadius: '6px', padding: '4px 8px' }}
                              >
                                <Trash2Icon size={13} color="#B91C1C" />
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={rev.reviewText}
                              onChange={(e) => updateReview(idx, 'reviewText', e.target.value)}
                              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editorSection === 'faqs' && (
                    <div className="ux-card" style={{ background: '#FFFFFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#0F766E' }}>
                          FAQs ({content.faqs.length})
                        </h3>
                        <button
                          type="button"
                          onClick={addFaq}
                          className="ux-btn"
                          style={{ background: '#0F766E', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          + Add FAQ
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {content.faqs.map((faq, idx) => (
                          <div key={faq.id} style={{ border: '1px solid #E2E8F0', padding: '12px', borderRadius: '8px', background: '#F8FAFC' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <input
                                type="text"
                                value={faq.question}
                                onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                                style={{ flex: 1, fontWeight: '700', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                              />
                              <button
                                type="button"
                                onClick={() => removeFaq(idx)}
                                style={{ background: '#FEE2E2', border: 'none', color: '#B91C1C', cursor: 'pointer', marginLeft: '6px', borderRadius: '6px', padding: '4px 8px' }}
                              >
                                <Trash2Icon size={13} color="#B91C1C" />
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={faq.answer}
                              onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column: Live Iframe Preview */}
                <div
                  className="ux-card"
                  style={{
                    background: '#CBD5E1',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B', fontWeight: '600' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      <span>Live Patient Site Preview (http://localhost:3000/)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setPreviewKey((k) => k + 1)}
                        className="ux-btn"
                        style={{ background: '#FFFFFF', border: '1px solid #94A3B8', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <RefreshCwIcon size={12} color="#334155" />
                        <span>Refresh</span>
                      </button>
                      <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="ux-btn"
                        style={{ background: '#0F766E', color: '#FFFFFF', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <span>Open Live Site</span>
                        <ExternalLinkIcon size={12} color="#FFFFFF" />
                      </a>
                    </div>
                  </div>

                  {/* Direct In-Context Preview Quick Edit Toolbar */}
                  <div
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #94A3B8',
                      padding: '12px 16px',
                      marginBottom: '12px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SparklesIcon size={14} color="#0F766E" />
                        <span>Direct In-Context Quick Edit (Visible Instant Control)</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        Edits apply directly to the live site preview below
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 90px 130px auto', gap: '8px', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>Hero Headline</div>
                        <input
                          type="text"
                          value={content.hero.headline}
                          onChange={(e) => handleContentChange('hero', 'headline', e.target.value)}
                          placeholder="Headline"
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>Doctor Specialty</div>
                        <input
                          type="text"
                          value={content.doctor.specialty}
                          onChange={(e) => handleContentChange('doctor', 'specialty', e.target.value)}
                          placeholder="Specialty"
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>Fee (₹)</div>
                        <input
                          type="number"
                          value={content.doctor.consultationFee}
                          onChange={(e) => handleContentChange('doctor', 'consultationFee', Number(e.target.value))}
                          placeholder="Fee"
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: '2px' }}>Next Slot</div>
                        <input
                          type="text"
                          value={content.availability?.nextAvailableSlot || 'Today, 05:30 PM'}
                          onChange={(e) => {
                            if (!content) return;
                            setContent({
                              ...content,
                              availability: {
                                ...content.availability,
                                nextAvailableSlot: e.target.value,
                              },
                            });
                            setHasUnsavedChanges(true);
                          }}
                          placeholder="Slot"
                          style={{ width: '100%', padding: '6px 8px', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ paddingTop: '16px' }}>
                        <button
                          onClick={() => handlePublish()}
                          className="ux-btn"
                          style={{
                            background: '#0F766E',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '7px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <SendIcon size={12} color="#FFFFFF" />
                          <span>Publish Live</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Section Jump Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>Quick-Focus Section:</span>
                      {[
                        { id: 'clinic', label: 'Clinic & Schedule' },
                        { id: 'hero', label: 'Hero Block' },
                        { id: 'doctor', label: 'Doctor Credentials' },
                        { id: 'services', label: 'Services' },
                        { id: 'reviews', label: 'Reviews' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setEditorSection(item.id as EditorSection)}
                          className="ux-btn"
                          style={{
                            background: editorSection === item.id ? '#CCFBF1' : '#F8FAFC',
                            color: editorSection === item.id ? '#0F766E' : '#475569',
                            border: editorSection === item.id ? '1px solid #0F766E' : '1px solid #CBD5E1',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: editorSection === item.id ? '700' : '500',
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    style={{
                      width: deviceViewport,
                      maxWidth: '100%',
                      height: '800px',
                      background: '#FFFFFF',
                      borderRadius: '10px',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                      overflow: 'hidden',
                      transition: 'width 0.25s ease',
                      border: '1px solid #94A3B8',
                    }}
                  >
                    <iframe
                      ref={previewIframeRef}
                      key={previewKey}
                      src="/"
                      title="Live Site Preview"
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 4: CLINICAL SERVICES CATALOG                        */}
          {/* ======================================================= */}
          {activeTab === 'services' && (
            <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MicroscopeIcon size={22} color="#0F766E" />
                    <span>Clinical Procedures &amp; Services Catalog</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                    Manage the 9 specialized medical treatments displayed on the patient landing page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addService}
                  className="ux-btn"
                  style={{ background: '#0F766E', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <PlusIcon size={15} color="#FFFFFF" />
                  <span>Add Procedure</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {content.services.map((srv, idx) => (
                  <div key={srv.id} className="ux-card" style={{ border: '1px solid #E2E8F0', padding: '16px', borderRadius: '10px', background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {renderEditorIconPreview(srv.icon)}
                        </div>
                        <input
                          type="text"
                          value={srv.title}
                          onChange={(e) => updateService(idx, 'title', e.target.value)}
                          style={{ flex: 1, fontWeight: '700', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeService(idx)}
                        className="ux-btn"
                        style={{ background: '#FEE2E2', border: 'none', color: '#B91C1C', cursor: 'pointer', marginLeft: '8px', borderRadius: '6px', padding: '6px 8px' }}
                      >
                        <Trash2Icon size={14} color="#B91C1C" />
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={srv.description}
                      onChange={(e) => updateService(idx, 'description', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 5: PATIENT REVIEWS & RATINGS                        */}
          {/* ======================================================= */}
          {activeTab === 'reviews' && (
            <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageCircleIcon size={22} color="#0F766E" />
                    <span>Patient Feedback &amp; Verified Reviews</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                    Moderate real clinical feedback displayed in the patient landing page reviews carousel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addReview}
                  className="ux-btn"
                  style={{ background: '#0F766E', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <PlusIcon size={15} color="#FFFFFF" />
                  <span>Add Patient Review</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {content.reviews.map((rev, idx) => (
                  <div key={rev.id} className="ux-card" style={{ border: '1px solid #E2E8F0', padding: '16px', borderRadius: '10px', background: '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                        <input
                          type="text"
                          placeholder="Patient Name"
                          value={rev.patientName}
                          onChange={(e) => updateReview(idx, 'patientName', e.target.value)}
                          style={{ width: '130px', fontWeight: '700', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                        />
                        <input
                          type="text"
                          placeholder="Treatment"
                          value={rev.treatment}
                          onChange={(e) => updateReview(idx, 'treatment', e.target.value)}
                          style={{ flex: 1, padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeReview(idx)}
                        className="ux-btn"
                        style={{ background: '#FEE2E2', border: 'none', color: '#B91C1C', cursor: 'pointer', marginLeft: '8px', borderRadius: '6px', padding: '6px 8px' }}
                      >
                        <Trash2Icon size={14} color="#B91C1C" />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        placeholder="Location (e.g. Sector 18, Noida)"
                        value={rev.location}
                        onChange={(e) => updateReview(idx, 'location', e.target.value)}
                        style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                      />
                      <select
                        value={rev.rating}
                        onChange={(e) => updateReview(idx, 'rating', Number(e.target.value))}
                        style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                      >
                        <option value={5}>5 Stars (Excellent)</option>
                        <option value={4}>4 Stars (Good)</option>
                      </select>
                    </div>
                    <textarea
                      rows={3}
                      value={rev.reviewText}
                      onChange={(e) => updateReview(idx, 'reviewText', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 6: CLINIC HOURS & GOOGLE MAP FACADE                 */}
          {/* ======================================================= */}
          {activeTab === 'clinic_hours' && (
            <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BuildingIcon size={22} color="#0F766E" />
                <span>Clinic Schedule, Fee Policy &amp; Google Map</span>
              </h2>
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748B' }}>
                Updates the exact Clinic Schedule &amp; Map Card shown on the patient landing page.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Monday – Friday Shift Hours</label>
                    <input
                      type="text"
                      value={content.clinic.schedule.weekdayHours}
                      onChange={(e) => handleContentChange('clinic', 'schedule.weekdayHours', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Saturday Shift Hours</label>
                    <input
                      type="text"
                      value={content.clinic.schedule.saturdayHours}
                      onChange={(e) => handleContentChange('clinic', 'schedule.saturdayHours', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Sunday Schedule</label>
                    <input
                      type="text"
                      value={content.clinic.schedule.sundayHours}
                      onChange={(e) => handleContentChange('clinic', 'schedule.sundayHours', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Consultation Fee Policy</label>
                    <textarea
                      rows={3}
                      value={content.clinic.feePolicy}
                      onChange={(e) => handleContentChange('clinic', 'feePolicy', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Google Map Location Title</label>
                    <input
                      type="text"
                      value={content.clinic.mapLocationName}
                      onChange={(e) => handleContentChange('clinic', 'mapLocationName', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Map Subtitle</label>
                    <input
                      type="text"
                      value={content.clinic.mapSubtitle}
                      onChange={(e) => handleContentChange('clinic', 'mapSubtitle', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>Transit &amp; Parking Guidance</label>
                    <textarea
                      rows={4}
                      value={content.clinic.transitGuidance}
                      onChange={(e) => handleContentChange('clinic', 'transitGuidance', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 7: 6 CLINICAL THEME PRESETS                         */}
          {/* ======================================================= */}
          {activeTab === 'themes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PaletteIcon size={22} color="#0F766E" />
                    <span>DoctorSite Pro &bull; 6 Clinical Theme Presets</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                    Per Spec 19. All palettes pass WCAG 2.2 Level AA accessibility standards. 1-click apply publishes immediately to <code>localhost:3000</code>.
                  </p>
                </div>

                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', color: '#166534', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircleIcon size={14} color="#166534" />
                  <span>Active Theme: <strong>{content.theme}</strong></span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {THEME_PRESETS.map((theme) => {
                  const isCurrent = content.theme === theme.name;
                  return (
                    <div
                      key={theme.name}
                      className="ux-card"
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        border: isCurrent ? '2px solid #0F766E' : '1px solid #E2E8F0',
                        padding: '22px',
                        boxShadow: isCurrent ? '0 6px 16px rgba(15,118,110,0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <strong style={{ fontSize: '17px', color: theme.primary }}>{theme.name}</strong>
                          {isCurrent && (
                            <span style={{ background: '#0F766E', color: '#FFFFFF', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircleIcon size={12} color="#FFFFFF" />
                              <span>ACTIVE THEME</span>
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                          <div style={{ flex: 1, height: '44px', borderRadius: '8px', background: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}>
                            Primary
                          </div>
                          <div style={{ flex: 1, height: '44px', borderRadius: '8px', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}>
                            Accent
                          </div>
                          <div style={{ flex: 1, height: '44px', borderRadius: '8px', background: theme.bg, border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '11px', fontWeight: 'bold' }}>
                            Background
                          </div>
                        </div>

                        <div style={{ fontSize: '13px', color: '#334155', marginBottom: '6px', fontWeight: '500' }}>
                          {theme.description}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                          <strong>Recommended for:</strong> {theme.specialty}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                        <button
                          onClick={() => selectAndPublishTheme(theme.name)}
                          className="ux-btn"
                          style={{
                            flex: 1,
                            background: isCurrent ? '#0F766E' : '#FFFFFF',
                            color: isCurrent ? '#FFFFFF' : '#0F766E',
                            border: isCurrent ? 'none' : '1px solid #0F766E',
                            padding: '10px',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          {isCurrent ? (
                            <>
                              <CheckCircleIcon size={14} color="#FFFFFF" />
                              <span>Currently Live</span>
                            </>
                          ) : (
                            <>
                              <ZapIcon size={14} color="#0F766E" />
                              <span>Apply &amp; Publish Immediately</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 8: MEDIA LIBRARY & ASSET PIPELINE                   */}
          {/* ======================================================= */}
          {activeTab === 'media' && (
            <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={22} color="#0F766E" />
                    <span>Media Library &bull; Asset Pipeline &amp; Photo Management</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                    Upload doctor portraits, clinic facades, and branding assets. 1-click set as active on the live patient portal (http://localhost:3000/).
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => mediaFileInputRef.current?.click()}
                    className="ux-btn"
                    style={{
                      background: '#0F766E',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '9px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(15,118,110,0.2)',
                    }}
                  >
                    <UploadIcon size={16} color="#FFFFFF" />
                    <span>+ Upload Photo</span>
                  </button>
                </div>
              </div>

              {/* Hidden Real File Input */}
              <input
                ref={mediaFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadMediaFile(file);
                    e.target.value = '';
                  }
                }}
              />

              {/* Clickable & Draggable Upload Dropzone */}
              <div
                onClick={() => mediaFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingMedia(true);
                }}
                onDragLeave={() => setIsDraggingMedia(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingMedia(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    handleUploadMediaFile(file);
                  }
                }}
                className="ux-card"
                style={{
                  border: isDraggingMedia ? '2px dashed #0F766E' : '2px dashed #0F766E',
                  borderRadius: '12px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: isDraggingMedia ? '#CCFBF1' : '#F0FDF4',
                  cursor: 'pointer',
                  marginBottom: '24px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadIcon size={28} color="#0F766E" />
                  </div>
                </div>
                <div style={{ fontWeight: '800', fontSize: '16px', color: '#0F766E' }}>
                  {uploadingMedia ? 'Uploading & Processing Image...' : 'Click to Upload or Drag & Drop Photos Here'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                  Supports JPG, PNG, WebP, SVG &bull; Preserved in <code>public/uploads</code> with instant live site sync
                </div>
                <button
                  type="button"
                  className="ux-btn"
                  style={{
                    marginTop: '14px',
                    background: '#0F766E',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <UploadIcon size={14} color="#FFFFFF" />
                  <span>Browse File From Computer</span>
                </button>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#334155', margin: 0 }}>
                  Active Media Assets ({content.media?.length || 0})
                </h3>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'all', label: `All (${content.media?.length || 0})` },
                    { id: 'doctor', label: 'Doctor Portraits' },
                    { id: 'clinic', label: 'Clinic Facades' },
                    { id: 'logo', label: 'Branding Logos' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setMediaCategoryFilter(f.id as any)}
                      className="ux-btn"
                      style={{
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: mediaCategoryFilter === f.id ? '700' : '500',
                        border: mediaCategoryFilter === f.id ? '1px solid #0F766E' : '1px solid #CBD5E1',
                        background: mediaCategoryFilter === f.id ? '#CCFBF1' : '#FFFFFF',
                        color: mediaCategoryFilter === f.id ? '#0F766E' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Media Assets Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                {(content.media || [])
                  .filter((item) => {
                    if (mediaCategoryFilter === 'doctor') return item.assignedTo === 'hero_doctor_portrait' || item.fileName.includes('portrait') || item.fileName.includes('doctor');
                    if (mediaCategoryFilter === 'clinic') return item.assignedTo === 'clinic_facade' || item.fileName.includes('clinic') || item.fileName.includes('facade');
                    if (mediaCategoryFilter === 'logo') return item.assignedTo === 'nav_logo' || item.fileName.includes('logo') || item.fileName.includes('branding');
                    return true;
                  })
                  .map((item) => {
                    const isDoctorPortrait = content.doctor.photoUrl === item.url || item.assignedTo === 'hero_doctor_portrait';
                    const isClinicPhoto = content.clinic.photoUrl === item.url || item.assignedTo === 'clinic_facade';
                    const isNavLogo = content.clinic.logoUrl === item.url || item.assignedTo === 'nav_logo';

                    return (
                      <div
                        key={item.id}
                        className="ux-card"
                        style={{
                          border: isDoctorPortrait || isClinicPhoto ? '2px solid #0F766E' : '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '14px',
                          background: '#FFFFFF',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          {/* Real Image Thumbnail */}
                          <div style={{ height: '160px', width: '100%', background: '#F1F5F9', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', position: 'relative' }}>
                            <img
                              src={item.url}
                              alt={item.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {/* Active Assignment Badge */}
                            {isDoctorPortrait && (
                              <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#0F766E', color: '#FFF', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckIcon size={11} color="#FFF" />
                                <span>Active Doctor Portrait</span>
                              </span>
                            )}
                            {isClinicPhoto && (
                              <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#0284C7', color: '#FFF', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckIcon size={11} color="#FFF" />
                                <span>Active Clinic Photo</span>
                              </span>
                            )}
                            {isNavLogo && (
                              <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#D97706', color: '#FFF', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckIcon size={11} color="#FFF" />
                                <span>Active Nav Logo</span>
                              </span>
                            )}
                          </div>

                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#0F172A', marginBottom: '2px', wordBreak: 'break-all' }}>
                            {item.title || item.fileName}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '12px' }}>
                            {item.fileSize} &bull; {item.fileType}
                          </div>
                        </div>

                        {/* 1-Click Assignment & Management Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                          <button
                            onClick={() => handleSetDoctorPhoto(item.url)}
                            className="ux-btn"
                            style={{
                              width: '100%',
                              background: isDoctorPortrait ? '#DCFCE7' : '#F0FDF4',
                              color: '#166534',
                              border: '1px solid #BBF7D0',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                            }}
                          >
                            <UserCheckIcon size={13} color="#166534" />
                            <span>{isDoctorPortrait ? '✓ Current Doctor Portrait' : '★ Set as Doctor Portrait'}</span>
                          </button>

                          <button
                            onClick={() => handleSetClinicPhoto(item.url)}
                            className="ux-btn"
                            style={{
                              width: '100%',
                              background: isClinicPhoto ? '#E0F2FE' : '#F8FAFC',
                              color: '#0369A1',
                              border: '1px solid #BAE6FD',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                            }}
                          >
                            <BuildingIcon size={13} color="#0369A1" />
                            <span>{isClinicPhoto ? '✓ Current Clinic Photo' : '★ Set as Clinic Photo'}</span>
                          </button>

                          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.url);
                                showToast('Image URL copied to clipboard');
                              }}
                              className="ux-btn"
                              style={{
                                flex: '1',
                                background: '#F8FAFC',
                                color: '#475569',
                                border: '1px solid #CBD5E1',
                                padding: '5px 8px',
                                borderRadius: '5px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <CopyIcon size={12} color="#475569" />
                              <span>Copy URL</span>
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Delete asset "${item.fileName}"?`)) {
                                  handleDeleteMedia(item.id);
                                }
                              }}
                              className="ux-btn"
                              style={{
                                background: '#FEF2F2',
                                color: '#991B1B',
                                border: '1px solid #FECACA',
                                padding: '5px 8px',
                                borderRadius: '5px',
                                fontSize: '11px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Delete Asset"
                            >
                              <Trash2Icon size={13} color="#991B1B" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {(content.media || []).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '13px' }}>
                  No media assets uploaded yet. Use the upload box above to add your first clinic photo.
                </div>
              )}
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 9: SETTINGS & COMPLIANCE                            */}
          {/* ======================================================= */}
          {activeTab === 'settings' && (
            <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SettingsIcon size={22} color="#0F766E" />
                <span>Clinic Governance &bull; 18% GST &amp; DPDP Act 2023</span>
              </h2>
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#64748B' }}>
                Operational compliance configurations for Indian healthcare regulations.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                <div style={{ border: '1px solid #E2E8F0', padding: '20px', borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '15px', color: '#1E293B', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClockIcon size={16} color="#0F766E" />
                    <span>Clinic Operational Shifts</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    <strong>{content.clinic.schedule.weekdayHours}</strong><br />
                    <strong>{content.clinic.schedule.saturdayHours}</strong><br />
                    <strong>{content.clinic.schedule.sundayHours}</strong>
                  </p>
                  <button
                    onClick={() => setActiveTab('clinic_hours')}
                    className="ux-btn"
                    style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Edit3Icon size={13} color="#334155" />
                    <span>Edit Hours &amp; Timings</span>
                  </button>
                </div>

                <div style={{ border: '1px solid #E2E8F0', padding: '20px', borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '15px', color: '#1E293B', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BanknoteIcon size={16} color="#0F766E" />
                    <span>18% GST Compliance &amp; Billing</span>
                  </h3>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
                    <strong>Plan:</strong> DoctorSite Pro (Annual Retainer)<br />
                    <strong>Base Fee:</strong> ₹24,999 / year<br />
                    <strong>CGST (9%) + SGST (9%):</strong> ₹4,499.82<br />
                    <strong>Total Invoice:</strong> ₹29,498.82 INR<br />
                    <strong>SAC Code:</strong> 998314 (IT &amp; Digital Presence Automation)
                  </div>
                  <button
                    onClick={() => alert('GST Tax Invoice downloaded: INV-2026-998314.pdf')}
                    className="ux-btn"
                    style={{ background: '#0F766E', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <DownloadIcon size={14} color="#FFFFFF" />
                    <span>Download Latest Tax Invoice</span>
                  </button>
                </div>

                <div style={{ border: '1px solid #E2E8F0', padding: '20px', borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '15px', color: '#1E293B', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheckIcon size={16} color="#0F766E" />
                    <span>DPDP Act 2023 Patient Privacy</span>
                  </h3>
                  <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
                    <strong>Consent Status:</strong> Active on appointment form.<br />
                    <strong>Storage:</strong> AES-256-GCM encrypted.<br />
                    <strong>Audit Trail:</strong> All status transitions logged.<br />
                    <strong>Right to Erasure:</strong> Supported per patient phone ID.
                  </div>
                  <button
                    onClick={downloadDPDPExport}
                    className="ux-btn"
                    style={{ background: '#1E3A8A', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <DownloadIcon size={14} color="#FFFFFF" />
                    <span>Export Patient Consent &amp; Appointment Ledger</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Quick Walk-in Modal */}
      {showAddAptModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={20} color="#0F766E" />
                <span>Add Walk-in / Phone Consultation</span>
              </h3>
              <button onClick={() => setShowAddAptModal(false)} className="ux-btn" style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}>
                <XIcon size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Patient Name *</label>
                <input
                  type="text"
                  required
                  value={newAptData.patientName}
                  onChange={(e) => setNewAptData({ ...newAptData, patientName: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={newAptData.phone}
                  onChange={(e) => setNewAptData({ ...newAptData, phone: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Service</label>
                  <select
                    value={newAptData.service}
                    onChange={(e) => setNewAptData({ ...newAptData, service: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    {content.services.map((s) => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Shift</label>
                  <select
                    value={newAptData.shift}
                    onChange={(e) => setNewAptData({ ...newAptData, shift: e.target.value as any })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Date</label>
                <input
                  type="date"
                  value={newAptData.preferredDate}
                  onChange={(e) => setNewAptData({ ...newAptData, preferredDate: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Staff Notes</label>
                <input
                  type="text"
                  value={newAptData.notes}
                  onChange={(e) => setNewAptData({ ...newAptData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddAptModal(false)}
                  className="ux-btn"
                  style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFF', fontSize: '13px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ux-btn"
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#0F766E', color: '#FFF', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Printable Clinic Appointment Slip Modal */}
      {printSlipPatient && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            className="ux-card"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={() => setPrintSlipPatient(null)}
              className="ux-btn"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748B',
              }}
            >
              <XIcon size={20} color="#64748B" />
            </button>

            {/* Printable Area */}
            <div style={{ border: '2px solid #0F766E', borderRadius: '12px', padding: '20px', background: '#F8FAFC' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid #CBD5E1', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                  {content?.clinic.name}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  Plot 14, Health Plaza, Sector 18, Noida &bull; Ph: +91 98710 23456
                </div>
                <div style={{ fontSize: '11px', color: '#0F766E', fontWeight: '600', marginTop: '2px' }}>
                  {content?.doctor.name} &bull; {content?.doctor.degree} &bull; Reg: {content?.doctor.registrationNumber}
                </div>
              </div>

              {/* Big Token Stamp */}
              <div style={{ textAlign: 'center', background: '#CCFBF1', border: '1px solid #5EEAD4', borderRadius: '8px', padding: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#0F766E', textTransform: 'uppercase' }}>
                  OPD Consultation Token
                </div>
                <div style={{ fontSize: '34px', fontWeight: '900', color: '#0F766E', letterSpacing: '1px' }}>
                  #{String(printSlipPatient.tokenNumber || 1).padStart(2, '0')}
                </div>
              </div>

              {/* Patient details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '14px' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Patient Name:</span>
                  <div style={{ fontWeight: '700', color: '#0F172A' }}>{printSlipPatient.patientName}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Phone / WhatsApp:</span>
                  <div style={{ fontWeight: '700', color: '#0F172A' }}>{printSlipPatient.phone}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Date &amp; Shift:</span>
                  <div style={{ fontWeight: '700', color: '#0F172A' }}>{printSlipPatient.preferredDate} ({printSlipPatient.shift || 'Evening'})</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Clinical Procedure:</span>
                  <div style={{ fontWeight: '700', color: '#0F172A' }}>{printSlipPatient.service}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Consultation Fee:</span>
                  <div style={{ fontWeight: '700', color: '#16A34A' }}>₹{content?.doctor.consultationFee || 600} (7-Day Follow-Up Incl.)</div>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Registration ID:</span>
                  <div style={{ fontWeight: '600', color: '#0F172A' }}>{printSlipPatient.id}</div>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
                <strong>Clinic Guidance:</strong> Located in Central Market Sector 18, 200m from Noida Sector 18 Metro (Blue Line, Gate 2). Please arrive 10 minutes prior to token call. Multi-level car parking available next to Health Plaza.
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button
                onClick={() => window.print()}
                className="ux-btn"
                style={{
                  flex: '1',
                  background: '#0F766E',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <PrinterIcon size={16} color="#FFFFFF" />
                <span>Print Slip (PDF)</span>
              </button>

              <button
                onClick={() => {
                  const cleanPhone = printSlipPatient.phone.replace(/\D/g, '');
                  const token = `#${String(printSlipPatient.tokenNumber || 1).padStart(2, '0')}`;
                  const text = `Namaste ${printSlipPatient.patientName}, here is your HealthConsult Clinic appointment slip.\nToken: ${token}\nDoctor: Dr. Maanvita Kumari\nDate: ${printSlipPatient.preferredDate} (${printSlipPatient.shift || 'Evening'})\nFee: ₹${content?.doctor.consultationFee || 600} (7-day follow-up complimentary)\nDirections: https://maps.google.com/?q=HealthConsult+Clinic+Noida`;
                  window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="ux-btn"
                style={{
                  flex: '1',
                  background: '#F0FDF4',
                  color: '#166534',
                  border: '1px solid #BBF7D0',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <MessageCircleIcon size={16} color="#166534" />
                <span>Share on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Weekly Doctor WhatsApp Summary Digest Modal */}
      {showWeeklySummaryModal && (() => {
        const stats = getWeeklySummaryStats();
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
            }}
          >
            <div
              className="ux-card"
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                maxWidth: '560px',
                width: '100%',
                padding: '28px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setShowWeeklySummaryModal(false)}
                className="ux-btn"
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                <XIcon size={20} color="#64748B" />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircleIcon size={22} color="#166534" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
                    Dr. Maanvita Weekly WhatsApp Digest
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    Plain-language weekly practice report delivered to doctor&apos;s phone (+91 98710 23456)
                  </div>
                </div>
              </div>

              {/* Stats Highlights Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F766E' }}>{stats.totalBookings}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Appointments</div>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#16A34A' }}>{stats.completed}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Completed</div>
                </div>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#D97706' }}>{stats.reviewsSent}</div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Reviews Sent</div>
                </div>
              </div>

              {/* Formatted Plain-Text Preview */}
              <div style={{ background: '#F1F5F9', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#1E293B', fontFamily: 'monospace', whiteSpace: 'pre-line', lineHeight: 1.5, marginBottom: '20px', border: '1px solid #CBD5E1' }}>
                {stats.text}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    const docPhone = '9871023456';
                    window.open(`https://wa.me/91${docPhone}?text=${encodeURIComponent(stats.text)}`, '_blank');
                    showToast('Opening WhatsApp with Dr. Maanvita Kumari');
                  }}
                  className="ux-btn"
                  style={{
                    flex: '1',
                    background: '#16A34A',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(22,163,74,0.2)',
                  }}
                >
                  <MessageCircleIcon size={16} color="#FFFFFF" />
                  <span>Send to Doctor&apos;s WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(stats.text);
                    showToast('Digest copied to clipboard!');
                  }}
                  className="ux-btn"
                  style={{
                    background: '#F8FAFC',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    padding: '11px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <CopyIcon size={15} color="#334155" />
                  <span>Copy Text</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Status Notification Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0F172A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
          }}
        >
          <CheckCircleIcon size={18} color="#34D399" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
