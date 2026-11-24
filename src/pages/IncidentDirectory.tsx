import React, { useEffect, useState } from 'react';
import {
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  ThumbsUp,
  Share2,
  Camera,
  Wrench,
  Send,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Incident, IncidentStatus, ScreenRoute } from '../types';
import { HOTLINKED_IMAGES, NIGERIAN_CADASTRE, getCadastreLgaOptions } from '../data/mockData';
import { SafeImage } from '../components/SafeImage';

interface IncidentDirectoryProps {
  incidents: Incident[];
  selectedIncidentId: string;
  isAdminSession?: boolean;
  isStreetFixOffice?: boolean;
  onSelectIncident: (id: string) => void;
  onConfirmIncident: (id: string) => void;
  onAddComment: (id: string, text: string) => void;
  onAssignUnit?: (id: string, unit: string) => void;
  onUpdateIncidentStatus?: (id: string, status: IncidentStatus, note?: string) => void;
  onCertifyIncident?: (id: string) => void;
  onReopenIncident?: (id: string) => void;
  onDeleteIncident?: (id: string) => void;
  onNavigate: (route: ScreenRoute) => void;
  onNotify: (msg: string) => void;
}

export const IncidentDirectory: React.FC<IncidentDirectoryProps> = ({
  incidents,
  selectedIncidentId,
  isAdminSession = false,
  isStreetFixOffice = false,
  onSelectIncident,
  onConfirmIncident,
  onAddComment,
  onAssignUnit,
  onUpdateIncidentStatus,
  onCertifyIncident,
  onReopenIncident,
  onDeleteIncident,
  onNavigate,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [lgaFilter, setLgaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'confirmations'>('urgency');
  const [commentText, setCommentText] = useState('');
  const [clockSecondsOffset, setClockSecondsOffset] = useState(50);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockSecondsOffset((prev) => (prev > 0 ? prev - 1 : 59));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const uniqueStates = Object.values(NIGERIAN_CADASTRE).map((s) => s.name);
  const lgaOptions = getCadastreLgaOptions(
    stateFilter,
    incidents
      .filter((i) => stateFilter === 'all' || i.state === stateFilter)
      .map((i) => i.lga)
  );

  const filtered = incidents
    .filter((inc) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        inc.refCode.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.address.toLowerCase().includes(q) ||
        inc.lga.toLowerCase().includes(q);
      const matchesState = stateFilter === 'all' || inc.state === stateFilter;
      const matchesLga = lgaFilter === 'all' || inc.lga === lgaFilter;
      const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
      return matchesSearch && matchesState && matchesLga && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'confirmations') return b.confirmations - a.confirmations;
      const sevRank = { critical: 3, moderate: 2, low: 1 };
      return sevRank[b.severity] - sevRank[a.severity];
    });

  const selected =
    incidents.find((i) => i.id === selectedIncidentId) || filtered[0] || incidents[0];

  const getStageIndex = (status: IncidentStatus) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'under_review':
        return 2;
      case 'assigned':
        return 3;
      case 'in_progress':
        return 4;
      case 'fixed':
        return 5;
      default:
        return 1;
    }
  };

  const activeStage = selected ? getStageIndex(selected.status) : 1;

  const formatSlaClock = (inc: Incident) => {
    if (inc.status === 'fixed') return '00h : 00m : 00s (Certified)';
    const hrs = String(Math.max(0, inc.slaRemainingHours)).padStart(2, '0');
    const mins = inc.slaLabel.includes(':')
      ? inc.slaLabel.split(':')[1].replace(/\D/g, '').padStart(2, '0')
      : '24';
    const secs = String(clockSecondsOffset).padStart(2, '0');
    return `${hrs}h : ${mins}m : ${secs}s`;
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !commentText.trim()) return;
    onAddComment(selected.id, commentText.trim());
    setCommentText('');
  };

  const handleShare = () => {
    if (!selected) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${selected.refCode} — ${selected.title} (${selected.address})`).catch(() => {});
    }
    onNotify(`Copied tracking reference ${selected.refCode} to clipboard.`);
  };

  const statusPill = (status: IncidentStatus) => {
    switch (status) {
      case 'fixed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-[#B96417]">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
            Assigned
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700">
            Pending
          </span>
        );
    }
  };

  const counts = {
    all: incidents.length,
    under_review: incidents.filter((i) => i.status === 'under_review' || i.status === 'pending').length,
    assigned: incidents.filter((i) => i.status === 'assigned').length,
    in_progress: incidents.filter((i) => i.status === 'in_progress').length,
    fixed: incidents.filter((i) => i.status === 'fixed').length,
  };

  return (
    <div className="min-h-screen bg-[#F8FAF5]">
      {/* Dark Evergreen Header & Filter Bar */}
      <section className="bg-[#0B231A] text-white border-b border-white/10 py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-[#D8FA64]">
                Public Infrastructure Audit &amp; Dispatch
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Public Incident Directory &amp; Tracker
              </h1>
              <p className="text-sm text-[#A3B899]">
                Live transparent dispatch logs for street hazards, drainage blockages, and roadway restorations across municipal works departments.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-4 sm:gap-6 bg-[#132E20] border border-white/10 rounded-xl px-4 sm:px-5 py-3.5 shrink-0 w-full lg:w-auto">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#A3B899] font-semibold">
                  Open Cases
                </div>
                <div className="text-xl font-extrabold text-[#D8FA64] tabular-nums">
                  {counts.under_review + counts.assigned + counts.in_progress} Active
                </div>
              </div>
              <div className="w-px h-8 bg-white/15 hidden sm:block" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#A3B899] font-semibold">
                  Resolved Rate
                </div>
                <div className="text-xl font-extrabold text-white tabular-nums">
                  {incidents.length > 0
                    ? `${((counts.fixed / incidents.length) * 100).toFixed(1)}%`
                    : '0.0%'}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Jurisdiction Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 text-[#A3B899] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference code (STF-2026-004892), street, or LGA..."
                className="w-full rounded-xl bg-[#132E20] border border-white/15 pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#A3B899]/70 focus:border-[#D8FA64] focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <select
                aria-label="Filter by state"
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setLgaFilter('all');
                }}
                className="w-full rounded-xl bg-[#132E20] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:border-[#D8FA64] focus:outline-none"
              >
                <option value="all">All States &amp; FCT Sectors</option>
                {uniqueStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                aria-label="Filter by LGA"
                value={lgaFilter}
                onChange={(e) => setLgaFilter(e.target.value)}
                className="w-full rounded-xl bg-[#132E20] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:border-[#D8FA64] focus:outline-none"
              >
                <option value="all">
                  {stateFilter === 'all' ? 'All LGAs (774 Nationwide)' : `All LGAs in ${stateFilter}`}
                </option>
                {lgaOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter Strip */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#A3B899] font-medium mr-1">Status Filter:</span>
            {[
              { key: 'all' as const, label: 'All', count: counts.all },
              { key: 'under_review' as const, label: 'Under Review', count: counts.under_review },
              { key: 'assigned' as const, label: 'Assigned', count: counts.assigned },
              { key: 'in_progress' as const, label: 'In Progress', count: counts.in_progress },
              { key: 'fixed' as const, label: 'Resolved', count: counts.fixed },
            ].map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-full font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#D8FA64] text-[#0B231A]'
                      : 'bg-[#132E20] text-[#A3B899] hover:text-white border border-white/10'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="font-mono text-[11px] tabular-nums opacity-85">{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Split Workspace */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Active Public Reports List */}
        <section className="lg:col-span-5 space-y-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1A1D1A]">Active Public Reports</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#EDEEE9] text-[#132E20] text-xs font-mono font-bold tabular-nums">
                {filtered.length} Active
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#4A5568]">
              <span>Sort:</span>
              <select
                aria-label="Sort reports"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'urgency' | 'confirmations')}
                className="bg-transparent font-semibold text-[#132E20] focus:outline-none cursor-pointer"
              >
                <option value="urgency">Urgency</option>
                <option value="confirmations">Endorsements</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center space-y-3">
              <p className="text-sm font-bold text-[#1A1D1A]">No matching incident reports</p>
              <p className="text-xs text-[#4A5568]">
                Adjust your search query or LGA filter to view other active public works cases.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStateFilter('all');
                  setLgaFilter('all');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 rounded-full bg-[#132E20] text-[#D8FA64] text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((inc) => {
                const isSelected = selected?.id === inc.id;
                return (
                  <button
                    key={inc.id}
                    type="button"
                    onClick={() => onSelectIncident(inc.id)}
                    className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#E06236] shadow-sm ring-1 ring-[#E06236]/30'
                        : 'bg-white border-[#E2E8F0] hover:border-[#132E20]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#132E20] bg-[#F3F4EF] px-2 py-0.5 rounded">
                        {inc.refCode}
                      </span>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-[#E06236] text-white text-[10px] font-bold uppercase tracking-wider">
                            Selected Case
                          </span>
                        )}
                        {statusPill(inc.status)}
                      </div>
                    </div>
                    <h3 className="text-sm font-bold text-[#1A1D1A] leading-snug">{inc.title}</h3>
                    <p className="text-xs text-[#4A5568] mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#727973] shrink-0" />
                      <span className="truncate">{inc.address}, {inc.lga}</span>
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                      <span className="text-[#4A5568] font-medium tabular-nums">
                        +{inc.confirmations} residents confirmed
                      </span>
                      <span
                        className={`font-mono font-semibold tabular-nums ${
                          inc.status === 'fixed' ? 'text-emerald-700' : 'text-[#E06236]'
                        }`}
                      >
                        {inc.status === 'fixed' ? 'Certified' : `SLA: ${inc.slaLabel}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Report Callout Box */}
          {!isAdminSession && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFF4EE] text-[#E06236] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#E06236]">
                    New Report
                  </p>
                  <h3 className="text-sm font-bold text-[#1A1D1A]">Spot an unreported hazard nearby?</h3>
                  <p className="text-xs text-[#4A5568] mt-0.5">
                    Pin exact coordinates and upload EXIF evidence to notify local council engineers.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('report')}
                  className="flex-1 bg-[#E06236] hover:bg-[#D35400] text-white px-4 py-2.5 rounded-full text-xs font-bold cursor-pointer text-center"
                >
                  Open GPS Geotag Studio
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('auth')}
                  className="px-4 py-2.5 rounded-full bg-[#F3F4EF] hover:bg-[#E2E8F0] text-[#1A1D1A] text-xs font-semibold cursor-pointer"
                >
                  Resident Sign In
                </button>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Detailed Case Inspection */}
        {selected && (
          <section className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 md:p-7 space-y-7 min-w-0">
            {/* Case Header + SLA Clock */}
            <div className="space-y-4 border-b border-[#E2E8F0] pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    selected.severity === 'critical'
                      ? 'bg-red-50 text-red-700'
                      : selected.severity === 'moderate'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {selected.severity === 'critical'
                    ? 'P1 Critical Road Hazard'
                    : selected.severity === 'moderate'
                    ? 'P2 Moderate Disruption'
                    : 'P3 Routine Maintenance'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#F3F4EF] text-[#1A1D1A] font-mono text-xs font-bold">
                  CASE #{selected.refCode}
                </span>
              </div>

              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1A1D1A] tracking-tight break-words">
                  {selected.title}
                </h2>
                <p className="text-sm text-[#4A5568] mt-1 break-words">
                  {selected.address} · {selected.landmark} · {selected.lga}, {selected.state}
                </p>
              </div>

              {/* Dark Evergreen SLA Clock Strip */}
              <div className="w-full sm:w-auto inline-flex items-center gap-3 bg-[#0B231A] text-white px-4 sm:px-5 py-3 rounded-xl border border-[#183D2A]">
                <Clock className="w-5 h-5 text-[#D8FA64] shrink-0" />
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#A3B899]">
                    Municipal SLA Clock
                  </div>
                  <div className="text-base sm:text-lg font-mono font-extrabold text-[#D8FA64] tabular-nums">
                    {formatSlaClock(selected)}
                  </div>
                </div>
              </div>
            </div>

            {/* 5-Stage Civic Dispatch Lifecycle Tracker */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                  Civic Dispatch Lifecycle Tracker
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#FFF4EE] text-[#E06236] text-xs font-bold">
                  Phase {activeStage} of 5
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { step: 1, title: 'Submitted', sub: selected.reportedAt },
                  { step: 2, title: 'Verified', sub: 'EXIF Validated' },
                  { step: 3, title: 'Assigned', sub: selected.assignedUnit },
                  { step: 4, title: 'Crew On Site', sub: selected.checkedIn ? 'Checked In' : 'Active Repair' },
                  { step: 5, title: 'Final Signoff', sub: selected.status === 'fixed' ? 'Certified' : 'Pending' },
                ].map((stage) => {
                  const done = activeStage > stage.step || (stage.step === 5 && selected.status === 'fixed');
                  const current = activeStage === stage.step && selected.status !== 'fixed';
                  return (
                    <div
                      key={stage.step}
                      className={`p-3 rounded-xl border text-center space-y-1.5 ${
                        done
                          ? 'bg-[#F8FAF5] border-emerald-200'
                          : current
                          ? 'bg-[#FFF9F2] border-[#D8FA64]'
                          : 'bg-white border-[#E2E8F0] opacity-70'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center text-xs font-bold ${
                          done
                            ? 'bg-[#132E20] text-[#D8FA64]'
                            : current
                            ? 'bg-[#D8FA64] text-[#0B231A]'
                            : 'bg-[#F1F5F9] text-[#4A5568]'
                        }`}
                      >
                        {done ? '✓' : stage.step}
                      </div>
                      <div className="text-xs font-bold text-[#1A1D1A]">
                        {stage.step}. {stage.title}
                      </div>
                      <div className="text-[11px] text-[#4A5568] truncate">{stage.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3-Stage Photographic Evidence Trail */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                    Multi-Stage Photographic Evidence Trail
                  </h3>
                  <p className="text-xs text-[#4A5568]">
                    Tamper-evident timestamped GPS photos verified by municipal works engineers
                  </p>
                </div>
                {selected.exifVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    EXIF Verified
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Stage 1 */}
                <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-[#F8FAF5]">
                  <div className="relative h-36 bg-[#132E20]">
                    <SafeImage
                      src={selected.beforePhotoUrl}
                      alt="Stage 1 Initial Citizen Evidence"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#0B231A]/85 text-white text-[10px] font-bold">
                      Stage 1: Before Repair
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold text-[#1A1D1A]">Initial Citizen Evidence</div>
                    <div className="text-[11px] text-[#4A5568]">EXIF GPS locked · {selected.lat}</div>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-[#F8FAF5]">
                  <div className="relative h-36 bg-[#132E20] flex items-center justify-center">
                    {selected.progressPhotoUrl ? (
                      <SafeImage
                        src={selected.progressPhotoUrl}
                        alt="Stage 2 Active Crew Dispatch"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 text-[#A3B899]">
                        <Wrench className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-[11px] font-semibold">Crew mobilization queued</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#D8FA64] text-[#0B231A] text-[10px] font-bold">
                      Stage 2: Live In-Progress
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-bold text-[#1A1D1A]">{selected.assignedUnit}</div>
                    <div className="text-[11px] text-[#4A5568]">
                      {selected.progressPhotoUrl ? 'Active repair underway' : 'Awaiting on-site check-in'}
                    </div>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="rounded-xl border border-dashed border-[#CBD5E1] overflow-hidden bg-[#F8FAF5]">
                  {selected.afterPhotoUrl ? (
                    <>
                      <div className="relative h-36 bg-[#132E20]">
                        <SafeImage
                          src={selected.afterPhotoUrl}
                          alt="Stage 3 Post-Compaction Audit"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                          Stage 3: Certified
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-bold text-[#1A1D1A]">Post-Completion Audit</div>
                        <div className="text-[11px] text-emerald-700 font-semibold">100% Signoff Passed</div>
                      </div>
                    </>
                  ) : (
                    <div className="h-full min-h-[196px] p-4 flex flex-col items-center justify-center text-center space-y-2">
                      <div className="w-9 h-9 rounded-full bg-[#EDEEE9] text-[#4A5568] flex items-center justify-center">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-[#1A1D1A]">
                        Stage 3: Post-Compaction Audit
                      </div>
                      <p className="text-[11px] text-[#4A5568]">
                        Awaiting field supervisor completion upload &amp; signoff.
                      </p>
                      {isAdminSession && (
                        <button
                          type="button"
                          onClick={() => onNavigate('dispatch')}
                          className="text-[11px] font-bold text-[#E06236] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Field Dispatch</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cadastral GIS + Civic Validation Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAF5] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1D1A]">
                    Cadastral GIS Positioning
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[11px] font-semibold text-[#132E20]">
                    {selected.ward}
                  </span>
                </div>
                <p className="text-xs text-[#4A5568]">
                  Cross-referenced with State Physical Planning &amp; Urban Development Cadastral Layer 2026.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <div className="text-[10px] uppercase text-[#4A5568] font-semibold">Latitude</div>
                    <div className="font-mono font-bold text-[#1A1D1A] tabular-nums">{selected.lat}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#4A5568] font-semibold">Longitude</div>
                    <div className="font-mono font-bold text-[#1A1D1A] tabular-nums">{selected.lng}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#4A5568] font-semibold">Assigned Depot</div>
                    <div className="font-semibold text-[#1A1D1A]">{selected.assignedDepot}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-[#4A5568] font-semibold">Squad Lead</div>
                    <div className="font-semibold text-[#1A1D1A] flex items-center gap-2 mt-0.5">
                      {selected.squadLead === 'Engr. Iniobong Ekpo' && (
                        <SafeImage
                          src={HOTLINKED_IMAGES.engrIniobongEkpo}
                          alt="Engr. Iniobong Ekpo"
                          className="w-6 h-6 rounded-full object-cover border border-[#CBD5E1] shrink-0"
                        />
                      )}
                      <span>{selected.squadLead}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAF5] border border-[#E2E8F0] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                      Civic Validation
                    </span>
                    <span className="text-xs font-bold text-emerald-700">High Priority</span>
                  </div>
                  <div className="text-2xl font-extrabold text-[#1A1D1A] mt-1 tabular-nums">
                    {selected.confirmations} Neighbourhood Endorsements
                  </div>
                  <p className="text-xs text-[#4A5568] mt-1">
                    Reports confirmed by verified local residents speed up municipal crew allocation.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isAdminSession ? (
                    <button
                      type="button"
                      onClick={() => onConfirmIncident(selected.id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-white hover:bg-[#132E20] hover:text-[#D8FA64] text-[#1A1D1A] border border-[#E2E8F0] py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Confirm This Fault</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onNavigate('admin')}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-slate-800 text-[#D8FA64] py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Open in Admin Console</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Share incident reference"
                    className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#4A5568] hover:text-[#132E20] cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {isAdminSession && (
              <div className="p-4 rounded-xl bg-[#0F172A] text-white border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono font-bold uppercase text-[#D8FA64]">
                      {isStreetFixOffice ? 'HQ Backend & Admin Case Controls' : 'Admin Operations Controls'}
                    </div>
                    <div className="text-xs text-slate-300">
                      Assign units, progress work orders, or certify repair directly.
                    </div>
                  </div>
                  {isStreetFixOffice && onDeleteIncident && (
                    <button
                      type="button"
                      onClick={() => onDeleteIncident(selected.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-200 hover:text-white text-[11px] font-bold cursor-pointer"
                    >
                      Purge Case (HQ Only)
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onAssignUnit && (
                    <select
                      aria-label="Assign municipal unit"
                      value={selected.assignedUnit}
                      onChange={(e) => onAssignUnit(selected.id, e.target.value)}
                      className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs font-semibold text-white"
                    >
                      <option value="Unassigned">Unassigned</option>
                      <option value="AKRMA Squad 4">AKRMA Squad 4</option>
                      <option value="Akwa Ibom Drainage Unit #12">Akwa Ibom Drainage Unit #12</option>
                      <option value="AKRMA Rapid Unit 02">AKRMA Rapid Unit 02</option>
                      <option value="AKSEPB Compactor Truck #22">AKSEPB Compactor Truck #22</option>
                      <option value="Ibom Power Streetlight Unit">Ibom Power Streetlight Unit</option>
                      <option value="FCDA Electrical Maintenance">FCDA Electrical Maintenance</option>
                    </select>
                  )}
                  {onUpdateIncidentStatus && selected.status !== 'in_progress' && selected.status !== 'fixed' && (
                    <button
                      type="button"
                      onClick={() => onUpdateIncidentStatus(selected.id, 'in_progress')}
                      className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#0A1419] text-xs font-bold cursor-pointer"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {selected.status !== 'fixed' ? (
                    onCertifyIncident && (
                      <button
                        type="button"
                        onClick={() => onCertifyIncident(selected.id)}
                        className="px-3 py-2 rounded-lg bg-[#D8FA64] hover:bg-[#c8eb52] text-[#0B231A] text-xs font-bold cursor-pointer"
                      >
                        Certify Fixed
                      </button>
                    )
                  ) : (
                    onReopenIncident && (
                      <button
                        type="button"
                        onClick={() => onReopenIncident(selected.id)}
                        className="px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Reopen Case
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Official Log & Resident Eyewitness Stream */}
            <div className="space-y-4 pt-2 border-t border-[#E2E8F0]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A5568]">
                Official Log &amp; Resident Eyewitness Stream
              </h3>

              <div className="space-y-3">
                {selected.comments.length === 0 ? (
                  <p className="text-xs text-[#4A5568] bg-[#F8FAF5] rounded-xl p-4 border border-[#E2E8F0]">
                    No field notes posted yet. Add a verified eyewitness update below.
                  </p>
                ) : (
                  selected.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border ${
                        c.isOfficial
                          ? 'bg-[#F4FBE4] border-[#D8FA64]'
                          : 'bg-[#F8FAF5] border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-[#1A1D1A]">{c.author}</span>
                        <span className="text-[11px] text-[#4A5568]">{c.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#1A1D1A]/85 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleCommentSubmit} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add verified observation or local traffic update..."
                  className="flex-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAF5] px-4 py-2.5 text-xs text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 bg-[#0B231A] hover:bg-[#132E20] text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-[#D8FA64]" />
                  <span>Post Update</span>
                </button>
              </form>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
