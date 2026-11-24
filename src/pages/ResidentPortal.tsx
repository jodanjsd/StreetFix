import React, { useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import {
  ArrowRight,
  Phone,
  MapPin,
  CheckCircle2,
  Eye,
  EyeOff,
  ThumbsUp,
  Upload,
  ShieldCheck,
  LocateFixed,
  Clock,
  Wrench,
  Droplets,
  Lightbulb,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Bell,
  CheckCheck,
} from 'lucide-react';
import {
  AppNotification,
  Incident,
  IncidentCategory,
  IncidentSeverity,
  ResidentAccount,
  ScreenRoute,
  UserSession,
} from '../types';
import {
  HOTLINKED_IMAGES,
  NIGERIAN_CADASTRE,
  STATE_COORDINATES,
  getCadastreLgaOptions,
} from '../data/mockData';
import { SafeImage } from '../components/SafeImage';
import { OtpVerificationCard } from '../components/OtpVerificationCard';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  findResidentAccountByIdentifier,
  generateOtpCode,
  isValidNgPhone,
  normalizeNgPhone,
} from '../utils/authAccounts';
import { readCompressedImageFile } from '../utils/imageUpload';

interface ResidentPortalProps {
  incidents: Incident[];
  myReportedIds?: string[];
  session: UserSession | null;
  residentAccounts?: ResidentAccount[];
  onSaveResidentAccount?: (account: ResidentAccount) => void;
  onVerifyResidentAccount?: (accountId: string) => void;
  onUpdateResidentProfile?: (payload: {
    name: string;
    email: string;
    phone: string;
    state: string;
    lga: string;
    avatarUrl?: string;
    newPassword?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onLogin: (session: UserSession, idToken?: string) => void;
  onSignOut: () => void;
  onNavigate: (route: ScreenRoute) => void;
  onSelectIncident: (id: string) => void;
  onConfirmIncident: (id: string) => void;
  onQuickCreateIncident: (data: {
    category: IncidentCategory;
    state: string;
    lga: string;
    address: string;
    severity?: IncidentSeverity;
    description?: string;
    hasPhoto: boolean;
    photoUrl?: string;
  }) => void;
  onNotify?: (msg: string, urgent?: boolean) => void;
}

const HERO_SLIDES = [
  {
    url: HOTLINKED_IMAGES.asphaltCrewHero,
    title: 'Active Resurfacing Unit',
    location: 'Uyo Oron Road Corridor, Zone 4',
    badge: 'Live Dispatch',
    alt: 'Public works asphalt paving crew resurfacing urban corridor',
  },
  {
    url: HOTLINKED_IMAGES.asphaltCrewPatch,
    title: 'Hot-Mix Pothole Patching',
    location: 'Abak Road Dual Carriageway',
    badge: '78% Complete',
    alt: 'Road crew applying hot asphalt patch to crater',
  },
  {
    url: HOTLINKED_IMAGES.rollerStage2,
    title: 'Vibratory Roller Compaction',
    location: 'Ewet Housing Arterial Link',
    badge: 'Heavy Plant',
    alt: 'Heavy vibratory roller compacting freshly laid road surface',
  },
  {
    url: HOTLINKED_IMAGES.drainageCrew,
    title: 'Culvert & Drainage Repair',
    location: 'Eket Marina Culvert Axis',
    badge: 'Flood Relief',
    alt: 'Municipal engineers clearing and reinforcing street drainage culvert',
  },
  {
    url: HOTLINKED_IMAGES.yabaRoadWork,
    title: 'Roadway Sub-Base Reconstruction',
    location: 'Ikot Ekpene Urban Way',
    badge: 'Crew On Site',
    alt: 'Civil construction workers repairing damaged urban roadway',
  },
  {
    url: HOTLINKED_IMAGES.finishedRoadStriping,
    title: 'Resurfaced & Striped Corridor',
    location: 'Nwaniba Road Expressway, Uyo',
    badge: 'Certified Fixed',
    alt: 'Freshly paved road with crisp lane markings',
  },
];

export const ResidentPortal: React.FC<ResidentPortalProps> = ({
  incidents,
  myReportedIds = [],
  session,
  residentAccounts = [],
  onSaveResidentAccount,
  onVerifyResidentAccount,
  onUpdateResidentProfile,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onLogin,
  onSignOut,
  onNavigate,
  onSelectIncident,
  onConfirmIncident,
  onQuickCreateIncident,
  onNotify,
}) => {
  const isAdminSession = Boolean(
    session && (session.role === 'admin' || session.role === 'staff')
  );
  const [activeTab, setActiveTab] = useState<'all' | 'mine' | 'pending' | 'in_progress' | 'fixed'>('all');
  const [previewEmpty, setPreviewEmpty] = useState(false);
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all');
  const [lgaFilter, setLgaFilter] = useState<string>('all');
  const [categoryTagFilter, setCategoryTagFilter] = useState<string>('all');
  const [heroVisualMode, setHeroVisualMode] = useState<'crew' | 'road'>('crew');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  useEffect(() => {
    if (isCarouselPaused) return;
    const timer = window.setTimeout(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [activeSlide, isCarouselPaused]);

  // Inline Resident Auth State
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [resName, setResName] = useState('');
  const [resPhone, setResPhone] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resPassword, setResPassword] = useState('');
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showResPassword, setShowResPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState<{
    account: ResidentAccount;
    code: string;
  } | null>(null);

  // Quick Report Form State
  const [quickCategory, setQuickCategory] = useState<IncidentCategory>('Pothole / Road Failure');
  const [quickSeverity, setQuickSeverity] = useState<IncidentSeverity>('moderate');
  const [quickStateKey, setQuickStateKey] = useState<string>('akwa_ibom');
  const [quickLgaKey, setQuickLgaKey] = useState<string>('uyo');
  const [quickAddress, setQuickAddress] = useState<string>('');
  const [quickDescription, setQuickDescription] = useState<string>('');
  const [quickPhotoUrl, setQuickPhotoUrl] = useState<string>('');
  const [quickPhotoName, setQuickPhotoName] = useState<string>('');

  // Resident Self-Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profName, setProfName] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profStateKey, setProfStateKey] = useState('akwa_ibom');
  const [profLgaName, setProfLgaName] = useState('Uyo LGA');
  const [profAvatarUrl, setProfAvatarUrl] = useState('');
  const [profNewPassword, setProfNewPassword] = useState('');
  const [showProfPassword, setShowProfPassword] = useState(false);
  const [profSaving, setProfSaving] = useState(false);

  useEffect(() => {
    if (!session || isAdminSession) return;
    setProfName(session.name || '');
    setProfEmail(session.email || '');
    setProfPhone(session.phone || '');
    setProfAvatarUrl(session.avatarUrl || '');
    const [stPart, lgaPart] = (session.jurisdiction || '').split(' · ');
    const foundKey = Object.entries(NIGERIAN_CADASTRE).find(([, v]) => v.name === stPart)?.[0];
    if (foundKey) {
      setProfStateKey(foundKey);
    }
    if (lgaPart) {
      setProfLgaName(lgaPart);
    }
    setProfNewPassword('');
  }, [session, isAdminSession]);

  const selectedState = NIGERIAN_CADASTRE[quickStateKey] || NIGERIAN_CADASTRE.akwa_ibom;
  const availableLgas = Object.entries(selectedState.lgas);
  const profSelectedState = NIGERIAN_CADASTRE[profStateKey] || NIGERIAN_CADASTRE.akwa_ibom;
  const profAvailableLgas = Object.values(profSelectedState.lgas);

  const handleStateChange = (newStateKey: string) => {
    setQuickStateKey(newStateKey);
    const firstLga = Object.keys(NIGERIAN_CADASTRE[newStateKey].lgas)[0];
    setQuickLgaKey(firstLga);
  };

  const handleQuickPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuickPhotoName(file.name);
    readCompressedImageFile(
      file,
      (dataUrl) => {
        setQuickPhotoUrl(dataUrl);
        onNotify?.(`Attached compressed photographic evidence: ${file.name}`);
      },
      (err) => onNotify?.(err, true)
    );
    e.target.value = '';
  };

  const handleResidentAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readCompressedImageFile(
      file,
      (dataUrl) => {
        setProfAvatarUrl(dataUrl);
        onNotify?.('Resident profile photo ready to save.');
      },
      (err) => onNotify?.(err, true)
    );
    e.target.value = '';
  };

  const handleSaveResidentProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateResidentProfile) return;
    if (!profName.trim() || !profEmail.trim()) {
      onNotify?.('Name and email are required.', true);
      return;
    }
    if (profNewPassword.trim() && profNewPassword.trim().length < 6) {
      onNotify?.('New password must be at least 6 characters.', true);
      return;
    }
    setProfSaving(true);
    const result = await onUpdateResidentProfile({
      name: profName.trim(),
      email: profEmail.trim(),
      phone: profPhone.trim(),
      state: profSelectedState.name,
      lga: profLgaName,
      avatarUrl: profAvatarUrl || undefined,
      newPassword: profNewPassword.trim() || undefined,
    });
    setProfSaving(false);
    if (result.ok) {
      setProfNewPassword('');
      setEditingProfile(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAuthError(data.error || 'Could not complete Google Sign-In.');
        return;
      }
      if (data.resident) {
        onSaveResidentAccount?.({ ...data.resident, password: '' });
        onLogin(
          {
            name: data.resident.name,
            role: 'resident',
            jurisdiction: `${data.resident.state} · ${data.resident.lga}`,
            email: data.resident.email,
            phone: data.resident.phone,
            avatarUrl: data.resident.avatarUrl,
          },
          idToken
        );
      } else {
        onLogin(
          {
            name: result.user.displayName || result.user.email || 'StreetFix Resident',
            role: 'resident',
            jurisdiction: 'Akwa Ibom State · Uyo LGA',
            email: result.user.email || undefined,
            avatarUrl: result.user.photoURL || undefined,
          },
          idToken
        );
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes('popup-closed-by-user')
          ? 'Google sign-in popup was closed before finishing.'
          : 'Could not complete Google Sign-In. Please try again.';
      setAuthError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResidentAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const lgaName = selectedState.lgas[quickLgaKey]?.name || 'Uyo LGA';

    if (authMode === 'signup') {
      if (!resName.trim()) {
        setAuthError('Please enter your full name.');
        return;
      }
      if (!isValidNgPhone(resPhone)) {
        setAuthError('Enter a valid Nigerian phone number for WhatsApp & SMS confirmation.');
        return;
      }
      if (!resEmail.trim() || !resEmail.includes('@')) {
        setAuthError('Please enter a valid email address.');
        return;
      }
      if (resPassword.length < 6) {
        setAuthError('Password must be at least 6 characters.');
        return;
      }

      const normalizedPhone = normalizeNgPhone(resPhone);
      const normalizedEmail = resEmail.trim().toLowerCase();

      const existingVerified = residentAccounts.find(
        (acc) =>
          acc.verified &&
          (acc.email.toLowerCase() === normalizedEmail || acc.phone === normalizedPhone)
      );
      if (existingVerified) {
        setAuthError(
          'An account with this email or phone number already exists. Switch to "I already have an account" to sign in.'
        );
        return;
      }

      const newAccount: ResidentAccount = {
        id: `res-${Date.now()}`,
        name: resName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password: resPassword,
        state: selectedState.name,
        lga: lgaName,
        whatsappAlerts: true,
        verified: false,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      onSaveResidentAccount?.(newAccount);
      const code = generateOtpCode();
      setPendingVerification({ account: newAccount, code });
      onNotify?.(`Confirmation code sent via WhatsApp & SMS to ${normalizedPhone}.`);
      return;
    }

    // Sign In: verify against backend or local residentAccounts
    if (!signInIdentifier.trim() || !signInPassword) {
      setAuthError('Enter both your registered email/phone and password.');
      return;
    }

    let matched: ResidentAccount | undefined;
    try {
      const res = await fetch('/api/auth/resident-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: signInIdentifier.trim(),
          password: signInPassword,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        matched = data.resident;
      } else if (res.status === 401 || res.status === 403 || res.status === 400) {
        const errData = await res.json().catch(() => ({}));
        setAuthError(errData.error || 'Could not sign in.');
        return;
      }
    } catch {
      // Fallback to local state if API server is unreachable
    }

    if (!matched) {
      matched = findResidentAccountByIdentifier(residentAccounts, signInIdentifier);
      if (!matched) {
        setAuthError(
          'No account found for this email or phone number. Please create a free account first.'
        );
        return;
      }
      if (matched.status === 'Suspended') {
        setAuthError(
          `Resident account for ${matched.name} is currently suspended by the Office of StreetFix.`
        );
        return;
      }
      if (matched.password !== signInPassword) {
        setAuthError('Incorrect password. Please check your password and try again.');
        return;
      }
    }

    if (!matched.verified) {
      const code = generateOtpCode();
      setPendingVerification({ account: matched, code });
      onNotify?.(`Phone verification required. Code sent via WhatsApp & SMS to ${matched.phone}.`);
      return;
    }

    onLogin({
      name: matched.name,
      role: 'resident',
      jurisdiction: `${matched.state} · ${matched.lga}`,
      email: matched.email,
      phone: matched.phone,
      avatarUrl: matched.avatarUrl,
    });
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddress.trim()) return;
    const lgaName = selectedState.lgas[quickLgaKey]?.name || 'Uyo LGA';
    onQuickCreateIncident({
      category: quickCategory,
      state: selectedState.name,
      lga: lgaName,
      address: quickAddress.trim(),
      severity: quickSeverity,
      description: quickDescription.trim() || undefined,
      hasPhoto: Boolean(quickPhotoUrl),
      photoUrl: quickPhotoUrl || undefined,
    });
    setQuickAddress('');
    setQuickDescription('');
    setQuickSeverity('moderate');
    setQuickPhotoUrl('');
    setQuickPhotoName('');
  };

  // Counts & Live Metrics
  const pendingCount = incidents.filter((i) => i.status === 'pending' || i.status === 'under_review').length;
  const inProgressCount = incidents.filter((i) => i.status === 'in_progress' || i.status === 'assigned').length;
  const fixedCount = incidents.filter((i) => i.status === 'fixed').length;
  const totalCount = incidents.length;
  const resolutionRatePct = totalCount > 0 ? ((fixedCount / totalCount) * 100).toFixed(1) : '0.0';
  const exifVerifiedPct =
    totalCount > 0
      ? Math.round((incidents.filter((i) => i.exifVerified).length / totalCount) * 100)
      : 100;
  const activeCoordinates = STATE_COORDINATES[quickStateKey] || STATE_COORDINATES.akwa_ibom;
  const myReportsCount = incidents.filter(
    (i) =>
      myReportedIds.includes(i.id) ||
      (session && !isAdminSession && i.reporterName.toLowerCase() === session.name.toLowerCase())
  ).length;

  const lgaFilterOptions = getCadastreLgaOptions(
    jurisdictionFilter,
    incidents
      .filter((i) => jurisdictionFilter === 'all' || i.state === jurisdictionFilter)
      .map((i) => i.lga)
  );

  const filteredIncidents = incidents.filter((inc) => {
    const matchesJurisdiction =
      jurisdictionFilter === 'all' || inc.state.toLowerCase().includes(jurisdictionFilter.toLowerCase());
    if (!matchesJurisdiction) return false;
    if (lgaFilter !== 'all' && inc.lga !== lgaFilter) return false;
    if (
      categoryTagFilter !== 'all' &&
      !inc.category.toLowerCase().includes(categoryTagFilter.toLowerCase())
    ) {
      return false;
    }
    if (activeTab === 'all') return true;
    if (activeTab === 'mine') {
      return (
        myReportedIds.includes(inc.id) ||
        Boolean(session && !isAdminSession && inc.reporterName.toLowerCase() === session.name.toLowerCase())
      );
    }
    if (activeTab === 'pending') return inc.status === 'pending' || inc.status === 'under_review';
    if (activeTab === 'in_progress') return inc.status === 'in_progress' || inc.status === 'assigned';
    if (activeTab === 'fixed') return inc.status === 'fixed';
    return true;
  });

  const getCategoryIcon = (cat: IncidentCategory) => {
    switch (cat) {
      case 'Blocked Drainage':
        return <Droplets className="w-5 h-5" />;
      case 'Streetlight Failure':
        return <Lightbulb className="w-5 h-5" />;
      case 'Pothole / Road Failure':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Wrench className="w-5 h-5" />;
    }
  };

  const statusBadge = (status: Incident['status']) => {
    switch (status) {
      case 'fixed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#132E20]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Fixed · Certified
          </span>
        );
      case 'in_progress':
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B96417]">
            <Clock className="w-3.5 h-3.5 text-[#E06236]" />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Pending Dispatch
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="bg-[#0B231A] text-white relative overflow-hidden border-b border-white/10">
        {/* Full-bleed Sliding Construction & Road Repair Background (excludes header) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            className="flex h-full w-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {HERO_SLIDES.map((slide) => (
              <div key={`hero-bg-${slide.title}`} className="relative w-full h-full shrink-0">
                <SafeImage
                  src={slide.url}
                  alt={slide.alt}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-[#0B231A]/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B231A]/90 via-[#0B231A]/65 to-[#0B231A]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B231A]/80 via-transparent to-[#0B231A]/45" />
          <div className="absolute inset-0 civic-grid-bg opacity-40" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Copy & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-[#D8FA64] text-xs font-bold uppercase tracking-wider">
                <span className="w-4 h-0.5 bg-[#D8FA64] inline-block" />
                <span>Better streets start here</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] text-white max-w-xl">
                See a problem. <br />
                <span className="text-[#D8FA64]">Help fix your street.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#A3B899] max-w-xl leading-relaxed">
                Report road craters, blocked drainage, downed streetlights, and neighbourhood hazards with GPS photo evidence, then follow repair crews in real time across all 36 States &amp; FCT.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                {!isAdminSession && (
                  <button
                    type="button"
                    onClick={() => onNavigate('report')}
                    className="inline-flex items-center justify-center gap-2 bg-[#D8FA64] hover:bg-[#C8E665] text-[#0B231A] px-6 py-3.5 rounded-full text-sm font-bold transition-transform active:scale-95 cursor-pointer"
                  >
                    <span>Report an issue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <a
                  href="tel:+23412270000"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full border border-white/20 bg-[#132E20]/70 text-white text-sm font-semibold hover:border-[#D8FA64] hover:text-[#D8FA64] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#D8FA64]" />
                  <span>Call the office (01 227 0000)</span>
                </a>
              </div>

              {/* Trust Metrics */}
              <div className="pt-6 border-t border-white/12 grid grid-cols-3 gap-3 sm:gap-6 max-w-lg">
                <div>
                  <div className="text-lg sm:text-2xl font-bold text-[#D8FA64] tabular-nums">
                    {pendingCount + inProgressCount} Open
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#A3B899]">Active &amp; queued</div>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold text-white tabular-nums">
                    {resolutionRatePct}%
                  </div>
                  <div className="text-[11px] sm:text-xs text-[#A3B899]">Resolution rate</div>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold text-white tabular-nums">36 + FCT</div>
                  <div className="text-[11px] sm:text-xs text-[#A3B899]">Verified coverage</div>
                </div>
              </div>
            </div>

            {/* Right Visual Showcase (Toggleable between Live Crew Photo and Architectural Road Plane) */}
            <div className="lg:col-span-5 flex flex-col gap-3 min-w-0">
              <div className="flex items-center justify-start sm:justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setHeroVisualMode('crew')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    heroVisualMode === 'crew'
                      ? 'bg-[#D8FA64] text-[#0B231A]'
                      : 'bg-[#132E20] text-[#A3B899] hover:text-white'
                  }`}
                >
                  Field Dispatch View
                </button>
                <button
                  type="button"
                  onClick={() => setHeroVisualMode('road')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    heroVisualMode === 'road'
                      ? 'bg-[#D8FA64] text-[#0B231A]'
                      : 'bg-[#132E20] text-[#A3B899] hover:text-white'
                  }`}
                >
                  Road Schematic
                </button>
              </div>

              {heroVisualMode === 'crew' ? (
                <div className="space-y-2.5">
                  <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-[#132E20] shadow-2xl h-72 sm:h-96 group">
                    {/* Horizontal Sliding Track */}
                    <div
                      className="flex h-full transition-transform duration-700 ease-out"
                      style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                    >
                      {HERO_SLIDES.map((slide) => (
                        <div key={slide.title} className="relative w-full h-full shrink-0">
                          <SafeImage
                            src={slide.url}
                            alt={slide.alt}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0B231A] via-[#0B231A]/30 to-transparent" />
                        </div>
                      ))}
                    </div>

                    {/* Top Slide Counter & Controls */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-[#0B231A]/80 backdrop-blur-md border border-white/15 text-[11px] font-mono font-semibold text-[#D8FA64] tabular-nums">
                        {String(activeSlide + 1).padStart(2, '0')} /{' '}
                        {String(HERO_SLIDES.length).padStart(2, '0')} · Field Works
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Previous construction image"
                          onClick={() =>
                            setActiveSlide(
                              (prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length
                            )
                          }
                          className="w-8 h-8 rounded-full bg-[#0B231A]/80 hover:bg-[#D8FA64] text-white hover:text-[#0B231A] border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next construction image"
                          onClick={() =>
                            setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)
                          }
                          className="w-8 h-8 rounded-full bg-[#0B231A]/80 hover:bg-[#D8FA64] text-white hover:text-[#0B231A] border border-white/15 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Bottom Overlay Card */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 p-3.5 sm:p-4 rounded-xl bg-[#0B231A]/90 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3 z-10">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {HERO_SLIDES[activeSlide].title}
                        </p>
                        <p className="text-xs text-[#A3B899] truncate">
                          {HERO_SLIDES[activeSlide].location}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#D8FA64] text-[#0B231A] text-xs font-bold shrink-0">
                        {HERO_SLIDES[activeSlide].badge}
                      </span>
                    </div>
                  </div>

                  {/* Clickable Construction & Repair Filmstrip Thumbnails */}
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                    {HERO_SLIDES.map((slide, idx) => {
                      const isActive = idx === activeSlide;
                      return (
                        <button
                          key={slide.title}
                          type="button"
                          aria-label={`View ${slide.title}`}
                          onClick={() => setActiveSlide(idx)}
                          className={`relative h-11 sm:h-12 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                            isActive
                              ? 'border-[#D8FA64] ring-2 ring-[#D8FA64]/50 opacity-100 scale-[1.02]'
                              : 'border-white/15 opacity-60 hover:opacity-95'
                          }`}
                        >
                          <SafeImage
                            src={slide.url}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="relative road-perspective-container flex items-center justify-center h-72 sm:h-96 overflow-hidden rounded-2xl border border-white/10 bg-[#0B231A]">
                  <div className="road-plane relative w-64 h-[440px] bg-gradient-to-b from-[#183424] via-[#102419] to-[#0A1A12] border-x-4 border-white/15 rounded-sm flex flex-col items-center justify-around py-6">
                    <div className="w-3 h-14 bg-[#D8FA64] rounded-full shadow-[0_0_12px_rgba(216,250,100,0.6)]" />
                    <div className="w-3 h-14 bg-[#D8FA64] rounded-full shadow-[0_0_12px_rgba(216,250,100,0.6)]" />
                    <div className="w-3 h-14 bg-[#D8FA64] rounded-full shadow-[0_0_12px_rgba(216,250,100,0.6)]" />
                    <div className="w-3 h-14 bg-[#D8FA64] rounded-full shadow-[0_0_12px_rgba(216,250,100,0.6)]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. IMPACT METRICS STRIP */}
      <section className="bg-white border-b border-[#E2E8F0] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAF5] border border-[#E2E8F0]">
            <div className="text-2xl font-bold text-[#1A1D1A] tabular-nums">
              {fixedCount} / {totalCount}
            </div>
            <div className="text-xs text-[#4A5568] mt-0.5">Fixed Hazards Logged</div>
          </div>
          <div className="p-4 rounded-xl bg-[#F8FAF5] border border-[#E2E8F0]">
            <div className="text-2xl font-bold text-[#1A1D1A] tabular-nums">
              {pendingCount + inProgressCount} Active
            </div>
            <div className="text-xs text-[#4A5568] mt-0.5">Open Municipal Work Queue</div>
          </div>
          <div className="p-4 rounded-xl bg-[#F8FAF5] border border-[#E2E8F0]">
            <div className="text-2xl font-bold text-[#1A1D1A] tabular-nums">
              {resolutionRatePct}%
            </div>
            <div className="text-xs text-[#4A5568] mt-0.5">Live Case Resolution Rate</div>
          </div>
          <div className="p-4 rounded-xl bg-[#F8FAF5] border border-[#E2E8F0]">
            <div className="text-2xl font-bold text-[#1A1D1A] tabular-nums">
              {exifVerifiedPct}%
            </div>
            <div className="text-xs text-[#4A5568] mt-0.5">Photo-Verified Audits</div>
          </div>
        </div>
      </section>

      {/* 3. TWO-COLUMN WORKSPACE: QUICK REPORT + COMMUNITY TRACKER */}
      <main className="bg-[#F8FAF5] py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Resident Sign Up / Sign In & Quick Report */}
          <aside className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 md:p-7 space-y-6 min-w-0">
            <div className="border-b border-[#E2E8F0] pb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#E06236]">New report</p>
                <h2 className="text-xl font-bold text-[#1A1D1A] mt-0.5">Tell us what’s wrong</h2>
                <p className="text-xs text-[#4A5568] mt-1">
                  Sign up or sign in to submit geo-tagged road &amp; neighbourhood issues to your local council.
                </p>
              </div>
              {session && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-xs font-semibold text-[#4A5568] hover:text-[#E06236] underline shrink-0 cursor-pointer"
                >
                  Sign out
                </button>
              )}
            </div>

            {!session ? (
              pendingVerification ? (
                <OtpVerificationCard
                  phone={pendingVerification.account.phone}
                  email={pendingVerification.account.email}
                  recipientName={pendingVerification.account.name}
                  generatedCode={pendingVerification.code}
                  destinationLabel="your Resident Dashboard"
                  onVerifySuccess={() => {
                    const acc = pendingVerification.account;
                    onVerifyResidentAccount?.(acc.id);
                    setPendingVerification(null);
                    onNotify?.(
                      `Phone verified via WhatsApp & SMS! Resident Dashboard unlocked.`
                    );
                    onLogin({
                      name: acc.name,
                      role: 'resident',
                      jurisdiction: `${acc.state} · ${acc.lga}`,
                      email: acc.email,
                      phone: acc.phone,
                    });
                  }}
                  onResendCode={() => {
                    const nextCode = generateOtpCode();
                    setPendingVerification((prev) =>
                      prev ? { ...prev, code: nextCode } : null
                    );
                    onNotify?.(
                      `New confirmation code sent via WhatsApp & SMS to ${pendingVerification.account.phone}.`
                    );
                  }}
                  onBack={() => setPendingVerification(null)}
                />
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col items-center text-center space-y-2 pt-1">
                    <div className="w-11 h-11 rounded-full bg-[#E6F4EA] text-[#132E20] flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-[#1A1D1A]">Sign in to report safely</h3>
                    <p className="text-xs text-[#4A5568] max-w-xs">
                      Create an account with WhatsApp &amp; SMS confirmation or sign in with your registered details.
                    </p>
                  </div>

                  {/* Sign Up / Sign In Toggle Tabs */}
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F3F4EF] border border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError('');
                      }}
                      className={`py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
                        authMode === 'signup'
                          ? 'bg-white text-[#1A1D1A] shadow-sm'
                          : 'text-[#4A5568] hover:text-[#1A1D1A]'
                      }`}
                    >
                      Create free account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setAuthError('');
                      }}
                      className={`py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
                        authMode === 'signin'
                          ? 'bg-white text-[#1A1D1A] shadow-sm'
                          : 'text-[#4A5568] hover:text-[#1A1D1A]'
                      }`}
                    >
                      I already have an account
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={googleLoading}
                    onClick={handleGoogleSignIn}
                    className="w-full py-2.5 px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAF5] text-[#1A1D1A] text-xs font-bold flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                      />
                    </svg>
                    <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
                  </button>

                  <div className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    <span className="flex-1 h-px bg-[#E2E8F0]" />
                    <span>or continue with email / phone</span>
                    <span className="flex-1 h-px bg-[#E2E8F0]" />
                  </div>

                  {authError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 space-y-1.5">
                      <div>{authError}</div>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signup');
                            setAuthError('');
                          }}
                          className="text-[#E06236] font-bold hover:underline cursor-pointer"
                        >
                          Create a free account now →
                        </button>
                      )}
                    </div>
                  )}

                  <form onSubmit={handleResidentAuthSubmit} className="space-y-3.5">
                    {authMode === 'signup' ? (
                      <>
                        <div>
                          <label htmlFor="res-name" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                            Full Name *
                          </label>
                          <input
                            id="res-name"
                            type="text"
                            required
                            value={resName}
                            onChange={(e) => setResName(e.target.value)}
                            placeholder="e.g. Nsikak Udoh"
                            className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 text-xs text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="min-w-0">
                            <label htmlFor="res-state" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                              State
                            </label>
                            <select
                              id="res-state"
                              value={quickStateKey}
                              onChange={(e) => handleStateChange(e.target.value)}
                              className="w-full min-w-0 max-w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-2.5 py-2 text-xs font-medium text-[#1A1D1A]"
                            >
                              {Object.entries(NIGERIAN_CADASTRE).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="min-w-0">
                            <label htmlFor="res-lga" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                              Local Govt. Area
                            </label>
                            <select
                              id="res-lga"
                              value={quickLgaKey}
                              onChange={(e) => setQuickLgaKey(e.target.value)}
                              className="w-full min-w-0 max-w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-2.5 py-2 text-xs font-medium text-[#1A1D1A]"
                            >
                              {availableLgas.map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="res-phone" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                            Phone Number (WhatsApp / SMS) *
                          </label>
                          <input
                            id="res-phone"
                            type="tel"
                            required
                            value={resPhone}
                            onChange={(e) => setResPhone(e.target.value)}
                            placeholder="+234 803 123 4567"
                            className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 text-xs text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label htmlFor="res-email" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                            Email Address *
                          </label>
                          <input
                            id="res-email"
                            type="email"
                            required
                            value={resEmail}
                            onChange={(e) => setResEmail(e.target.value)}
                            placeholder="resident@example.com"
                            className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 text-xs text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label htmlFor="res-password" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                            Create Password *
                          </label>
                          <div className="relative">
                            <input
                              id="res-password"
                              type={showResPassword ? 'text' : 'password'}
                              required
                              value={resPassword}
                              onChange={(e) => setResPassword(e.target.value)}
                              placeholder="Minimum 6 characters"
                              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 pr-10 text-xs text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowResPassword((prev) => !prev)}
                              aria-label={showResPassword ? 'Hide password' : 'Show password'}
                              title={showResPassword ? 'Hide password' : 'Show password'}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#1A1D1A] cursor-pointer"
                            >
                              {showResPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label htmlFor="res-signin-id" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                            Registered Email or Phone (+234) *
                          </label>
                          <input
                            id="res-signin-id"
                            type="text"
                            required
                            value={signInIdentifier}
                            onChange={(e) => setSignInIdentifier(e.target.value)}
                            placeholder="resident@example.com or 0803 123 4567"
                            className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 text-xs text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label htmlFor="res-signin-password" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                            Password *
                          </label>
                          <div className="relative">
                            <input
                              id="res-signin-password"
                              type={showResPassword ? 'text' : 'password'}
                              required
                              value={signInPassword}
                              onChange={(e) => setSignInPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 pr-10 text-xs text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowResPassword((prev) => !prev)}
                              aria-label={showResPassword ? 'Hide password' : 'Show password'}
                              title={showResPassword ? 'Hide password' : 'Show password'}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4A5568] hover:text-[#1A1D1A] cursor-pointer"
                            >
                              {showResPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-[#E06236] hover:bg-[#D35400] text-white py-3 px-5 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>
                        {authMode === 'signup'
                          ? 'Create account & verify WhatsApp / SMS'
                          : 'Sign in to Resident Dashboard'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )
            ) : isAdminSession ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#0F172A] text-white flex items-center gap-3 text-xs">
                  {session.avatarUrl ? (
                    <SafeImage
                      src={session.avatarUrl}
                      alt={session.name}
                      className="w-9 h-9 rounded-lg object-cover border border-cyan-400/50 shrink-0"
                    />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-[#D8FA64] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold truncate">{session.name}</div>
                    <div className="text-[11px] text-cyan-300 truncate">
                      {session.serviceId || session.jurisdiction}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#4A5568] leading-relaxed">
                  You are signed in with Admin / Officer clearance. Use the Admin Workspace to inspect incoming resident reports, dispatch crews, and certify completed works.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="w-full bg-[#0F172A] hover:bg-slate-800 text-[#D8FA64] py-3 px-5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Return to Admin Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[#E6F4EA] border border-emerald-200 flex items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {session.avatarUrl ? (
                      <SafeImage
                        src={session.avatarUrl}
                        alt={session.name}
                        className="w-8 h-8 rounded-full object-cover border border-emerald-300 shrink-0"
                      />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-[#132E20] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-[#132E20] truncate">{session.name}</div>
                      <div className="text-[11px] text-[#4A5568] truncate">{session.jurisdiction}</div>
                    </div>
                  </div>
                  {onUpdateResidentProfile && (
                    <button
                      type="button"
                      onClick={() => setEditingProfile((prev) => !prev)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-[#132E20] font-bold hover:bg-emerald-50 shrink-0 cursor-pointer"
                    >
                      {editingProfile ? 'Close Profile' : 'Edit Profile'}
                    </button>
                  )}
                </div>

                {editingProfile && onUpdateResidentProfile && (
                  <form
                    onSubmit={handleSaveResidentProfileSubmit}
                    className="p-4 rounded-xl bg-[#F8FAF5] border border-[#CBD5E1] space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                      <span className="font-bold text-[#132E20]">Resident Profile Settings</span>
                      <label className="px-2.5 py-1 rounded-lg bg-white border border-[#CBD5E1] font-semibold text-[#132E20] hover:border-[#132E20] cursor-pointer">
                        <span>{profAvatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleResidentAvatarUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label htmlFor="res-prof-name" className="block font-semibold text-[#1A1D1A] mb-1">
                          Full Name
                        </label>
                        <input
                          id="res-prof-name"
                          type="text"
                          required
                          value={profName}
                          onChange={(e) => setProfName(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1A1D1A]"
                        />
                      </div>
                      <div>
                        <label htmlFor="res-prof-phone" className="block font-semibold text-[#1A1D1A] mb-1">
                          WhatsApp / SMS Phone
                        </label>
                        <input
                          id="res-prof-phone"
                          type="tel"
                          required
                          value={profPhone}
                          onChange={(e) => setProfPhone(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1A1D1A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="res-prof-email" className="block font-semibold text-[#1A1D1A] mb-1">
                        Email Address
                      </label>
                      <input
                        id="res-prof-email"
                        type="email"
                        required
                        value={profEmail}
                        onChange={(e) => setProfEmail(e.target.value)}
                        className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1A1D1A]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label htmlFor="res-prof-state" className="block font-semibold text-[#1A1D1A] mb-1">
                          Home State
                        </label>
                        <select
                          id="res-prof-state"
                          value={profStateKey}
                          onChange={(e) => {
                            const nextKey = e.target.value;
                            setProfStateKey(nextKey);
                            const first = Object.values(NIGERIAN_CADASTRE[nextKey]?.lgas || {})[0];
                            if (first) setProfLgaName(first.name);
                          }}
                          className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1A1D1A]"
                        >
                          {Object.entries(NIGERIAN_CADASTRE).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="res-prof-lga" className="block font-semibold text-[#1A1D1A] mb-1">
                          Local Govt. Area
                        </label>
                        <select
                          id="res-prof-lga"
                          value={profLgaName}
                          onChange={(e) => setProfLgaName(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#1A1D1A]"
                        >
                          {profAvailableLgas.map((lgaObj) => (
                            <option key={lgaObj.name} value={lgaObj.name}>
                              {lgaObj.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="res-prof-pass" className="block font-semibold text-[#1A1D1A] mb-1">
                        New Password (optional)
                      </label>
                      <div className="relative">
                        <input
                          id="res-prof-pass"
                          type={showProfPassword ? 'text' : 'password'}
                          value={profNewPassword}
                          onChange={(e) => setProfNewPassword(e.target.value)}
                          placeholder="Leave blank to keep existing password"
                          className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 pr-9 text-xs text-[#1A1D1A]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowProfPassword((prev) => !prev)}
                          aria-label={showProfPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4A5568] cursor-pointer"
                        >
                          {showProfPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={profSaving}
                      className="w-full py-2 rounded-lg bg-[#132E20] hover:bg-[#183D2A] text-[#D8FA64] font-bold text-xs cursor-pointer disabled:opacity-60"
                    >
                      {profSaving ? 'Saving Profile...' : 'Save Resident Profile'}
                    </button>
                  </form>
                )}

                <form onSubmit={handleQuickSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1D1A] mb-2">
                      Issue category
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(
                        [
                          'Pothole / Road Failure',
                          'Blocked Drainage',
                          'Waste Heap / Sanitation',
                          'Streetlight Failure',
                          'Pipe Burst / Water Leak',
                          'Traffic Signal Defect',
                        ] as IncidentCategory[]
                      ).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setQuickCategory(cat)}
                          className={`px-3 py-2.5 rounded-xl border text-left text-xs font-semibold transition-colors cursor-pointer ${
                            quickCategory === cat
                              ? 'bg-[#132E20] text-[#D8FA64] border-[#132E20]'
                              : 'bg-[#F8FAF5] text-[#1A1D1A] border-[#E2E8F0] hover:border-[#132E20]/40'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="block text-xs font-semibold text-[#1A1D1A]">
                        Condition severity
                      </label>
                      <span className="text-[11px] font-medium text-[#4A5568]">
                        Urgency level
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          value: 'low' as const,
                          label: 'Low',
                          active: 'bg-emerald-700 text-white border-emerald-700',
                        },
                        {
                          value: 'moderate' as const,
                          label: 'Moderate',
                          active: 'bg-amber-600 text-white border-amber-600',
                        },
                        {
                          value: 'critical' as const,
                          label: 'Serious',
                          active: 'bg-red-700 text-white border-red-700',
                        },
                      ].map((sev) => (
                        <button
                          key={sev.value}
                          type="button"
                          onClick={() => setQuickSeverity(sev.value)}
                          className={`px-2.5 py-2 rounded-xl border text-xs font-bold text-center transition-colors cursor-pointer ${
                            quickSeverity === sev.value
                              ? sev.active
                              : 'bg-[#F8FAF5] text-[#1A1D1A] border-[#E2E8F0] hover:border-[#132E20]/40'
                          }`}
                        >
                          {sev.label}
                        </button>
                      ))}
                    </div>
                    {quickSeverity === 'critical' && (
                      <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] font-medium text-red-800 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                        <span>
                          Serious condition selected: sends an urgent alert directly to the Admin Portal (24h priority SLA).
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <label htmlFor="quick-state" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                        State
                      </label>
                      <select
                        id="quick-state"
                        value={quickStateKey}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full min-w-0 max-w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 text-xs font-medium text-[#1A1D1A] focus:border-[#132E20] focus:outline-none"
                      >
                        {Object.entries(NIGERIAN_CADASTRE).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="quick-lga" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                        Local Govt. Area
                      </label>
                      <select
                        id="quick-lga"
                        value={quickLgaKey}
                        onChange={(e) => setQuickLgaKey(e.target.value)}
                        className="w-full min-w-0 max-w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 text-xs font-medium text-[#1A1D1A] focus:border-[#132E20] focus:outline-none"
                      >
                        {availableLgas.map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="quick-address" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                      Street address or landmark
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#4A5568] absolute left-3 top-2.5" />
                      <input
                        id="quick-address"
                        type="text"
                        required
                        value={quickAddress}
                        onChange={(e) => setQuickAddress(e.target.value)}
                        placeholder="e.g. Opposite Ibom Plaza, Oron Road"
                        className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] pl-9 pr-3 py-2 text-xs text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="quick-description" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                      Condition details (optional)
                    </label>
                    <textarea
                      id="quick-description"
                      rows={2}
                      value={quickDescription}
                      onChange={(e) => setQuickDescription(e.target.value)}
                      placeholder="Describe road damage, flood depth, or safety hazard..."
                      className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 text-xs text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                    />
                  </div>

                  {quickPhotoUrl ? (
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/60 p-3 space-y-2.5">
                      <div className="relative w-full h-40 rounded-lg overflow-hidden border border-emerald-200 bg-slate-900">
                        <img
                          src={quickPhotoUrl}
                          alt={quickPhotoName || 'Uploaded photographic evidence'}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          aria-label="Remove uploaded photo"
                          onClick={() => {
                            setQuickPhotoUrl('');
                            setQuickPhotoName('');
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white flex items-center justify-center cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <div className="font-bold text-emerald-900 truncate">
                            {quickPhotoName || 'Uploaded evidence'}
                          </div>
                          <div className="text-[11px] font-mono text-emerald-700">
                            EXIF Geotagged ({activeCoordinates.lat.toFixed(4)}° N,{' '}
                            {activeCoordinates.lng.toFixed(4)}° E)
                          </div>
                        </div>
                        <label className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-semibold hover:bg-emerald-100 shrink-0 cursor-pointer">
                          <span>Replace</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQuickPhotoUpload}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="block w-full border border-dashed border-[#CBD5E1] bg-[#F8FAF5] hover:border-[#E06236] hover:bg-[#F3F4EF] rounded-xl p-4 text-center transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQuickPhotoUpload}
                        className="sr-only"
                      />
                      <Upload className="w-5 h-5 mx-auto mb-1 text-[#E06236]" />
                      <div className="text-xs font-semibold text-[#1A1D1A]">
                        Attach photographic evidence (auto-geotags GPS)
                      </div>
                      <div className="text-[11px] text-[#4A5568] mt-0.5">
                        Click to choose JPG, PNG, or HEIC from your device
                      </div>
                    </label>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-[#E06236] hover:bg-[#D35400] text-white py-3 px-5 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span>Submit Report &amp; Track</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => onNavigate('report')}
                  className="w-full text-center text-xs font-bold text-[#132E20] hover:text-[#E06236] hover:underline cursor-pointer"
                >
                  Open full GPS Geotag Studio →
                </button>
              </div>
            )}

            {/* Quick Jurisdiction Search */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
              <label
                htmlFor="quick-jurisdiction-filter"
                className="block text-[11px] font-bold uppercase tracking-wider text-[#4A5568]"
              >
                Quick Jurisdiction Search
              </label>
              <select
                id="quick-jurisdiction-filter"
                value={jurisdictionFilter}
                onChange={(e) => {
                  setJurisdictionFilter(e.target.value);
                  setLgaFilter('all');
                }}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 text-xs font-semibold text-[#1A1D1A]"
              >
                <option value="all">All Jurisdictions (36 States + FCT)</option>
                {Object.entries(NIGERIAN_CADASTRE).map(([k, v]) => (
                  <option key={k} value={v.name}>
                    {v.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by Local Government Area"
                value={lgaFilter}
                onChange={(e) => setLgaFilter(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAF5] px-3 py-2 text-xs font-semibold text-[#1A1D1A]"
              >
                <option value="all">
                  {jurisdictionFilter === 'all'
                    ? 'All LGAs (774 Nationwide)'
                    : `All LGAs in ${jurisdictionFilter}`}
                </option>
                {lgaFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '#All', val: 'all' },
                  { label: '#Potholes', val: 'pothole' },
                  { label: '#Drainage', val: 'drainage' },
                  { label: '#Streetlights', val: 'streetlight' },
                  { label: '#Sanitation', val: 'waste' },
                ].map((tag) => (
                  <button
                    key={tag.val}
                    type="button"
                    onClick={() => setCategoryTagFilter(tag.val)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      categoryTagFilter === tag.val
                        ? 'bg-[#132E20] text-[#D8FA64]'
                        : 'bg-[#F3F4EF] text-[#4A5568] hover:text-[#1A1D1A]'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* RIGHT COLUMN: Community Tracker */}
          <section className="lg:col-span-7 space-y-6 min-w-0">
            {/* Reporter Live Notifications Banner */}
            {notifications.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#0B231A] text-[#D8FA64] flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1A1D1A]">
                        Updates on Your Submitted Reports
                      </h3>
                      <p className="text-[11px] text-[#4A5568]">
                        {notifications.filter((n) => !n.read).length > 0
                          ? `${notifications.filter((n) => !n.read).length} new notification(s) from Municipal Operations`
                          : 'All report notifications read'}
                      </p>
                    </div>
                  </div>
                  {notifications.some((n) => !n.read) && onMarkAllNotificationsRead && (
                    <button
                      type="button"
                      onClick={onMarkAllNotificationsRead}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F3F4EF] hover:bg-[#E2E8F0] text-[11px] font-bold text-[#132E20] cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {notifications.slice(0, 3).map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        !notif.read
                          ? 'bg-[#F4FBE4] border-[#C8E665]'
                          : 'bg-[#F8FAF5] border-[#E2E8F0]'
                      }`}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="font-mono font-bold text-[#132E20]">{notif.refCode}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#4A5568]">{notif.createdAt}</span>
                          {!notif.read && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-bold text-[#E06236]">New</span>
                            </>
                          )}
                        </div>
                        <div className="text-xs font-bold text-[#1A1D1A]">{notif.title}</div>
                        <p className="text-xs text-[#4A5568]">{notif.message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onMarkNotificationRead?.(notif.id);
                          onSelectIncident(notif.incidentId);
                          onNavigate('directory');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0B231A] text-[#D8FA64] text-[11px] font-bold hover:bg-[#132E20] shrink-0 self-start sm:self-center cursor-pointer whitespace-nowrap"
                      >
                        View Case →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#E06236]">
                  Community tracker
                </p>
                <h2 className="text-2xl font-bold text-[#1A1D1A] mt-0.5">Recent street reports</h2>
                <p className="text-sm text-[#4A5568] mt-1">
                  Follow what’s happening across the neighbourhood.
                </p>
              </div>
              <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
                <span className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums leading-none">
                  {previewEmpty ? 0 : filteredIncidents.length}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#4A5568]">
                  Active reports
                </span>
              </div>
            </div>

            {/* Filter Bar + Jurisdiction + Empty View Toggle */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: 'all' as const, label: 'All', count: incidents.length },
                  ...(session && !isAdminSession
                    ? [{ key: 'mine' as const, label: 'My Reports', count: myReportsCount }]
                    : []),
                  { key: 'pending' as const, label: 'Pending', count: pendingCount },
                  { key: 'in_progress' as const, label: 'In Progress', count: inProgressCount },
                  { key: 'fixed' as const, label: 'Fixed', count: fixedCount },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setPreviewEmpty(false);
                      setActiveTab(tab.key);
                    }}
                    className={`pb-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer ${
                      activeTab === tab.key && !previewEmpty
                        ? 'border-[#E06236] text-[#1A1D1A]'
                        : 'border-transparent text-[#4A5568] hover:text-[#1A1D1A]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-xs font-mono text-[#4A5568] tabular-nums">{tab.count}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter by state"
                  value={jurisdictionFilter}
                  onChange={(e) => {
                    setJurisdictionFilter(e.target.value);
                    setLgaFilter('all');
                  }}
                  className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#1A1D1A] max-w-full min-w-0"
                >
                  <option value="all">All 36 States + FCT</option>
                  {Object.entries(NIGERIAN_CADASTRE).map(([k, v]) => (
                    <option key={k} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter tracker by LGA"
                  value={lgaFilter}
                  onChange={(e) => setLgaFilter(e.target.value)}
                  className="bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#1A1D1A] max-w-[200px] min-w-0"
                >
                  <option value="all">All LGAs</option>
                  {lgaFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setPreviewEmpty(!previewEmpty)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#EDEEE9] hover:bg-[#E1E3DE] text-xs font-semibold text-[#1A1D1A] cursor-pointer shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{previewEmpty ? 'Show active' : 'Preview empty'}</span>
                </button>
              </div>
            </div>

            {/* Report Cards or Empty State */}
            {previewEmpty || filteredIncidents.length === 0 ? (
              <div className="border-[1.5px] border-dashed border-[#CBD5E1] bg-white rounded-2xl p-6 sm:p-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#E6F4EA] flex items-center justify-center text-[#132E20] mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-[#1A1D1A] mb-1">No reports yet</h3>
                <p className="text-sm text-[#4A5568] max-w-sm mb-6">
                  Be the first to help improve your street. Submit a geo-tagged report for immediate municipal triage.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('report')}
                  className="inline-flex items-center gap-2 bg-[#132E20] text-[#D8FA64] px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#183D2A] cursor-pointer"
                >
                  <LocateFixed className="w-4 h-4" />
                  <span>Submit the first report</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((inc) => (
                  <article
                    key={inc.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 hover:border-[#132E20]/40 transition-colors flex flex-col sm:flex-row gap-4 justify-between"
                  >
                    <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-[#E2E8F0] shrink-0 bg-[#F3F4EF] flex items-center justify-center text-[#132E20]">
                        {inc.beforePhotoUrl ? (
                          <SafeImage
                            src={inc.beforePhotoUrl}
                            alt={inc.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getCategoryIcon(inc.category)
                        )}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A5568]">
                          {statusBadge(inc.status)}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[11px] font-semibold text-[#132E20]">
                            {inc.refCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`text-[11px] font-bold ${
                              inc.severity === 'critical'
                                ? 'text-red-700'
                                : inc.severity === 'moderate'
                                ? 'text-amber-700'
                                : 'text-slate-600'
                            }`}
                          >
                            {inc.severity === 'critical'
                              ? 'Serious'
                              : inc.severity === 'moderate'
                              ? 'Moderate'
                              : 'Low'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{inc.reportedAt}</span>
                        </div>
                        <h3 className="text-base font-bold text-[#1A1D1A] break-words sm:truncate">
                          {inc.title}
                        </h3>
                        <p className="text-xs text-[#4A5568] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#727973] shrink-0" />
                          <span className="truncate">
                            {inc.state}, {inc.lga} · {inc.address}
                            {inc.assignedUnit !== 'Unassigned' ? ` · ${inc.assignedUnit}` : ''}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E2E8F0] shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => onConfirmIncident(inc.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4A5568] hover:text-[#132E20] cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-[#526600]" />
                        <span className="tabular-nums">{inc.confirmations} confirmations</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectIncident(inc.id);
                          onNavigate('directory');
                        }}
                        className="text-xs font-bold text-[#132E20] hover:text-[#E06236] hover:underline cursor-pointer whitespace-nowrap"
                      >
                        View timeline →
                      </button>
                    </div>
                  </article>
                ))}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => onNavigate('directory')}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#132E20] hover:text-[#E06236] transition-colors cursor-pointer"
                  >
                    <span>Browse all {incidents.length} reports in the open civic registry</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
