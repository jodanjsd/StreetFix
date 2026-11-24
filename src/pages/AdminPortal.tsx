import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  ClipboardCheck,
  Users,
  SlidersHorizontal,
  LayoutGrid,
  Truck,
  BarChart3,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
  Megaphone,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Search,
  Building2,
  MapPin,
  X,
  Check,
  ShieldAlert,
  Bell,
  CheckCheck,
  Send,
  UserCog,
  UserPlus,
  Upload,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  AppNotification,
  BroadcastAdvisory,
  GlobalPolicies,
  Incident,
  IncidentStatus,
  ResidentAccount,
  ScreenRoute,
  StaffMember,
  UserSession,
} from '../types';
import { DEPARTMENT_QUOTAS, NIGERIAN_CADASTRE, getCadastreLgaOptions } from '../data/mockData';
import { SafeImage } from '../components/SafeImage';
import { BrandLogo, BrandMark } from '../components/BrandLogo';
import { readCompressedImageFile } from '../utils/imageUpload';

interface AdminPortalProps {
  incidents: Incident[];
  staff: StaffMember[];
  residentAccounts?: ResidentAccount[];
  session: UserSession | null;
  globalPolicies?: GlobalPolicies;
  advisories?: BroadcastAdvisory[];
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onLogin: (session: UserSession, rawPasscode?: string) => void;
  onSignOut: () => void;
  onNavigate: (route: ScreenRoute) => void;
  onSelectIncident: (id: string) => void;
  onAssignUnit: (id: string, unit: string) => void;
  onUpdateIncidentStatus?: (id: string, status: IncidentStatus, note?: string) => void;
  onDeleteIncident?: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onToggleStaffStatus: (id: string) => void;
  onOfficeDeleteAdmin?: (targetId: string) => Promise<{ ok: boolean; error?: string }>;
  onOfficeModerateResident?: (
    residentId: string,
    patch: { verified?: boolean; status?: 'Active' | 'Suspended' }
  ) => Promise<{ ok: boolean; error?: string }>;
  onOfficeDeleteResident?: (residentId: string) => Promise<{ ok: boolean; error?: string }>;
  onUpdateGlobalPolicies?: (
    partial: Partial<GlobalPolicies>
  ) => Promise<{ ok: boolean; error?: string }>;
  onPostAdvisory?: (text: string) => Promise<{ ok: boolean; error?: string }>;
  onUpdateOwnProfile?: (payload: {
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    newPasscode?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onOfficeRegisterAdmin?: (
    payload: Omit<StaffMember, 'id' | 'initials' | 'lastTelemetry' | 'lastAction'> & {
      passcode: string;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  onOfficeUpdateAdmin?: (
    targetId: string,
    payload: Partial<StaffMember>
  ) => Promise<{ ok: boolean; error?: string }>;
  onCertifyIncident: (id: string) => void;
  onReopenIncident: (id: string) => void;
  onNotify: (msg: string, urgent?: boolean) => void;
}

type AdminTab = 'overview' | 'workorders' | 'profile' | 'staff' | 'office' | 'policies';

const DISPATCH_UNITS = [
  'Unassigned',
  'AKRMA Squad 4',
  'Akwa Ibom Drainage Unit #12',
  'AKRMA Rapid Unit 02',
  'AKSEPB Compactor Truck #22',
  'Ibom Power Streetlight Unit',
  'FCDA Electrical Maintenance',
];

const DEFAULT_POLICIES: GlobalPolicies = {
  exifStrict: true,
  autoRoutePotholes: true,
  autoEscalateSla: true,
  openLedger: true,
  slaTargetHours: '48',
};

export const AdminPortal: React.FC<AdminPortalProps> = ({
  incidents,
  staff,
  residentAccounts = [],
  session,
  globalPolicies,
  advisories,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onLogin,
  onSignOut,
  onNavigate,
  onSelectIncident,
  onAssignUnit,
  onUpdateIncidentStatus,
  onDeleteIncident,
  onToggleStaffStatus,
  onOfficeDeleteAdmin,
  onOfficeModerateResident,
  onOfficeDeleteResident,
  onUpdateGlobalPolicies,
  onPostAdvisory,
  onUpdateOwnProfile,
  onOfficeRegisterAdmin,
  onOfficeUpdateAdmin,
  onCertifyIncident,
  onReopenIncident,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [queueFilter, setQueueFilter] = useState<'all' | 'active' | 'pending' | 'fixed'>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [lgaFilter, setLgaFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewIncidentId, setPreviewIncidentId] = useState<string | null>(null);
  const [confirmDeleteIncidentId, setConfirmDeleteIncidentId] = useState<string | null>(null);
  const [confirmDeleteStaffId, setConfirmDeleteStaffId] = useState<string | null>(null);
  const [confirmDeleteResidentId, setConfirmDeleteResidentId] = useState<string | null>(null);
  const [alertsDrawerOpen, setAlertsDrawerOpen] = useState(false);
  const [officialActionNote, setOfficialActionNote] = useState('');
  const alertsDrawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!alertsDrawerOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (alertsDrawerRef.current && !alertsDrawerRef.current.contains(e.target as Node)) {
        setAlertsDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [alertsDrawerOpen]);

  const [advisoryText, setAdvisoryText] = useState('');
  const [localAdvisories, setLocalAdvisories] = useState<BroadcastAdvisory[]>([
    {
      id: 'b-1',
      time: 'Today · 08:15 WAT',
      author: 'Aisha Bello (#AKSG-SEC-8821)',
      text: 'All Drainage Rapid Units placed on convective rainfall alert across Uyo, Eket, and Oron corridors.',
    },
  ]);
  const [localPolicies, setLocalPolicies] = useState<GlobalPolicies>(DEFAULT_POLICIES);
  const activePolicies = globalPolicies || localPolicies;
  const activeAdvisories = advisories && advisories.length > 0 ? advisories : localAdvisories;

  // Admin Sign-In Form State
  const [adminServiceId, setAdminServiceId] = useState('#AKSG-WRK-4091');
  const [adminName, setAdminName] = useState('Engr. Iniobong Ekpo');
  const [adminDepartment, setAdminDepartment] = useState('Akwa Ibom Roads (AKRMA)');
  const [adminMfaMethod, setAdminMfaMethod] = useState('2FA Active');
  const [adminPasscode, setAdminPasscode] = useState('AdminClearance#2026');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin Self-Service Profile Edit State (Important fields only)
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileNewPasscode, setProfileNewPasscode] = useState('');
  const [showProfilePasscode, setShowProfilePasscode] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Office of StreetFix Backend: Register New Admin State
  const [regName, setRegName] = useState('');
  const [regServiceId, setRegServiceId] = useState('');
  const [regTitle, setRegTitle] = useState('Municipal Operations Officer');
  const [regDept, setRegDept] = useState('Akwa Ibom Roads (AKRMA)');
  const [regRoleLevel, setRegRoleLevel] = useState<StaffMember['roleLevel']>('FIELD SQUAD LEAD');
  const [regStateKey, setRegStateKey] = useState('akwa_ibom');
  const [regLgaKey, setRegLgaKey] = useState('uyo');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regMfa, setRegMfa] = useState('2FA Active');
  const [regStatus, setRegStatus] = useState<StaffMember['status']>('Active');
  const [regPasscode, setRegPasscode] = useState('AdminClearance#2026');
  const [regAvatarUrl, setRegAvatarUrl] = useState('');
  const [regError, setRegError] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Office of StreetFix Backend: Edit ALL Parts Modal State
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    serviceId: string;
    title: string;
    department: string;
    roleLevel: StaffMember['roleLevel'];
    lgaJurisdiction: string;
    mfaMethod: string;
    status: StaffMember['status'];
    email: string;
    phone: string;
    avatarUrl: string;
    passcode: string;
  }>({
    name: '',
    serviceId: '',
    title: '',
    department: '',
    roleLevel: 'FIELD SQUAD LEAD',
    lgaJurisdiction: '',
    mfaMethod: '2FA Active',
    status: 'Active',
    email: '',
    phone: '',
    avatarUrl: '',
    passcode: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const isAdminAuthenticated = Boolean(
    session && (session.role === 'admin' || session.role === 'staff')
  );
  const isStreetFixOffice = Boolean(isAdminAuthenticated && session?.isStreetFixOffice);

  // Regular municipal officers only (Office of StreetFix HQ is a separate website backend authority)
  const rosterOfficers = useMemo(
    () => staff.filter((m) => !m.isStreetFixOffice && m.id !== 'st-hq'),
    [staff]
  );
  const hqOfficer = useMemo(
    () => staff.find((m) => m.isStreetFixOffice || m.id === 'st-hq') || null,
    [staff]
  );

  const isSelfStaffMember = (member: StaffMember) =>
    Boolean(
      session?.serviceId &&
        member.serviceId.toLowerCase() === session.serviceId.toLowerCase()
    );

  const editingTarget = useMemo(
    () => staff.find((m) => m.id === editingStaffId) || null,
    [staff, editingStaffId]
  );
  const isEditTargetSelfOrHq = Boolean(
    editingTarget &&
      (editingTarget.id === 'st-hq' ||
        editingTarget.isStreetFixOffice ||
        isSelfStaffMember(editingTarget))
  );

  const activeOfficer = useMemo(
    () =>
      staff.find(
        (s) =>
          (session?.serviceId &&
            s.serviceId.toLowerCase() === session.serviceId.toLowerCase()) ||
          s.name.toLowerCase() === (session?.name || '').toLowerCase()
      ),
    [staff, session]
  );

  useEffect(() => {
    if (!activeOfficer) return;
    setProfileName(activeOfficer.name);
    setProfileEmail(activeOfficer.email || '');
    setProfilePhone(activeOfficer.phone || '');
    setProfileAvatarUrl(activeOfficer.avatarUrl || '');
    setProfileNewPasscode('');
  }, [activeOfficer]);

  useEffect(() => {
    if (!isStreetFixOffice && activeTab === 'office') {
      setActiveTab('overview');
    }
  }, [isStreetFixOffice, activeTab]);

  const activeOfficerAvatar = session?.avatarUrl || activeOfficer?.avatarUrl;

  const regSelectedState = NIGERIAN_CADASTRE[regStateKey] || NIGERIAN_CADASTRE.akwa_ibom;
  const regLgaEntries = Object.entries(regSelectedState.lgas);

  const handleSelectOfficerPreset = (member: StaffMember) => {
    setAdminServiceId(member.serviceId);
    setAdminName(member.name);
    setAdminDepartment(member.department);
    setAdminMfaMethod(member.mfaMethod);
    setAdminPasscode(
      member.passcode || (member.isStreetFixOffice ? 'OfficeBackend#2026' : 'AdminClearance#2026')
    );
    setLoginError('');
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminServiceId.trim() || !adminPasscode.trim()) {
      setLoginError('Enter both your Official Service ID and Admin Passcode.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    let authenticatedOfficer: StaffMember | null = null;
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: adminServiceId.trim(),
          passcode: adminPasscode.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const seedMatch = staff.find(
          (s) => s.id === data.officer.id || s.serviceId.toLowerCase() === data.officer.serviceId.toLowerCase()
        );
        authenticatedOfficer = {
          ...seedMatch,
          ...data.officer,
          avatarUrl: data.officer.avatarUrl || seedMatch?.avatarUrl,
        };
      } else {
        const errData = await res.json().catch(() => ({}));
        setIsLoggingIn(false);
        setLoginError(errData.error || 'Officer authentication failed.');
        return;
      }
    } catch {
      // Fallback local verification if Express server is unreachable
      const matched = staff.find(
        (s) => s.serviceId.toLowerCase() === adminServiceId.trim().toLowerCase()
      );
      if (!matched) {
        setIsLoggingIn(false);
        setLoginError(
          'No authorized officer account found for this Service ID. Only officers registered by the Office of StreetFix can log in.'
        );
        return;
      }
      if (matched.status === 'Suspended') {
        setIsLoggingIn(false);
        setLoginError(`Clearance suspended for ${matched.name}. Contact Office of StreetFix.`);
        return;
      }
      if (matched.status === 'Pending') {
        setIsLoggingIn(false);
        setLoginError(`Clearance pending approval for ${matched.name}. Contact Office of StreetFix.`);
        return;
      }
      const expectedPasscode =
        matched.passcode || (matched.isStreetFixOffice ? 'OfficeBackend#2026' : 'AdminClearance#2026');
      if (adminPasscode.trim() !== expectedPasscode) {
        setIsLoggingIn(false);
        setLoginError('Incorrect Admin Passcode. Please verify your clearance credentials.');
        return;
      }
      authenticatedOfficer = matched;
    }

    setIsLoggingIn(false);
    if (!authenticatedOfficer) return;

    onLogin(
      {
        name: authenticatedOfficer.name,
        role:
          authenticatedOfficer.roleLevel === 'FIELD TECHNICIAN' ||
          authenticatedOfficer.roleLevel === 'FIELD SQUAD LEAD'
            ? 'staff'
            : 'admin',
        jurisdiction: authenticatedOfficer.department,
        serviceId: authenticatedOfficer.serviceId,
        avatarUrl: authenticatedOfficer.avatarUrl,
        email: authenticatedOfficer.email,
        phone: authenticatedOfficer.phone,
        roleLevel: authenticatedOfficer.roleLevel,
        isStreetFixOffice: Boolean(authenticatedOfficer.isStreetFixOffice),
      },
      adminPasscode.trim()
    );
  };

  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onLoad: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readCompressedImageFile(
      file,
      (dataUrl) => onLoad(dataUrl),
      (err) => onNotify(err, true)
    );
    e.target.value = '';
  };

  const handleSaveOwnProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateOwnProfile) return;
    if (profileNewPasscode.trim() && profileNewPasscode.trim().length < 6) {
      onNotify('New passcode must be at least 6 characters.');
      return;
    }
    setProfileSaving(true);
    await onUpdateOwnProfile({
      name: profileName.trim(),
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
      avatarUrl: profileAvatarUrl || undefined,
      newPasscode: profileNewPasscode.trim() || undefined,
    });
    setProfileNewPasscode('');
    setProfileSaving(false);
  };

  const handleOfficeRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onOfficeRegisterAdmin) return;
    setRegError('');
    if (!regName.trim()) {
      setRegError('Enter the full name of the admin or officer.');
      return;
    }
    if (regPasscode.trim().length < 6) {
      setRegError('Initial clearance passcode must be at least 6 characters.');
      return;
    }
    setRegSubmitting(true);
    const lgaLabel =
      regLgaKey === 'all'
        ? `Statewide (${regSelectedState.name})`
        : `${regSelectedState.lgas[regLgaKey]?.name || 'Uyo LGA'}, ${regSelectedState.name}`;
    const result = await onOfficeRegisterAdmin({
      name: regName.trim(),
      serviceId: regServiceId.trim(),
      title: regTitle.trim() || 'Municipal Operations Officer',
      department: regDept,
      roleLevel: regRoleLevel,
      lgaJurisdiction: lgaLabel,
      mfaMethod: regMfa,
      status: regStatus,
      email: regEmail.trim() || undefined,
      phone: regPhone.trim() || undefined,
      avatarUrl: regAvatarUrl || undefined,
      passcode: regPasscode.trim(),
      isStreetFixOffice: false,
    });
    setRegSubmitting(false);
    if (!result.ok) {
      setRegError(result.error || 'Could not register admin.');
      return;
    }
    setRegName('');
    setRegServiceId('');
    setRegEmail('');
    setRegPhone('');
    setRegAvatarUrl('');
  };

  const openOfficeEditModal = (member: StaffMember) => {
    if (!isStreetFixOffice) {
      onNotify('Restricted: Only the Office of StreetFix (Website Backend) can edit all parts of an admin profile.');
      return;
    }
    setEditingStaffId(member.id);
    setEditForm({
      name: member.name,
      serviceId: member.serviceId,
      title: member.title,
      department: member.department,
      roleLevel: member.roleLevel,
      lgaJurisdiction: member.lgaJurisdiction,
      mfaMethod: member.mfaMethod,
      status: member.status,
      email: member.email || '',
      phone: member.phone || '',
      avatarUrl: member.avatarUrl || '',
      passcode: '',
    });
  };

  const handleOfficeEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffId || !onOfficeUpdateAdmin) return;
    setEditSubmitting(true);
    const result = await onOfficeUpdateAdmin(editingStaffId, {
      name: editForm.name.trim(),
      serviceId: editForm.serviceId.trim(),
      title: editForm.title.trim(),
      department: editForm.department,
      roleLevel: editForm.roleLevel,
      lgaJurisdiction: editForm.lgaJurisdiction.trim(),
      mfaMethod: editForm.mfaMethod,
      status: editForm.status,
      email: editForm.email.trim() || undefined,
      phone: editForm.phone.trim() || undefined,
      avatarUrl: editForm.avatarUrl || undefined,
      ...(editForm.passcode.trim().length >= 6 ? { passcode: editForm.passcode.trim() } : {}),
    });
    setEditSubmitting(false);
    if (result.ok) {
      setEditingStaffId(null);
    }
  };

  const pendingIncidents = useMemo(
    () => incidents.filter((i) => i.status === 'pending' || i.status === 'under_review'),
    [incidents]
  );
  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.status === 'in_progress' || i.status === 'assigned'),
    [incidents]
  );
  const fixedIncidents = useMemo(
    () => incidents.filter((i) => i.status === 'fixed'),
    [incidents]
  );
  const criticalOpenIncidents = useMemo(
    () => incidents.filter((i) => i.severity === 'critical' && i.status !== 'fixed'),
    [incidents]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications]
  );
  const unreadSeriousAlerts = useMemo(
    () => unreadNotifications.filter((n) => n.actionType === 'serious_report'),
    [unreadNotifications]
  );

  const priorityOverviewQueue = useMemo(() => {
    const open = incidents.filter((i) => i.status !== 'fixed');
    const pendingOrCritical = open.filter(
      (i) => i.status === 'pending' || i.severity === 'critical'
    );
    return (pendingOrCritical.length > 0 ? pendingOrCritical : open).slice(0, 6);
  }, [incidents]);

  const allStatesList = useMemo(
    () => Object.values(NIGERIAN_CADASTRE).map((s) => s.name),
    []
  );

  const lgaFilterOptions = useMemo(
    () =>
      getCadastreLgaOptions(
        stateFilter,
        incidents
          .filter((i) => stateFilter === 'all' || i.state === stateFilter)
          .map((i) => i.lga)
      ),
    [stateFilter, incidents]
  );

  const filteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return incidents.filter((inc) => {
      if (queueFilter === 'active' && inc.status !== 'in_progress' && inc.status !== 'assigned') {
        return false;
      }
      if (queueFilter === 'pending' && inc.status !== 'pending' && inc.status !== 'under_review') {
        return false;
      }
      if (queueFilter === 'fixed' && inc.status !== 'fixed') {
        return false;
      }
      if (stateFilter !== 'all' && inc.state !== stateFilter) {
        return false;
      }
      if (lgaFilter !== 'all' && inc.lga !== lgaFilter) {
        return false;
      }
      if (q) {
        const hay = `${inc.refCode} ${inc.title} ${inc.address} ${inc.state} ${inc.lga} ${inc.assignedUnit}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [incidents, queueFilter, stateFilter, lgaFilter, searchQuery]);

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach((inc) => {
      counts[inc.category] = (counts[inc.category] || 0) + 1;
    });
    const total = Math.max(incidents.length, 1);
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({
        category,
        count,
        pct: Math.round((count / total) * 100),
      }));
  }, [incidents]);

  const previewIncident = useMemo(
    () => incidents.find((i) => i.id === previewIncidentId) || null,
    [incidents, previewIncidentId]
  );

  const togglePolicy = async (
    key: 'exifStrict' | 'autoRoutePotholes' | 'autoEscalateSla' | 'openLedger',
    label: string
  ) => {
    if (!isStreetFixOffice) {
      onNotify(
        'Restricted: Only the Office of StreetFix (HQ) can modify global SLA & verification policies.',
        true
      );
      return;
    }
    const nextValue = !activePolicies[key];
    if (onUpdateGlobalPolicies) {
      await onUpdateGlobalPolicies({ [key]: nextValue });
      return;
    }
    setLocalPolicies((prev) => ({ ...prev, [key]: nextValue }));
    onNotify(`${label}: ${nextValue ? 'Enabled' : 'Disabled'}.`);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisoryText.trim()) return;
    const msg = advisoryText.trim();
    if (onPostAdvisory) {
      const res = await onPostAdvisory(msg);
      if (res.ok) setAdvisoryText('');
      return;
    }
    setLocalAdvisories((prev) => [
      {
        id: `b-${Date.now()}`,
        time: 'Just now',
        author: `${session?.name || 'Admin'} (${session?.serviceId || '#AKSG-ADM'})`,
        text: msg,
      },
      ...prev,
    ]);
    onNotify(`Municipal Advisory broadcasted nationwide: "${msg}"`);
    setAdvisoryText('');
  };

  const consoleNavItems: {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'overview',
      label: 'Executive Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'workorders',
      label: 'Work Orders',
      icon: <ClipboardCheck className="w-4 h-4" />,
      badge: pendingIncidents.length + activeIncidents.length,
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: <UserCog className="w-4 h-4" />,
    },
    {
      id: 'staff',
      label: 'Agencies & Staff',
      icon: <Users className="w-4 h-4" />,
      badge: staff.filter((s) => s.status === 'Active').length,
    },
    ...(isStreetFixOffice
      ? [
          {
            id: 'office' as const,
            label: 'Office Backend',
            icon: <KeyRound className="w-4 h-4" />,
          },
        ]
      : []),
    {
      id: 'policies',
      label: 'Policies & Broadcast',
      icon: <SlidersHorizontal className="w-4 h-4" />,
    },
  ];

  const commandLaunchers: {
    route: ScreenRoute;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { route: 'ops', label: 'Ops Command GIS', icon: <LayoutGrid className="w-4 h-4" /> },
    { route: 'triage', label: 'Triage Matrix', icon: <ShieldAlert className="w-4 h-4" /> },
    { route: 'dispatch', label: 'Field Dispatch', icon: <Truck className="w-4 h-4" /> },
    { route: 'analytics', label: 'SLA Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { route: 'governance', label: 'RBAC & Audit Logs', icon: <Lock className="w-4 h-4" /> },
  ];

  // ==========================================
  // 1. STANDALONE ADMIN SECURITY GATEWAY
  // ==========================================
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B1217] text-slate-100 flex flex-col">
        {/* Isolated Gateway Top Bar */}
        <header className="border-b border-slate-800 bg-[#0F172A]/90 backdrop-blur-md px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="sm" />
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold uppercase tracking-widest text-[#D8FA64]">
              Admin Console
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('resident')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#D8FA64]" />
            <span>Public Resident Portal</span>
          </button>
        </header>

        {/* Centered Security Gateway Card */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 md:py-14">
          <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-slate-800 shadow-2xl grid grid-cols-1 lg:grid-cols-12">
            {/* Left Slate Briefing Column */}
            <section className="lg:col-span-5 bg-[#0F172A] p-6 sm:p-8 flex flex-col justify-between gap-6 border-b lg:border-b-0 lg:border-r border-slate-800">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Restricted Admin Gateway</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Administrative Control Console
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Dedicated municipal command environment for work-order certification, unit dispatch, staff clearance, and nationwide SLA policy control.
                </p>

                {session && session.role === 'resident' && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                    Signed in as resident <strong>{session.name}</strong>. Authenticate with an officer Service ID below to switch into the Admin Console.
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Quick-Fill Officer Credentials
                  </div>
                  <div className="space-y-2">
                    {rosterOfficers.slice(0, 3).map((member) => {
                      const selected = adminServiceId === member.serviceId;
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleSelectOfficerPreset(member)}
                          className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            selected
                              ? 'bg-slate-800 border-[#D8FA64]'
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {member.avatarUrl ? (
                              <SafeImage
                                src={member.avatarUrl}
                                alt={member.name}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-600 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-[#D8FA64] text-[11px] font-bold flex items-center justify-center shrink-0">
                                {member.initials}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {member.name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {member.roleLevel} · {member.department}
                              </div>
                            </div>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-[#D8FA64] shrink-0">
                            {member.serviceId}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {hqOfficer && (
                    <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                        Website Backend Authority (HQ)
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectOfficerPreset(hqOfficer)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          adminServiceId === hqOfficer.serviceId
                            ? 'bg-cyan-950/70 border-cyan-400'
                            : 'bg-cyan-950/35 border-cyan-500/40 hover:border-cyan-400'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {hqOfficer.avatarUrl ? (
                            <SafeImage
                              src={hqOfficer.avatarUrl}
                              alt={hqOfficer.name}
                              className="w-9 h-9 rounded-lg object-cover border border-cyan-500/50 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-cyan-900 border border-cyan-500/50 text-cyan-200 text-[11px] font-bold flex items-center justify-center shrink-0">
                              {hqOfficer.initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white truncate">
                                {hqOfficer.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-mono font-bold shrink-0">
                                HQ BACKEND
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              Full Policy, Roster &amp; Audit Authority
                            </div>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-cyan-300 shrink-0">
                          {hqOfficer.serviceId}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Zero-Trust Audit Trail</span>
                <span className="font-mono font-semibold text-emerald-400">MFA REQUIRED</span>
              </div>
            </section>

            {/* Right Clean Form Column */}
            <section className="lg:col-span-7 bg-white text-slate-900 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Officer Identity Verification
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Enter Service ID and hardware clearance token to unlock Admin Console
                    </p>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-slate-900 text-[#D8FA64] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                </div>

                <form onSubmit={handleAdminSignIn} className="space-y-4">
                  {loginError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                      {loginError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="adm-service-id"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Official Service ID *
                      </label>
                      <input
                        id="adm-service-id"
                        type="text"
                        required
                        value={adminServiceId}
                        onChange={(e) => setAdminServiceId(e.target.value)}
                        placeholder="#AKSG-SEC-8821"
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="adm-name"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Officer Display Name
                      </label>
                      <input
                        id="adm-name"
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="adm-dept"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Agency / Bureau
                      </label>
                      <select
                        id="adm-dept"
                        value={adminDepartment}
                        onChange={(e) => setAdminDepartment(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900"
                      >
                        <option>Govt Cyber Operations Hub</option>
                        <option>Akwa Ibom Roads (AKRMA)</option>
                        <option>Civic Operations Command</option>
                        <option>AKSEPB Waste &amp; Drainage</option>
                        <option>Akwa Ibom Water Co. (AKSWC)</option>
                        <option>Ibom Power &amp; Lighting</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="adm-mfa"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        MFA Verification Token
                      </label>
                      <select
                        id="adm-mfa"
                        value={adminMfaMethod}
                        onChange={(e) => setAdminMfaMethod(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900"
                      >
                        <option>YubiKey Hardware Token</option>
                        <option>2FA Active</option>
                        <option>Hardware Key</option>
                        <option>SMS OTP</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="adm-passcode"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Admin Passcode *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="adm-passcode"
                        type={showPasscode ? 'text' : 'password'}
                        required
                        value={adminPasscode}
                        onChange={(e) => setAdminPasscode(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        aria-label="Toggle passcode visibility"
                        onClick={() => setShowPasscode(!showPasscode)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPasscode ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-[#D8FA64] py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isLoggingIn ? 'Verifying Clearance...' : 'Launch Admin Console'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>StreetFix Municipal Operations v4.2</span>
                <button
                  type="button"
                  onClick={() => onNavigate('auth')}
                  className="font-semibold text-slate-800 hover:underline cursor-pointer"
                >
                  Resident Sign-In Hub →
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // 2. AUTHENTICATED EXECUTIVE ADMIN CONSOLE
  // ==========================================
  return (
    <div className="min-h-screen flex bg-[#F1F5F9] text-slate-900">
      {/* Desktop Dedicated Slate Admin Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#0F172A] text-slate-200 flex-col justify-between border-r border-slate-800">
        <div className="p-4 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/70 border border-slate-700/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <BrandMark className="w-8 h-8 shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-white tracking-tight truncate">
                  StreetFix <span className="text-[#D8FA64]">Admin</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  CONSOLE · 36 STATES
                </div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="System Online" />
          </div>

          {/* Primary Console Tabs */}
          <div className="space-y-1">
            <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Admin Workspace
            </div>
            {consoleNavItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-[#0A1419] border-cyan-400 font-bold'
                      : 'text-cyan-300 bg-[#0F1E24] hover:bg-cyan-500 hover:text-[#0A1419] border-cyan-500/25'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tabular-nums ${
                        isActive
                          ? 'bg-[#0A1419] text-cyan-300'
                          : 'bg-[#0A1419]/80 text-cyan-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => onNavigate('ops')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-cyan-300 bg-[#0F1E24] hover:bg-cyan-500 hover:text-[#0A1419] border border-cyan-500/25 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5 truncate">
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span className="truncate">Operations Modules</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Bottom Authenticated Admin Badge */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            {activeOfficerAvatar ? (
              <SafeImage
                src={activeOfficerAvatar}
                alt={session?.name || 'Authenticated officer'}
                className="w-9 h-9 rounded-lg object-cover border border-emerald-400/50 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#D8FA64] text-slate-950 font-extrabold text-xs flex items-center justify-center shrink-0">
                {(session?.name || 'AD')
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{session?.name}</div>
              <div className="text-[10px] font-mono text-emerald-400 truncate">
                {session?.serviceId || '#AKSG-ADM'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onNavigate('resident')}
              className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 text-center cursor-pointer"
            >
              Public Site
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="px-2.5 py-2 rounded-lg border border-slate-700 hover:bg-red-950/50 hover:border-red-500/40 text-[11px] font-semibold text-slate-300 hover:text-red-200 flex items-center justify-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Console Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean White Enterprise Top Utility Header */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg:hidden">
              <BrandMark className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                  {consoleNavItems.find((n) => n.id === activeTab)?.label}
                </h1>
                <span
                  className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                    isStreetFixOffice
                      ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}
                >
                  {isStreetFixOffice ? 'HQ BACKEND' : 'ADMIN TIER'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {session?.jurisdiction} · Clearance {session?.serviceId || '#AKSG-ADM'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto min-w-0">
            {/* Global Search */}
            <div className="relative flex-1 sm:flex-initial sm:w-56 md:w-64 min-w-[160px] order-last sm:order-none">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim() && activeTab !== 'workorders') {
                    setActiveTab('workorders');
                  }
                }}
                placeholder="Search Ref, street, reporter..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Admin Alert Bell */}
            <div className="relative shrink-0" ref={alertsDrawerRef}>
              <button
                type="button"
                aria-label="Open admin notifications"
                onClick={() => setAlertsDrawerOpen((prev) => !prev)}
                className={`relative p-2 rounded-xl border transition-colors cursor-pointer ${
                  unreadSeriousAlerts.length > 0
                    ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                    : unreadNotifications.length > 0
                    ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums ${
                      unreadSeriousAlerts.length > 0 ? 'bg-red-600' : 'bg-slate-900'
                    }`}
                  >
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {alertsDrawerOpen && (
                <div
                  role="dialog"
                  aria-label="Admin notifications"
                  className="fixed inset-x-3 top-16 sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden text-left"
                >
                  <div className="px-4 py-3 bg-[#0F172A] text-white flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold">Admin Portal Alerts</div>
                      <div className="text-[11px] text-slate-300">
                        {unreadSeriousAlerts.length > 0
                          ? `${unreadSeriousAlerts.length} serious hazard alert(s) unread`
                          : `${unreadNotifications.length} unread report alert(s)`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {unreadNotifications.length > 0 && onMarkAllNotificationsRead && (
                        <button
                          type="button"
                          onClick={onMarkAllNotificationsRead}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#D8FA64] text-[11px] font-semibold cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Mark read</span>
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label="Close alerts"
                        onClick={() => setAlertsDrawerOpen(false)}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No resident alert notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 15).map((notif) => {
                        const isSerious = notif.actionType === 'serious_report';
                        return (
                          <button
                            key={notif.id}
                            type="button"
                            onClick={() => {
                              onMarkNotificationRead?.(notif.id);
                              setPreviewIncidentId(notif.incidentId);
                              setOfficialActionNote('');
                              setAlertsDrawerOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-3 cursor-pointer ${
                              !notif.read
                                ? isSerious
                                  ? 'bg-red-50/80'
                                  : 'bg-cyan-50/50'
                                : 'bg-white'
                            }`}
                          >
                            {isSerious ? (
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            ) : (
                              <span
                                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                                  !notif.read ? 'bg-cyan-600' : 'bg-slate-300'
                                }`}
                              />
                            )}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="font-mono font-bold text-slate-900">
                                  {notif.refCode}
                                </span>
                                <span className="text-slate-400 shrink-0">{notif.createdAt}</span>
                              </div>
                              <div
                                className={`text-xs font-bold ${
                                  isSerious ? 'text-red-800' : 'text-slate-900'
                                }`}
                              >
                                {notif.title}
                              </div>
                              <p className="text-[11px] text-slate-600 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('resident')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>

            <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50 shrink-0">
              {activeOfficerAvatar ? (
                <SafeImage
                  src={activeOfficerAvatar}
                  alt={session?.name || 'Signed-in officer'}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-300 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#0F172A] text-[#D8FA64] font-bold text-[10px] flex items-center justify-center shrink-0">
                  {(session?.name || 'AD')
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <div className="hidden md:block min-w-0 leading-tight">
                <div className="text-[11px] font-bold text-slate-900 truncate max-w-[140px]">
                  {session?.name}
                </div>
                <div className="text-[10px] font-mono text-emerald-700 truncate">
                  {session?.serviceId || '#AKSG-ADM'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-900 text-[#D8FA64] text-xs font-bold shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Mobile / Tablet Admin Console Tab Switcher */}
        <div className="lg:hidden bg-[#0F172A] px-4 py-2.5 border-b border-slate-800 overflow-x-auto flex items-center gap-2">
          {consoleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-[#0A1419] border-cyan-400 font-bold'
                    : 'bg-[#0F1E24] text-cyan-300 border-cyan-500/25 hover:bg-cyan-500 hover:text-[#0A1419]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onNavigate('ops')}
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0F1E24] hover:bg-cyan-500 hover:text-[#0A1419] border border-cyan-500/25 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Operations Modules</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('resident')}
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </button>
        </div>

        {/* Active Console Viewport */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Urgent Serious Condition Alert Strip */}
          {unreadSeriousAlerts.length > 0 && (
            <section
              aria-label="Serious condition alerts"
              className="rounded-2xl border border-red-300 bg-red-50 p-4 sm:p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-extrabold text-red-900">
                      Serious Condition Alert ({unreadSeriousAlerts.length})
                    </h2>
                    <p className="text-xs text-red-700">
                      Residents flagged high-severity infrastructure hazards requiring immediate dispatch.
                    </p>
                  </div>
                </div>
                {onMarkAllNotificationsRead && (
                  <button
                    type="button"
                    onClick={onMarkAllNotificationsRead}
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-100 text-xs font-bold text-red-800 cursor-pointer"
                  >
                    Acknowledge All
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {unreadSeriousAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-xl bg-white border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="font-mono font-bold text-red-700">{alert.refCode}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-600">{alert.createdAt}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900">{alert.title}</div>
                      <p className="text-xs text-slate-600">{alert.message}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onMarkNotificationRead?.(alert.id);
                          setPreviewIncidentId(alert.incidentId);
                          setOfficialActionNote('');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        Inspect
                      </button>
                      {onUpdateIncidentStatus && (
                        <button
                          type="button"
                          onClick={() => {
                            onMarkNotificationRead?.(alert.id);
                            onUpdateIncidentStatus(
                              alert.incidentId,
                              'in_progress',
                              'Emergency unit mobilized following serious hazard alert.'
                            );
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold cursor-pointer"
                        >
                          Dispatch Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* KPI Metric Ribbon (Visible on Overview) */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Open &amp; Active Queue</span>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {pendingIncidents.length + activeIncidents.length}
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{pendingIncidents.length}</span> awaiting dispatch ·{' '}
                    <span className="font-semibold text-slate-800">{activeIncidents.length}</span> in field
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>P1 Critical Escalations</span>
                    <AlertTriangle className="w-4 h-4 text-[#E06236]" />
                  </div>
                  <div className="text-3xl font-extrabold text-[#E06236] tabular-nums">
                    {criticalOpenIncidents.length}
                  </div>
                  <div className="text-xs text-slate-500">
                    High-severity arterial hazards requiring immediate closeout
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Certified Fixed</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-700 tabular-nums">
                    {fixedIncidents.length}
                  </div>
                  <div className="text-xs text-slate-500">
                    Verified with EXIF geolocation &amp; photographic audit
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Active Admin &amp; Field Staff</span>
                    <Users className="w-4 h-4 text-slate-700" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {rosterOfficers.filter((s) => s.status === 'Active').length}{' '}
                    <span className="text-base font-semibold text-slate-400">/ {rosterOfficers.length}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Across {DEPARTMENT_QUOTAS.length} municipal response bureaus
                  </div>
                </div>
              </div>

              {/* Overview Split Analytics & Priority Escalations */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Incoming Resident Reports & Priority Escalations */}
                <section className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Incoming Resident Reports &amp; Priority Escalations
                      </h2>
                      <p className="text-xs text-slate-500">
                        New citizen submissions appear here automatically — take action to notify reporters
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('workorders')}
                      className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Full Ledger</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {priorityOverviewQueue.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-900">
                            <SafeImage
                              src={inc.afterPhotoUrl || inc.progressPhotoUrl || inc.beforePhotoUrl}
                              alt={inc.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[11px] font-bold text-slate-900">
                                {inc.refCode}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  inc.severity === 'critical'
                                    ? 'bg-red-100 text-red-700'
                                    : inc.severity === 'moderate'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {inc.severity === 'critical' ? 'SERIOUS' : inc.severity}
                              </span>
                              <span className="text-[11px] text-slate-500">{inc.reportedAt}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                              {inc.title}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              Reporter: <strong>{inc.reporterName}</strong> · {inc.lga}, {inc.state} · Unit:{' '}
                              <strong>{inc.assignedUnit}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewIncidentId(inc.id);
                              setOfficialActionNote('');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                          >
                            Preview
                          </button>
                          {onUpdateIncidentStatus && inc.status !== 'in_progress' && inc.status !== 'fixed' && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateIncidentStatus(
                                  inc.id,
                                  'in_progress',
                                  'Field squad mobilized and repair work started.'
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold cursor-pointer"
                            >
                              Start Work
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onCertifyIncident(inc.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[#D8FA64] text-xs font-bold cursor-pointer"
                          >
                            Certify Fixed
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Defect Load & Agency Quota Health */}
                <section className="xl:col-span-5 space-y-6 min-w-0">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
                    <h2 className="text-base font-bold text-slate-900">
                      Defect Load by Category
                    </h2>
                    <div className="space-y-3">
                      {categoryBreakdown.map((item) => (
                        <div key={item.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700 truncate">
                              {item.category}
                            </span>
                            <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                              {item.count} ({item.pct}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-slate-900"
                              style={{ width: `${item.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900">
                        Quick Command Launchers
                      </h2>
                      <span className="text-[11px] font-mono text-slate-400">DIRECT ROUTE</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {commandLaunchers.map((mod) => (
                        <button
                          key={mod.route}
                          type="button"
                          onClick={() => onNavigate(mod.route)}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-900 hover:bg-white text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2 text-xs font-bold text-slate-800 truncate">
                            {mod.icon}
                            <span className="truncate">{mod.label}</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* WORK ORDERS & VERIFICATION TAB */}
          {activeTab === 'workorders' && (
            <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-5">
              {/* Filter Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { key: 'all' as const, label: `All (${incidents.length})` },
                    { key: 'pending' as const, label: `Pending (${pendingIncidents.length})` },
                    { key: 'active' as const, label: `Active (${activeIncidents.length})` },
                    { key: 'fixed' as const, label: `Certified (${fixedIncidents.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setQueueFilter(tab.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        queueFilter === tab.key
                          ? 'bg-slate-900 text-[#D8FA64]'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
                  <select
                    aria-label="Filter work orders by State"
                    value={stateFilter}
                    onChange={(e) => {
                      setStateFilter(e.target.value);
                      setLgaFilter('all');
                    }}
                    className="w-full sm:w-auto min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="all">All 36 States + FCT</option>
                    {allStatesList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter work orders by LGA"
                    value={lgaFilter}
                    onChange={(e) => setLgaFilter(e.target.value)}
                    className="w-full sm:w-auto min-w-0 sm:max-w-[220px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="all">
                      {stateFilter === 'all' ? 'All LGAs (774)' : `All LGAs in ${stateFilter}`}
                    </option>
                    {lgaFilterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Desktop Ledger Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                      <th className="py-3 pr-4">Ticket / Fault</th>
                      <th className="py-3 pr-4">Reporter &amp; Severity</th>
                      <th className="py-3 pr-4">Location</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Assigned Squad</th>
                      <th className="py-3 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredQueue.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-900">
                              <SafeImage
                                src={inc.afterPhotoUrl || inc.progressPhotoUrl || inc.beforePhotoUrl}
                                alt={inc.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <div className="font-mono font-bold text-slate-900">{inc.refCode}</div>
                              <div className="font-semibold text-slate-800 truncate">{inc.title}</div>
                              <div className="text-[11px] text-slate-500 truncate">{inc.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="font-semibold text-slate-800">{inc.reporterName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                inc.severity === 'critical'
                                  ? 'bg-red-100 text-red-700'
                                  : inc.severity === 'moderate'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {inc.severity === 'critical' ? 'Serious' : inc.severity}
                            </span>
                            <span className="text-[11px] text-slate-400">{inc.reportedAt}</span>
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="font-semibold text-slate-800">{inc.lga}</div>
                          <div className="text-[11px] text-slate-500">{inc.state}</div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              inc.status === 'fixed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inc.status === 'in_progress'
                                ? 'bg-amber-100 text-amber-800'
                                : inc.status === 'assigned'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {inc.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <select
                            aria-label={`Assign unit for ${inc.refCode}`}
                            value={inc.assignedUnit}
                            onChange={(e) => onAssignUnit(inc.id, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                          >
                            {!DISPATCH_UNITS.includes(inc.assignedUnit) && (
                              <option value={inc.assignedUnit}>{inc.assignedUnit}</option>
                            )}
                            {DISPATCH_UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewIncidentId(inc.id);
                                setOfficialActionNote('');
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer"
                            >
                              Evidence
                            </button>
                            {onUpdateIncidentStatus && inc.status !== 'in_progress' && inc.status !== 'fixed' && (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateIncidentStatus(
                                    inc.id,
                                    'in_progress',
                                    'Repair crew deployed to site and work is now in progress.'
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold cursor-pointer"
                              >
                                Start Work
                              </button>
                            )}
                            {inc.status !== 'fixed' ? (
                              <button
                                type="button"
                                onClick={() => onCertifyIncident(inc.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[#D8FA64] font-bold cursor-pointer"
                              >
                                Certify
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onReopenIncident(inc.id)}
                                className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold cursor-pointer"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile / Tablet Stacked Cards */}
              <div className="lg:hidden space-y-3">
                {filteredQueue.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-900">
                        <SafeImage
                          src={inc.afterPhotoUrl || inc.progressPhotoUrl || inc.beforePhotoUrl}
                          alt={inc.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {inc.refCode}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                inc.severity === 'critical'
                                  ? 'bg-red-100 text-red-700'
                                  : inc.severity === 'moderate'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {inc.severity === 'critical' ? 'Serious' : inc.severity}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold uppercase">
                              {inc.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-slate-900 mt-1">{inc.title}</div>
                        <div className="text-xs text-slate-500">
                          {inc.reporterName} · {inc.lga}, {inc.state}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
                      <select
                        aria-label={`Assign unit for ${inc.refCode}`}
                        value={inc.assignedUnit}
                        onChange={(e) => onAssignUnit(inc.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800"
                      >
                        {!DISPATCH_UNITS.includes(inc.assignedUnit) && (
                          <option value={inc.assignedUnit}>{inc.assignedUnit}</option>
                        )}
                        {DISPATCH_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewIncidentId(inc.id);
                            setOfficialActionNote('');
                          }}
                          className="flex-1 sm:flex-initial px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          Evidence
                        </button>
                        {onUpdateIncidentStatus && inc.status !== 'in_progress' && inc.status !== 'fixed' && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateIncidentStatus(
                                inc.id,
                                'in_progress',
                                'Repair crew deployed to site and work is now in progress.'
                              )
                            }
                            className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-cyan-600 text-white text-xs font-bold cursor-pointer"
                          >
                            Start Work
                          </button>
                        )}
                        {inc.status !== 'fixed' ? (
                          <button
                            type="button"
                            onClick={() => onCertifyIncident(inc.id)}
                            className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-slate-900 text-[#D8FA64] text-xs font-bold cursor-pointer"
                          >
                            Certify Fixed
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onReopenIncident(inc.id)}
                            className="flex-1 sm:flex-initial px-3 py-2 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold cursor-pointer"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredQueue.length === 0 && (
                <div className="py-10 text-center text-xs text-slate-500">
                  No work orders match the selected filters.
                </div>
              )}
            </section>
          )}

          {/* MY PROFILE TAB (Admin Self-Edit Important Fields Only) */}
          {activeTab === 'profile' && activeOfficer && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Self-Editable Important Contact & Security Details */}
              <form
                onSubmit={handleSaveOwnProfileSubmit}
                className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      My Profile · Important Details
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Update your display name, official contact info, photo, and personal passcode.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold shrink-0">
                    SELF-EDITABLE
                  </span>
                </div>

                {/* Photo Preview + Upload */}
                <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  {profileAvatarUrl ? (
                    <SafeImage
                      src={profileAvatarUrl}
                      alt={profileName || activeOfficer.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-300 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 text-[#D8FA64] font-bold text-lg flex items-center justify-center shrink-0">
                      {activeOfficer.initials}
                    </div>
                  )}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-900">Officer Profile Photo</div>
                    <p className="text-[11px] text-slate-500">
                      Visible to dispatch squads and in header clearance badges.
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-900 text-xs font-semibold text-slate-800 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, setProfileAvatarUrl)}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700 mb-1">
                      Display Name *
                    </label>
                    <input
                      id="prof-name"
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="prof-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Contact Phone *
                    </label>
                    <input
                      id="prof-phone"
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+234 803 000 0000"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="prof-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Email Address
                  </label>
                  <input
                    id="prof-email"
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="officer@streetfix.ng"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="prof-passcode" className="block text-xs font-semibold text-slate-700 mb-1">
                    Change Account Passcode (leave blank to keep current)
                  </label>
                  <div className="relative">
                    <input
                      id="prof-passcode"
                      type={showProfilePasscode ? 'text' : 'password'}
                      value={profileNewPasscode}
                      onChange={(e) => setProfileNewPasscode(e.target.value)}
                      placeholder="New passcode (min 6 characters)"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 pr-10 text-xs text-slate-900 focus:bg-white focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Toggle passcode visibility"
                      onClick={() => setShowProfilePasscode((p) => !p)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showProfilePasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#D8FA64] text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{profileSaving ? 'Saving...' : 'Save Important Profile Details'}</span>
                </button>
              </form>

              {/* Backend-Locked Structural Fields (Office of StreetFix Only) */}
              <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Backend Clearance Fields
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Protected governance fields managed only by the Office of StreetFix.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold shrink-0">
                    <Lock className="w-3 h-3" />
                    <span>OFFICE ONLY</span>
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Official Service ID', value: activeOfficer.serviceId },
                    { label: 'RBAC Role Level', value: activeOfficer.roleLevel },
                    { label: 'Official Title / Post', value: activeOfficer.title },
                    { label: 'Department / Agency', value: activeOfficer.department },
                    { label: 'Assigned Jurisdiction', value: activeOfficer.lgaJurisdiction },
                    { label: 'MFA Security Policy', value: activeOfficer.mfaMethod },
                    { label: 'Clearance Status', value: activeOfficer.status },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <span className="text-slate-500 font-medium">{field.label}</span>
                      <span className="font-bold text-slate-900 text-right inline-flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{field.value}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl bg-[#0F172A] text-slate-200 text-xs leading-relaxed">
                  {isStreetFixOffice ? (
                    <span>
                      You are signed in as the <strong>Office of StreetFix (Website Backend)</strong>. Open the <strong>Office Backend</strong> tab to register admins or edit any restricted field.
                    </span>
                  ) : (
                    <span>
                      Only the <strong>Office of StreetFix (Website Backend)</strong> can register new admins or edit Service ID, Role Level, Department, Jurisdiction, MFA, or Status.
                    </span>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* AGENCIES & STAFF TAB */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              {/* Agency Quotas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {DEPARTMENT_QUOTAS.map((dept) => (
                  <div
                    key={dept.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Building2 className="w-4 h-4 text-slate-600" />
                        <span>{dept.shortCode}</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dept.slaStatus === 'healthy'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {dept.slaRate}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 truncate">{dept.name}</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{dept.activeSquads} Squads</span>
                        <span className="font-mono font-bold text-slate-800">
                          {dept.utilizationPct}% load
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${dept.utilizationPct}%`,
                            backgroundColor: dept.barColor,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Staff Clearance Roster */}
              <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Officer Clearance &amp; RBAC Roster
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isStreetFixOffice
                        ? 'Office of StreetFix Backend: Register new admins, edit all profile parts, or toggle clearance.'
                        : 'Read-only directory · Only the Office of StreetFix (Website Backend) can register or edit all parts of admin profiles.'}
                    </p>
                  </div>
                  {isStreetFixOffice ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('office')}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 text-[#D8FA64] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register Admin (Office Backend)</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Office of StreetFix Backend Required</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rosterOfficers.map((member) => {
                    const isSelf = isSelfStaffMember(member);
                    const canToggleStatus =
                      isStreetFixOffice &&
                      !isSelf &&
                      !member.isStreetFixOffice &&
                      member.id !== 'st-hq';
                    return (
                      <div
                        key={member.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {member.avatarUrl ? (
                            <SafeImage
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-300 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-[#D8FA64] font-bold text-xs flex items-center justify-center shrink-0">
                              {member.initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 truncate">
                                {member.name}
                              </span>
                              <span className="font-mono text-[10px] font-bold text-slate-500">
                                {member.serviceId}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 truncate">
                              {member.roleLevel} · {member.department}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {member.lgaJurisdiction} · {member.mfaMethod}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {isStreetFixOffice ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openOfficeEditModal(member)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-slate-900 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                <span>Edit All</span>
                              </button>
                              {canToggleStatus ? (
                                <button
                                  type="button"
                                  onClick={() => onToggleStaffStatus(member.id)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                                    member.status === 'Active'
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800'
                                      : 'bg-red-100 text-red-800 hover:bg-emerald-100 hover:text-emerald-800'
                                  }`}
                                >
                                  {member.status}
                                </button>
                              ) : (
                                <span
                                  title="Self-suspension and activation changes are prohibited"
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                                    member.status === 'Active'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  <Lock className="w-3 h-3 opacity-70" />
                                  <span>{member.status}</span>
                                </span>
                              )}
                            </>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                                member.status === 'Active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              <Lock className="w-3 h-3 opacity-70" />
                              <span>{member.status}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {/* OFFICE OF STREETFIX BACKEND TAB (Exclusive to Office of StreetFix HQ) */}
          {activeTab === 'office' && isStreetFixOffice && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left 5 Cols: Register New Admin */}
              <form
                onSubmit={handleOfficeRegisterSubmit}
                className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-4">
                  <div>
                    <div className="text-[11px] font-mono font-bold uppercase text-cyan-700">
                      StreetFix Website Backend
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      Register New Admin Account
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Only the Office of StreetFix can provision new admin credentials.
                    </p>
                  </div>
                  <span className="w-9 h-9 rounded-xl bg-[#0F172A] text-[#D8FA64] flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4" />
                  </span>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                    {regError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700 mb-1">
                      Admin Full Name *
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Engr. Etim Okon"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-sid" className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Service ID (optional)
                    </label>
                    <input
                      id="reg-sid"
                      type="text"
                      value={regServiceId}
                      onChange={(e) => setRegServiceId(e.target.value)}
                      placeholder="Auto-assigned if blank"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-title" className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Title / Post *
                    </label>
                    <input
                      id="reg-title"
                      type="text"
                      required
                      value={regTitle}
                      onChange={(e) => setRegTitle(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-role" className="block text-xs font-semibold text-slate-700 mb-1">
                      RBAC Role Level *
                    </label>
                    <select
                      id="reg-role"
                      value={regRoleLevel}
                      onChange={(e) => setRegRoleLevel(e.target.value as StaffMember['roleLevel'])}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option value="FIELD SQUAD LEAD">FIELD SQUAD LEAD</option>
                      <option value="TRIAGE OFFICER">TRIAGE OFFICER</option>
                      <option value="AGENCY DIRECTOR">AGENCY DIRECTOR</option>
                      <option value="FIELD TECHNICIAN">FIELD TECHNICIAN</option>
                      <option value="SUPER ADMIN">SUPER ADMIN</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-dept" className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Agency
                  </label>
                  <select
                    id="reg-dept"
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    <option>Akwa Ibom Roads (AKRMA)</option>
                    <option>Civic Operations Command</option>
                    <option>AKSEPB Waste &amp; Drainage</option>
                    <option>Akwa Ibom Water Co. (AKSWC)</option>
                    <option>Ibom Power &amp; Lighting</option>
                    <option>Govt Cyber Operations Hub</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-state" className="block text-xs font-semibold text-slate-700 mb-1">
                      State (36 + FCT)
                    </label>
                    <select
                      id="reg-state"
                      value={regStateKey}
                      onChange={(e) => {
                        const next = e.target.value;
                        setRegStateKey(next);
                        setRegLgaKey(Object.keys(NIGERIAN_CADASTRE[next]?.lgas || {})[0] || 'all');
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
                    >
                      {Object.entries(NIGERIAN_CADASTRE).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-lga" className="block text-xs font-semibold text-slate-700 mb-1">
                      LGA Jurisdiction
                    </label>
                    <select
                      id="reg-lga"
                      value={regLgaKey}
                      onChange={(e) => setRegLgaKey(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900"
                    >
                      <option value="all">All LGAs (Statewide)</option>
                      {regLgaEntries.map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Email
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="officer@streetfix.ng"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+234 803 000 0000"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-mfa" className="block text-xs font-semibold text-slate-700 mb-1">
                      MFA Policy
                    </label>
                    <select
                      id="reg-mfa"
                      value={regMfa}
                      onChange={(e) => setRegMfa(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option>2FA Active</option>
                      <option>Hardware Key</option>
                      <option>YubiKey Enforced</option>
                      <option>SMS OTP</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-status" className="block text-xs font-semibold text-slate-700 mb-1">
                      Clearance Status
                    </label>
                    <select
                      id="reg-status"
                      value={regStatus}
                      onChange={(e) => setRegStatus(e.target.value as StaffMember['status'])}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-passcode" className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Clearance Passcode *
                  </label>
                  <input
                    id="reg-passcode"
                    type="text"
                    required
                    value={regPasscode}
                    onChange={(e) => setRegPasscode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:border-slate-900 text-xs font-semibold text-slate-700 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{regAvatarUrl ? 'Photo Attached' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileUpload(e, setRegAvatarUrl)}
                      className="sr-only"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={regSubmitting}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#D8FA64] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{regSubmitting ? 'Registering...' : 'Register Admin'}</span>
                  </button>
                </div>
              </form>

              {/* Right 7 Cols: Full Profile Editor Roster (Office Only) */}
              <section className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
                <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Registered Admin Profiles (Full Backend Control)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Edit all parts of any admin profile: Service ID, Role, Department, Jurisdiction, MFA, Status, Contact, Photo &amp; Passcode.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-cyan-50 border border-cyan-200 text-cyan-800 font-mono text-[10px] font-bold">
                    {rosterOfficers.length} ACCOUNTS
                  </span>
                </div>

                <div className="space-y-3">
                  {rosterOfficers.map((member) => {
                    const isSelf = isSelfStaffMember(member);
                    const canRevoke =
                      member.id !== 'st-hq' &&
                      !member.isStreetFixOffice &&
                      !isSelf &&
                      Boolean(onOfficeDeleteAdmin);
                    return (
                      <div
                        key={member.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {member.avatarUrl ? (
                            <SafeImage
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-300 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-900 text-[#D8FA64] font-bold text-xs flex items-center justify-center shrink-0">
                              {member.initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 truncate">
                                {member.name}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-600">
                                {member.serviceId}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  member.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {member.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 truncate">
                              {member.roleLevel} · {member.title} · {member.department}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {member.lgaJurisdiction} · {member.email || 'No email'} · {member.phone || 'No phone'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => openOfficeEditModal(member)}
                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-[#D8FA64] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit All</span>
                          </button>
                          {canRevoke && (
                            confirmDeleteStaffId === member.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onOfficeDeleteAdmin?.(member.id);
                                    setConfirmDeleteStaffId(null);
                                  }}
                                  className="px-2.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                                >
                                  Confirm Revoke
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteStaffId(null)}
                                  className="px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteStaffId(member.id)}
                                className="px-2.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                title="Revoke and remove admin account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Revoke</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* HQ Only: Resident Accounts Governance */}
                <div className="pt-5 border-t border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Resident Reporter Accounts Governance (HQ Backend)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Verify, suspend, reactivate, or remove citizen reporter accounts registered on StreetFix.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                      {residentAccounts.length} RESIDENT{residentAccounts.length === 1 ? '' : 'S'}
                    </span>
                  </div>

                  {residentAccounts.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                      No custom resident accounts registered yet. Citizens signing up via Resident Portal or Auth Hub appear here for HQ moderation.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {residentAccounts.map((resAcc) => (
                        <div
                          key={resAcc.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{resAcc.name}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  resAcc.verified
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {resAcc.verified ? 'Verified' : 'Unverified'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  resAcc.status === 'Suspended'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-cyan-100 text-cyan-800'
                                }`}
                              >
                                {resAcc.status || 'Active'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 truncate">
                              {resAcc.email} · {resAcc.phone} · {resAcc.state}, {resAcc.lga}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {onOfficeModerateResident && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void onOfficeModerateResident(resAcc.id, {
                                      verified: !resAcc.verified,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-slate-900 text-[11px] font-semibold text-slate-800 cursor-pointer"
                                >
                                  {resAcc.verified ? 'Unverify' : 'Verify'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void onOfficeModerateResident(resAcc.id, {
                                      status:
                                        resAcc.status === 'Suspended' ? 'Active' : 'Suspended',
                                    })
                                  }
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                                    resAcc.status === 'Suspended'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {resAcc.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                                </button>
                              </>
                            )}
                            {onOfficeDeleteResident && (
                              confirmDeleteResidentId === resAcc.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await onOfficeDeleteResident(resAcc.id);
                                      setConfirmDeleteResidentId(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    Confirm Delete
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteResidentId(null)}
                                    className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-700 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteResidentId(resAcc.id)}
                                  className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-[11px] font-bold cursor-pointer"
                                >
                                  Delete
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* POLICIES & BROADCAST TAB */}
          {activeTab === 'policies' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Global SLA &amp; Verification Policies
                    </h2>
                    <p className="text-xs text-slate-500">
                      {isStreetFixOffice
                        ? 'HQ Website Backend authority: changes sync globally across all portals.'
                        : 'Enforced by HQ (Office of StreetFix). Regular Admins have read-only inspection.'}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-[10px] font-bold ${
                      isStreetFixOffice
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {!isStreetFixOffice && <Lock className="w-3 h-3" />}
                    <span>{isStreetFixOffice ? 'HQ EDITABLE' : 'HQ ENFORCED'}</span>
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'exifStrict' as const,
                      label: 'Enforce EXIF GPS Verification (±15m)',
                      desc: 'Reject field closeout uploads lacking authentic GPS telemetry metadata.',
                    },
                    {
                      key: 'autoRoutePotholes' as const,
                      label: 'Auto-Route Potholes to Nearest Depot',
                      desc: 'Assign incoming arterial road craters automatically using Haversine proximity.',
                    },
                    {
                      key: 'autoEscalateSla' as const,
                      label: 'Auto-Escalate Breached SLAs (>48h)',
                      desc: 'Flag overdue tickets onto the Admin Executive Watchlist.',
                    },
                    {
                      key: 'openLedger' as const,
                      label: 'Public Open-Ledger Transparency',
                      desc: 'Mirror certified before/after repair evidence onto Resident Portal.',
                    },
                  ].map((item) => {
                    const enabled = activePolicies[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => void togglePolicy(item.key, item.label)}
                        className={`w-full p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4 text-left ${
                          isStreetFixOffice ? 'hover:border-slate-400 cursor-pointer' : 'opacity-85 cursor-not-allowed'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900">{item.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                            enabled
                              ? 'bg-slate-900 text-[#D8FA64]'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {enabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 space-y-2">
                  <label
                    htmlFor="admin-sla-window"
                    className="flex items-center justify-between text-xs font-bold text-slate-800"
                  >
                    <span>Default Municipal SLA Target Window</span>
                    <span className="font-mono text-slate-900">
                      {activePolicies.slaTargetHours} Hours
                    </span>
                  </label>
                  <select
                    id="admin-sla-window"
                    disabled={!isStreetFixOffice}
                    value={activePolicies.slaTargetHours}
                    onChange={(e) => {
                      const val = e.target.value as '24' | '48' | '72';
                      if (!isStreetFixOffice) return;
                      if (onUpdateGlobalPolicies) {
                        void onUpdateGlobalPolicies({ slaTargetHours: val });
                      } else {
                        setLocalPolicies((prev) => ({ ...prev, slaTargetHours: val }));
                        onNotify(`Updated default municipal SLA target to ${val} hours.`);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 disabled:opacity-60"
                  >
                    <option value="24">24 Hours (Emergency Priority)</option>
                    <option value="48">48 Hours (Standard Municipal SLA)</option>
                    <option value="72">72 Hours (Routine Maintenance)</option>
                  </select>
                </div>
              </section>

              <section className="lg:col-span-6 space-y-6">
                <form
                  onSubmit={handleBroadcast}
                  className="bg-[#0F172A] text-white rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4"
                >
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#D8FA64]">
                    <Megaphone className="w-4 h-4" />
                    <span>Emergency Municipal Broadcast</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Dispatch high-priority weather, diversion, or corridor closure advisories directly to field squads and subscribed citizens.
                  </p>
                  <textarea
                    rows={3}
                    value={advisoryText}
                    onChange={(e) => setAdvisoryText(e.target.value)}
                    placeholder="Enter advisory notice for field units and residents..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white placeholder-slate-500 focus:border-[#D8FA64] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-[#D8FA64] hover:bg-[#c8eb52] text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    Broadcast Advisory Notice
                  </button>
                </form>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Recent Broadcast Audit Log</h3>
                  <div className="space-y-2.5">
                    {activeAdvisories.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-800">{item.author}</span>
                          <span className="font-mono">{item.time}</span>
                        </div>
                        <p className="text-xs text-slate-700">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      {/* Evidence Inspection Drawer / Modal */}
      {previewIncident && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-4 bg-[#0F172A] text-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-mono text-xs font-bold text-[#D8FA64]">
                  {previewIncident.refCode} · AUDIT INSPECTION
                </div>
                <div className="text-sm font-bold truncate">{previewIncident.title}</div>
              </div>
              <button
                type="button"
                aria-label="Close inspection dialog"
                onClick={() => setPreviewIncidentId(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    Citizen Before Report
                  </div>
                  <div className="h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                    <SafeImage
                      src={previewIncident.beforePhotoUrl}
                      alt="Before repair"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono font-bold uppercase text-slate-500">
                    {previewIncident.afterPhotoUrl ? 'Certified After Proof' : 'Latest Field Progress'}
                  </div>
                  <div className="h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                    <SafeImage
                      src={
                        previewIncident.afterPhotoUrl ||
                        previewIncident.progressPhotoUrl ||
                        previewIncident.beforePhotoUrl
                      }
                      alt="Repair progress or completion"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    <span>
                      {previewIncident.address}, {previewIncident.lga}, {previewIncident.state}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      previewIncident.severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : previewIncident.severity === 'moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {previewIncident.severity === 'critical' ? 'Serious Condition' : previewIncident.severity}
                  </span>
                </div>
                <p className="text-slate-600">{previewIncident.description}</p>
                <div className="flex flex-wrap gap-3 pt-1 font-mono text-[11px] text-slate-700">
                  <span>Reporter: {previewIncident.reporterName}</span>
                  {previewIncident.reporterPhone && <span>Tel: {previewIncident.reporterPhone}</span>}
                  <span>GPS: {previewIncident.lat}, {previewIncident.lng}</span>
                  <span>Unit: {previewIncident.assignedUnit}</span>
                  {previewIncident.materialsAsphaltTons && (
                    <span>Material: {previewIncident.materialsAsphaltTons}t</span>
                  )}
                </div>
              </div>

              {onUpdateIncidentStatus && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <label
                    htmlFor="admin-action-note"
                    className="block text-xs font-bold text-slate-900"
                  >
                    Official Action Note &amp; Reporter Notification
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="admin-action-note"
                      type="text"
                      value={officialActionNote}
                      onChange={(e) => setOfficialActionNote(e.target.value)}
                      placeholder="e.g. Drainage crew dispatched; patching scheduled today..."
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateIncidentStatus(
                          previewIncident.id,
                          previewIncident.status === 'pending' ? 'under_review' : previewIncident.status,
                          officialActionNote.trim() || 'Admin reviewed this submission and scheduled engineering verification.'
                        );
                        setOfficialActionNote('');
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Notify Reporter</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <div>
                  {isStreetFixOffice && onDeleteIncident && (
                    confirmDeleteIncidentId === previewIncident.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteIncident(previewIncident.id);
                            setConfirmDeleteIncidentId(null);
                            setPreviewIncidentId(null);
                          }}
                          className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Confirm Purge Case
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteIncidentId(null)}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteIncidentId(previewIncident.id)}
                        className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge Case (HQ Only)</span>
                      </button>
                    )
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectIncident(previewIncident.id);
                      setPreviewIncidentId(null);
                      onNavigate('directory');
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Open Full Public File
                  </button>
                  {onUpdateIncidentStatus && previewIncident.status !== 'in_progress' && previewIncident.status !== 'fixed' && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateIncidentStatus(
                          previewIncident.id,
                          'in_progress',
                          officialActionNote.trim() || 'Field engineering crew dispatched and active repairs started.'
                        );
                        setOfficialActionNote('');
                        setPreviewIncidentId(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {previewIncident.status !== 'fixed' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (officialActionNote.trim() && onUpdateIncidentStatus) {
                          onUpdateIncidentStatus(
                            previewIncident.id,
                            'fixed',
                            officialActionNote.trim()
                          );
                        } else {
                          onCertifyIncident(previewIncident.id);
                        }
                        setOfficialActionNote('');
                        setPreviewIncidentId(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-[#D8FA64] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Certify &amp; Mark Fixed</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onReopenIncident(previewIncident.id);
                        setOfficialActionNote('');
                        setPreviewIncidentId(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reopen Work Order</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Office of StreetFix Backend: Edit ALL Parts of Admin Profile Modal */}
      {editingStaffId && isStreetFixOffice && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleOfficeEditSubmit}
            className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono font-bold text-[#D8FA64]">
                  OFFICE OF STREETFIX · BACKEND PROFILE EDITOR
                </div>
                <h3 className="text-base font-bold">
                  Edit All Admin Profile Parts ({editForm.name})
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close backend editor"
                onClick={() => setEditingStaffId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex flex-wrap items-center gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                {editForm.avatarUrl ? (
                  <SafeImage
                    src={editForm.avatarUrl}
                    alt={editForm.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-300 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-900 text-[#D8FA64] font-bold text-base flex items-center justify-center shrink-0">
                    {editForm.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-900 font-semibold text-slate-800 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Change Profile Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageFileUpload(e, (url) =>
                        setEditForm((prev) => ({ ...prev, avatarUrl: url }))
                      )
                    }
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Service ID *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isEditTargetSelfOrHq}
                    value={editForm.serviceId}
                    onChange={(e) => setEditForm((p) => ({ ...p, serviceId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-slate-900 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Title / Post *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    RBAC Role Level *
                  </label>
                  <select
                    value={editForm.roleLevel}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        roleLevel: e.target.value as StaffMember['roleLevel'],
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-900"
                  >
                    <option value="FIELD SQUAD LEAD">FIELD SQUAD LEAD</option>
                    <option value="TRIAGE OFFICER">TRIAGE OFFICER</option>
                    <option value="AGENCY DIRECTOR">AGENCY DIRECTOR</option>
                    <option value="FIELD TECHNICIAN">FIELD TECHNICIAN</option>
                    <option value="SUPER ADMIN">SUPER ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department / Agency
                  </label>
                  <select
                    value={editForm.department}
                    onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-900"
                  >
                    <option>StreetFix Head Office (Backend)</option>
                    <option>Akwa Ibom Roads (AKRMA)</option>
                    <option>Civic Operations Command</option>
                    <option>AKSEPB Waste &amp; Drainage</option>
                    <option>Akwa Ibom Water Co. (AKSWC)</option>
                    <option>Ibom Power &amp; Lighting</option>
                    <option>Govt Cyber Operations Hub</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Jurisdiction (State / LGA)
                  </label>
                  <input
                    type="text"
                    value={editForm.lgaJurisdiction}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, lgaJurisdiction: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">MFA Policy</label>
                  <select
                    value={editForm.mfaMethod}
                    onChange={(e) => setEditForm((p) => ({ ...p, mfaMethod: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-900"
                  >
                    <option>Hardware Root Key</option>
                    <option>2FA Active</option>
                    <option>Hardware Key</option>
                    <option>YubiKey Enforced</option>
                    <option>SMS OTP</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Clearance Status
                  </label>
                  <select
                    disabled={isEditTargetSelfOrHq}
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        status: e.target.value as StaffMember['status'],
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-semibold text-slate-900 disabled:opacity-60"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reset Account Passcode (optional, min 6 chars)
                </label>
                <input
                  type="text"
                  value={editForm.passcode}
                  onChange={(e) => setEditForm((p) => ({ ...p, passcode: e.target.value }))}
                  placeholder="Leave blank to keep existing passcode"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStaffId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-[#D8FA64] font-bold cursor-pointer disabled:opacity-60"
                >
                  {editSubmitting ? 'Saving All Fields...' : 'Save All Profile Fields'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
