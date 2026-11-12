'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useCmsShell } from '@/components/cms/CmsShellContext';
import { DoctorContent, AppointmentRecord } from '@/lib/contentStore';
import { FALLBACK_CONTENT } from '@/lib/useClinicContent';
import PageSlotsManager from '@/app/cms/pages/page';
import BlogManagementPage from '@/app/cms/blog/page';
import VersionHistoryPage from '@/app/cms/versions/page';
import ReviewsFaqsPage from '@/app/cms/reviews-faqs/page';
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
  | 'enquiries'
  | 'editor'
  | 'pages'
  | 'blog'
  | 'services'
  | 'reviews'
  | 'faqs'
  | 'clinic_hours'
  | 'themes'
  | 'media'
  | 'settings'
  | 'versions';

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

function renderEditorIconPreview(iconName: string, color = 'var(--color-brand-primary, #183C4A)') {
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
  const shell = useCmsShell();
  const [localActiveTab, setLocalActiveTab] = useState<Tab>('dashboard');
  const activeTab = (shell?.activeNav as Tab) || localActiveTab;
  const setActiveTab = (tab: Tab) => {
    setLocalActiveTab(tab);
    if (shell?.setActiveNav) shell.setActiveNav(tab);
  };
  const [editorSection, setEditorSection] = useState<EditorSection>('clinic');
  const [deviceViewport, setDeviceViewport] = useState<'360px' | '768px' | '100%'>('100%');
  const [publishStatus, setPublishStatus] = useState<'idle' | 'publishing' | 'published' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastPublishedAt, setLastPublishedAt] = useState<string>('Synced on startup');
  const [previewKey, setPreviewKey] = useState<number>(1);

  // Live Content Store
  const [content, setContent] = useState<DoctorContent>(FALLBACK_CONTENT);
  const [loadingContent, setLoadingContent] = useState(false);

  // Live Appointments Store
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [aptFilter, setAptFilter] = useState<'all' | 'new' | 'contacted' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = shell?.searchQuery ?? localSearchQuery;
  const setSearchQuery = (query: string) => {
    setLocalSearchQuery(query);
    if (shell?.setSearchQuery) shell.setSearchQuery(query);
  };
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Sync breadcrumbs with shell
  const setBreadcrumbs = shell?.setBreadcrumbs;
  useEffect(() => {
    if (!setBreadcrumbs) return;
    const tabLabels: Record<string, string> = {
      dashboard: 'Dashboard',
      opd_board: "Today's OPD Board",
      appointments: 'Appointments',
      enquiries: 'Patient Enquiries',
      editor: 'Site Block Editor',
      pages: 'Page Slots (10-Page Architecture)',
      blog: 'Health & Wellness Blog',
      services: 'Services Catalog',
      reviews: 'Patient Reviews',
      faqs: 'Patient Reviews & FAQs',
      clinic_hours: 'Clinic Hours & Map',
      themes: 'Themes',
      media: 'Media Library',
      settings: 'Settings & Security',
      versions: 'Version History',
    };
    const currentLabel = tabLabels[activeTab] || activeTab;
    const groupLabel =
      activeTab === 'dashboard' || activeTab === 'opd_board' || activeTab === 'appointments' || activeTab === 'enquiries' || activeTab === 'services' || activeTab === 'clinic_hours' || activeTab === 'themes'
        ? 'Clinical Operations'
        : activeTab === 'settings' || activeTab === 'versions'
        ? 'Governance & Audit'
        : '10-Page Site CMS';
    setBreadcrumbs((prev) => {
      if (
        prev.length === 3 &&
        prev[0]?.label === 'CMS' &&
        prev[1]?.label === groupLabel &&
        prev[2]?.label === currentLabel
      ) {
        return prev;
      }
      return [
        { label: 'CMS', href: '/cms' },
        { label: groupLabel },
        { label: currentLabel },
      ];
    });
  }, [activeTab, setBreadcrumbs]);

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
  const replaceFileInputRef = useRef<HTMLInputElement>(null);
  const doctorPhotoInputRef = useRef<HTMLInputElement>(null);
  const clinicPhotoInputRef = useRef<HTMLInputElement>(null);
  const [replacingMediaId, setReplacingMediaId] = useState<string | null>(null);
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

  const handleTriggerReplaceMedia = (mediaId: string) => {
    setReplacingMediaId(mediaId);
    replaceFileInputRef.current?.click();
  };

  const handleReplaceMediaFile = async (file: File) => {
    if (!content || !replacingMediaId) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      let newUrl = '';
      let fileSize = `${Math.round(file.size / 1024)} KB`;
      let fileType = file.type || 'image/jpeg';

      if (res.ok) {
        const data = await res.json();
        newUrl = data.asset.url;
        fileSize = data.asset.fileSize;
        fileType = data.asset.fileType;
      } else {
        newUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      const targetItem = (content.media || []).find((m) => m.id === replacingMediaId);
      const updatedMedia = (content.media || []).map((m) => {
        if (m.id === replacingMediaId) {
          return {
            ...m,
            url: newUrl,
            fileName: file.name,
            fileSize,
            fileType,
            uploadedAt: 'Updated just now',
          };
        }
        return m;
      });

      const updatedDoctor = { ...content.doctor };
      const updatedClinic = { ...content.clinic };

      if (targetItem?.assignedTo === 'hero_doctor_portrait' || content.doctor.photoUrl === targetItem?.url || targetItem?.fileName.includes('portrait')) {
        updatedDoctor.photoUrl = newUrl;
      }
      if (targetItem?.assignedTo === 'clinic_facade' || content.clinic.photoUrl === targetItem?.url || targetItem?.fileName.includes('facade') || targetItem?.fileName.includes('clinic')) {
        updatedClinic.photoUrl = newUrl;
      }
      if (targetItem?.assignedTo === 'nav_logo' || content.clinic.logoUrl === targetItem?.url) {
        updatedClinic.logoUrl = newUrl;
      }

      const updated = {
        ...content,
        doctor: updatedDoctor,
        clinic: updatedClinic,
        media: updatedMedia,
      };

      setContent(updated);
      await handlePublish(updated);
      showToast(`Updated photo for "${targetItem?.title || file.name}". Live site updated!`);
    } catch (err) {
      console.error(err);
      alert('Failed to replace photo');
    } finally {
      setUploadingMedia(false);
      setReplacingMediaId(null);
    }
  };

  const handleUploadDoctorPhotoDirect = async (file: File) => {
    if (!content) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      let newUrl = '';
      let fileSize = `${Math.round(file.size / 1024)} KB`;
      let fileType = file.type || 'image/jpeg';

      if (res.ok) {
        const data = await res.json();
        newUrl = data.asset.url;
        fileSize = data.asset.fileSize;
        fileType = data.asset.fileType;
      } else {
        newUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      const newAsset = {
        id: `med-${Date.now()}`,
        title: `Doctor Portrait (${file.name})`,
        fileName: file.name,
        fileType,
        fileSize,
        url: newUrl,
        assignedTo: 'hero_doctor_portrait' as const,
        uploadedAt: 'Just now',
      };

      const updatedMedia = [
        newAsset,
        ...(content.media || []).map((m) => ({
          ...m,
          assignedTo: m.assignedTo === 'hero_doctor_portrait' ? ('unassigned' as const) : m.assignedTo,
        })),
      ];

      const updated = {
        ...content,
        doctor: { ...content.doctor, photoUrl: newUrl },
        media: updatedMedia,
      };

      setContent(updated);
      await handlePublish(updated);
      showToast('Doctor portrait uploaded and live on site!');
    } catch (err) {
      console.error(err);
      alert('Error uploading doctor portrait');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleUploadClinicPhotoDirect = async (file: File) => {
    if (!content) return;
    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      let newUrl = '';
      let fileSize = `${Math.round(file.size / 1024)} KB`;
      let fileType = file.type || 'image/jpeg';

      if (res.ok) {
        const data = await res.json();
        newUrl = data.asset.url;
        fileSize = data.asset.fileSize;
        fileType = data.asset.fileType;
      } else {
        newUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      const newAsset = {
        id: `med-${Date.now()}`,
        title: `Clinic Facade (${file.name})`,
        fileName: file.name,
        fileType,
        fileSize,
        url: newUrl,
        assignedTo: 'clinic_facade' as const,
        uploadedAt: 'Just now',
      };

      const updatedMedia = [
        newAsset,
        ...(content.media || []).map((m) => ({
          ...m,
          assignedTo: m.assignedTo === 'clinic_facade' ? ('unassigned' as const) : m.assignedTo,
        })),
      ];

      const updated = {
        ...content,
        clinic: { ...content.clinic, photoUrl: newUrl },
        media: updatedMedia,
      };

      setContent(updated);
      await handlePublish(updated);
      showToast('Clinic photo uploaded and live on site!');
    } catch (err) {
      console.error(err);
      alert('Error uploading clinic photo');
    } finally {
      setUploadingMedia(false);
    }
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

  return (
    <div style={{ padding: '24px 28px', minWidth: 0 }}>
      {/* Top Page Action & Publish Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '22px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--color-border-subtle, rgba(24, 60, 74, 0.10))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-main, #162228)' }}>
            {activeTab === 'dashboard' && (
              <>
                Clinical Practice{' '}
                <span className="ms-serif-italic" style={{ fontSize: '25px', fontWeight: 400 }}>
                  Overview
                </span>
              </>
            )}
            {activeTab === 'opd_board' && "Today's Patient Queue (OPD)"}
            {activeTab === 'appointments' && 'Appointment Records'}
            {activeTab === 'editor' && 'Site Block Editor'}
            {activeTab === 'pages' && 'Page Slots (10-Page Architecture)'}
            {activeTab === 'blog' && 'Health & Wellness Blog Management'}
            {activeTab === 'services' && 'Clinical Services Catalog'}
            {activeTab === 'reviews' && 'Patient Reviews & Testimonials'}
            {activeTab === 'faqs' && 'Patient Reviews & Clinical FAQs'}
            {activeTab === 'clinic_hours' && 'Clinic Operating Hours & Map'}
            {activeTab === 'themes' && 'Clinical Theme Customizer'}
            {activeTab === 'media' && 'Media & Asset Library'}
            {activeTab === 'settings' && 'Clinic Settings & DPDP Compliance'}
            {activeTab === 'versions' && 'Version History & Edge Rollbacks'}
          </h1>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted, #54666E)',
              fontWeight: 500,
              background: 'var(--color-brand-surface, #E7F2F5)',
              padding: '4px 10px',
              borderRadius: '9999px',
            }}
          >
            Last synced: {lastPublishedAt}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => handlePublish()}
            disabled={publishStatus === 'publishing'}
            className="ms-pill-dark cms-focus-ring"
            title="Save changes and immediately update the live patient page"
            style={{
              background:
                publishStatus === 'published'
                  ? '#059669'
                  : hasUnsavedChanges
                  ? '#D97706'
                  : '#183C4A',
              borderColor:
                publishStatus === 'published'
                  ? '#059669'
                  : hasUnsavedChanges
                  ? '#D97706'
                  : '#183C4A',
              cursor: publishStatus === 'publishing' ? 'not-allowed' : 'pointer',
            }}
          >
            <span className="ms-pill-circle">
              {publishStatus === 'publishing' && <RefreshCwIcon size={14} color="#183C4A" className="spin" />}
              {publishStatus === 'published' && <CheckCircleIcon size={14} color="#059669" />}
              {publishStatus === 'idle' && <SendIcon size={13} color="#183C4A" />}
              {publishStatus === 'error' && <XCircleIcon size={14} color="#DC2626" />}
            </span>
            <span>
              {publishStatus === 'publishing' && 'Publishing Pipeline...'}
              {publishStatus === 'published' && 'Live on Patient Page!'}
              {publishStatus === 'idle' && (hasUnsavedChanges ? 'Publish Draft Changes' : 'Publish to Live Site')}
              {publishStatus === 'error' && 'Retry Publishing'}
            </span>
          </button>
        </div>
      </div>

        {/* Unsaved Changes Banner */}
        {hasUnsavedChanges && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '14px', padding: '10px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#92400E' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangleIcon size={16} color="#D97706" />
              <span><strong>You have unsaved changes!</strong> Content updates will not appear on the patient site until published.</span>
            </div>
            <button
              onClick={() => handlePublish()}
              className="ms-pill-dark"
              style={{
                background: '#D97706',
                borderColor: '#D97706',
                padding: '4px 14px 4px 4px',
                fontSize: '12px',
              }}
            >
              <span className="ms-pill-circle" style={{ width: '24px', height: '24px' }}>
                <SendIcon size={12} color="#D97706" />
              </span>
              <span>Publish Now</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. CONTENT WORKSPACE (SWITCHABLE PER ACTIVE TAB)          */}
        {/* ========================================================= */}
        <div style={{ maxWidth: '1440px', width: '100%', boxSizing: 'border-box' }}>
          
          {/* ======================================================= */}
          {/* TAB 1: MEDSPHERE REFERENCE CONTROL PLANE OVERVIEW       */}
          {/* ======================================================= */}
          {activeTab === 'dashboard' && (
            <div>
              {/* 1. Reference Hero Banner with Mixed Sans/Serif Display, Dual Pills, Hairline Columns & Floating Badges */}
              <div className="ms-hero-card" style={{ marginBottom: '28px' }}>
                <div className="ms-hero-grid">
                  {/* Left: Editorial Copy & Pill Actions */}
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--color-text-muted, #54666E)',
                        marginBottom: '14px',
                      }}
                    >
                      <span
                        className="pulse-beacon"
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#059669',
                          display: 'inline-block',
                        }}
                      />
                      <span>Control Plane Live &bull; {content.clinic.area}, {content.clinic.city} OPD</span>
                    </div>

                    <h2
                      style={{
                        margin: '0 0 12px 0',
                        fontSize: 'clamp(28px, 3vw, 40px)',
                        fontWeight: 700,
                        lineHeight: 1.08,
                        letterSpacing: '-0.03em',
                        color: 'var(--color-text-main, #162228)',
                      }}
                    >
                      Good morning, <br />
                      <span className="ms-serif-italic" style={{ fontSize: 'clamp(34px, 3.6vw, 48px)', fontWeight: 400 }}>
                        {content.doctor.name}
                      </span>
                    </h2>

                    <p
                      style={{
                        margin: '0 0 22px 0',
                        fontSize: '14.5px',
                        lineHeight: 1.55,
                        color: 'var(--color-text-muted, #54666E)',
                        maxWidth: '500px',
                      }}
                    >
                      Connect patient appointment requests, 7-page clinical blocks, and real-time OPD queues at <strong>{content.clinic.name}</strong> from one workspace.
                    </p>

                    {/* Signature Reference Action Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setActiveTab('editor')}
                        className="ms-pill-dark cms-focus-ring"
                      >
                        <span className="ms-pill-circle">
                          <Edit3Icon size={13} color="#183C4A" />
                        </span>
                        <span>Open Block Editor</span>
                      </button>

                      <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="ms-pill-light cms-focus-ring"
                      >
                        <ExternalLinkIcon size={14} color="var(--color-brand-primary, #183C4A)" />
                        <span>View Live Patient Site</span>
                      </a>
                    </div>

                    {/* Reference Hairline Divider + Unboxed 2-Column Highlights */}
                    <div
                      style={{
                        marginTop: '28px',
                        paddingTop: '18px',
                        borderTop: '1px solid var(--color-border-subtle, rgba(24, 60, 74, 0.12))',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                        gap: '20px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text-main, #162228)', marginBottom: '4px' }}>
                          Active OPD Queue
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: 'var(--color-text-muted, #54666E)' }}>
                          Serving from 09:30 AM IST. Fee ₹{content.doctor.consultationFee} includes 7-day follow-up review.
                        </p>
                      </div>

                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text-main, #162228)', marginBottom: '4px' }}>
                          Clinical Site Assistant
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: 'var(--color-text-muted, #54666E)' }}>
                          All web requests on <code>localhost:3000</code> sync instantly with audit-logged statuses.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Doctor Portrait & 3 Reference Floating Frosted Badges */}
                  <div
                    style={{
                      position: 'relative',
                      minHeight: '300px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '380px',
                        height: '300px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        position: 'relative',
                        background: '#D5E7EB',
                        boxShadow: '0 20px 44px -16px rgba(24, 60, 74, 0.22)',
                      }}
                    >
                      <img
                        src={content.doctor.photoUrl && !content.doctor.photoUrl.endsWith('.svg') ? content.doctor.photoUrl : '/images/hero-doctor.jpg'}
                        alt={content.doctor.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center top',
                          display: 'block',
                        }}
                      />
                    </div>

                    {/* Floating Badge 1: Avatar Stack + Inquiry Count */}
                    <div
                      className="ms-floating-badge"
                      onClick={() => setActiveTab('appointments')}
                      style={{
                        position: 'absolute',
                        left: '0px',
                        bottom: '54px',
                        maxWidth: '215px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                        <img
                          src="/images/avatar-1.jpg"
                          alt="Patient A"
                          style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FFFFFF' }}
                        />
                        <img
                          src="/images/avatar-2.jpg"
                          alt="Patient B"
                          style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FFFFFF', marginLeft: '-8px' }}
                        />
                        <img
                          src="/images/avatar-3.jpg"
                          alt="Patient C"
                          style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FFFFFF', marginLeft: '-8px' }}
                        />
                        <span
                          style={{
                            marginLeft: '-6px',
                            background: '#183C4A',
                            color: '#FFFFFF',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '9999px',
                            border: '2px solid #FFFFFF',
                          }}
                        >
                          {appointments.length}+
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', lineHeight: 1.35, color: 'var(--color-text-main, #162228)', fontWeight: 500 }}>
                        Patient inquiries synced live to your front-desk inbox.
                      </div>
                    </div>

                    {/* Floating Badge 2: Top Right Shield Security Pill */}
                    <div
                      className="ms-floating-badge"
                      onClick={() => setActiveTab('settings')}
                      style={{
                        position: 'absolute',
                        right: '0px',
                        top: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      <span
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: '#183C4A',
                          color: '#FFFFFF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ShieldCheckIcon size={13} color="#FFFFFF" />
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-main, #162228)', lineHeight: 1.25, maxWidth: '140px' }}>
                        DPDP encrypted records &amp; audit trail
                      </span>
                    </div>

                    {/* Floating Badge 3: Bottom Right Mini Team Card */}
                    <div
                      className="ms-floating-badge"
                      onClick={() => setActiveTab('pages')}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        bottom: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      <img
                        src="/images/care-team-doctor.jpg"
                        alt="CMS Assistant"
                        style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-main, #162228)' }}>
                          10-Page CMS Active
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted, #54666E)' }}>
                          {content.services.length} procedures live
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Reference "(Practice overview)" Editorial Statement + Asymmetric Bento Metrics */}
              <div className="ms-about-bento-grid">
                {/* Left Editorial Statement */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '6px 4px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'var(--color-text-muted, #54666E)',
                        marginBottom: '12px',
                      }}
                    >
                      (Practice overview)
                    </div>
                    <h3
                      style={{
                        margin: '0 0 18px 0',
                        fontSize: 'clamp(20px, 2vw, 25px)',
                        fontWeight: 600,
                        lineHeight: 1.32,
                        letterSpacing: '-0.02em',
                        color: 'var(--color-text-main, #162228)',
                      }}
                    >
                      Dedicated clinical operations, patient enquiries, and 7-page publishing workflows — built to keep care{' '}
                      <span className="ms-serif-italic" style={{ fontSize: '1.14em', fontWeight: 400 }}>
                        fast and effortless.
                      </span>
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddAptModal(true)}
                      className="ms-pill-dark cms-focus-ring"
                    >
                      <span className="ms-pill-circle">
                        <PlusIcon size={14} color="#183C4A" />
                      </span>
                      <span>Add Walk-in Consultation</span>
                    </button>

                    <button
                      type="button"
                      onClick={downloadDPDPExport}
                      className="ms-pill-light cms-focus-ring"
                    >
                      <DownloadIcon size={14} color="var(--color-brand-primary, #183C4A)" />
                      <span>Export DPDP Audit</span>
                    </button>
                  </div>
                </div>

                {/* Right Asymmetric Bento Metrics (Reference 5k+ Light Tile, 100% Dark Petrol Tile & Consultation Photo Tile) */}
                <div className="ms-bento-metrics">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Light Mist Tile */}
                    <div
                      onClick={() => setActiveTab('appointments')}
                      className="ms-bento-tile-light"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--color-text-main, #162228)' }}>
                          {appointments.length}+
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#DCFCE7', padding: '3px 8px', borderRadius: '9999px' }}>
                          +12% growth
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main, #162228)', marginTop: '10px' }}>
                        Total Patient Inquiries
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted, #54666E)', marginTop: '2px' }}>
                        {newAppointmentsCount > 0 ? `${newAppointmentsCount} pending WhatsApp outreach` : 'All bookings confirmed'}
                      </div>
                    </div>

                    {/* Dark Petrol Slate Tile */}
                    <div
                      onClick={() => setActiveTab('themes')}
                      className="ms-bento-tile-dark"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: '#FFFFFF' }}>
                          0.9s
                        </div>
                        <ZapIcon size={18} color="#94D2C7" />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF', marginTop: '10px' }}>
                        Mobile LCP &amp; WCAG 2.2 AA
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#BFE3DC', marginTop: '2px', textTransform: 'capitalize' }}>
                        Active theme: {content.theme} &bull; 6 presets
                      </div>
                    </div>
                  </div>

                  {/* Right Photo Bento Card */}
                  <div
                    onClick={() => setActiveTab('services')}
                    style={{
                      position: 'relative',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      minHeight: '220px',
                      cursor: 'pointer',
                      border: '1px solid var(--color-border-subtle, rgba(24, 60, 74, 0.10))',
                      boxShadow: '0 10px 28px -12px rgba(24, 60, 74, 0.22)',
                    }}
                  >
                    <img
                      src="/images/about-consultation.jpg"
                      alt="Patient Consultation at MedSphere Clinic"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(24, 60, 74, 0.04) 40%, rgba(16, 43, 54, 0.78) 100%)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: '18px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.94)',
                            color: '#183C4A',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '5px 11px',
                            borderRadius: '9999px',
                          }}
                        >
                          {content.services.length} Live Procedures
                        </span>
                        <span
                          style={{
                            background: newAppointmentsCount > 0 ? '#FEF3C7' : '#D1FAE5',
                            color: newAppointmentsCount > 0 ? '#92400E' : '#065F46',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            padding: '5px 11px',
                            borderRadius: '9999px',
                          }}
                        >
                          {newAppointmentsCount} Pending Action
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Main Dashboard Two-Column Operational Grid */}
              <div className="ms-dashboard-lower-grid">
                
                {/* Left Column: Today's Appointments & Quick Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Today's Schedule Timeline */}
                  <div className="ms-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: 'var(--color-text-main, #162228)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CalendarIcon size={18} color="var(--color-brand-primary, #183C4A)" />
                          <span>Today&apos;s Appointments &bull; Patient Queue</span>
                        </h3>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted, #54666E)' }}>
                          Live bookings from web patient form. Confirm slots directly with patients via WhatsApp.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="ms-pill-light"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        <span>View All ({appointments.length})</span>
                        <ArrowRightIcon size={13} color="var(--color-brand-primary, #183C4A)" />
                      </button>
                    </div>

                    {searchQuery.trim() && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: 'var(--color-brand-surface, #E7F2F5)', border: '1px solid var(--color-border-subtle, rgba(24, 60, 74, 0.12))', borderRadius: '12px', fontSize: '12px', color: 'var(--color-brand-primary, #183C4A)', marginBottom: '12px' }}>
                        <span>Search filter active: <strong>&quot;{searchQuery}&quot;</strong></span>
                        <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--color-brand-primary, #183C4A)', cursor: 'pointer', fontWeight: 'bold' }}>Clear</button>
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
                            padding: '13px 16px',
                            background: 'var(--color-bg-surface, #F5F8F9)',
                            borderRadius: '14px',
                            border: '1px solid var(--color-border-subtle, rgba(24, 60, 74, 0.08))',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-text-main, #162228)' }}>
                              {apt.patientName}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #54666E)', marginTop: '2px' }}>
                              {apt.service} &bull; {apt.preferredDate} ({apt.shift})
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a
                              href={`https://wa.me/${apt.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(apt.patientName)},%20this%20is%20Sunita%20from%20${encodeURIComponent(content.clinic.name)}%20regarding%20your%20consultation%20request%20with%20${encodeURIComponent(content.doctor.name)}.`}
                              target="_blank"
                              rel="noreferrer"
                              className="ms-pill-light"
                              title="Chat with patient on WhatsApp"
                              style={{
                                padding: '5px 11px',
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#183C4A',
                              }}
                            >
                              <MessageCircleIcon size={13} color="#183C4A" />
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
                                    ? '#E7F2F5'
                                    : apt.status === 'confirmed'
                                    ? '#D1FAE5'
                                    : '#F1F5F9',
                                color:
                                  apt.status === 'new'
                                    ? '#92400E'
                                    : apt.status === 'contacted'
                                    ? '#183C4A'
                                    : apt.status === 'confirmed'
                                    ? '#065F46'
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

                  {/* Quick Action Control Shortcuts — Cohesive MedSphere Palette */}
                  <div className="ms-card">
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: 'var(--color-text-main, #162228)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ZapIcon size={18} color="var(--color-brand-primary, #183C4A)" />
                      <span>Control Plane Quick Actions</span>
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '12px' }}>
                      {[
                        { tab: 'editor' as Tab, icon: <Edit3Icon size={18} color="#183C4A" />, title: 'Site Block Editor', desc: 'Edit text & announcements' },
                        { tab: 'clinic_hours' as Tab, icon: <BuildingIcon size={18} color="#183C4A" />, title: 'Clinic Hours & Map', desc: 'OPD shifts & transit guide' },
                        { tab: 'services' as Tab, icon: <MicroscopeIcon size={18} color="#183C4A" />, title: `Manage ${content.services.length} Services`, desc: 'Clinical treatments' },
                        { tab: 'reviews' as Tab, icon: <MessageCircleIcon size={18} color="#183C4A" />, title: 'Patient Reviews', desc: 'Testimonial moderation' },
                        { tab: 'themes' as Tab, icon: <PaletteIcon size={18} color="#183C4A" />, title: '6 Themes Preset', desc: 'Instant palette switch' },
                        { tab: 'pages' as Tab, icon: <GlobeIcon size={18} color="#183C4A" />, title: 'Page Slots Manager', desc: '10-Page Architecture' },
                        { tab: 'blog' as Tab, icon: <FileTextIcon size={18} color="#183C4A" />, title: 'Health Blog Posts', desc: 'Patient education guides' },
                        { tab: 'versions' as Tab, icon: <RefreshCwIcon size={18} color="#183C4A" />, title: 'Version History', desc: 'Audit snapshots & rollback' },
                      ].map((action) => (
                        <button
                          key={action.tab}
                          onClick={() => setActiveTab(action.tab)}
                          className="ms-bento-tile-light"
                          style={{ padding: '15px', textAlign: 'left', borderRadius: '16px' }}
                        >
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid rgba(24, 60, 74, 0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                            {action.icon}
                          </div>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--color-text-main, #162228)' }}>{action.title}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted, #54666E)', marginTop: '2px' }}>{action.desc}</div>
                        </button>
                      ))}

                      <button
                        onClick={downloadDPDPExport}
                        className="ms-bento-tile-light"
                        style={{ padding: '15px', textAlign: 'left', borderRadius: '16px' }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FFFFFF', border: '1px solid rgba(24, 60, 74, 0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                          <ShieldCheckIcon size={18} color="#183C4A" />
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--color-text-main, #162228)' }}>DPDP Data Export</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted, #54666E)', marginTop: '2px' }}>Compliance consent audit</div>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Column: Mini Calendar & Today's Shifts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Interactive Mini Calendar Widget */}
                  <div className="ms-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--color-text-main, #162228)' }}>November 2026</strong>
                      <span style={{ fontSize: '11px', color: '#183C4A', fontWeight: '700', background: '#E7F2F5', padding: '3px 9px', borderRadius: '9999px' }}>OPD Calendar</span>
                    </div>

                    {/* Weekday Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted, #54666E)', marginBottom: '10px' }}>
                      <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
                    </div>

                    {/* Month Days */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontSize: '12px' }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((d) => {
                        const isToday = d === 12;
                        return (
                          <div
                            key={d}
                            style={{
                              padding: '8px 0',
                              borderRadius: '9999px',
                              background: isToday ? '#183C4A' : 'transparent',
                              color: isToday ? '#FFFFFF' : 'var(--color-text-main, #162228)',
                              fontWeight: isToday ? '700' : '500',
                            }}
                          >
                            {d}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Today's Shift Card */}
                  <div className="ms-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--color-text-main, #162228)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ClockIcon size={16} color="var(--color-brand-primary, #183C4A)" />
                        <span>Today&apos;s OPD Shifts</span>
                      </h4>
                      <button
                        onClick={() => setActiveTab('clinic_hours')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-brand-primary, #183C4A)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Edit Hours &rarr;
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#E7F2F5', borderRadius: '12px' }}>
                        <span style={{ color: '#183C4A', fontWeight: '600' }}>Morning OPD</span>
                        <strong style={{ color: '#162228' }}>{(content.clinic.schedule.weekdayHours.split('–')[0] ?? '').replace('Monday', '').trim()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--color-bg-surface, #F5F8F9)', borderRadius: '12px' }}>
                        <span style={{ color: 'var(--color-text-muted, #54666E)' }}>Saturday Shift</span>
                        <strong style={{ color: 'var(--color-text-main, #162228)' }}>{content.clinic.schedule.saturdayHours}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#FEF2F2', borderRadius: '12px' }}>
                        <span style={{ color: '#991B1B' }}>Sunday</span>
                        <strong style={{ color: '#991B1B' }}>Emergency On-Call</strong>
                      </div>
                    </div>
                  </div>

                  {/* Add Walk-in Patient Action */}
                  <button
                    onClick={() => setShowAddAptModal(true)}
                    className="ms-pill-dark cms-focus-ring"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      padding: '8px 20px 8px 8px',
                    }}
                  >
                    <span className="ms-pill-circle">
                      <PlusIcon size={15} color="#183C4A" />
                    </span>
                    <span>Add Walk-in / Phone Consultation</span>
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
                className="ms-hero-card"
                style={{
                  padding: '28px 30px',
                  marginBottom: '22px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.88)', color: 'var(--color-brand-primary, #183C4A)', border: '1px solid var(--color-border-subtle)', padding: '5px 12px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '10px' }}>
                      <span className="pulse-beacon" style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                      <span>Live Clinic Operations &bull; Receptionist Desk</span>
                    </div>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: 600, color: 'var(--color-text-main, #162228)', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <ActivityIcon size={22} color="var(--color-brand-primary, #183C4A)" />
                      <span>Today&apos;s OPD Board</span>
                      <span className="ms-serif-italic" style={{ fontSize: '30px', fontWeight: 400 }}>&amp; live queue</span>
                    </h2>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text-muted, #54666E)' }}>
                      Control live patient token sequence, 1-tap WhatsApp notifications, broadcast doctor delays, and dispatch Google review requests.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowWeeklySummaryModal(true)}
                      className="ms-pill-dark"
                    >
                      <span className="ms-pill-circle">
                        <Share2Icon size={13} color="#183C4A" />
                      </span>
                      <span>Dr. Maanvita Weekly Digest</span>
                    </button>

                    <button
                      onClick={() => {
                        fetchAppointments();
                        fetchContent();
                        showToast('OPD Board refreshed');
                      }}
                      className="ms-pill-light"
                    >
                      <RefreshCwIcon size={14} color="currentColor" />
                      <span>Refresh Board</span>
                    </button>
                  </div>
                </div>

                {/* 3 Real-time Control Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', paddingTop: '18px', borderTop: '1px solid var(--color-border-subtle)' }}>
                  
                  {/* Control 1: Currently Serving Token */}
                  <div className="ms-bento-tile-dark" style={{ padding: '18px 20px', cursor: 'default' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                      Currently Serving In Cabin
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                        <span style={{ fontSize: '32px', fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                          #{String(content?.availability?.currentServingToken || 1).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.72)' }}>Live on patient site</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleStepServingToken(-1)}
                          className="ms-pill-light"
                          style={{ padding: '7px 12px', fontSize: '12px' }}
                          title="Previous Token"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => handleStepServingToken(1)}
                          className="ms-pill-light"
                          style={{ padding: '7px 14px', fontSize: '12px', background: '#FFFFFF', color: '#183C4A' }}
                          title="Advance to Next Token"
                        >
                          Next Token &rarr;
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Control 2: Running Late Broadcast */}
                  <div className="ms-bento-tile-light" style={{ background: (content?.availability?.runningLateMinutes || 0) > 0 ? '#FFFBEB' : 'rgba(255,255,255,0.88)', borderColor: (content?.availability?.runningLateMinutes || 0) > 0 ? '#FCD34D' : 'var(--color-border-subtle)', padding: '18px 20px', cursor: 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: (content?.availability?.runningLateMinutes || 0) > 0 ? '#B45309' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Doctor Delay Broadcast
                      </div>
                      {(content?.availability?.runningLateMinutes || 0) > 0 && (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: '9999px' }}>
                          ~{content?.availability?.runningLateMinutes}m Late Live
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleBroadcastLate(0)}
                        className="ux-btn"
                        style={{
                          padding: '6px 12px',
                          borderRadius: '9999px',
                          border: (content?.availability?.runningLateMinutes || 0) === 0 ? '1px solid #183C4A' : '1px solid var(--color-border-subtle)',
                          background: (content?.availability?.runningLateMinutes || 0) === 0 ? '#183C4A' : '#FFFFFF',
                          color: (content?.availability?.runningLateMinutes || 0) === 0 ? '#FFFFFF' : 'var(--color-text-muted)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        On Time (Clear)
                      </button>
                      {[15, 20, 30].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleBroadcastLate(mins)}
                          className="ux-btn"
                          style={{
                            padding: '6px 12px',
                            borderRadius: '9999px',
                            border: content?.availability?.runningLateMinutes === mins ? '1px solid #D97706' : '1px solid var(--color-border-subtle)',
                            background: content?.availability?.runningLateMinutes === mins ? '#FEF3C7' : '#FFFFFF',
                            color: content?.availability?.runningLateMinutes === mins ? '#92400E' : 'var(--color-text-muted)',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          +{mins} min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Control 3: Live Next Available Slot Chip */}
                  <div className="ms-bento-tile-light" style={{ background: 'rgba(255,255,255,0.88)', padding: '18px 20px', cursor: 'default' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
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
                              padding: '6px 12px',
                              borderRadius: '9999px',
                              border: isSelected ? '1px solid #183C4A' : '1px solid var(--color-border-subtle)',
                              background: isSelected ? '#183C4A' : '#FFFFFF',
                              color: isSelected ? '#FFFFFF' : 'var(--color-text-muted)',
                              fontSize: '11.5px',
                              fontWeight: isSelected ? 600 : 500,
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
                className="ms-card"
                style={{
                  padding: '20px 24px',
                  marginBottom: '22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusIcon size={16} color="var(--color-brand-primary, #183C4A)" />
                    <span>10-Second Walk-In Add (Front Desk Sunita)</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
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
                    style={{ flex: '1 1 200px', minWidth: '180px', padding: '10px 14px', borderRadius: '9999px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', fontSize: '13px' }}
                  />

                  <input
                    type="tel"
                    required
                    placeholder="Phone (e.g. 98100 12345)"
                    value={quickWalkIn.phone}
                    onChange={(e) => setQuickWalkIn({ ...quickWalkIn, phone: e.target.value })}
                    style={{ flex: '1 1 160px', minWidth: '140px', padding: '10px 14px', borderRadius: '9999px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', fontSize: '13px' }}
                  />

                  <select
                    value={quickWalkIn.service}
                    onChange={(e) => setQuickWalkIn({ ...quickWalkIn, service: e.target.value })}
                    style={{ flex: '1 1 200px', minWidth: '180px', padding: '10px 14px', borderRadius: '9999px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', fontSize: '13px' }}
                  >
                    {content?.services.map((s) => (
                      <option key={s.id} value={s.title}>{s.title}</option>
                    ))}
                  </select>

                  <select
                    value={quickWalkIn.shift}
                    onChange={(e) => setQuickWalkIn({ ...quickWalkIn, shift: e.target.value as 'Morning' | 'Evening' })}
                    style={{ flex: '0 0 140px', padding: '10px 14px', borderRadius: '9999px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', fontSize: '13px' }}
                  >
                    <option value="Morning">Morning OPD</option>
                    <option value="Evening">Evening OPD</option>
                  </select>

                  <button
                    type="submit"
                    className="ms-pill-dark"
                  >
                    <span className="ms-pill-circle">
                      <PlusIcon size={14} color="#183C4A" />
                    </span>
                    <span>Add Walk-In Patient</span>
                  </button>
                </form>
              </div>

              {/* 3-Column Kanban Board */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', alignItems: 'flex-start' }}>
                
                {/* COLUMN 1: WAITING */}
                <div className="ms-bento-tile-light" style={{ padding: '18px', cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '2px solid var(--color-brand-primary, #183C4A)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>WAITING</span>
                        <span style={{ background: 'var(--color-brand-surface, #E7F2F5)', color: 'var(--color-brand-primary, #183C4A)', fontSize: '11px', fontWeight: 800, padding: '2px 9px', borderRadius: '9999px' }}>
                          {appointments.filter((a) => (a.opdStage || 'waiting') === 'waiting' && a.status !== 'cancelled').length}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Patients in clinic waiting lounge</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '320px' }}>
                    {appointments
                      .filter((a) => (a.opdStage || 'waiting') === 'waiting' && a.status !== 'cancelled')
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className="ms-card"
                          style={{
                            borderRadius: '16px',
                            padding: '16px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{ background: 'var(--color-brand-surface, #E7F2F5)', color: 'var(--color-brand-primary, #183C4A)', border: '1px solid var(--color-border-subtle)', fontWeight: 700, fontSize: '12px', padding: '3px 10px', borderRadius: '9999px' }}>
                              Token #{String(apt.tokenNumber || 1).padStart(2, '0')}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                              {apt.shift || 'Evening'}
                            </span>
                          </div>

                          <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--color-text-main)', marginBottom: '2px' }}>
                            {apt.patientName}
                          </div>
                          <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                            {apt.service}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <PhoneIcon size={12} color="var(--color-text-muted)" />
                            <span>{apt.phone}</span>
                            <span>&bull; {apt.preferredDate}</span>
                          </div>

                          {/* Quick 1-Tap Actions */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)' }}>
                            <button
                              onClick={() => handleUpdateOpdStage(apt.id, 'in_consultation')}
                              className="ms-pill-dark"
                              style={{
                                flex: '1 1 100%',
                                justifyContent: 'center',
                                padding: '8px 14px',
                                fontSize: '12px',
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
                                background: 'var(--color-brand-surface, #E7F2F5)',
                                color: 'var(--color-brand-primary, #183C4A)',
                                border: '1px solid var(--color-border-subtle)',
                                padding: '6px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <MessageCircleIcon size={12} color="var(--color-brand-primary, #183C4A)" />
                              <span>{apt.whatsappConfirmationSent ? 'Sent' : 'WA Confirm'}</span>
                            </button>

                            <button
                              onClick={() => handleSendWhatsAppReminder(apt)}
                              className="ux-btn"
                              title="Send 2-hour reminder with quick reply"
                              style={{
                                flex: '1',
                                background: 'var(--color-brand-surface, #E7F2F5)',
                                color: 'var(--color-brand-primary, #183C4A)',
                                border: '1px solid var(--color-border-subtle)',
                                padding: '6px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <ClockIcon size={12} color="var(--color-brand-primary, #183C4A)" />
                              <span>2h Remind</span>
                            </button>

                            <a
                              href={`tel:${apt.phone}`}
                              className="ux-btn"
                              style={{
                                flex: '1',
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)',
                                border: '1px solid var(--color-border-subtle)',
                                padding: '6px 8px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                              }}
                            >
                              <PhoneIcon size={12} color="currentColor" />
                              <span>Call</span>
                            </a>

                            <button
                              onClick={() => setPrintSlipPatient(apt)}
                              className="ux-btn"
                              title="Print Clinic Appointment Slip"
                              style={{
                                background: 'var(--color-bg-surface)',
                                color: 'var(--color-text-main)',
                                border: '1px solid var(--color-border-subtle)',
                                padding: '6px 10px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <PrinterIcon size={12} color="currentColor" />
                              <span>Slip</span>
                            </button>
                          </div>
                        </div>
                      ))}

                    {appointments.filter((a) => (a.opdStage || 'waiting') === 'waiting' && a.status !== 'cancelled').length === 0 && (
                      <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        Waiting lounge is clear. Add walk-in above or wait for arrivals.
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMN 2: IN CONSULTATION */}
                <div style={{ background: 'var(--color-brand-surface, #E7F2F5)', borderRadius: '20px', border: '1px solid var(--color-border-strong)', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '2px solid var(--color-brand-primary, #183C4A)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-primary, #183C4A)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="pulse-beacon" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        <span>IN CONSULTATION</span>
                        <span style={{ background: '#183C4A', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, padding: '2px 9px', borderRadius: '9999px' }}>
                          {appointments.filter((a) => a.opdStage === 'in_consultation').length}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Active inside doctor cabin</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '320px' }}>
                    {appointments
                      .filter((a) => a.opdStage === 'in_consultation')
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className="ms-card"
                          style={{
                            borderRadius: '16px',
                            border: '2px solid var(--color-brand-primary, #183C4A)',
                            padding: '16px',
                            boxShadow: '0 10px 24px -8px rgba(24, 60, 74, 0.16)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ background: '#183C4A', color: '#FFFFFF', fontWeight: 700, fontSize: '12px', padding: '3px 10px', borderRadius: '9999px' }}>
                              Token #{String(apt.tokenNumber || 1).padStart(2, '0')} &bull; In Cabin
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--color-brand-primary, #183C4A)', fontWeight: 700 }}>Active Now</span>
                          </div>

                          <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text-main)', marginBottom: '4px' }}>
                            {apt.patientName}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--color-brand-primary, #183C4A)', fontWeight: 600, marginBottom: '8px' }}>
                            {apt.service}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '14px' }}>
                            Phone: {apt.phone} &bull; Ref: {apt.id}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleUpdateOpdStage(apt.id, 'done')}
                              className="ms-pill-dark"
                              style={{
                                flex: '1 1 100%',
                                justifyContent: 'center',
                                padding: '9px 14px',
                                fontSize: '13px',
                              }}
                            >
                              <CheckCircleIcon size={16} color="#FFFFFF" />
                              <span>Mark Consultation Complete &rarr;</span>
                            </button>

                            <button
                              onClick={() => setPrintSlipPatient(apt)}
                              className="ms-pill-light"
                              style={{
                                flex: '1',
                                justifyContent: 'center',
                                padding: '7px 10px',
                                fontSize: '12px',
                              }}
                            >
                              <PrinterIcon size={13} color="currentColor" />
                              <span>Print Slip</span>
                            </button>
                          </div>
                        </div>
                      ))}

                    {appointments.filter((a) => a.opdStage === 'in_consultation').length === 0 && (
                      <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--color-brand-primary, #183C4A)', fontSize: '13px', background: 'var(--color-bg-base)', borderRadius: '14px', border: '1px dashed var(--color-border-strong)' }}>
                        No patient currently in cabin. Click &quot;Call Inside Cabin&quot; from the Waiting queue.
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMN 3: DONE / COMPLETED */}
                <div className="ms-bento-tile-light" style={{ padding: '18px', cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '2px solid var(--color-border-strong)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>DONE / COMPLETED</span>
                        <span style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: 800, padding: '2px 9px', borderRadius: '9999px', border: '1px solid var(--color-border-subtle)' }}>
                          {appointments.filter((a) => a.opdStage === 'done' || a.status === 'completed').length}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Post-visit Google review &amp; pharmacy</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '320px' }}>
                    {appointments
                      .filter((a) => a.opdStage === 'done' || a.status === 'completed')
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className="ms-card"
                          style={{
                            borderRadius: '16px',
                            padding: '16px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <span style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '12px', padding: '2px 9px', borderRadius: '9999px', border: '1px solid var(--color-border-subtle)' }}>
                              Token #{String(apt.tokenNumber || 1).padStart(2, '0')} &bull; Done
                            </span>
                            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckIcon size={12} color="#10B981" />
                              <span>Completed</span>
                            </span>
                          </div>

                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-main)', marginBottom: '2px' }}>
                            {apt.patientName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                            {apt.service} &bull; {apt.phone}
                          </div>

                          {/* Post-visit Google Review Request Trigger */}
                          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleSendGoogleReview(apt)}
                              className="ux-btn"
                              style={{
                                flex: '1 1 100%',
                                background: apt.googleReviewSent ? 'var(--color-brand-surface, #E7F2F5)' : '#FEF3C7',
                                color: apt.googleReviewSent ? 'var(--color-brand-primary, #183C4A)' : '#92400E',
                                border: apt.googleReviewSent ? '1px solid var(--color-border-subtle)' : '1px solid #FCD34D',
                                padding: '7px 10px',
                                borderRadius: '9999px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                              }}
                            >
                              <StarIcon size={14} color={apt.googleReviewSent ? 'var(--color-brand-primary, #183C4A)' : '#D97706'} />
                              <span>{apt.googleReviewSent ? 'Google Review Sent' : 'Request Google Review on WhatsApp'}</span>
                            </button>

                            <button
                              onClick={() => setPrintSlipPatient(apt)}
                              className="ms-pill-light"
                              style={{
                                flex: '1',
                                justifyContent: 'center',
                                padding: '6px 10px',
                                fontSize: '11.5px',
                              }}
                            >
                              <PrinterIcon size={12} color="currentColor" />
                              <span>Print Discharge Slip</span>
                            </button>
                          </div>
                        </div>
                      ))}

                    {appointments.filter((a) => a.opdStage === 'done' || a.status === 'completed').length === 0 && (
                      <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
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
            <div className="ms-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <CalendarIcon size={20} color="var(--color-brand-primary, #183C4A)" />
                    <span>Patient Appointments</span>
                    <span className="ms-serif-italic" style={{ fontSize: '26px', fontWeight: 400 }}>reception inbox</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Per ADR-104: Receptionist verifies shift capacity and confirms time slot directly on WhatsApp. Live synced with /api/appointments.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowAddAptModal(true)}
                    className="ms-pill-dark"
                  >
                    <span className="ms-pill-circle">
                      <PlusIcon size={14} color="#183C4A" />
                    </span>
                    <span>Add Walk-in Patient</span>
                  </button>
                  <button
                    onClick={() => fetchAppointments()}
                    className="ms-pill-light"
                  >
                    <RefreshCwIcon size={14} color="currentColor" />
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
                    { id: 'confirmed', label: `Confirmed (${appointments.filter((a) => a.status === 'confirmed').length})`, dot: '#10B981' },
                    { id: 'completed', label: `Completed (${appointments.filter((a) => a.status === 'completed').length})`, dot: '#64748B' },
                    { id: 'cancelled', label: `Cancelled (${appointments.filter((a) => a.status === 'cancelled').length})`, dot: '#DC2626' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setAptFilter(f.id as any)}
                      className="ux-btn"
                      style={{
                        padding: '7px 14px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: aptFilter === f.id ? 600 : 500,
                        border: aptFilter === f.id ? '1px solid #183C4A' : '1px solid var(--color-border-subtle)',
                        background: aptFilter === f.id ? '#183C4A' : 'var(--color-bg-base)',
                        color: aptFilter === f.id ? '#FFFFFF' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {f.dot && (
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: f.dot, display: 'inline-block' }} />
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
                    style={{ padding: '9px 14px 9px 34px', borderRadius: '9999px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', fontSize: '13px', width: '260px' }}
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }}>
                    <SearchIcon size={14} color="currentColor" />
                  </span>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)' }}>
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
                        <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          No appointments match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((apt) => (
                        <tr key={apt.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: 'var(--color-brand-surface, #E7F2F5)', color: 'var(--color-brand-primary, #183C4A)', border: '1px solid var(--color-border-subtle)', fontWeight: 700, fontSize: '12px', padding: '3px 10px', borderRadius: '9999px', whiteSpace: 'nowrap' }}>
                              Token #{String(apt.tokenNumber || 1).padStart(2, '0')}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                            <div>{apt.patientName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{apt.id} &bull; {apt.createdAt}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <a
                              href={`https://wa.me/${apt.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(apt.patientName)},%20this%20is%20Sunita%20from%20${encodeURIComponent(content.clinic.name)}%20regarding%20your%20consultation%20request%20with%20${encodeURIComponent(content.doctor.name)}.%20Please%20let%20us%20know%20if%20you%20prefer%20morning%20or%20evening.`}
                              target="_blank"
                              rel="noreferrer"
                              className="ux-btn"
                              style={{ color: 'var(--color-brand-primary, #183C4A)', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              title="Open WhatsApp chat with patient"
                            >
                              <MessageCircleIcon size={14} color="var(--color-brand-primary, #183C4A)" />
                              <span>{apt.phone}</span>
                            </a>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--color-text-main)' }}>{apt.service}</td>
                          <td style={{ padding: '12px', color: 'var(--color-text-main)' }}>
                            <span style={{ fontWeight: 600 }}>{apt.preferredDate}</span>
                            <span style={{ marginLeft: '6px', fontSize: '11px', background: 'var(--color-bg-surface)', color: 'var(--color-text-muted)', padding: '2px 8px', borderRadius: '9999px' }}>
                              {apt.shift}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background:
                                  apt.status === 'new'
                                    ? '#FEF3C7'
                                    : apt.status === 'contacted'
                                    ? '#E0F2FE'
                                    : apt.status === 'confirmed'
                                    ? '#E7F2F5'
                                    : '#F1F5F9',
                                color:
                                  apt.status === 'new'
                                    ? '#92400E'
                                    : apt.status === 'contacted'
                                    ? '#0369A1'
                                    : apt.status === 'confirmed'
                                    ? '#183C4A'
                                    : '#475569',
                              }}
                            >
                              {apt.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--color-text-muted)', maxWidth: '220px', fontSize: '12px' }}>
                            {apt.notes}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => handleSendWhatsAppConfirmation(apt)}
                                className="ux-btn"
                                title="Send WhatsApp confirmation & reply options"
                                style={{ background: 'var(--color-brand-surface, #E7F2F5)', color: 'var(--color-brand-primary, #183C4A)', border: '1px solid var(--color-border-subtle)', padding: '5px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <MessageCircleIcon size={12} color="var(--color-brand-primary, #183C4A)" />
                                <span>{apt.whatsappConfirmationSent ? 'WA Sent' : 'WA Confirm'}</span>
                              </button>

                              <button
                                onClick={() => setPrintSlipPatient(apt)}
                                className="ux-btn"
                                title="Print Clinic Appointment Slip"
                                style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', border: '1px solid var(--color-border-subtle)', padding: '5px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <PrinterIcon size={12} color="currentColor" />
                                <span>Slip</span>
                              </button>

                              {apt.status === 'new' && (
                                <button
                                  disabled={actionLoadingId === apt.id}
                                  onClick={() => updateStatus(apt.id, 'contacted', 'WhatsApp outreach performed')}
                                  className="ux-btn"
                                  style={{ background: '#0284C7', color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Mark Contacted
                                </button>
                              )}
                              {(apt.status === 'new' || apt.status === 'contacted') && (
                                <button
                                  disabled={actionLoadingId === apt.id}
                                  onClick={() => updateStatus(apt.id, 'confirmed', 'Time slot confirmed with patient')}
                                  className="ux-btn"
                                  style={{ background: '#183C4A', color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Confirm Slot
                                </button>
                              )}
                              {apt.status === 'confirmed' && (
                                <button
                                  disabled={actionLoadingId === apt.id}
                                  onClick={() => updateStatus(apt.id, 'completed', 'Consultation finished')}
                                  className="ux-btn"
                                  style={{ background: '#475569', color: '#FFF', border: 'none', padding: '5px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Complete Visit
                                </button>
                              )}
                              {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                <button
                                  disabled={actionLoadingId === apt.id}
                                  onClick={() => updateStatus(apt.id, 'cancelled', 'Cancelled by patient or clinic')}
                                  className="ux-btn"
                                  style={{ background: 'var(--color-bg-surface)', color: '#991B1B', border: '1px solid #FECACA', padding: '5px 10px', borderRadius: '9999px', fontSize: '11px', cursor: 'pointer' }}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <Edit3Icon size={20} color="var(--color-brand-primary, #183C4A)" />
                    <span>Site Block Editor</span>
                    <span className="ms-serif-italic" style={{ fontSize: '28px', fontWeight: 400 }}>&amp; live device preview</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Changes edit <code>fixtures/live-store.json</code> and reflect on the patient site at <code>http://localhost:3000/</code> in real time.
                  </p>
                </div>

                {/* Viewport Width Controls */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', padding: '4px', borderRadius: '9999px' }}>
                  <button
                    onClick={() => setDeviceViewport('360px')}
                    className="ux-btn"
                    style={{
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: deviceViewport === '360px' ? 600 : 500,
                      background: deviceViewport === '360px' ? '#183C4A' : 'transparent',
                      color: deviceViewport === '360px' ? '#FFFFFF' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <SmartphoneIcon size={14} color="currentColor" />
                    <span>Mobile (360px)</span>
                  </button>
                  <button
                    onClick={() => setDeviceViewport('768px')}
                    className="ux-btn"
                    style={{
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: deviceViewport === '768px' ? 600 : 500,
                      background: deviceViewport === '768px' ? '#183C4A' : 'transparent',
                      color: deviceViewport === '768px' ? '#FFFFFF' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <TabletIcon size={14} color="currentColor" />
                    <span>Tablet (768px)</span>
                  </button>
                  <button
                    onClick={() => setDeviceViewport('100%')}
                    className="ux-btn"
                    style={{
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: deviceViewport === '100%' ? 600 : 500,
                      background: deviceViewport === '100%' ? '#183C4A' : 'transparent',
                      color: deviceViewport === '100%' ? '#FFFFFF' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <MonitorIcon size={14} color="currentColor" />
                    <span>Desktop (1400px)</span>
                  </button>
                </div>
              </div>

              {/* Sub-Navigation for Block Sections */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '18px', borderBottom: '1px solid var(--color-border-subtle)' }}>
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
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      fontSize: '12.5px',
                      fontWeight: editorSection === sec.id ? 600 : 500,
                      border: editorSection === sec.id ? '1px solid #183C4A' : '1px solid var(--color-border-subtle)',
                      background: editorSection === sec.id ? '#183C4A' : 'var(--color-bg-base)',
                      color: editorSection === sec.id ? '#FFFFFF' : 'var(--color-text-main)',
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
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 460px) 1fr', gap: '24px', alignItems: 'flex-start' }}>
                
                {/* Left Column: Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Save Banner */}
                  <div className="ms-card" style={{ padding: '16px 20px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-brand-primary, #183C4A)' }}>
                        Editing: {editorSection.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                        {hasUnsavedChanges ? (
                          <>
                            <AlertTriangleIcon size={13} color="#D97706" />
                            <span style={{ color: '#D97706', fontWeight: 600 }}>Unsaved changes ready to publish</span>
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon size={13} color="#10B981" />
                            <span>All synced with live patient page</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePublish()}
                      disabled={publishStatus === 'publishing'}
                      className="ms-pill-dark"
                      style={hasUnsavedChanges ? { background: '#B45309', borderColor: '#B45309' } : undefined}
                    >
                      <span className="ms-pill-circle">
                        {publishStatus === 'publishing' ? (
                          <RefreshCwIcon size={12} color="#183C4A" className="spin" />
                        ) : (
                          <SendIcon size={12} color="#183C4A" />
                        )}
                      </span>
                      <span>{publishStatus === 'publishing' ? 'Saving...' : 'Publish Changes'}</span>
                    </button>
                  </div>

                  {/* SECTION: CLINIC, SCHEDULE & MAP */}
                  {editorSection === 'clinic' && (
                    <div className="ms-card" style={{ padding: '20px', borderRadius: '18px' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: 'var(--color-brand-primary, #183C4A)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BuildingIcon size={18} color="var(--color-brand-primary, #183C4A)" />
                        <span>Clinic Address, Schedule &amp; Map Facade</span>
                      </h3>

                      {/* Clinic Facade Photo Upload Card */}
                      <input
                        ref={clinicPhotoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadClinicPhotoDirect(file);
                            e.target.value = '';
                          }
                        }}
                      />

                      <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-primary, #183C4A)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ImageIcon size={14} color="var(--color-brand-primary, #183C4A)" />
                          <span>Clinic Facade &amp; Premises Photo</span>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div
                            onClick={() => clinicPhotoInputRef.current?.click()}
                            title="Click to upload/change photo"
                            style={{
                              width: '120px',
                              height: '80px',
                              borderRadius: '10px',
                              border: '2px solid #183C4A',
                              overflow: 'hidden',
                              background: '#E2E8F0',
                              flexShrink: 0,
                              cursor: 'pointer',
                              position: 'relative',
                            }}
                          >
                            <img
                              src={content.clinic.photoUrl || '/assets/noida_clinic_facade.svg'}
                              alt="Clinic Facade"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.3)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFF',
                                fontSize: '10px',
                                fontWeight: '700',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                            >
                              Change
                            </div>
                          </div>

                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => clinicPhotoInputRef.current?.click()}
                                className="ms-pill-dark"
                                disabled={uploadingMedia}
                                style={{ padding: '7px 14px', fontSize: '12px' }}
                              >
                                <UploadIcon size={14} color="#FFF" />
                                <span>{uploadingMedia ? 'Uploading...' : 'Upload Clinic Photo'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setActiveTab('media')}
                                className="ux-btn"
                                style={{
                                  background: '#FFFFFF',
                                  color: '#475569',
                                  border: '1px solid #CBD5E1',
                                  padding: '7px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <ImageIcon size={14} color="#475569" />
                                <span>Browse Media Library</span>
                              </button>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>
                              Appears alongside the clinic address &amp; Google Map embed for easy patient arrival.
                            </div>
                          </div>
                        </div>
                      </div>

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
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                            <MapPinIcon size={14} color="var(--color-brand-primary, #183C4A)" />
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
                    <div className="ms-card" style={{ padding: '20px', borderRadius: '18px' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: 'var(--color-brand-primary, #183C4A)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ActivityIcon size={18} color="var(--color-brand-primary, #183C4A)" />
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
                    <div className="ms-card" style={{ padding: '20px', borderRadius: '18px' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: 'var(--color-brand-primary, #183C4A)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheckIcon size={18} color="var(--color-brand-primary, #183C4A)" />
                        <span>Doctor Credentials, Fee &amp; Bio</span>
                      </h3>

                      {/* Doctor Portrait Upload Card */}
                      <input
                        ref={doctorPhotoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadDoctorPhotoDirect(file);
                            e.target.value = '';
                          }
                        }}
                      />

                      <div style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-subtle)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-primary, #183C4A)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ImageIcon size={14} color="var(--color-brand-primary, #183C4A)" />
                          <span>Doctor Hero Portrait Photo</span>
                        </div>
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div
                            onClick={() => doctorPhotoInputRef.current?.click()}
                            title="Click to upload/change photo"
                            style={{
                              width: '84px',
                              height: '84px',
                              borderRadius: '12px',
                              border: '2px solid #183C4A',
                              overflow: 'hidden',
                              background: '#E2E8F0',
                              flexShrink: 0,
                              cursor: 'pointer',
                              position: 'relative',
                            }}
                          >
                            <img
                              src={content.doctor.photoUrl || '/assets/dr_maanvita_portrait.svg'}
                              alt="Doctor Portrait"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.3)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFF',
                                fontSize: '10px',
                                fontWeight: '700',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                            >
                              Change
                            </div>
                          </div>

                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => doctorPhotoInputRef.current?.click()}
                                className="ms-pill-dark"
                                disabled={uploadingMedia}
                                style={{ padding: '7px 14px', fontSize: '12px' }}
                              >
                                <UploadIcon size={14} color="#FFF" />
                                <span>{uploadingMedia ? 'Uploading...' : 'Upload Doctor Photo'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setActiveTab('media')}
                                className="ux-btn"
                                style={{
                                  background: '#FFFFFF',
                                  color: '#475569',
                                  border: '1px solid #CBD5E1',
                                  padding: '7px 12px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                <ImageIcon size={14} color="#475569" />
                                <span>Browse Media Library</span>
                              </button>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>
                              Shows on hero card and doctor credentials. Recommended: 800×800 square or 4:5 portrait.
                            </div>
                          </div>
                        </div>
                      </div>

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
                    <div className="ms-card" style={{ padding: '20px', borderRadius: '18px' }}>
                      <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', color: 'var(--color-brand-primary, #183C4A)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AwardIcon size={18} color="var(--color-brand-primary, #183C4A)" />
                        <span>Why Choose Us &bull; 4 Trust Pillars</span>
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {content.whyChooseUs?.map((pillar, idx) => (
                          <div key={pillar.id} style={{ border: '1px solid var(--color-border-subtle)', padding: '14px', borderRadius: '14px', background: 'var(--color-bg-surface)' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-brand-surface, #E7F2F5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <div className="ms-card" style={{ padding: '20px', borderRadius: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-brand-primary, #183C4A)' }}>
                          Clinical Services ({content.services.length})
                        </h3>
                        <button
                          type="button"
                          onClick={addService}
                          className="ms-pill-dark"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
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
                    <div className="ms-card" style={{ padding: '20px', borderRadius: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-brand-primary, #183C4A)' }}>
                          Patient Feedback ({content.reviews.length})
                        </h3>
                        <button
                          type="button"
                          onClick={addReview}
                          className="ms-pill-dark"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
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
                    <div className="ms-card" style={{ padding: '20px', borderRadius: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-brand-primary, #183C4A)' }}>
                          FAQs ({content.faqs.length})
                        </h3>
                        <button
                          type="button"
                          onClick={addFaq}
                          className="ms-pill-dark"
                          style={{ padding: '6px 14px', fontSize: '12px' }}
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
                        className="ms-pill-dark"
                        style={{ padding: '4px 12px 4px 10px', fontSize: '12px' }}
                      >
                        <span>Open Live Site</span>
                        <ExternalLinkIcon size={12} color="#FFFFFF" />
                      </a>
                    </div>
                  </div>

                  {/* Direct In-Context Preview Quick Edit Toolbar */}
                  <div
                    className="ms-card"
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      padding: '14px 18px',
                      marginBottom: '12px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-primary, #183C4A)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <SparklesIcon size={14} color="var(--color-brand-primary, #183C4A)" />
                        <span>Direct In-Context Quick Edit (Visible Instant Control)</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        Edits apply directly to the live site preview below
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 90px 130px auto', gap: '8px', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Hero Headline</div>
                        <input
                          type="text"
                          value={content.hero.headline}
                          onChange={(e) => handleContentChange('hero', 'headline', e.target.value)}
                          placeholder="Headline"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Doctor Specialty</div>
                        <input
                          type="text"
                          value={content.doctor.specialty}
                          onChange={(e) => handleContentChange('doctor', 'specialty', e.target.value)}
                          placeholder="Specialty"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Fee (₹)</div>
                        <input
                          type="number"
                          value={content.doctor.consultationFee}
                          onChange={(e) => handleContentChange('doctor', 'consultationFee', Number(e.target.value))}
                          placeholder="Fee"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '3px' }}>Next Slot</div>
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
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-surface)', color: 'var(--color-text-main)', fontSize: '12px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div style={{ paddingTop: '16px' }}>
                        <button
                          onClick={() => handlePublish()}
                          className="ms-pill-dark"
                          style={{ padding: '7px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                          <SendIcon size={12} color="#FFFFFF" />
                          <span>Publish Live</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Section Jump Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)' }}>Quick-Focus Section:</span>
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
                            background: editorSection === item.id ? '#183C4A' : 'var(--color-bg-surface)',
                            color: editorSection === item.id ? '#FFFFFF' : 'var(--color-text-muted)',
                            border: editorSection === item.id ? '1px solid #183C4A' : '1px solid var(--color-border-subtle)',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: editorSection === item.id ? 600 : 500,
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
            <div className="ms-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <MicroscopeIcon size={20} color="var(--color-brand-primary, #183C4A)" />
                    <span>Clinical Procedures</span>
                    <span className="ms-serif-italic" style={{ fontSize: '26px', fontWeight: 400 }}>&amp; services catalog</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Manage the specialized medical treatments displayed on the patient landing page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addService}
                  className="ms-pill-dark"
                >
                  <span className="ms-pill-circle">
                    <PlusIcon size={14} color="#183C4A" />
                  </span>
                  <span>Add Procedure</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {content.services.map((srv, idx) => (
                  <div key={srv.id} className="ms-bento-tile-light" style={{ padding: '18px', borderRadius: '16px', cursor: 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--color-brand-surface, #E7F2F5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {renderEditorIconPreview(srv.icon)}
                        </div>
                        <input
                          type="text"
                          value={srv.title}
                          onChange={(e) => updateService(idx, 'title', e.target.value)}
                          style={{ flex: 1, fontWeight: 600, padding: '7px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', fontSize: '13px' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeService(idx)}
                        className="ux-btn"
                        style={{ background: '#FEE2E2', border: 'none', color: '#B91C1C', cursor: 'pointer', marginLeft: '8px', borderRadius: '9999px', padding: '7px 9px' }}
                      >
                        <Trash2Icon size={14} color="#B91C1C" />
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={srv.description}
                      onChange={(e) => updateService(idx, 'description', e.target.value)}
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', fontSize: '12.5px', boxSizing: 'border-box' }}
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
            <div className="ms-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <MessageCircleIcon size={20} color="var(--color-brand-primary, #183C4A)" />
                    <span>Patient Feedback</span>
                    <span className="ms-serif-italic" style={{ fontSize: '26px', fontWeight: 400 }}>&amp; verified reviews</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Moderate real clinical feedback displayed in the patient landing page reviews carousel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addReview}
                  className="ms-pill-dark"
                >
                  <span className="ms-pill-circle">
                    <PlusIcon size={14} color="#183C4A" />
                  </span>
                  <span>Add Patient Review</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {content.reviews.map((rev, idx) => (
                  <div key={rev.id} className="ms-bento-tile-light" style={{ padding: '18px', borderRadius: '16px', cursor: 'default' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                        <input
                          type="text"
                          placeholder="Patient Name"
                          value={rev.patientName}
                          onChange={(e) => updateReview(idx, 'patientName', e.target.value)}
                          style={{ width: '130px', fontWeight: 600, padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', fontSize: '12px' }}
                        />
                        <input
                          type="text"
                          placeholder="Treatment"
                          value={rev.treatment}
                          onChange={(e) => updateReview(idx, 'treatment', e.target.value)}
                          style={{ flex: 1, padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', fontSize: '12px' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeReview(idx)}
                        className="ux-btn"
                        style={{ background: '#FEE2E2', border: 'none', color: '#B91C1C', cursor: 'pointer', marginLeft: '8px', borderRadius: '9999px', padding: '6px 8px' }}
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
                        style={{ flex: 1, padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', fontSize: '12px' }}
                      />
                      <select
                        value={rev.rating}
                        onChange={(e) => updateReview(idx, 'rating', Number(e.target.value))}
                        style={{ padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', fontSize: '12px' }}
                      >
                        <option value={5}>5 Stars (Excellent)</option>
                        <option value={4}>4 Stars (Good)</option>
                      </select>
                    </div>
                    <textarea
                      rows={3}
                      value={rev.reviewText}
                      onChange={(e) => updateReview(idx, 'reviewText', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', fontSize: '12px', boxSizing: 'border-box' }}
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
            <div className="ms-card" style={{ padding: '26px' }}>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <BuildingIcon size={20} color="var(--color-brand-primary, #183C4A)" />
                <span>Clinic Schedule, Fee Policy</span>
                <span className="ms-serif-italic" style={{ fontSize: '26px', fontWeight: 400 }}>&amp; Google Map</span>
              </h2>
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
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
                  <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <PaletteIcon size={20} color="var(--color-brand-primary, #183C4A)" />
                    <span>DoctorSite Pro</span>
                    <span className="ms-serif-italic" style={{ fontSize: '26px', fontWeight: 400 }}>clinical theme presets</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Per Spec 19. All palettes pass WCAG 2.2 Level AA accessibility standards. 1-click apply publishes immediately to <code>localhost:3000</code>.
                  </p>
                </div>

                <div style={{ background: 'var(--color-brand-surface, #E7F2F5)', border: '1px solid var(--color-border-subtle)', padding: '8px 16px', borderRadius: '9999px', fontSize: '13px', color: 'var(--color-brand-primary, #183C4A)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircleIcon size={14} color="var(--color-brand-primary, #183C4A)" />
                  <span>Active Theme: <strong>{content.theme}</strong></span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {THEME_PRESETS.map((theme) => {
                  const isCurrent = content.theme === theme.name;
                  return (
                    <div
                      key={theme.name}
                      className="ms-card"
                      style={{
                        border: isCurrent ? '2px solid #183C4A' : '1px solid var(--color-border-subtle)',
                        padding: '22px',
                        boxShadow: isCurrent ? '0 14px 30px -10px rgba(24, 60, 74, 0.18)' : undefined,
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
                            <span style={{ background: '#183C4A', color: '#FFFFFF', fontWeight: 700, fontSize: '11px', padding: '4px 10px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircleIcon size={12} color="#FFFFFF" />
                              <span>ACTIVE THEME</span>
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                          <div style={{ flex: 1, height: '44px', borderRadius: '10px', background: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}>
                            Primary
                          </div>
                          <div style={{ flex: 1, height: '44px', borderRadius: '10px', background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '11px', fontWeight: 'bold' }}>
                            Accent
                          </div>
                          <div style={{ flex: 1, height: '44px', borderRadius: '10px', background: theme.bg, border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '11px', fontWeight: 'bold' }}>
                            Background
                          </div>
                        </div>

                        <div style={{ fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '6px', fontWeight: 500 }}>
                          {theme.description}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          <strong>Recommended for:</strong> {theme.specialty}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)' }}>
                        <button
                          onClick={() => selectAndPublishTheme(theme.name)}
                          className={isCurrent ? 'ms-pill-dark' : 'ms-pill-light'}
                          style={{
                            flex: 1,
                            justifyContent: 'center',
                            padding: '10px 14px',
                          }}
                        >
                          {isCurrent ? (
                            <>
                              <CheckCircleIcon size={14} color="#FFFFFF" />
                              <span>Currently Live</span>
                            </>
                          ) : (
                            <>
                              <ZapIcon size={14} color="currentColor" />
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
            <div className="ms-card" style={{ padding: '26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <ImageIcon size={20} color="var(--color-brand-primary, #183C4A)" />
                    <span>Media Library</span>
                    <span className="ms-serif-italic" style={{ fontSize: '26px', fontWeight: 400 }}>&amp; clinical photography</span>
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Upload doctor portraits, clinic facades, and branding assets. 1-click set as active on the live patient portal (http://localhost:3000/).
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => mediaFileInputRef.current?.click()}
                    className="ms-pill-dark"
                  >
                    <span className="ms-pill-circle">
                      <UploadIcon size={14} color="#183C4A" />
                    </span>
                    <span>Upload Photo</span>
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

              {/* Hidden Real File Input for Specific Asset Replacement */}
              <input
                ref={replaceFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleReplaceMediaFile(file);
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
                className="ms-hero-card"
                style={{
                  border: '1.5px dashed var(--color-brand-primary, #183C4A)',
                  borderRadius: '20px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: isDraggingMedia ? 'var(--color-brand-surface, #E7F2F5)' : 'var(--ms-hero-mist)',
                  cursor: 'pointer',
                  marginBottom: '24px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                  <div style={{ width: '54px', height: '54px', borderRadius: '9999px', background: '#FFFFFF', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadIcon size={24} color="#183C4A" />
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-brand-primary, #183C4A)' }}>
                  {uploadingMedia ? 'Uploading & Processing Image...' : 'Click to Upload or Drag & Drop Photos Here'}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                  Supports JPG, PNG, WebP, SVG &bull; Preserved in <code>public/uploads</code> with instant live site sync
                </div>
                <button
                  type="button"
                  className="ms-pill-dark"
                  style={{ marginTop: '16px' }}
                >
                  <span className="ms-pill-circle">
                    <UploadIcon size={13} color="#183C4A" />
                  </span>
                  <span>Browse File From Computer</span>
                </button>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
                  Active Media Assets ({content.media?.length || 0})
                </h3>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: mediaCategoryFilter === f.id ? 600 : 500,
                        border: mediaCategoryFilter === f.id ? '1px solid #183C4A' : '1px solid var(--color-border-subtle)',
                        background: mediaCategoryFilter === f.id ? '#183C4A' : 'var(--color-bg-base)',
                        color: mediaCategoryFilter === f.id ? '#FFFFFF' : 'var(--color-text-muted)',
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
                        className="ms-card"
                        style={{
                          border: isDoctorPortrait || isClinicPhoto ? '2px solid #183C4A' : '1px solid var(--color-border-subtle)',
                          borderRadius: '18px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          {/* Real Image Thumbnail with Click-to-Replace */}
                          <div
                            onClick={() => handleTriggerReplaceMedia(item.id)}
                            title="Click to upload/replace this photo from your computer"
                            style={{
                              height: '160px',
                              width: '100%',
                              background: 'var(--color-bg-surface)',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '10px',
                              position: 'relative',
                              cursor: 'pointer',
                              border: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            <img
                              src={item.url}
                              alt={item.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {/* Hover / Quick Action Overlay */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '8px',
                                right: '8px',
                                background: 'rgba(24, 60, 74, 0.86)',
                                color: '#FFFFFF',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backdropFilter: 'blur(4px)',
                              }}
                            >
                              <UploadIcon size={11} color="#FFFFFF" />
                              <span>Click to Replace</span>
                            </div>

                            {/* Active Assignment Badge */}
                            {isDoctorPortrait && (
                              <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#183C4A', color: '#FFF', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckIcon size={11} color="#FFF" />
                                <span>Active Doctor Portrait</span>
                              </span>
                            )}
                            {isClinicPhoto && (
                              <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#0284C7', color: '#FFF', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckIcon size={11} color="#FFF" />
                                <span>Active Clinic Photo</span>
                              </span>
                            )}
                            {isNavLogo && (
                              <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#D97706', color: '#FFF', fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <CheckIcon size={11} color="#FFF" />
                                <span>Active Nav Logo</span>
                              </span>
                            )}
                          </div>

                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '2px', wordBreak: 'break-all' }}>
                            {item.title || item.fileName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                            {item.fileSize} &bull; {item.fileType}
                          </div>
                        </div>

                        {/* 1-Click Assignment & Management Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: '1px solid var(--color-border-subtle)' }}>
                          <button
                            type="button"
                            onClick={() => handleTriggerReplaceMedia(item.id)}
                            className="ms-pill-dark"
                            disabled={uploadingMedia && replacingMediaId === item.id}
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                              padding: '7px 12px',
                              fontSize: '11.5px',
                            }}
                          >
                            <UploadIcon size={13} color="#FFFFFF" />
                            <span>
                              {uploadingMedia && replacingMediaId === item.id ? 'Uploading...' : 'Upload / Replace This Photo'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleSetDoctorPhoto(item.url)}
                            className="ux-btn"
                            style={{
                              width: '100%',
                              background: 'var(--color-brand-surface, #E7F2F5)',
                              color: 'var(--color-brand-primary, #183C4A)',
                              border: '1px solid var(--color-border-subtle)',
                              padding: '6px 10px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                            }}
                          >
                            <UserCheckIcon size={13} color="var(--color-brand-primary, #183C4A)" />
                            <span>{isDoctorPortrait ? 'Current Doctor Portrait' : 'Set as Doctor Portrait'}</span>
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
                            <span>{isClinicPhoto ? 'Current Clinic Photo' : 'Set as Clinic Photo'}</span>
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
            <div className="ms-card" style={{ padding: '26px' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: 600, color: 'var(--color-text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <SettingsIcon size={20} color="var(--color-brand-primary, #183C4A)" />
                <span>Clinic Governance</span>
                <span className="ms-serif-italic" style={{ fontSize: '26px', fontWeight: 400 }}>GST &amp; DPDP Act 2023</span>
              </h2>
              <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                Operational compliance configurations for Indian healthcare regulations.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                <div className="ms-bento-tile-light" style={{ padding: '22px', borderRadius: '18px', cursor: 'default' }}>
                  <h3 style={{ fontSize: '15px', color: 'var(--color-text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ClockIcon size={16} color="var(--color-brand-primary, #183C4A)" />
                    <span>Clinic Operational Shifts</span>
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                    <strong>{content.clinic.schedule.weekdayHours}</strong><br />
                    <strong>{content.clinic.schedule.saturdayHours}</strong><br />
                    <strong>{content.clinic.schedule.sundayHours}</strong>
                  </p>
                  <button
                    onClick={() => setActiveTab('clinic_hours')}
                    className="ms-pill-light"
                  >
                    <Edit3Icon size={13} color="currentColor" />
                    <span>Edit Hours &amp; Timings</span>
                  </button>
                </div>

                <div className="ms-bento-tile-light" style={{ padding: '22px', borderRadius: '18px', cursor: 'default' }}>
                  <h3 style={{ fontSize: '15px', color: 'var(--color-text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BanknoteIcon size={16} color="var(--color-brand-primary, #183C4A)" />
                    <span>18% GST Compliance &amp; Billing</span>
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                    <strong>Plan:</strong> DoctorSite Pro (Annual Retainer)<br />
                    <strong>Base Fee:</strong> ₹24,999 / year<br />
                    <strong>CGST (9%) + SGST (9%):</strong> ₹4,499.82<br />
                    <strong>Total Invoice:</strong> ₹29,498.82 INR<br />
                    <strong>SAC Code:</strong> 998314 (IT &amp; Digital Presence Automation)
                  </div>
                  <button
                    onClick={() => alert('GST Tax Invoice downloaded: INV-2026-998314.pdf')}
                    className="ms-pill-dark"
                  >
                    <span className="ms-pill-circle">
                      <DownloadIcon size={13} color="#183C4A" />
                    </span>
                    <span>Download Latest Tax Invoice</span>
                  </button>
                </div>

                <div className="ms-bento-tile-light" style={{ padding: '22px', borderRadius: '18px', cursor: 'default' }}>
                  <h3 style={{ fontSize: '15px', color: 'var(--color-text-main)', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheckIcon size={16} color="var(--color-brand-primary, #183C4A)" />
                    <span>DPDP Act 2023 Patient Privacy</span>
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                    <strong>Consent Status:</strong> Active on appointment form.<br />
                    <strong>Storage:</strong> AES-256-GCM encrypted.<br />
                    <strong>Audit Trail:</strong> All status transitions logged.<br />
                    <strong>Right to Erasure:</strong> Supported per patient phone ID.
                  </div>
                  <button
                    onClick={downloadDPDPExport}
                    className="ms-pill-dark"
                  >
                    <span className="ms-pill-circle">
                      <DownloadIcon size={13} color="#183C4A" />
                    </span>
                    <span>Export Patient Consent &amp; Appointment Ledger</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 10: 7-PAGE SLOTS ARCHITECTURE                       */}
          {/* ======================================================= */}
          {activeTab === 'pages' && (
            <div style={{ marginTop: '8px' }}>
              <PageSlotsManager />
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 11: HEALTH & WELLNESS BLOG MANAGEMENT               */}
          {/* ======================================================= */}
          {activeTab === 'blog' && (
            <div style={{ marginTop: '8px' }}>
              <BlogManagementPage />
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 12: VERSION HISTORY & ROLLBACK AUDIT                */}
          {/* ======================================================= */}
          {activeTab === 'versions' && (
            <div style={{ marginTop: '8px' }}>
              <VersionHistoryPage />
            </div>
          )}

          {/* ======================================================= */}
          {/* TAB 13: FAQS & REVIEWS EXTENSION                        */}
          {/* ======================================================= */}
          {activeTab === 'faqs' && (
            <div style={{ marginTop: '8px' }}>
              <ReviewsFaqsPage />
            </div>
          )}

        </div>

      {/* Quick Walk-in Modal */}
      {showAddAptModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ux-card" style={{ background: '#FFFFFF', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)' }}>
                <CalendarIcon size={20} color="var(--color-brand-primary, #183C4A)" />
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
                  className="ms-pill-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ms-pill-dark"
                  style={{ padding: '9px 18px' }}
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
            <div style={{ border: '2px solid #183C4A', borderRadius: '16px', padding: '20px', background: '#F8FBFC' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(24,60,74,0.14)', paddingBottom: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#162228' }}>
                  {content?.clinic.name}
                </div>
                <div style={{ fontSize: '12px', color: '#54666E', marginTop: '2px' }}>
                  Plot 14, Health Plaza, Sector 18, Noida &bull; Ph: +91 98710 23456
                </div>
                <div style={{ fontSize: '11px', color: '#183C4A', fontWeight: '600', marginTop: '2px' }}>
                  {content?.doctor.name} &bull; {content?.doctor.degree} &bull; Reg: {content?.doctor.registrationNumber}
                </div>
              </div>

              {/* Big Token Stamp */}
              <div style={{ textAlign: 'center', background: '#E7F2F5', border: '1px solid rgba(24,60,74,0.18)', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#183C4A', textTransform: 'uppercase' }}>
                  OPD Consultation Token
                </div>
                <div style={{ fontSize: '34px', fontWeight: '900', color: '#183C4A', letterSpacing: '1px' }}>
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
                className="ms-pill-dark"
                style={{ flex: '1', justifyContent: 'center', padding: '10px 16px' }}
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
                className="ms-pill-light"
                style={{ flex: '1', justifyContent: 'center', padding: '10px 16px' }}
              >
                <MessageCircleIcon size={16} color="#183C4A" />
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
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--color-brand-surface, #E7F2F5)', border: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageCircleIcon size={22} color="var(--color-brand-primary, #183C4A)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                    Dr. Maanvita Weekly WhatsApp Digest
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Plain-language weekly practice report delivered to doctor&apos;s phone (+91 98710 23456)
                  </div>
                </div>
              </div>

              {/* Stats Highlights Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div className="ms-bento-tile-light" style={{ padding: '12px', textAlign: 'center', borderRadius: '12px', cursor: 'default' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-primary, #183C4A)' }}>{stats.totalBookings}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Appointments</div>
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
