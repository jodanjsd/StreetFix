import React from 'react';
import {
  LayoutGrid,
  Truck,
  SlidersHorizontal,
  BarChart3,
  ShieldAlert,
  Users,
  FilePlus2,
  MapPin,
} from 'lucide-react';
import { ScreenRoute } from '../types';
import { BrandMark } from './BrandLogo';

interface CommandSidebarProps {
  currentRoute: ScreenRoute;
  onNavigate: (route: ScreenRoute) => void;
  pendingCount: number;
  activeCount: number;
}

export const CommandSidebar: React.FC<CommandSidebarProps> = ({
  currentRoute,
  onNavigate,
  pendingCount,
  activeCount,
}) => {
  const railLinks: {
    route: ScreenRoute;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }[] = [
    {
      route: 'admin',
      label: 'Admin Portal',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      route: 'ops',
      label: 'Ops Command Hub',
      icon: <LayoutGrid className="w-4 h-4" />,
      badge: activeCount,
    },
    {
      route: 'triage',
      label: 'Triage Matrix',
      icon: <SlidersHorizontal className="w-4 h-4" />,
      badge: pendingCount,
    },
    {
      route: 'dispatch',
      label: 'Field Dispatch',
      icon: <Truck className="w-4 h-4" />,
    },
    {
      route: 'directory',
      label: 'Public Tracker',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      route: 'analytics',
      label: 'SLA Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      route: 'governance',
      label: 'Personnel & RBAC',
      icon: <Users className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile / Tablet Horizontal Command Switcher */}
      <div className="md:hidden w-full bg-[#0B231A] text-white border-b border-white/10 px-4 py-2.5 overflow-x-auto flex items-center gap-2">
        {railLinks.map((item) => {
          const isActive = currentRoute === item.route;
          return (
            <button
              key={item.route}
              type="button"
              onClick={() => onNavigate(item.route)}
              className={`shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold min-h-[40px] transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#D8FA64] text-[#0B231A] font-bold'
                  : 'bg-[#132E20] text-[#A3B899] hover:text-white border border-white/10'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                    isActive ? 'bg-[#0B231A] text-[#D8FA64]' : 'bg-[#183D2A] text-[#D8FA64]'
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
          onClick={() => onNavigate('report')}
          className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#183D2A] text-[#D8FA64] border border-[#D8FA64]/30 text-xs font-bold min-h-[40px] cursor-pointer"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>New Incident</span>
        </button>
      </div>

      {/* Desktop Vertical Command Rail */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between p-4 bg-[#0B231A] text-white border-r border-white/10 min-h-[calc(100vh-4rem)]">
        <div className="space-y-5">
          {/* Identity Header */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#132E20] border border-white/10">
            <BrandMark className="w-9 h-9 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">HQ Command Hub</div>
              <div className="text-[11px] text-[#A3B899] truncate">Akwa Ibom State Works</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {railLinks.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#D8FA64] text-[#0B231A] font-bold'
                      : 'text-[#A3B899] hover:bg-[#132E20] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums ${
                        isActive ? 'bg-[#0B231A] text-[#D8FA64]' : 'bg-[#183D2A] text-[#D8FA64]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => onNavigate('report')}
            className="w-full py-2.5 px-3 rounded-xl bg-[#183D2A] hover:bg-[#1f4c35] text-[#D8FA64] border border-[#D8FA64]/25 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" />
            <span>Log New Incident</span>
          </button>
        </div>

        <div className="pt-4 border-t border-white/10 text-[11px] text-[#A3B899] space-y-1">
          <div className="flex items-center justify-between">
            <span>Cadastre Sync</span>
            <span className="text-[#D8FA64] font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Jurisdiction</span>
            <span className="text-white font-medium">36 States + FCT</span>
          </div>
        </div>
      </aside>
    </>
  );
};
