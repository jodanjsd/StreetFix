import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  X,
  Phone,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { AppNotification, ScreenRoute, UserSession } from '../types';
import { BrandLogo } from './BrandLogo';
import { SafeImage } from './SafeImage';

interface TopNavBarProps {
  currentRoute: ScreenRoute;
  onNavigate: (route: ScreenRoute) => void;
  session: UserSession | null;
  onSignOut: () => void;
  notifications?: AppNotification[];
  onSelectNotification?: (notif: AppNotification) => void;
  onMarkAllNotificationsRead?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  currentRoute,
  onNavigate,
  session,
  onSignOut,
  notifications = [],
  onSelectNotification,
  onMarkAllNotificationsRead,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const desktopNotifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);

  const isAdminSession = Boolean(
    session && (session.role === 'admin' || session.role === 'staff')
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!userMenuOpen && !notifOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      const inDesktopNotif = desktopNotifRef.current?.contains(target);
      const inMobileNotif = mobileNotifRef.current?.contains(target);
      if (!inDesktopNotif && !inMobileNotif) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, notifOpen]);

  const navItems: { route: ScreenRoute; label: string }[] = isAdminSession
    ? [
        { route: 'resident', label: 'Resident Portal' },
        { route: 'directory', label: 'Incident Tracker' },
        { route: 'ops', label: 'Ops Command' },
        { route: 'dispatch', label: 'Field Dispatch' },
        { route: 'analytics', label: 'Analytics' },
      ]
    : [
        { route: 'resident', label: 'Resident Portal' },
        { route: 'directory', label: 'Incident Tracker' },
      ];

  const handleNav = (route: ScreenRoute) => {
    onNavigate(route);
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  };

  const renderNotifPopover = () => (
    <div
      role="dialog"
      aria-label="Reporter notifications"
      className="fixed inset-x-3 top-[4.25rem] sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 text-left overflow-hidden text-[#1A1D1A]"
    >
      <div className="px-4 py-3 bg-[#0B231A] text-white flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-bold">Reporter Updates</div>
          <div className="text-[11px] text-[#A3B899]">
            {unreadCount > 0 ? `${unreadCount} unread status alert(s)` : 'All updates read'}
          </div>
        </div>
        {unreadCount > 0 && onMarkAllNotificationsRead && (
          <button
            type="button"
            onClick={onMarkAllNotificationsRead}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#132E20] hover:bg-[#183D2A] text-[#D8FA64] text-[11px] font-semibold cursor-pointer shrink-0"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-6 text-center space-y-1">
            <div className="text-xs font-bold text-slate-800">No updates yet</div>
            <p className="text-[11px] text-slate-500">
              When municipal crews or admins act on your submitted reports, alerts appear here.
            </p>
          </div>
        ) : (
          notifications.slice(0, 12).map((notif) => (
            <button
              key={notif.id}
              type="button"
              onClick={() => {
                onSelectNotification?.(notif);
                setNotifOpen(false);
                setMobileOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-[#F8FAF5] transition-colors flex items-start gap-3 cursor-pointer ${
                !notif.read ? 'bg-[#F4FBE4]/70' : 'bg-white'
              }`}
            >
              <span
                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                  !notif.read
                    ? notif.actionType === 'fixed'
                      ? 'bg-emerald-600'
                      : 'bg-[#E06236]'
                    : 'bg-slate-300'
                }`}
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono font-bold text-[#132E20] truncate">
                    {notif.refCode}
                  </span>
                  <span className="text-slate-400 shrink-0">{notif.createdAt}</span>
                </div>
                <div className="text-xs font-bold text-slate-900">{notif.title}</div>
                <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                  {notif.message}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <header className="w-full bg-[#0B231A] text-white border-b border-white/12 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3 xl:gap-8">
        {/* Brand Zone */}
        <button
          type="button"
          onClick={() => handleNav('resident')}
          className="flex items-center whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#D8FA64] rounded-md min-w-0"
        >
          <BrandLogo />
        </button>

        {/* Nav Links Zone */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
          {navItems.map((item) => {
            const isActive =
              currentRoute === item.route ||
              (item.route === 'ops' && (currentRoute === 'triage' || currentRoute === 'governance'));
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => handleNav(item.route)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#D8FA64] border-[#D8FA64] font-semibold'
                    : 'text-[#A3B899] border-transparent hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Primary Action Zone (Desktop) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <a
            href="tel:+23412270000"
            className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 text-xs font-medium text-[#A3B899] hover:text-[#D8FA64] hover:border-[#D8FA64] transition-colors whitespace-nowrap shrink-0"
          >
            <Phone className="w-3.5 h-3.5 text-[#D8FA64]" />
            <span className="tabular-nums">01 227 0000</span>
          </a>

          {!session && (
            <button
              type="button"
              onClick={() => handleNav('admin')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentRoute === 'admin'
                  ? 'bg-[#183D2A] border-[#D8FA64] text-[#D8FA64]'
                  : 'border-white/15 text-[#A3B899] hover:text-white hover:border-white/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D8FA64]" />
              <span>Admin portal</span>
            </button>
          )}

          {/* Reporter Notification Bell */}
          <div className="relative" ref={desktopNotifRef}>
            <button
              type="button"
              aria-label="Open report notifications"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setUserMenuOpen(false);
              }}
              className={`relative p-2 rounded-full border transition-colors cursor-pointer ${
                unreadCount > 0
                  ? 'border-[#D8FA64]/60 bg-[#132E20] text-[#D8FA64]'
                  : 'border-white/15 text-[#A3B899] hover:text-white hover:border-white/40'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E06236] text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && renderNotifPopover()}
          </div>

          {session && isAdminSession && (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNotifOpen(false);
                }}
                className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-[#D8FA64]/50 bg-[#132E20] text-xs font-semibold text-white hover:border-[#D8FA64] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                {session.avatarUrl ? (
                  <SafeImage
                    src={session.avatarUrl}
                    alt={session.name}
                    className="w-6 h-6 rounded-full object-cover border border-[#D8FA64]/70 shrink-0"
                  />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D8FA64] ml-1.5" />
                )}
                <span className="max-w-[135px] truncate">{session.name}</span>
                {session.isStreetFixOffice && (
                  <span className="px-1.5 py-0.5 rounded bg-[#D8FA64] text-[#0B231A] text-[9px] font-mono font-extrabold shrink-0">
                    HQ
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[#D8FA64] shrink-0" />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 rounded-xl bg-[#0F172A] border border-slate-700 shadow-2xl py-2 z-50 text-left"
                >
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate">{session.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[#D8FA64] text-[9px] font-mono font-bold shrink-0">
                        {session.isStreetFixOffice ? 'HQ BACKEND' : 'ADMIN'}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 truncate">
                      {session.serviceId || session.jurisdiction}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNav('admin')}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-[#D8FA64] flex items-center gap-2 cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#D8FA64]" />
                    <span>Command Workspace</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {session && !isAdminSession && (
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border border-white/15 text-xs font-medium text-white hover:border-[#D8FA64] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Click to sign out"
            >
              {session.avatarUrl ? (
                <SafeImage
                  src={session.avatarUrl}
                  alt={session.name}
                  className="w-6 h-6 rounded-full object-cover border border-[#D8FA64]/60 shrink-0"
                />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-[#D8FA64] ml-1.5" />
              )}
              <span className="max-w-[120px] truncate">{session.name}</span>
            </button>
          )}

          {!isAdminSession && (
            <button
              type="button"
              onClick={() => handleNav('report')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D8FA64] hover:bg-[#C8E665] text-[#0B231A] text-sm font-bold transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Report Issue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Menu Trigger & Notification Bell */}
        <div className="flex lg:hidden items-center gap-1 sm:gap-1.5 shrink-0">
          <div className="relative" ref={mobileNotifRef}>
            <button
              type="button"
              aria-label="Open report notifications"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setMobileOpen(false);
              }}
              className={`relative p-2 rounded-full border min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer ${
                unreadCount > 0
                  ? 'border-[#D8FA64]/60 bg-[#132E20] text-[#D8FA64]'
                  : 'border-white/15 text-[#A3B899]'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#E06236] text-white text-[10px] font-mono font-bold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && renderNotifPopover()}
          </div>

          {!isAdminSession && (
            <button
              type="button"
              onClick={() => handleNav('report')}
              className="px-2.5 sm:px-3 py-2 rounded-full bg-[#D8FA64] text-[#0B231A] text-xs font-bold whitespace-nowrap shrink-0 min-h-[38px]"
            >
              Report Issue
            </button>
          )}
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => {
              setMobileOpen(!mobileOpen);
              setNotifOpen(false);
            }}
            className="p-2 rounded-lg text-white hover:bg-[#183D2A] min-w-[42px] min-h-[42px] flex items-center justify-center"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#0B231A] border-t border-white/10 px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {session && (
            <div className="px-4 py-2.5 rounded-xl bg-[#132E20] border border-white/10 flex items-center justify-between gap-2 text-xs mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {session.avatarUrl ? (
                  <SafeImage
                    src={session.avatarUrl}
                    alt={session.name}
                    className="w-9 h-9 rounded-full object-cover border border-[#D8FA64]/50 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#0B231A] border border-[#D8FA64]/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#D8FA64]" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{session.name}</div>
                  <div className="text-[11px] text-[#A3B899] truncate">{session.jurisdiction}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isAdminSession && (
                  <button
                    type="button"
                    onClick={() => handleNav('admin')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#D8FA64] text-[#0B231A] font-bold shrink-0 cursor-pointer"
                  >
                    Workspace
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    setMobileOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#0B231A] text-[#D8FA64] font-bold shrink-0 cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
          {[
            ...navItems,
            ...(!session
              ? [{ route: 'admin' as ScreenRoute, label: 'Admin Portal' }]
              : []),
            ...(isAdminSession
              ? [
                  { route: 'triage' as ScreenRoute, label: 'Triage Matrix' },
                  { route: 'governance' as ScreenRoute, label: 'Personnel & RBAC' },
                ]
              : []),
          ].map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => handleNav(item.route)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between min-h-[44px] ${
                currentRoute === item.route
                  ? 'bg-[#183D2A] text-[#D8FA64]'
                  : 'text-[#A3B899] hover:bg-[#132E20] hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              <ArrowRight className="w-4 h-4 opacity-60" />
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
