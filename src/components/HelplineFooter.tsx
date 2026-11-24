import React from 'react';
import { Phone } from 'lucide-react';
import { ScreenRoute } from '../types';
import { BrandLogo } from './BrandLogo';

interface HelplineFooterProps {
  onNavigate: (route: ScreenRoute) => void;
  isAdminSession?: boolean;
  isLoggedIn?: boolean;
}

export const HelplineFooter: React.FC<HelplineFooterProps> = ({
  onNavigate,
  isAdminSession = false,
  isLoggedIn = false,
}) => {
  return (
    <>
      {/* Signature Chartreuse Lime Helpline Banner */}
      <section className="w-full bg-[#D8FA64] text-[#0B231A] border-t border-[#C8E665]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#0B231A] text-[#D8FA64] flex items-center justify-center shrink-0">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#132E20]/80">
                Need help?
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#0B231A]">
                Call the StreetFix office directly
              </h2>
            </div>
          </div>

          <a
            href="tel:+23412270000"
            className="flex flex-row items-baseline gap-2.5 group"
          >
            <span className="text-lg sm:text-xl font-extrabold text-[#0B231A] tracking-tight leading-none tabular-nums group-hover:underline">
              01 227 0000
            </span>
            <span className="text-[11px] font-medium text-[#132E20]/85">
              Mon–Fri, 8am–5pm
            </span>
          </a>
        </div>
      </section>

      {/* Dark Evergreen Minimalist Footer */}
      <footer className="w-full bg-[#0B231A] text-[#A3B899] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-center md:text-left">
            <button
              type="button"
              onClick={() => onNavigate('resident')}
              className="hover:opacity-90 transition-opacity cursor-pointer"
            >
              <BrandLogo size="sm" />
            </button>
            <span className="text-white/25 hidden sm:inline">·</span>
            <p className="text-[11px] text-[#A3B899]">
              Making every street safer, one report at a time.
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px]">
            {!isAdminSession && !isLoggedIn && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="hover:text-[#D8FA64] transition-colors cursor-pointer"
              >
                Admin Portal
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('directory')}
              className="hover:text-[#D8FA64] transition-colors cursor-pointer"
            >
              Public Accountability
            </button>
            {!isAdminSession ? (
              <button
                type="button"
                onClick={() => onNavigate('report')}
                className="hover:text-[#D8FA64] transition-colors cursor-pointer"
              >
                Report Street Fault
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('analytics')}
                  className="hover:text-[#D8FA64] transition-colors cursor-pointer"
                >
                  Service Level Agreements
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('governance')}
                  className="hover:text-[#D8FA64] transition-colors cursor-pointer"
                >
                  Governance &amp; RBAC
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('ops')}
                  className="hover:text-[#D8FA64] transition-colors cursor-pointer"
                >
                  Command GIS Hub
                </button>
              </>
            )}
          </nav>
        </div>
      </footer>
    </>
  );
};
