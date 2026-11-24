import React, { useEffect, useRef, useState } from 'react';
import {
  LayoutGrid,
  SlidersHorizontal,
  Truck,
  BarChart3,
  Users,
  ShieldAlert,
  MapPin,
  ArrowLeft,
  LogOut,
  Bell,
  AlertTriangle,
  CheckCheck,
} from 'lucide-react';
import { AppNotification, ScreenRoute, UserSession } from '../types';
import { BrandMark } from './BrandLogo';
import { SafeImage } from './SafeImage';

export type OpsRoute = 'ops' | 'triage' | 'dispatch' | 'analytics' | 'governance';

interface OperationsShellProps {
  currentRoute: OpsRoute;
  onNavigate: (route: ScreenRoute) => void;
  session: UserSession | null;
  onSignOut: () => void;
  pendingCount: number;
  activeCount: number;
  notifications?: AppNotification[];
  onSelectNotification?: (notif: AppNotification) => void;
  onMarkAllNotificationsRead?: () => void;
  children: React.ReactNode;
}

const MODULE_META: Record<
  OpsRoute,
  { title: string; subtitle: string }
> = {
  ops: {
    title: 'Ops Command GIS',
    subtitle: '36 States + FCT Cadastre & Intake Terminal',
  },
  triage: {
    title: 'Triage Matrix',
    subtitle: 'Priority Queue & Squad Routing',
  },
  dispatch: {
    title: 'Field Dispatch',
    subtitle: 'Route Navigation & Resolution Closeout',
  },
  analytics: {
    title: 'SLA Analytics',
    subtitle: '36-State & 774-LGA Compliance Scorecards',
  },
  governance: {
    title: 'RBAC & Governance',
    subtitle: 'Personnel Clearance & Agency Quotas',
  },
};

export const OperationsShell: React.FC<OperationsShellProps> = ({
  currentRoute,
  onNavigate,
  session,
  onSignOut,
  pendingCount,
  activeCount,
  notifications = [],
  onSelectNotification,
  onMarkAllNotificationsRead,
  children,
}) => {
  const [clockText, setClockText] = useState(() =>
    new Date().toLocaleTimeString('en-NG', { hour12: false })
  );
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClockText(new Date().toLocaleTimeString('en-NG', { hour12: false }));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!alertsOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [alertsOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentUnreadCount = notifications.filter(
    (n) => !n.read && n.actionType === 'serious_report'
  ).length;

  const opsModules: {
    route: OpsRoute;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      route: 'ops',
      label: 'Ops Command GIS',
      icon: <LayoutGrid className="w-4 h-4 shrink-0" />,
      badge: activeCount,
    },
    {
      route: 'triage',
      label: 'Triage Matrix',
      icon: <SlidersHorizontal className="w-4 h-4 shrink-0" />,
      badge: pendingCount,
    },
    {
      route: 'dispatch',
      label: 'Field Dispatch',
      icon: <Truck className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'analytics',
      label: 'SLA Analytics',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      route: 'governance',
      label: 'RBAC & Governance',
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
  ];

  const activeMeta = MODULE_META[currentRoute];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F9] text-slate-900">
      {/* Standalone Tactical Operations Top Header */}
      <header className="sticky top-0 z-40 h-14 bg-[#0F1E24] text-white border-b border-cyan-500/20 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigate('ops')}
            className="inline-flex items-center gap-2 shrink-0 cursor-pointer text-left"
          >
            <BrandMark className="w-8 h-8 shrink-0" />
            <span className="text-sm font-extrabold tracking-tight text-white whitespace-nowrap">
              StreetFix <span className="text-cyan-400">Ops</span>
            </span>
          </button>

          <span className="hidden sm:inline text-slate-600" aria-hidden="true">
            /
          </span>

          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-slate-200 truncate">
              {activeMeta.title}
            </span>
            <span className="hidden lg:inline text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="hidden lg:inline text-xs text-slate-400 truncate">
              {activeMeta.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0" ref={alertsRef}>
          <span className="hidden md:inline-block font-mono text-xs font-semibold text-cyan-300 tabular-nums whitespace-nowrap px-2.5 py-1 rounded-md bg-[#0A1419] border border-cyan-500/20">
            {clockText} WAT
          </span>

          {/* Ops Serious Condition Alert Bell */}
          <div className="relative">
            <button
              type="button"
              aria-label="Open admin alerts"
              onClick={() => setAlertsOpen((prev) => !prev)}
              className={`relative p-2 rounded-lg border transition-colors cursor-pointer ${
                urgentUnreadCount > 0
                  ? 'border-red-400/60 bg-red-950/60 text-red-200'
                  : 'border-slate-700 bg-[#0A1419] text-cyan-300 hover:border-cyan-400/50'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums ${
                    urgentUnreadCount > 0 ? 'bg-red-600' : 'bg-cyan-600'
                  }`}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {alertsOpen && (
              <div
                role="dialog"
                aria-label="Operations alerts"
                className="fixed inset-x-3 top-14 sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-2xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 bg-[#0F1E24] text-white flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold">Command &amp; Serious Hazard Alerts</div>
                    <div className="text-[11px] text-slate-300">
                      {urgentUnreadCount > 0
                        ? `${urgentUnreadCount} urgent critical report(s)`
                        : `${unreadCount} unread alert(s)`}
                    </div>
                  </div>
                  {unreadCount > 0 && onMarkAllNotificationsRead && (
                    <button
                      type="button"
                      onClick={onMarkAllNotificationsRead}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No incoming report notifications yet.
                    </div>
                  ) : (
                    notifications.slice(0, 12).map((notif) => {
                      const isSerious = notif.actionType === 'serious_report';
                      return (
                        <button
                          key={notif.id}
                          type="button"
                          onClick={() => {
                            onSelectNotification?.(notif);
                            setAlertsOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-3 cursor-pointer ${
                            !notif.read
                              ? isSerious
                                ? 'bg-red-50/70'
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
                              <span className="text-slate-400">{notif.createdAt}</span>
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
            onClick={() => onNavigate('admin')}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Admin Console</span>
            <span className="md:hidden">Admin</span>
          </button>

          {session && (
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0A1419] border border-cyan-500/25 shrink-0">
              {session.avatarUrl ? (
                <SafeImage
                  src={session.avatarUrl}
                  alt={session.name}
                  className="w-6 h-6 rounded-md object-cover border border-cyan-400/50 shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {session.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-white max-w-[130px] truncate">
                {session.name}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                  session.isStreetFixOffice
                    ? 'bg-[#D8FA64] text-[#0A1419]'
                    : 'bg-cyan-500/20 text-cyan-300'
                }`}
              >
                {session.isStreetFixOffice ? 'HQ' : 'ADMIN'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate('resident')}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Public Site</span>
          </button>

          {session && (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-950/40 hover:bg-red-900/60 text-red-200 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Mobile / Tablet Horizontal Module Switcher */}
      <nav
        aria-label="Operations modules mobile switcher"
        className="md:hidden w-full bg-[#0A1419] border-b border-slate-800 px-4 py-2.5 overflow-x-auto flex items-center gap-2"
      >
        {opsModules.map((mod) => {
          const isActive = currentRoute === mod.route;
          return (
            <button
              key={mod.route}
              type="button"
              onClick={() => onNavigate(mod.route)}
              className={`shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold min-h-[40px] transition-colors cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-[#0A1419] font-bold'
                  : 'bg-[#0F1E24] text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {mod.icon}
              <span>{mod.label}</span>
              {mod.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums ${
                    isActive
                      ? 'bg-[#0A1419] text-cyan-300'
                      : 'bg-slate-800 text-cyan-300'
                  }`}
                >
                  {mod.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Workstation Body: Left Tactical Rail + Module Viewport */}
      <div className="flex-1 flex min-w-0">
        <aside className="hidden md:flex w-60 shrink-0 flex-col justify-between bg-[#0A1419] text-slate-200 border-r border-slate-800 p-4">
          <div className="space-y-6">
            {/* Jurisdiction Summary */}
            <div className="p-3.5 rounded-xl bg-[#0F1E24] border border-cyan-500/20 space-y-1">
              <div className="text-[11px] font-semibold text-cyan-400">
                Operations Workstation
              </div>
              <div className="text-xs font-bold text-white">
                National Works Command
              </div>
              <div className="text-[11px] text-slate-400">
                36 States + FCT · 774 LGAs
              </div>
            </div>

            {/* 5 Operations Modules */}
            <div className="space-y-1.5">
              <div className="px-2 text-[11px] font-semibold text-slate-400">
                Operations Modules
              </div>
              <nav aria-label="Operations modules" className="space-y-1">
                {opsModules.map((mod) => {
                  const isActive = currentRoute === mod.route;
                  return (
                    <button
                      key={mod.route}
                      type="button"
                      onClick={() => onNavigate(mod.route)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500 text-[#0A1419] font-bold'
                          : 'text-slate-300 hover:bg-[#0F1E24] hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        {mod.icon}
                        <span className="truncate whitespace-nowrap">{mod.label}</span>
                      </span>
                      {mod.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[11px] tabular-nums shrink-0 ${
                            isActive
                              ? 'bg-[#0A1419] text-cyan-300'
                              : 'bg-slate-800 text-cyan-300'
                          }`}
                        >
                          {mod.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Cross-Workspace Links */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="px-2 text-[11px] font-semibold text-slate-400">
                Connected Desks
              </div>
              <button
                type="button"
                onClick={() => onNavigate('directory')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#0F1E24] hover:text-white transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">Public Tracker</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-[#0F1E24] hover:text-white transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">Executive Admin</span>
              </button>
            </div>
          </div>

          {/* Operator Footer */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5 text-xs">
            {session ? (
              <div className="p-2.5 rounded-lg bg-[#0F1E24] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {session.avatarUrl ? (
                    <SafeImage
                      src={session.avatarUrl}
                      alt={session.name}
                      className="w-9 h-9 rounded-lg object-cover border border-cyan-400/40 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {session.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white truncate">{session.name}</div>
                    <div className="text-[11px] font-mono text-cyan-300 truncate">
                      {session.serviceId || session.jurisdiction}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 space-y-1 px-1">
                <div className="flex items-center justify-between">
                  <span>Cadastre</span>
                  <span className="text-cyan-300 font-medium">36 States + FCT</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>LGAs Active</span>
                  <span className="text-slate-200 font-medium">774 Nationwide</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Active Module Content Viewport */}
        <main className="flex-1 min-w-0 bg-[#F4F7F9]">
          {children}
        </main>
      </div>
    </div>
  );
};
