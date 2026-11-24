/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { signOut } from 'firebase/auth';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { auth } from './lib/firebase';
import {
  AppNotification,
  BroadcastAdvisory,
  GlobalPolicies,
  Incident,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  ResidentAccount,
  ScreenRoute,
  StaffMember,
  UserSession,
} from './types';
import { HOTLINKED_IMAGES, INITIAL_INCIDENTS, INITIAL_STAFF } from './data/mockData';
import { TopNavBar } from './components/TopNavBar';
import { HelplineFooter } from './components/HelplineFooter';
import { ResidentPortal } from './pages/ResidentPortal';
import { ReportStudio } from './pages/ReportStudio';
import { IncidentDirectory } from './pages/IncidentDirectory';
import { AuthHub } from './pages/AuthHub';
import { OpsCommandHub } from './pages/OpsCommandHub';
import { TriageMatrix } from './pages/TriageMatrix';
import { FieldDispatchPortal } from './pages/FieldDispatchPortal';
import { ExecutiveAnalytics } from './pages/ExecutiveAnalytics';
import { GovernanceHub } from './pages/GovernanceHub';
import { AdminPortal } from './pages/AdminPortal';
import { OperationsShell, OpsRoute } from './components/OperationsShell';

const OPS_ROUTES: OpsRoute[] = ['ops', 'triage', 'dispatch', 'analytics', 'governance'];

const STORAGE_KEYS = {
  incidents: 'streetfix_incidents_v1',
  notifications: 'streetfix_notifications_v1',
  staff: 'streetfix_staff_v1',
  myReportedIds: 'streetfix_my_reported_ids_v1',
  residentAccounts: 'streetfix_resident_accounts_v1',
  policies: 'streetfix_policies_v1',
  advisories: 'streetfix_advisories_v1',
};

const DEFAULT_GLOBAL_POLICIES: GlobalPolicies = {
  exifStrict: true,
  autoRoutePotholes: true,
  autoEscalateSla: true,
  openLedger: true,
  slaTargetHours: '48',
};

const DEFAULT_ADVISORIES: BroadcastAdvisory[] = [
  {
    id: 'b-1',
    time: 'Today · 08:15 WAT',
    author: 'Aisha Bello (#AKSG-SEC-8821)',
    text: 'All Drainage Rapid Units placed on convective rainfall alert across Uyo, Eket, and Oron corridors.',
  },
];

function readStorageJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStorageJson<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore QuotaExceededError when storing large local photo data URLs
  }
}

function formatWatTimestamp(): string {
  try {
    return `${new Date().toLocaleTimeString('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })} WAT`;
  } catch {
    return 'Just now';
  }
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-init-admin-1',
    audience: 'admin',
    incidentId: INITIAL_INCIDENTS[0].id,
    refCode: INITIAL_INCIDENTS[0].refCode,
    severity: 'critical',
    actionType: 'serious_report',
    title: `Serious Condition Alert · ${INITIAL_INCIDENTS[0].refCode}`,
    message: `${INITIAL_INCIDENTS[0].reporterName} reported a critical ${INITIAL_INCIDENTS[0].category} at ${INITIAL_INCIDENTS[0].address}, ${INITIAL_INCIDENTS[0].lga}.`,
    createdAt: 'Today · 09:14 WAT',
    timestampMs: Date.now() - 1000 * 60 * 90,
    read: false,
  },
];

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<ScreenRoute>('resident');
  const [incidents, setIncidents] = useState<Incident[]>(() =>
    readStorageJson<Incident[]>(STORAGE_KEYS.incidents, INITIAL_INCIDENTS)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    readStorageJson<AppNotification[]>(STORAGE_KEYS.notifications, INITIAL_NOTIFICATIONS)
  );
  const [myReportedIds, setMyReportedIds] = useState<string[]>(() =>
    readStorageJson<string[]>(STORAGE_KEYS.myReportedIds, [])
  );
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    () => readStorageJson<Incident[]>(STORAGE_KEYS.incidents, INITIAL_INCIDENTS)[0]?.id || INITIAL_INCIDENTS[0].id
  );
  const [staff, setStaff] = useState<StaffMember[]>(() =>
    readStorageJson<StaffMember[]>(STORAGE_KEYS.staff, INITIAL_STAFF)
  );
  const [residentAccounts, setResidentAccounts] = useState<ResidentAccount[]>(() =>
    readStorageJson<ResidentAccount[]>(STORAGE_KEYS.residentAccounts, [])
  );
  const [globalPolicies, setGlobalPolicies] = useState<GlobalPolicies>(() => ({
    ...DEFAULT_GLOBAL_POLICIES,
    ...readStorageJson<Partial<GlobalPolicies>>(STORAGE_KEYS.policies, {}),
  }));
  const [advisories, setAdvisories] = useState<BroadcastAdvisory[]>(() => {
    const saved = readStorageJson<BroadcastAdvisory[]>(STORAGE_KEYS.advisories, []);
    return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_ADVISORIES;
  });
  const [session, setSession] = useState<UserSession | null>(null);
  const [firebaseIdToken, setFirebaseIdToken] = useState<string>('');
  const [officerPasscode, setOfficerPasscode] = useState<string>('');
  const [toastState, setToastState] = useState<{ message: string; urgent?: boolean } | null>(null);
  const [postAuthRoute, setPostAuthRoute] = useState<ScreenRoute>('resident');
  const [postAdminRoute, setPostAdminRoute] = useState<ScreenRoute>('admin');

  const hydratedIncidentsFromServerRef = useRef(false);
  const hydratedNotificationsFromServerRef = useRef(false);

  const isAdminSession = Boolean(
    session && (session.role === 'admin' || session.role === 'staff')
  );
  const isStreetFixOffice = Boolean(isAdminSession && session?.isStreetFixOffice);

  const hydrateStaffWithLocalSeeds = (records: StaffMember[]): StaffMember[] => {
    const seedMap = new Map(INITIAL_STAFF.map((s) => [s.id, s]));
    const merged: StaffMember[] = records.map((rec) => {
      const seed = seedMap.get(rec.id);
      return {
        ...seed,
        ...rec,
        avatarUrl: rec.avatarUrl || seed?.avatarUrl,
      };
    });
    // Ensure HQ Office account always exists even if reading older localStorage
    if (!merged.some((s) => s.id === 'st-hq' || s.isStreetFixOffice)) {
      const hq = INITIAL_STAFF.find((s) => s.id === 'st-hq');
      if (hq) merged.unshift(hq);
    }
    return merged;
  };

  const hydrateIncidentsWithLocalSeeds = (records: Incident[]): Incident[] => {
    const seedMap = new Map(INITIAL_INCIDENTS.map((inc) => [inc.id, inc]));
    return records.map((rec) => {
      const seed = seedMap.get(rec.id);
      if (!seed) return rec;
      return {
        ...seed,
        ...rec,
        beforePhotoUrl:
          rec.beforePhotoUrl && rec.beforePhotoUrl.startsWith('data:')
            ? rec.beforePhotoUrl
            : seed.beforePhotoUrl,
        progressPhotoUrl:
          rec.progressPhotoUrl && rec.progressPhotoUrl.startsWith('data:')
            ? rec.progressPhotoUrl
            : rec.progressPhotoUrl || seed.progressPhotoUrl,
        afterPhotoUrl:
          rec.afterPhotoUrl && rec.afterPhotoUrl.startsWith('data:')
            ? rec.afterPhotoUrl
            : rec.afterPhotoUrl || seed.afterPhotoUrl,
      };
    });
  };

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      fetch('/api/staff').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/office/policies').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/incidents').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/notifications').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/advisories').then((r) => (r.ok ? r.json() : null)),
    ]).then(([staffRes, policiesRes, incidentsRes, notifsRes, advisoriesRes]) => {
      if (!active) return;

      if (staffRes.status === 'fulfilled' && staffRes.value && Array.isArray(staffRes.value.staff)) {
        setStaff(hydrateStaffWithLocalSeeds(staffRes.value.staff));
      }

      if (policiesRes.status === 'fulfilled' && policiesRes.value?.policies) {
        setGlobalPolicies({ ...DEFAULT_GLOBAL_POLICIES, ...policiesRes.value.policies });
      }

      if (incidentsRes.status === 'fulfilled' && incidentsRes.value) {
        if (
          incidentsRes.value.seeded &&
          Array.isArray(incidentsRes.value.incidents) &&
          incidentsRes.value.incidents.length > 0
        ) {
          const hydrated = hydrateIncidentsWithLocalSeeds(incidentsRes.value.incidents);
          setIncidents(hydrated);
          if (!hydrated.some((i) => i.id === selectedIncidentId)) {
            setSelectedIncidentId(hydrated[0].id);
          }
        } else {
          void fetch('/api/incidents/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ incidents }),
          }).catch(() => {});
        }
      }
      hydratedIncidentsFromServerRef.current = true;

      if (notifsRes.status === 'fulfilled' && notifsRes.value) {
        if (notifsRes.value.seeded && Array.isArray(notifsRes.value.notifications)) {
          setNotifications(notifsRes.value.notifications);
        } else {
          void fetch('/api/notifications/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notifications }),
          }).catch(() => {});
        }
      }
      hydratedNotificationsFromServerRef.current = true;

      if (
        advisoriesRes.status === 'fulfilled' &&
        advisoriesRes.value &&
        Array.isArray(advisoriesRes.value.advisories)
      ) {
        setAdvisories(advisoriesRes.value.advisories);
      }
    });

    return () => {
      active = false;
    };
    // Run once on initial mount to hydrate from backend
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAdminSession || !session?.serviceId || !officerPasscode) return;
    let active = true;

    fetch('/api/residents', {
      headers: {
        'x-officer-service-id': session.serviceId,
        'x-officer-passcode': officerPasscode,
      },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data || !Array.isArray(data.residents)) return;
        const serverResidents = data.residents as ResidentAccount[];
        setResidentAccounts((prevLocal) => {
          const localById = new Map(prevLocal.map((r) => [r.id, r]));
          const merged = serverResidents.map((srv) => {
            const local = localById.get(srv.id);
            return {
              ...srv,
              password: srv.password || local?.password || '',
              status: srv.status || 'Active',
            };
          });
          const serverIds = new Set(serverResidents.map((r) => r.id));
          const localOnly = prevLocal.filter((r) => !serverIds.has(r.id));
          return [...merged, ...localOnly];
        });
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isAdminSession, session?.serviceId, officerPasscode]);

  // Persist shared state to localStorage and sync to backend
  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.incidents, incidents);
    if (hydratedIncidentsFromServerRef.current) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (firebaseIdToken) {
        headers.Authorization = `Bearer ${firebaseIdToken}`;
      }
      void fetch('/api/incidents/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ incidents }),
      }).catch(() => {});
    }
  }, [incidents, firebaseIdToken]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.notifications, notifications);
    if (hydratedNotificationsFromServerRef.current) {
      void fetch('/api/notifications/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications }),
      }).catch(() => {});
    }
  }, [notifications]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.staff, staff);
  }, [staff]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.myReportedIds, myReportedIds);
  }, [myReportedIds]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.residentAccounts, residentAccounts);
  }, [residentAccounts]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.policies, globalPolicies);
  }, [globalPolicies]);

  useEffect(() => {
    writeStorageJson(STORAGE_KEYS.advisories, advisories);
  }, [advisories]);

  // Real-time cross-tab synchronization between Resident & Admin portals
  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.incidents && e.newValue) {
        try {
          setIncidents(JSON.parse(e.newValue));
        } catch {
          // ignore malformed storage sync
        }
      }
      if (e.key === STORAGE_KEYS.notifications && e.newValue) {
        try {
          const nextNotifs: AppNotification[] = JSON.parse(e.newValue);
          setNotifications(nextNotifs);
          const newest = nextNotifs[0];
          if (newest && !newest.read) {
            if (isAdminSession && newest.audience === 'admin' && newest.actionType === 'serious_report') {
              setToastState({ message: `${newest.title}: ${newest.message}`, urgent: true });
            } else if (!isAdminSession && newest.audience === 'resident') {
              setToastState({ message: `${newest.title}: ${newest.message}` });
            }
          }
        } catch {
          // ignore malformed storage sync
        }
      }
      if (e.key === STORAGE_KEYS.staff && e.newValue) {
        try {
          setStaff(JSON.parse(e.newValue));
        } catch {
          // ignore malformed storage sync
        }
      }
      if (e.key === STORAGE_KEYS.residentAccounts && e.newValue) {
        try {
          setResidentAccounts(JSON.parse(e.newValue));
        } catch {
          // ignore malformed storage sync
        }
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [isAdminSession]);

  const showToast = (msg: string, urgent = false) => {
    setToastState({ message: msg, urgent });
  };

  useEffect(() => {
    if (!toastState) return;
    const timer = window.setTimeout(() => setToastState(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toastState]);

  const pushNotification = (
    payload: Omit<AppNotification, 'id' | 'createdAt' | 'timestampMs' | 'read'>
  ) => {
    const now = Date.now();
    const entry: AppNotification = {
      ...payload,
      id: `notif-${now}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: `Today · ${formatWatTimestamp()}`,
      timestampMs: now,
      read: false,
    };
    setNotifications((prev) => [entry, ...prev].slice(0, 60));
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = (audience: 'resident' | 'admin') => {
    setNotifications((prev) =>
      prev.map((n) => (n.audience === audience ? { ...n, read: true } : n))
    );
  };

  const adminNotifications = useMemo(
    () => notifications.filter((n) => n.audience === 'admin'),
    [notifications]
  );

  const residentNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (n.audience !== 'resident') return false;
      if (myReportedIds.includes(n.incidentId)) return true;
      if (
        session &&
        session.role === 'resident' &&
        n.recipientName &&
        n.recipientName.toLowerCase() === session.name.toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  }, [notifications, myReportedIds, session]);

  const requireAdminAuth = (actionLabel: string) => {
    if (isAdminSession) return true;
    setCurrentRoute('admin');
    showToast(`Login required: sign in as an authorized officer to ${actionLabel}.`);
    return false;
  };

  const handleSignOut = (message?: string) => {
    setSession(null);
    setFirebaseIdToken('');
    setOfficerPasscode('');
    setPostAdminRoute('admin');
    void signOut(auth).catch(() => {});
    if (OPS_ROUTES.includes(currentRoute as OpsRoute)) {
      setCurrentRoute('admin');
    } else if (currentRoute === 'report') {
      setCurrentRoute('resident');
    }
    showToast(
      message ||
        'Signed out. Admin and operations portal tasks are locked until you log in again.'
    );
  };

  const handleSaveResidentAccount = (account: ResidentAccount) => {
    const normalizedAcc: ResidentAccount = { ...account, status: account.status || 'Active' };
    setResidentAccounts((prev) => {
      const idx = prev.findIndex(
        (a) =>
          a.id === normalizedAcc.id ||
          a.email.toLowerCase() === normalizedAcc.email.toLowerCase() ||
          a.phone === normalizedAcc.phone
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = normalizedAcc;
        return next;
      }
      return [normalizedAcc, ...prev];
    });
    void fetch('/api/residents/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedAcc),
    }).catch(() => {});
  };

  const handleVerifyResidentAccount = (accountId: string) => {
    setResidentAccounts((prev) => {
      const next = prev.map((a) => (a.id === accountId ? { ...a, verified: true } : a));
      const verifiedAcc = next.find((a) => a.id === accountId);
      if (verifiedAcc) {
        void fetch('/api/residents/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verifiedAcc),
        }).catch(() => {});
      }
      return next;
    });
  };

  const handleUpdateResidentProfile = async (payload: {
    name: string;
    email: string;
    phone: string;
    state: string;
    lga: string;
    avatarUrl?: string;
    newPassword?: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    if (!session || session.role !== 'resident') {
      const msg = 'Resident sign-in required to update your profile.';
      showToast(msg, true);
      return { ok: false, error: msg };
    }

    const currentEmail = session.email?.toLowerCase() || '';
    const currentPhone = session.phone || '';

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (firebaseIdToken) {
        headers.Authorization = `Bearer ${firebaseIdToken}`;
      }
      const res = await fetch('/api/residents/me/profile', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          ...payload,
          currentEmail,
          currentPhone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.resident) {
        setResidentAccounts((prev) =>
          prev.map((acc) =>
            acc.id === data.resident.id ||
            (currentEmail && acc.email.toLowerCase() === currentEmail)
              ? {
                  ...acc,
                  ...data.resident,
                  password:
                    payload.newPassword && payload.newPassword.length >= 6
                      ? payload.newPassword
                      : acc.password,
                }
              : acc
          )
        );
        setSession((prev) =>
          prev
            ? {
                ...prev,
                name: data.resident.name,
                email: data.resident.email,
                phone: data.resident.phone,
                jurisdiction: `${data.resident.lga}, ${data.resident.state}`,
                avatarUrl: data.resident.avatarUrl,
              }
            : prev
        );
        showToast('Your resident profile changes have been saved.');
        return { ok: true };
      }
      if (res.status === 403) {
        showToast(data.error || 'Resident account is suspended.', true);
        return { ok: false, error: data.error };
      }
    } catch {
      // Fallback to local state when backend is unreachable
    }

    setResidentAccounts((prev) =>
      prev.map((acc) => {
        const matches =
          (currentEmail && acc.email.toLowerCase() === currentEmail) ||
          (currentPhone && acc.phone === currentPhone) ||
          acc.name.toLowerCase() === session.name.toLowerCase();
        if (!matches) return acc;
        return {
          ...acc,
          name: payload.name.trim() || acc.name,
          email: payload.email.trim().toLowerCase() || acc.email,
          phone: payload.phone.trim() || acc.phone,
          state: payload.state.trim() || acc.state,
          lga: payload.lga.trim() || acc.lga,
          avatarUrl: payload.avatarUrl !== undefined ? payload.avatarUrl : acc.avatarUrl,
          password:
            payload.newPassword && payload.newPassword.length >= 6
              ? payload.newPassword
              : acc.password,
        };
      })
    );
    setSession((prev) =>
      prev
        ? {
            ...prev,
            name: payload.name.trim() || prev.name,
            email: payload.email.trim().toLowerCase() || prev.email,
            phone: payload.phone.trim() || prev.phone,
            jurisdiction: `${payload.lga}, ${payload.state}`,
            avatarUrl: payload.avatarUrl !== undefined ? payload.avatarUrl : prev.avatarUrl,
          }
        : prev
    );
    showToast('Your resident profile changes have been saved.');
    return { ok: true };
  };

  const handleNavigate = (route: ScreenRoute) => {
    if (route === 'report' && isAdminSession) {
      setCurrentRoute('ops');
      showToast('Officers submit field reports from the Operations Command Hub.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (route === 'report' && !session) {
      setPostAuthRoute('report');
      setCurrentRoute('auth');
      showToast('Create an account or sign in first to report an issue.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (route === 'auth') {
      setPostAuthRoute(currentRoute === 'directory' ? 'directory' : 'resident');
      setCurrentRoute('auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (OPS_ROUTES.includes(route as OpsRoute) && !isAdminSession) {
      setPostAdminRoute(route);
      setCurrentRoute('admin');
      showToast('Officer login required to access Operations & Admin tasks.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id ? { ...inc, confirmations: inc.confirmations + 1 } : inc
      )
    );
    showToast('Endorsement logged. Priority score incremented for municipal dispatch.');
  };

  const handleAddComment = (id: string, text: string) => {
    const author = session ? session.name : 'Verified Local Resident';
    const isOfficial = session?.role === 'staff' || session?.role === 'admin';
    const target = incidents.find((i) => i.id === id);

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              updatedAt: `Today · ${formatWatTimestamp()}`,
              comments: [
                {
                  id: `c-${Date.now()}`,
                  author,
                  role: isOfficial ? 'Municipal Engineer' : 'Verified Resident',
                  isOfficial,
                  timestamp: 'Just now',
                  text,
                },
                ...inc.comments,
              ],
            }
          : inc
      )
    );

    if (isOfficial && target) {
      pushNotification({
        audience: 'resident',
        recipientName: target.reporterName,
        incidentId: target.id,
        refCode: target.refCode,
        severity: target.severity,
        actionType: 'comment',
        title: `Official Update · ${target.refCode}`,
        message: `${author}: ${text}`,
      });
      showToast(`Official update posted. Notification sent to ${target.reporterName}.`);
    } else {
      showToast('Eyewitness log appended to public audit stream.');
    }
  };

  const generateRefCode = () => {
    const num = Math.floor(5100 + Math.random() * 4800);
    return `STF-2026-00${num}`;
  };

  const handleQuickCreateIncident = (data: {
    category: IncidentCategory;
    state: string;
    lga: string;
    address: string;
    severity?: IncidentSeverity;
    description?: string;
    hasPhoto: boolean;
    photoUrl?: string;
  }) => {
    if (!session) {
      setPostAuthRoute('resident');
      setCurrentRoute('auth');
      showToast('Sign in required before submitting a report.');
      return;
    }
    const refCode = generateRefCode();
    const severity: IncidentSeverity = data.severity || 'moderate';
    const slaHours = severity === 'critical' ? 24 : severity === 'moderate' ? 48 : 72;
    const reporterName = session?.name || 'Civic Resident';
    const newId = `inc-${Date.now()}`;

    const newInc: Incident = {
      id: newId,
      refCode,
      title: `${data.category} along ${data.address}`,
      category: data.category,
      description:
        data.description?.trim() ||
        `Citizen-submitted ${severity} ${data.category.toLowerCase()} fault reported for ${data.address}, ${data.lga}, ${data.state}. Queued on Admin Portal for municipal verification.`,
      state: data.state,
      lga: data.lga,
      ward: `${data.lga} Central Ward`,
      address: data.address,
      landmark: data.address,
      lat: '5.0377° N',
      lng: '7.9128° E',
      status: 'pending',
      severity,
      reportedAt: `Just now · ${formatWatTimestamp()}`,
      slaRemainingHours: slaHours,
      slaLabel: `${slaHours}h : 00m`,
      confirmations: 1,
      reporterName,
      reporterVerified: true,
      assignedUnit: 'Unassigned',
      assignedDepot: `${data.lga} Works Depot`,
      squadLead: 'Pending Dispatch',
      beforePhotoUrl:
        data.photoUrl ||
        (data.category === 'Blocked Drainage'
          ? HOTLINKED_IMAGES.drainageAuditStage1
          : HOTLINKED_IMAGES.potholeCloseup),
      exifVerified: Boolean(data.hasPhoto || data.photoUrl),
      distanceKm: 1.8,
      comments: [],
    };

    setIncidents((prev) => [newInc, ...prev]);
    setMyReportedIds((prev) => [newId, ...prev.filter((id) => id !== newId)]);
    setSelectedIncidentId(newId);

    if (severity === 'critical') {
      pushNotification({
        audience: 'admin',
        incidentId: newId,
        refCode,
        severity: 'critical',
        actionType: 'serious_report',
        title: `Serious Condition Alert · ${refCode}`,
        message: `${reporterName} reported a critical ${data.category} at ${data.address}, ${data.lga}, ${data.state}. Immediate Admin triage required.`,
      });
      showToast(
        `Urgent report ${refCode} sent to Admin Portal! Serious condition alert triggered.`,
        true
      );
    } else {
      pushNotification({
        audience: 'admin',
        incidentId: newId,
        refCode,
        severity,
        actionType: 'new_report',
        title: `New Resident Report · ${refCode}`,
        message: `${reporterName} reported ${data.category} at ${data.address}, ${data.lga}, ${data.state}.`,
      });
      showToast(`Report ${refCode} logged and synced to Admin Portal.`);
    }
  };

  const handleSubmitFullReport = (payload: {
    state: string;
    lga: string;
    ward: string;
    address: string;
    landmark: string;
    lat: string;
    lng: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
    description: string;
    reporterName: string;
    reporterPhone: string;
    anonymous: boolean;
    photoUrl: string;
  }) => {
    if (!session) {
      setPostAuthRoute('report');
      setCurrentRoute('auth');
      showToast('Sign in required to submit a geotagged incident report.');
      return;
    }
    const refCode = generateRefCode();
    const slaHours = payload.severity === 'critical' ? 24 : payload.severity === 'moderate' ? 48 : 72;
    const reporterName = payload.anonymous
      ? 'Anonymous Resident'
      : payload.reporterName.trim() || session?.name || 'Civic Reporter';
    const newId = `inc-${Date.now()}`;

    const newInc: Incident = {
      id: newId,
      refCode,
      title: `${payload.category} at ${payload.address}`,
      category: payload.category,
      description:
        payload.description.trim() ||
        `Geotagged ${payload.category.toLowerCase()} hazard submitted via GPS Geotag Studio.`,
      state: payload.state,
      lga: payload.lga,
      ward: payload.ward,
      address: payload.address,
      landmark: payload.landmark || payload.address,
      lat: payload.lat,
      lng: payload.lng,
      status: 'pending',
      severity: payload.severity,
      reportedAt: `Just now · ${formatWatTimestamp()}`,
      slaRemainingHours: slaHours,
      slaLabel: `${slaHours}h : 00m`,
      confirmations: 1,
      reporterName,
      reporterPhone: payload.reporterPhone,
      reporterVerified: !payload.anonymous,
      assignedUnit: 'Unassigned',
      assignedDepot: `${payload.lga} Works Base`,
      squadLead: 'Pending Assignment',
      beforePhotoUrl: payload.photoUrl || HOTLINKED_IMAGES.potholeBeforeWork,
      exifVerified: true,
      distanceKm: 1.5,
      comments: [],
    };

    setIncidents((prev) => [newInc, ...prev]);
    setMyReportedIds((prev) => [newId, ...prev.filter((id) => id !== newId)]);
    setSelectedIncidentId(newId);
    handleNavigate('directory');

    if (payload.severity === 'critical') {
      pushNotification({
        audience: 'admin',
        incidentId: newId,
        refCode,
        severity: 'critical',
        actionType: 'serious_report',
        title: `Serious Condition Alert · ${refCode}`,
        message: `${reporterName} submitted a critical ${payload.category} at ${payload.address}, ${payload.lga}, ${payload.state}. Immediate Admin triage required.`,
      });
      showToast(
        `Ticket ${refCode} published! Serious condition alert dispatched to Admin Portal.`,
        true
      );
    } else {
      pushNotification({
        audience: 'admin',
        incidentId: newId,
        refCode,
        severity: payload.severity,
        actionType: 'new_report',
        title: `New Resident Report · ${refCode}`,
        message: `${reporterName} logged ${payload.category} at ${payload.address}, ${payload.lga}, ${payload.state}.`,
      });
      showToast(`Tracking Ticket ${refCode} generated and routed to Admin Portal.`);
    }
  };

  const handleDispatchIncident = (id: string, unit?: string) => {
    if (!requireAdminAuth('dispatch a field squad')) return;
    const assignedUnit = unit || 'AKRMA Squad 4';
    const target = incidents.find((i) => i.id === id);
    const actor = session?.name || 'Engr. Iniobong Ekpo';

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: 'assigned',
              assignedUnit,
              squadLead: actor,
              updatedAt: `Today · ${formatWatTimestamp()}`,
              comments: [
                {
                  id: `c-${Date.now()}`,
                  author: actor,
                  role: 'Dispatch Control',
                  isOfficial: true,
                  timestamp: 'Just now',
                  text: `Dispatched ${assignedUnit} to site for immediate field intervention.`,
                },
                ...inc.comments,
              ],
            }
          : inc
      )
    );

    if (target) {
      pushNotification({
        audience: 'resident',
        recipientName: target.reporterName,
        incidentId: target.id,
        refCode: target.refCode,
        severity: target.severity,
        actionType: 'assigned',
        title: `Squad Dispatched · ${target.refCode}`,
        message: `${assignedUnit} has been dispatched to your report at ${target.address} (${target.lga}).`,
      });
      showToast(`Dispatched ${assignedUnit}. Notification sent to ${target.reporterName}.`);
    } else {
      showToast(`Dispatched ${assignedUnit} to active incident site.`);
    }
  };

  const handleAssignUnit = (id: string, unit: string) => {
    if (!requireAdminAuth('assign response units')) return;
    const target = incidents.find((i) => i.id === id);
    const actor = session?.name || 'Admin Command';

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              assignedUnit: unit,
              status:
                unit === 'Unassigned'
                  ? 'pending'
                  : inc.status === 'pending' || inc.status === 'under_review'
                  ? 'assigned'
                  : inc.status,
              updatedAt: `Today · ${formatWatTimestamp()}`,
              comments:
                unit !== 'Unassigned'
                  ? [
                      {
                        id: `c-${Date.now()}`,
                        author: actor,
                        role: 'Admin Assignment',
                        isOfficial: true,
                        timestamp: 'Just now',
                        text: `Assigned response unit: ${unit}.`,
                      },
                      ...inc.comments,
                    ]
                  : inc.comments,
            }
          : inc
      )
    );

    if (target && unit !== 'Unassigned') {
      pushNotification({
        audience: 'resident',
        recipientName: target.reporterName,
        incidentId: target.id,
        refCode: target.refCode,
        severity: target.severity,
        actionType: 'assigned',
        title: `Response Unit Assigned · ${target.refCode}`,
        message: `${unit} has been assigned to handle your report at ${target.address}.`,
      });
      showToast(`Assigned ${unit}. Reporter (${target.reporterName}) notified.`);
    } else {
      showToast(`Updated squad assignment to ${unit}.`);
    }
  };

  const handleUpdateIncidentStatus = (
    id: string,
    nextStatus: IncidentStatus,
    officialNote?: string
  ) => {
    if (!requireAdminAuth('update incident work-order status')) return;
    const target = incidents.find((i) => i.id === id);
    if (!target) return;

    const actor = session?.name || 'Admin Operations Officer';
    const statusLabelMap: Record<IncidentStatus, string> = {
      pending: 'Pending Dispatch',
      under_review: 'Under Engineering Review',
      assigned: 'Squad Assigned',
      in_progress: 'Work In Progress',
      fixed: 'Fixed & Certified',
    };

    const noteText =
      officialNote?.trim() ||
      `Status updated to "${statusLabelMap[nextStatus]}" by ${actor}.`;

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: nextStatus,
              assignedUnit:
                nextStatus === 'in_progress' && inc.assignedUnit === 'Unassigned'
                  ? 'AKRMA Rapid Unit 02'
                  : inc.assignedUnit,
              progressPhotoUrl:
                nextStatus === 'in_progress'
                  ? inc.progressPhotoUrl || HOTLINKED_IMAGES.rollerStage2
                  : inc.progressPhotoUrl,
              afterPhotoUrl:
                nextStatus === 'fixed'
                  ? inc.afterPhotoUrl || HOTLINKED_IMAGES.finishedRoadStriping
                  : inc.afterPhotoUrl,
              slaRemainingHours: nextStatus === 'fixed' ? 0 : inc.slaRemainingHours || 18,
              slaLabel: nextStatus === 'fixed' ? 'Certified' : inc.slaLabel,
              updatedAt: `Today · ${formatWatTimestamp()}`,
              comments: [
                {
                  id: `c-${Date.now()}`,
                  author: actor,
                  role: 'Executive Admin',
                  isOfficial: true,
                  timestamp: 'Just now',
                  text: noteText,
                },
                ...inc.comments,
              ],
            }
          : inc
      )
    );

    const actionType =
      nextStatus === 'fixed'
        ? 'fixed'
        : nextStatus === 'in_progress'
        ? 'in_progress'
        : nextStatus === 'assigned'
        ? 'assigned'
        : 'comment';

    pushNotification({
      audience: 'resident',
      recipientName: target.reporterName,
      incidentId: target.id,
      refCode: target.refCode,
      severity: target.severity,
      actionType,
      title: `${statusLabelMap[nextStatus]} · ${target.refCode}`,
      message: `${noteText} (${target.address})`,
    });

    showToast(
      `Updated ${target.refCode} to ${statusLabelMap[nextStatus]}. Notification sent to ${target.reporterName}.`
    );
  };

  const handleBatchDispatch = (ids: string[]) => {
    if (!requireAdminAuth('execute batch dispatches')) return;
    const affected = incidents.filter((inc) => ids.includes(inc.id));
    const actor = session?.name || 'Engr. Iniobong Ekpo';

    setIncidents((prev) =>
      prev.map((inc) =>
        ids.includes(inc.id)
          ? {
              ...inc,
              status: inc.status === 'fixed' ? 'fixed' : 'in_progress',
              assignedUnit: inc.assignedUnit === 'Unassigned' ? 'AKRMA Squad 4' : inc.assignedUnit,
              squadLead: actor,
              updatedAt: `Today · ${formatWatTimestamp()}`,
            }
          : inc
      )
    );

    affected.forEach((inc) => {
      if (inc.status !== 'fixed') {
        const unit = inc.assignedUnit === 'Unassigned' ? 'AKRMA Squad 4' : inc.assignedUnit;
        pushNotification({
          audience: 'resident',
          recipientName: inc.reporterName,
          incidentId: inc.id,
          refCode: inc.refCode,
          severity: inc.severity,
          actionType: 'in_progress',
          title: `Crew Mobilized · ${inc.refCode}`,
          message: `${unit} has been mobilized for repair work at ${inc.address}.`,
        });
      }
    });

    showToast(`Batch dispatched ${ids.length} work orders and notified reporters.`);
  };

  const handleFieldCheckIn = (id: string) => {
    if (!requireAdminAuth('check in at a field site')) return;
    const target = incidents.find((i) => i.id === id);

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              checkedIn: true,
              status: inc.status === 'fixed' ? 'fixed' : 'in_progress',
              progressPhotoUrl: inc.progressPhotoUrl || HOTLINKED_IMAGES.rollerStage2,
              updatedAt: `Today · ${formatWatTimestamp()}`,
            }
          : inc
      )
    );

    if (target) {
      pushNotification({
        audience: 'resident',
        recipientName: target.reporterName,
        incidentId: target.id,
        refCode: target.refCode,
        severity: target.severity,
        actionType: 'checked_in',
        title: `Crew Arrived On Site · ${target.refCode}`,
        message: `${target.assignedUnit !== 'Unassigned' ? target.assignedUnit : 'Field engineering crew'} checked in at ${target.address} and started repair work.`,
      });
      showToast(`Geofence verified (35m). Reporter (${target.reporterName}) notified of crew arrival.`);
    } else {
      showToast('Geofence verified (within 35m). Squad checked in on site.');
    }
  };

  const handleResolveIncident = (
    id: string,
    payload: {
      afterPhotoUrl: string;
      asphaltTons: number;
      crewHours: number;
      equipment: string;
      notes: string;
    }
  ) => {
    if (!requireAdminAuth('certify field resolution closeouts')) return;
    const target = incidents.find((i) => i.id === id);

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: 'fixed',
              slaRemainingHours: 0,
              slaLabel: 'Completed',
              afterPhotoUrl: payload.afterPhotoUrl,
              materialsAsphaltTons: payload.asphaltTons,
              crewHours: payload.crewHours,
              updatedAt: `Today · ${formatWatTimestamp()}`,
              comments: [
                {
                  id: `c-${Date.now()}`,
                  author: session?.name || 'Engr. Iniobong Ekpo (Field Squad Lead)',
                  role: 'Field Closeout',
                  isOfficial: true,
                  timestamp: 'Just now',
                  text: `${payload.notes} [${payload.equipment} · ${payload.asphaltTons}t material · ${payload.crewHours} crew hrs]`,
                },
                ...inc.comments,
              ],
            }
          : inc
      )
    );

    if (target) {
      pushNotification({
        audience: 'resident',
        recipientName: target.reporterName,
        incidentId: target.id,
        refCode: target.refCode,
        severity: target.severity,
        actionType: 'fixed',
        title: `Repair Completed · ${target.refCode}`,
        message: `Your reported issue at ${target.address} has been repaired (${payload.asphaltTons}t material, ${payload.crewHours}h) with post-work proof uploaded.`,
      });
      showToast(`Resolution certified Fixed. Notification sent to ${target.reporterName}.`);
    } else {
      showToast('Resolution evidence & material audit certified. Case marked Fixed.');
    }
  };

  const handleUpdateOwnAdminProfile = async (payload: {
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    newPasscode?: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    if (!requireAdminAuth('update your admin profile')) {
      return { ok: false, error: 'Officer authentication required.' };
    }

    const currentOfficer = staff.find(
      (s) =>
        session?.serviceId &&
        s.serviceId.toLowerCase() === session.serviceId.toLowerCase()
    );
    if (!currentOfficer) {
      return { ok: false, error: 'Officer record not found.' };
    }

    const nextName = payload.name.trim() || currentOfficer.name;
    const parts = nextName.split(/\s+/).filter(Boolean);
    const nextInitials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : nextName.slice(0, 2).toUpperCase();

    try {
      const res = await fetch('/api/admins/me/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-officer-service-id': session?.serviceId || '',
          'x-officer-passcode': officerPasscode,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedOfficer: StaffMember = {
          ...currentOfficer,
          ...data.officer,
          avatarUrl: data.officer.avatarUrl || payload.avatarUrl || currentOfficer.avatarUrl,
          passcode: payload.newPasscode?.trim() ? payload.newPasscode.trim() : currentOfficer.passcode,
        };
        setStaff((prev) =>
          prev.map((s) => (s.id === currentOfficer.id ? updatedOfficer : s))
        );
        if (payload.newPasscode && payload.newPasscode.trim().length >= 6) {
          setOfficerPasscode(payload.newPasscode.trim());
        }
        setSession((prev) =>
          prev
            ? {
                ...prev,
                name: updatedOfficer.name,
                email: updatedOfficer.email,
                phone: updatedOfficer.phone,
                avatarUrl: updatedOfficer.avatarUrl,
              }
            : prev
        );
        showToast('Important profile details saved to StreetFix backend.');
        return { ok: true };
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403 || res.status === 401 || res.status === 400) {
          showToast(errData.error || 'Profile update rejected by backend.', true);
          return { ok: false, error: errData.error };
        }
      }
    } catch {
      // Fallback to local state if API server is unreachable
    }

    const updatedLocal: StaffMember = {
      ...currentOfficer,
      name: nextName,
      initials: nextInitials,
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      avatarUrl: payload.avatarUrl ?? currentOfficer.avatarUrl,
      passcode:
        payload.newPasscode && payload.newPasscode.trim().length >= 6
          ? payload.newPasscode.trim()
          : currentOfficer.passcode,
      lastAction: 'Updated personal contact/profile info',
      lastTelemetry: 'Just now',
    };
    setStaff((prev) => prev.map((s) => (s.id === currentOfficer.id ? updatedLocal : s)));
    if (payload.newPasscode && payload.newPasscode.trim().length >= 6) {
      setOfficerPasscode(payload.newPasscode.trim());
    }
    setSession((prev) =>
      prev
        ? {
            ...prev,
            name: updatedLocal.name,
            email: updatedLocal.email,
            phone: updatedLocal.phone,
            avatarUrl: updatedLocal.avatarUrl,
          }
        : prev
    );
    showToast('Important profile details updated.');
    return { ok: true };
  };

  const handleOfficeRegisterAdmin = async (
    payload: Omit<StaffMember, 'id' | 'initials' | 'lastTelemetry' | 'lastAction'> & {
      passcode: string;
    }
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isStreetFixOffice) {
      const msg =
        'Restricted: Only the Office of StreetFix (Website Backend) can register new admin accounts.';
      showToast(msg, true);
      return { ok: false, error: msg };
    }

    try {
      const res = await fetch('/api/office/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-officer-service-id': session?.serviceId || '',
          'x-officer-passcode': officerPasscode,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.officer) {
        const created: StaffMember = {
          ...data.officer,
          passcode: payload.passcode,
        };
        setStaff((prev) => [created, ...prev]);
        showToast(
          `Office Backend registered ${created.name} (${created.serviceId}) under ${created.roleLevel}.`
        );
        return { ok: true };
      }
      if (res.status >= 400 && res.status < 500) {
        showToast(data.error || 'Could not register admin account.', true);
        return { ok: false, error: data.error };
      }
    } catch {
      // Fallback to local enforcement
    }

    const serviceId =
      payload.serviceId.trim() || `#STF-ADM-${Math.floor(1000 + Math.random() * 8999)}`;
    if (staff.some((s) => s.serviceId.toLowerCase() === serviceId.toLowerCase())) {
      const msg = `Service ID ${serviceId} is already assigned.`;
      showToast(msg, true);
      return { ok: false, error: msg };
    }

    const parts = payload.name.trim().split(/\s+/).filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : payload.name.trim().slice(0, 2).toUpperCase();

    const created: StaffMember = {
      ...payload,
      id: `st-${Date.now()}`,
      initials,
      serviceId,
      lastTelemetry: 'Just registered',
      lastAction: `Registered by ${session?.name || 'Office of StreetFix'}`,
    };
    setStaff((prev) => [created, ...prev]);
    showToast(`Office Backend registered ${created.name} (${created.serviceId}).`);
    return { ok: true };
  };

  const handleOfficeUpdateAdmin = async (
    targetId: string,
    payload: Partial<StaffMember>
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isStreetFixOffice) {
      const msg =
        'Restricted: Only the Office of StreetFix (Website Backend) can edit all parts of an admin profile.';
      showToast(msg, true);
      return { ok: false, error: msg };
    }

    const existing = staff.find((s) => s.id === targetId);
    if (!existing) {
      return { ok: false, error: 'Admin account not found.' };
    }

    const isSelfTarget = Boolean(
      session?.serviceId &&
        existing.serviceId.toLowerCase() === session.serviceId.toLowerCase()
    );
    if (
      (existing.id === 'st-hq' || existing.isStreetFixOffice || isSelfTarget) &&
      payload.status &&
      payload.status !== existing.status
    ) {
      const msg =
        'Self-suspension/activation and HQ root account status changes are prohibited.';
      showToast(msg, true);
      return { ok: false, error: msg };
    }

    try {
      const res = await fetch(`/api/office/admins/${targetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-officer-service-id': session?.serviceId || '',
          'x-officer-passcode': officerPasscode,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.officer) {
        const updated: StaffMember = {
          ...existing,
          ...data.officer,
          avatarUrl: data.officer.avatarUrl || payload.avatarUrl || existing.avatarUrl,
          passcode:
            payload.passcode && payload.passcode.trim().length >= 6
              ? payload.passcode.trim()
              : existing.passcode,
        };
        setStaff((prev) => prev.map((s) => (s.id === targetId ? updated : s)));
        if (session?.serviceId?.toLowerCase() === existing.serviceId.toLowerCase()) {
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  name: updated.name,
                  jurisdiction: updated.department,
                  serviceId: updated.serviceId,
                  avatarUrl: updated.avatarUrl,
                  email: updated.email,
                  phone: updated.phone,
                  roleLevel: updated.roleLevel,
                }
              : prev
          );
        }
        showToast(`Office Backend updated all profile fields for ${updated.name}.`);
        return { ok: true };
      }
      if (res.status >= 400 && res.status < 500) {
        showToast(data.error || 'Could not update admin profile.', true);
        return { ok: false, error: data.error };
      }
    } catch {
      // Fallback to local state
    }

    const nextName = payload.name?.trim() || existing.name;
    const parts = nextName.split(/\s+/).filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : nextName.slice(0, 2).toUpperCase();

    const updatedLocal: StaffMember = {
      ...existing,
      ...payload,
      name: nextName,
      initials,
      lastAction: `Profile updated by ${session?.name || 'Office of StreetFix'}`,
      lastTelemetry: 'Just now',
    };
    setStaff((prev) => prev.map((s) => (s.id === targetId ? updatedLocal : s)));
    showToast(`Office Backend updated all profile fields for ${updatedLocal.name}.`);
    return { ok: true };
  };

  const handleAddStaff = (member: Omit<StaffMember, 'id'>) => {
    if (!isStreetFixOffice) {
      showToast(
        'Access denied: Only the Office of StreetFix (Website Backend) can register new admin accounts.',
        true
      );
      return;
    }
    void handleOfficeRegisterAdmin({
      ...member,
      passcode: member.passcode || 'AdminClearance#2026',
    });
  };

  const handleToggleStaffStatus = async (id: string) => {
    if (!isStreetFixOffice) {
      showToast(
        'Restricted: Only the Office of StreetFix (Website Backend) can suspend or activate admin clearance.',
        true
      );
      return;
    }

    const target = staff.find((s) => s.id === id);
    const isSelfTarget = Boolean(
      session?.serviceId &&
        target?.serviceId &&
        target.serviceId.toLowerCase() === session.serviceId.toLowerCase()
    );
    if (id === 'st-hq' || target?.isStreetFixOffice || isSelfTarget) {
      showToast(
        'Self-suspension/activation and HQ root account status changes are prohibited.',
        true
      );
      return;
    }

    try {
      const res = await fetch(`/api/office/admins/${id}/status`, {
        method: 'PATCH',
        headers: {
          'x-officer-service-id': session?.serviceId || '',
          'x-officer-passcode': officerPasscode,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStaff((prev) =>
          prev.map((s) =>
            s.id === id
              ? { ...s, ...data.officer, avatarUrl: data.officer.avatarUrl || s.avatarUrl }
              : s
          )
        );
        showToast(`Updated clearance status to ${data.officer.status}.`);
        return;
      }
      if (res.status >= 400 && res.status < 500) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Could not update clearance status.', true);
        return;
      }
    } catch {
      // Fallback
    }

    setStaff((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'Active' ? 'Suspended' : 'Active' } : s
      )
    );
    showToast('Updated officer RBAC clearance status.');
  };

  const handleCertifyIncident = (id: string) => {
    if (!requireAdminAuth('certify work orders')) return;
    const target = incidents.find((i) => i.id === id);

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: 'fixed',
              slaRemainingHours: 0,
              slaLabel: 'Certified',
              afterPhotoUrl: inc.afterPhotoUrl || HOTLINKED_IMAGES.finishedRoadStriping,
              updatedAt: `Today · ${formatWatTimestamp()}`,
              comments: [
                {
                  id: `c-${Date.now()}`,
                  author: session?.name || 'Admin Portal Certification Officer',
                  role: 'Executive Admin',
                  isOfficial: true,
                  timestamp: 'Just now',
                  text: 'Work order verified, audited, and formally certified closed via Admin Portal.',
                },
                ...inc.comments,
              ],
            }
          : inc
      )
    );

    if (target) {
      pushNotification({
        audience: 'resident',
        recipientName: target.reporterName,
        incidentId: target.id,
        refCode: target.refCode,
        severity: target.severity,
        actionType: 'fixed',
        title: `Work Order Certified Fixed · ${target.refCode}`,
        message: `Admin verified and certified the repair at ${target.address}, ${target.lga} as Fixed.`,
      });
      showToast(`Work order certified Fixed. Notification sent to ${target.reporterName}.`);
    } else {
      showToast('Work order certified and marked Fixed.');
    }
  };

  const handleReopenIncident = (id: string) => {
    if (!requireAdminAuth('reopen closed cases')) return;
    const target = incidents.find((i) => i.id === id);

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status: 'in_progress',
              slaRemainingHours: 12,
              slaLabel: '12h : 00m',
              updatedAt: `Today · ${formatWatTimestamp()}`,
              comments: [
                {
                  id: `c-${Date.now()}`,
                  author: session?.name || 'Admin Portal Audit Officer',
                  role: 'Executive Admin',
                  isOfficial: true,
                  timestamp: 'Just now',
                  text: 'Case reopened by Admin Portal for follow-up quality inspection.',
                },
                ...inc.comments,
              ],
            }
          : inc
      )
    );

    if (target) {
      pushNotification({
        audience: 'resident',
        recipientName: target.reporterName,
        incidentId: target.id,
        refCode: target.refCode,
        severity: target.severity,
        actionType: 'reopened',
        title: `Case Reopened for Inspection · ${target.refCode}`,
        message: `Admin reopened your report at ${target.address} for follow-up quality verification.`,
      });
      showToast(`Case reopened. Notification sent to ${target.reporterName}.`);
    } else {
      showToast('Case reopened and returned to active field queue.');
    }
  };

  const handleDeleteIncident = async (
    id: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isStreetFixOffice) {
      const msg =
        'Restricted: Only the Office of StreetFix (HQ Website Backend) can permanently purge incident records.';
      showToast(msg, true);
      return { ok: false, error: msg };
    }

    try {
      const res = await fetch(`/api/office/incidents/${id}`, {
        method: 'DELETE',
        headers: {
          'x-officer-service-id': session?.serviceId || '',
          'x-officer-passcode': officerPasscode,
        },
      });
      if (res.status >= 400 && res.status < 500) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Could not purge incident.', true);
        return { ok: false, error: err.error };
      }
    } catch {
      // Proceed with local update if server unavailable
    }

    setIncidents((prev) => {
      const next = prev.filter((inc) => inc.id !== id);
      if (selectedIncidentId === id) {
        setSelectedIncidentId(next[0]?.id || '');
      }
      return next;
    });
    showToast('HQ Backend permanently purged incident record from ledger.');
    return { ok: true };
  };

  const handleOfficeDeleteAdmin = async (
    targetId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isStreetFixOffice) {
      const msg =
        'Restricted: Only the Office of StreetFix (Website Backend) can permanently revoke admin accounts.';
      showToast(msg, true);
      return { ok: false, error: msg };
    }
    const target = staff.find((s) => s.id === targetId);
    const isSelfTarget = Boolean(
      session?.serviceId &&
        target?.serviceId &&
        target.serviceId.toLowerCase() === session.serviceId.toLowerCase()
    );
    if (targetId === 'st-hq' || target?.isStreetFixOffice || isSelfTarget) {
      const msg =
        'Self-deletion and HQ root account removal are prohibited.';
      showToast(msg, true);
      return { ok: false, error: msg };
    }

    try {
      const res = await fetch(`/api/office/admins/${targetId}`, {
        method: 'DELETE',
        headers: {
          'x-officer-service-id': session?.serviceId || '',
          'x-officer-passcode': officerPasscode,
        },
      });
      if (res.status >= 400 && res.status < 500) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Could not revoke admin account.', true);
        return { ok: false, error: err.error };
      }
    } catch {
      // Fallback to local update
    }

    setStaff((prev) => prev.filter((s) => s.id !== targetId));
    showToast('HQ Backend permanently revoked admin account and clearance.');
    return { ok: true };
  };

  const handleOfficeModerateResident = async (
    residentId: string,
    patch: { verified?: boolean; status?: 'Active' | 'Suspended' }
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isStreetFixOffice) {
      const msg =
        'Restricted: Only the Office of StreetFix (Website Backend) can moderate resident accounts.';
      showToast(msg, true);
      return { ok: false, error: msg };
    }

    try {
      const res = await fetch(`/api/office/residents/${residentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-officer-service-id': session?.serviceId || '',
          'x-officer-passcode': officerPasscode,
        },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.resident) {
        setResidentAccounts((prev) =>
          prev.map((r) => (r.id === residentId ? { ...r, ...data.resident } : r))
        );
        showToast(
          patch.status
            ? `Resident status updated to ${patch.status}.`
            : 'Resident verification status updated by HQ.'
        );
        return { ok: true };
      }
      if (res.status >= 400 && res.status < 500) {
        showToast(data.error || 'Could not moderate resident account.', true);
        return { ok: false, error: data.error };
      }
    } catch {
      // Fallback to local state
    }

    setResidentAccounts((prev) =>
      prev.map((r) =>
        r.id === residentId
          ? {
              ...r,
              verified: patch.verified ?? r.verified,
              status: patch.status ?? r.status ?? 'Active',
            }
          : r
      )
    );
    showToast('Resident account governance status updated.');
    return { ok: true };
  };

  const handleOfficeDeleteResident = async (
    residentId: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isStreetFixOffice) {
      const msg =
        'Restricted: Only the Office of StreetFix (Website Backend) can remove resident accounts.';
      showToast(msg, true);
      return { ok: false, error: msg };
    }

    try {
      const res = await fetch(`/api/office/residents/${residentId}`, {
        method: 'DELETE',
        headers: {
          'x-officer-service-id': session?.serviceId || '',
          'x-officer-passcode': officerPasscode,
        },
      });
      if (res.status >= 400 && res.status < 500) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Could not remove resident account.', true);
        return { ok: false, error: err.error };
      }
    } catch {
      // Fallback
    }

    setResidentAccounts((prev) => prev.filter((r) => r.id !== residentId));
    showToast('Resident account permanently removed by HQ Backend.');
    return { ok: true };
  };

  const handleUpdateGlobalPolicies = async (
    partial: Partial<GlobalPolicies>
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!isStreetFixOffice) {
      const msg =
        'Restricted: Only the Office of StreetFix (Website Backend) can alter global system & SLA policies.';
      showToast(msg, true);
      return { ok: false, error: msg };
    }

    try {
      const res = await fetch('/api/office/policies', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-officer-service-id': session?.serviceId || '',
          'x-officer-passcode': officerPasscode,
        },
        body: JSON.stringify(partial),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.policies) {
        setGlobalPolicies({ ...DEFAULT_GLOBAL_POLICIES, ...data.policies });
        showToast('Global system & SLA policies committed to StreetFix backend.');
        return { ok: true };
      }
      if (res.status >= 400 && res.status < 500) {
        showToast(data.error || 'Could not update policies.', true);
        return { ok: false, error: data.error };
      }
    } catch {
      // Fallback
    }

    setGlobalPolicies((prev) => ({ ...prev, ...partial }));
    showToast('Global system & SLA policies updated.');
    return { ok: true };
  };

  const handlePostAdvisory = async (
    text: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!requireAdminAuth('broadcast municipal advisories')) {
      return { ok: false, error: 'Officer clearance required.' };
    }
    const clean = text.trim();
    if (!clean) {
      return { ok: false, error: 'Advisory text cannot be empty.' };
    }

    try {
      const res = await fetch('/api/advisories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-officer-service-id': session?.serviceId || '',
          'x-officer-passcode': officerPasscode,
        },
        body: JSON.stringify({ text: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.advisory) {
        setAdvisories((prev) => [data.advisory, ...prev].slice(0, 40));
        showToast('Municipal advisory broadcast to all active state terminals.');
        return { ok: true };
      }
      if (res.status >= 400 && res.status < 500) {
        showToast(data.error || 'Could not publish advisory.', true);
        return { ok: false, error: data.error };
      }
    } catch {
      // Fallback
    }

    const fallbackEntry: BroadcastAdvisory = {
      id: `b-${Date.now()}`,
      time: `Today · ${formatWatTimestamp()}`,
      author: `${session?.name || 'Admin Command'} (${session?.serviceId || 'OPS'})`,
      text: clean,
    };
    setAdvisories((prev) => [fallbackEntry, ...prev].slice(0, 40));
    showToast('Municipal advisory broadcast queued.');
    return { ok: true };
  };

  const isOpsRoute = OPS_ROUTES.includes(currentRoute as OpsRoute);
  const showOpsWorkstation = isOpsRoute && isAdminSession;
  const showAdminGatewayOrConsole =
    currentRoute === 'admin' || (isOpsRoute && !isAdminSession);
  const showPublicChrome = !showAdminGatewayOrConsole && !showOpsWorkstation;
  const opsPendingCount = incidents.filter(
    (i) => i.status === 'pending' || i.status === 'under_review'
  ).length;
  const opsActiveCount = incidents.filter(
    (i) => i.status === 'in_progress' || i.status === 'assigned'
  ).length;

  return (
    <div
      className={`min-h-screen flex flex-col overflow-x-clip ${
        showOpsWorkstation ? 'bg-[#F4F7F9] text-slate-900' : 'bg-[#F8FAF5] text-[#1A1D1A]'
      }`}
    >
      {showPublicChrome && (
        <TopNavBar
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          session={session}
          onSignOut={() => handleSignOut('Signed out of active StreetFix session.')}
          notifications={residentNotifications}
          onSelectNotification={(notif) => {
            handleMarkNotificationRead(notif.id);
            setSelectedIncidentId(notif.incidentId);
            handleNavigate('directory');
          }}
          onMarkAllNotificationsRead={() => handleMarkAllNotificationsRead('resident')}
        />
      )}

      {/* Toast Notification */}
      {toastState && (
        <div
          role="status"
          className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-5 sm:right-5 z-50 sm:max-w-sm text-white rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3 ${
            toastState.urgent
              ? 'bg-[#7F1D1D] border border-red-400/60'
              : isOpsRoute
              ? 'bg-[#0F1E24] border border-cyan-500/40'
              : 'bg-[#0B231A] border border-[#D8FA64]/40'
          }`}
        >
          {toastState.urgent ? (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" />
          ) : (
            <CheckCircle2
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                isOpsRoute ? 'text-cyan-300' : 'text-[#D8FA64]'
              }`}
            />
          )}
          <p className="text-xs font-medium leading-relaxed flex-1">{toastState.message}</p>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToastState(null)}
            className="text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {currentRoute === 'resident' && (
          <ResidentPortal
            incidents={incidents}
            myReportedIds={myReportedIds}
            session={session}
            residentAccounts={residentAccounts}
            onSaveResidentAccount={handleSaveResidentAccount}
            onVerifyResidentAccount={handleVerifyResidentAccount}
            onUpdateResidentProfile={handleUpdateResidentProfile}
            notifications={residentNotifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={() => handleMarkAllNotificationsRead('resident')}
            onLogin={(newSession, idToken) => {
              setSession(newSession);
              if (idToken) setFirebaseIdToken(idToken);
              showToast(`Signed in as ${newSession.name} (${newSession.jurisdiction}).`);
            }}
            onSignOut={() => handleSignOut('Signed out of resident account.')}
            onNavigate={handleNavigate}
            onSelectIncident={setSelectedIncidentId}
            onConfirmIncident={handleConfirmIncident}
            onQuickCreateIncident={handleQuickCreateIncident}
            onNotify={showToast}
          />
        )}

        {currentRoute === 'report' &&
          !isAdminSession &&
          (session ? (
            <ReportStudio
              defaultReporterName={session.name}
              session={session}
              onNavigate={handleNavigate}
              onNotify={showToast}
              onSubmitReport={handleSubmitFullReport}
            />
          ) : (
            <AuthHub
              redirectTarget="report"
              isAdminSession={isAdminSession}
              hasSession={Boolean(session)}
              residentAccounts={residentAccounts}
              onSaveResidentAccount={handleSaveResidentAccount}
              onVerifyResidentAccount={handleVerifyResidentAccount}
              onLogin={(newSession, idToken) => {
                setSession(newSession);
                if (idToken) setFirebaseIdToken(idToken);
                setCurrentRoute('report');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                showToast(`Signed in as ${newSession.name} (${newSession.jurisdiction}).`);
              }}
              onNavigate={handleNavigate}
              onNotify={showToast}
            />
          ))}

        {currentRoute === 'directory' && (
          <IncidentDirectory
            incidents={incidents}
            selectedIncidentId={selectedIncidentId}
            isAdminSession={isAdminSession}
            isStreetFixOffice={isStreetFixOffice}
            onSelectIncident={setSelectedIncidentId}
            onConfirmIncident={handleConfirmIncident}
            onAddComment={handleAddComment}
            onAssignUnit={handleAssignUnit}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            onCertifyIncident={handleCertifyIncident}
            onReopenIncident={handleReopenIncident}
            onDeleteIncident={handleDeleteIncident}
            onNavigate={handleNavigate}
            onNotify={showToast}
          />
        )}

        {currentRoute === 'auth' && (
          <AuthHub
            redirectTarget={postAuthRoute}
            isAdminSession={isAdminSession}
            hasSession={Boolean(session)}
            residentAccounts={residentAccounts}
            onSaveResidentAccount={handleSaveResidentAccount}
            onVerifyResidentAccount={handleVerifyResidentAccount}
            onLogin={(newSession, idToken) => {
              setSession(newSession);
              if (idToken) setFirebaseIdToken(idToken);
              setCurrentRoute(postAuthRoute);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              showToast(`Signed in as ${newSession.name} (${newSession.jurisdiction}).`);
            }}
            onNavigate={handleNavigate}
            onNotify={showToast}
          />
        )}

        {showAdminGatewayOrConsole && (
          <AdminPortal
            incidents={incidents}
            staff={staff}
            residentAccounts={residentAccounts}
            session={session}
            globalPolicies={globalPolicies}
            advisories={advisories}
            notifications={adminNotifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={() => handleMarkAllNotificationsRead('admin')}
            onLogin={(newSession, rawPasscode) => {
              setSession(newSession);
              if (rawPasscode) setOfficerPasscode(rawPasscode);
              const target = postAdminRoute;
              setPostAdminRoute('admin');
              if (target && target !== 'admin') {
                setCurrentRoute(target);
              }
              const seriousUnread = adminNotifications.filter(
                (n) => !n.read && n.actionType === 'serious_report'
              ).length;
              if (seriousUnread > 0) {
                showToast(
                  `Admin Portal unlocked. ${seriousUnread} serious condition alert(s) require attention.`,
                  true
                );
              } else {
                showToast(
                  newSession.isStreetFixOffice
                    ? `StreetFix Office Backend unlocked for ${newSession.name}.`
                    : `Admin Portal unlocked for ${newSession.name} (${newSession.serviceId}).`
                );
              }
            }}
            onSignOut={() =>
              handleSignOut('Signed out of Admin Portal clearance. Log in again to perform tasks.')
            }
            onNavigate={handleNavigate}
            onSelectIncident={setSelectedIncidentId}
            onAssignUnit={handleAssignUnit}
            onUpdateIncidentStatus={handleUpdateIncidentStatus}
            onDeleteIncident={handleDeleteIncident}
            onToggleStaffStatus={handleToggleStaffStatus}
            onOfficeDeleteAdmin={handleOfficeDeleteAdmin}
            onOfficeModerateResident={handleOfficeModerateResident}
            onOfficeDeleteResident={handleOfficeDeleteResident}
            onUpdateGlobalPolicies={handleUpdateGlobalPolicies}
            onPostAdvisory={handlePostAdvisory}
            onUpdateOwnProfile={handleUpdateOwnAdminProfile}
            onOfficeRegisterAdmin={handleOfficeRegisterAdmin}
            onOfficeUpdateAdmin={handleOfficeUpdateAdmin}
            onCertifyIncident={handleCertifyIncident}
            onReopenIncident={handleReopenIncident}
            onNotify={showToast}
          />
        )}

        {showOpsWorkstation && (
          <OperationsShell
            currentRoute={currentRoute as OpsRoute}
            onNavigate={handleNavigate}
            session={session}
            onSignOut={() =>
              handleSignOut('Signed out of Operations Portal. Log in again to perform tasks.')
            }
            pendingCount={opsPendingCount}
            activeCount={opsActiveCount}
            notifications={adminNotifications}
            onSelectNotification={(notif) => {
              handleMarkNotificationRead(notif.id);
              setSelectedIncidentId(notif.incidentId);
              handleNavigate('triage');
            }}
            onMarkAllNotificationsRead={() => handleMarkAllNotificationsRead('admin')}
          >
            {currentRoute === 'ops' && (
              <OpsCommandHub
                incidents={incidents}
                onNavigate={handleNavigate}
                onSelectIncident={setSelectedIncidentId}
                onDispatchIncident={handleDispatchIncident}
                onQuickCreateIncident={handleQuickCreateIncident}
                onNotify={showToast}
              />
            )}

            {currentRoute === 'triage' && (
              <TriageMatrix
                incidents={incidents}
                onNavigate={handleNavigate}
                onAssignUnit={handleAssignUnit}
                onBatchDispatch={handleBatchDispatch}
                onSelectIncident={setSelectedIncidentId}
                onNotify={showToast}
              />
            )}

            {currentRoute === 'dispatch' && (
              <FieldDispatchPortal
                incidents={incidents}
                selectedIncidentId={selectedIncidentId}
                session={session}
                onSelectIncident={setSelectedIncidentId}
                onCheckIn={handleFieldCheckIn}
                onResolveIncident={handleResolveIncident}
                onNavigate={handleNavigate}
                onNotify={showToast}
              />
            )}

            {currentRoute === 'analytics' && (
              <ExecutiveAnalytics
                incidents={incidents}
                onNavigate={handleNavigate}
                onNotify={showToast}
              />
            )}

            {currentRoute === 'governance' && (
              <GovernanceHub
                incidents={incidents}
                staff={staff}
                session={session}
                residentCount={residentAccounts.length}
                isStreetFixOffice={isStreetFixOffice}
                onAddStaff={handleAddStaff}
                onToggleStaffStatus={handleToggleStaffStatus}
                onNavigate={handleNavigate}
                onNotify={showToast}
              />
            )}
          </OperationsShell>
        )}
      </div>

      {showPublicChrome && (
        <HelplineFooter
          onNavigate={handleNavigate}
          isAdminSession={isAdminSession}
          isLoggedIn={Boolean(session)}
        />
      )}
    </div>
  );
}
