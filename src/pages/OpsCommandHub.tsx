import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Download,
  Search,
  Send,
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Minus,
  Crosshair,
  Wrench,
  ArrowRight,
  X,
} from 'lucide-react';
import { Incident, IncidentCategory, IncidentSeverity, ScreenRoute } from '../types';
import { HOTLINKED_IMAGES, NIGERIAN_CADASTRE, getCadastreLgaOptions } from '../data/mockData';
import { SafeImage } from '../components/SafeImage';
import { readCompressedImageFile } from '../utils/imageUpload';

interface OpsCommandHubProps {
  incidents: Incident[];
  onNavigate: (route: ScreenRoute) => void;
  onSelectIncident: (id: string) => void;
  onDispatchIncident: (id: string, unit?: string) => void;
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
  onNotify: (msg: string) => void;
}

export const OpsCommandHub: React.FC<OpsCommandHubProps> = ({
  incidents,
  onNavigate,
  onSelectIncident,
  onDispatchIncident,
  onQuickCreateIncident,
  onNotify,
}) => {
  const [mapFilter, setMapFilter] = useState<'all' | 'pothole' | 'drainage' | 'streetlight' | 'fixed'>('all');
  const [selectedPinId, setSelectedPinId] = useState<string>(incidents[0]?.id || 'inc-1');
  const [mapZoom, setMapZoom] = useState(1);

  // Rapid Intake Portal tabs & form
  const [intakeTab, setIntakeTab] = useState<'log' | 'track'>('log');
  const [intakeCategory, setIntakeCategory] = useState<IncidentCategory>('Pothole / Road Failure');
  const [intakeSeverity, setIntakeSeverity] = useState<IncidentSeverity>('moderate');
  const [intakeStateKey, setIntakeStateKey] = useState('akwa_ibom');
  const [intakeLgaKey, setIntakeLgaKey] = useState('uyo');
  const [intakeAddress, setIntakeAddress] = useState('Plot 18, Oron Road, near Ibom Plaza');
  const [intakePhone, setIntakePhone] = useState('0803 456 7890');
  const [intakePhotoUrl, setIntakePhotoUrl] = useState('');
  const [intakePhotoName, setIntakePhotoName] = useState('');
  const [trackCodeQuery, setTrackCodeQuery] = useState('STF-2026-004892');

  // Ledger Filters
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerState, setLedgerState] = useState('all');
  const [ledgerLga, setLedgerLga] = useState('all');

  // Live WAT Clock
  const [clockText, setClockText] = useState(() =>
    new Date().toLocaleTimeString('en-NG', { hour12: false })
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setClockText(new Date().toLocaleTimeString('en-NG', { hour12: false }));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const pendingCount = incidents.filter((i) => i.status === 'pending' || i.status === 'under_review').length;
  const activeCount = incidents.filter((i) => i.status === 'in_progress' || i.status === 'assigned').length;
  const fixedCount = incidents.filter((i) => i.status === 'fixed').length;
  const criticalOpenCount = incidents.filter((i) => i.severity === 'critical' && i.status !== 'fixed').length;
  const resolutionPct = incidents.length > 0 ? Math.round((fixedCount / incidents.length) * 100) : 0;
  const activeCrewCount = new Set(
    incidents
      .filter((i) => i.assignedUnit && i.assignedUnit !== 'Unassigned' && i.status !== 'fixed')
      .map((i) => i.assignedUnit)
  ).size;

  const selectedState = NIGERIAN_CADASTRE[intakeStateKey] || NIGERIAN_CADASTRE.akwa_ibom;
  const availableLgas = Object.entries(selectedState.lgas);

  const handleStateChange = (newState: string) => {
    setIntakeStateKey(newState);
    const firstLga = Object.keys(NIGERIAN_CADASTRE[newState].lgas)[0];
    setIntakeLgaKey(firstLga);
  };

  const handleIntakePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIntakePhotoName(file.name);
    readCompressedImageFile(
      file,
      (dataUrl) => {
        setIntakePhotoUrl(dataUrl);
        onNotify(`Attached compressed photographic evidence: ${file.name}`);
      },
      (err) => onNotify(err)
    );
    e.target.value = '';
  };

  const handleRapidDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeAddress.trim()) return;
    const lgaName = selectedState.lgas[intakeLgaKey]?.name || 'Uyo LGA';
    onQuickCreateIncident({
      category: intakeCategory,
      state: selectedState.name,
      lga: lgaName,
      address: intakeAddress.trim(),
      severity: intakeSeverity,
      hasPhoto: Boolean(intakePhotoUrl),
      photoUrl: intakePhotoUrl || undefined,
    });
    setIntakeAddress('');
    setIntakeSeverity('moderate');
    setIntakePhotoUrl('');
    setIntakePhotoName('');
  };

  const mapPins = [
    { id: incidents[0]?.id || 'inc-1', x: '48%', y: '34%', type: 'pothole', color: 'bg-[#E06236]' },
    { id: incidents[1]?.id || 'inc-2', x: '32%', y: '58%', type: 'drainage', color: 'bg-sky-500' },
    { id: incidents[2]?.id || 'inc-3', x: '66%', y: '52%', type: 'drainage', color: 'bg-amber-400' },
    { id: incidents[5]?.id || 'inc-6', x: '74%', y: '72%', type: 'fixed', color: 'bg-emerald-500' },
    { id: incidents[3]?.id || 'inc-4', x: '54%', y: '24%', type: 'streetlight', color: 'bg-red-500' },
  ];

  const activePinIncident =
    incidents.find((i) => i.id === selectedPinId) || incidents[0];

  const allStatesList = Object.values(NIGERIAN_CADASTRE).map((s) => s.name);
  const ledgerLgaOptions = getCadastreLgaOptions(
    ledgerState,
    incidents
      .filter((i) => ledgerState === 'all' || i.state === ledgerState)
      .map((i) => i.lga)
  );

  const filteredLedger = incidents.filter((inc) => {
    const q = ledgerSearch.trim().toLowerCase();
    const matchesQ =
      !q ||
      inc.refCode.toLowerCase().includes(q) ||
      inc.address.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q);
    const matchesState = ledgerState === 'all' || inc.state === ledgerState;
    const matchesLga = ledgerLga === 'all' || inc.lga === ledgerLga;
    return matchesQ && matchesState && matchesLga;
  });

  const handleExportCsv = () => {
    const headers = ['RefCode', 'Category', 'Title', 'State', 'LGA', 'Address', 'Status', 'AssignedUnit', 'SLACountdown'];
    const rows = filteredLedger.map((i) => [
      i.refCode,
      `"${i.category}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.state}"`,
      `"${i.lga}"`,
      `"${i.address.replace(/"/g, '""')}"`,
      i.status,
      `"${i.assignedUnit}"`,
      `"${i.slaLabel}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'streetfix_ops_telemetry.csv';
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Exported filtered operations ledger CSV.');
  };

  const trackedIncident = incidents.find((i) =>
    i.refCode.toLowerCase().includes(trackCodeQuery.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col">
      {/* Dark Carbon-Teal Telemetry Banner */}
      <section className="bg-[#0F1E24] text-white border-b border-cyan-500/20 px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-cyan-400">
              <span>Operational Command</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-300 font-medium">Akwa Ibom Unified Intake Terminal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              HQ Operations Command &amp; Telemetry Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Akwa Ibom State Ministry of Works &amp; Infrastructure · Public Works Cadastre Control
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4">
            <div className="text-left sm:text-right">
              <div className="font-mono text-sm font-bold text-cyan-300 tabular-nums">
                {clockText} WAT
              </div>
              <div className="text-[11px] text-slate-400">Real-Time Cadastre Feed</div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('triage')}
              className="inline-flex items-center gap-2 bg-[#E06236] hover:bg-[#D35400] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Emergency Dispatch</span>
            </button>
          </div>
        </div>

        {/* 4 Tactical Telemetry KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-[#0A1419] border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 font-medium">Pending Verification</div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-extrabold text-white tabular-nums">
                {pendingCount}
              </span>
              <span className="text-[11px] font-semibold text-[#E06236] tabular-nums">
                {criticalOpenCount} Critical
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Requires engineer site audit</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A1419] border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 font-medium">Active Work Orders</div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-extrabold text-white tabular-nums">
                {activeCount}
              </span>
              <span className="text-[11px] font-semibold text-cyan-300 tabular-nums">
                {activeCrewCount} Active Squads
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Crews dispatched across active sectors</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A1419] border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 font-medium">Resolution Rate</div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-extrabold text-white tabular-nums">
                {resolutionPct}%
              </span>
              <span className="text-[11px] font-semibold text-emerald-400">
                48h SLA Target
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Live verified closeout ratio</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0A1419] border border-slate-800 space-y-1">
            <div className="text-xs text-slate-400 font-medium">Certified Fixed</div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-extrabold text-white tabular-nums">
                {fixedCount}
              </span>
              <span className="text-[11px] font-semibold text-emerald-400">
                {incidents.length} Total Logged
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Before &amp; after photo proof logged</div>
          </div>
        </div>
      </section>

      {/* Main Workspace Body */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* LEFT 8 COLS: Lagos Cadastre GIS Grid + Active Field Squads */}
            <div className="xl:col-span-8 space-y-6">
              {/* Interactive GIS Map Card */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#1A1D1A]">Akwa Ibom Cadastre GIS Grid</h2>
                    <p className="text-xs text-[#4A5568]">
                      Real-time incident density &amp; dispatch tracking
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { key: 'all' as const, label: 'All Sectors', count: incidents.length },
                      {
                        key: 'pothole' as const,
                        label: 'Potholes',
                        count: incidents.filter((i) => i.category === 'Pothole / Road Failure').length,
                      },
                      {
                        key: 'drainage' as const,
                        label: 'Drainage',
                        count: incidents.filter((i) => i.category === 'Blocked Drainage').length,
                      },
                      {
                        key: 'streetlight' as const,
                        label: 'Streetlights',
                        count: incidents.filter((i) => i.category === 'Streetlight Failure').length,
                      },
                      { key: 'fixed' as const, label: 'Cleared', count: fixedCount },
                    ].map((chip) => (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setMapFilter(chip.key)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                          mapFilter === chip.key
                            ? 'bg-[#0F1E24] text-cyan-300'
                            : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span>{chip.label}</span>
                        <span className="font-mono text-[10px] opacity-80 tabular-nums">
                          {chip.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dark Carbon-Teal Vector GIS Map Canvas */}
                <div className="relative min-h-[420px] sm:h-96 rounded-xl overflow-hidden bg-[#0A1419] border border-slate-800">
                  <div
                    className="absolute inset-0 ops-telemetry-grid transition-transform duration-300"
                    style={{ transform: `scale(${mapZoom})` }}
                  >
                    {/* Simulated Akwa Ibom Road Arterials */}
                    <svg className="w-full h-full opacity-45" viewBox="0 0 800 400" preserveAspectRatio="none">
                      <path
                        d="M 40 300 Q 260 220 480 180 T 760 90"
                        stroke="#22D3EE"
                        strokeWidth="2.5"
                        strokeDasharray="6 6"
                        fill="none"
                      />
                      <path
                        d="M 120 40 L 420 260 L 720 340"
                        stroke="#0EA5E9"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d="M 280 30 Q 340 180 310 380"
                        stroke="#38BDF8"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </svg>
                  </div>

                  {/* Coordinate HUD */}
                  <div className="absolute top-3 left-3 max-w-[calc(100%-4rem)] truncate px-3 py-1.5 rounded-lg bg-[#0F1E24]/95 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 tabular-nums">
                    Uyo HQ · LAT {activePinIncident?.lat || '5.0377° N'}, LON{' '}
                    {activePinIncident?.lng || '7.9128° E'}
                  </div>

                  {/* Zoom Controls */}
                  <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                    <button
                      type="button"
                      aria-label="Zoom in GIS map"
                      onClick={() => setMapZoom((z) => Math.min(1.4, Number((z + 0.15).toFixed(2))))}
                      className="w-8 h-8 rounded-lg bg-[#0F1E24]/95 border border-slate-700 text-white hover:text-cyan-300 flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Zoom out GIS map"
                      onClick={() => setMapZoom((z) => Math.max(0.85, Number((z - 0.15).toFixed(2))))}
                      className="w-8 h-8 rounded-lg bg-[#0F1E24]/95 border border-slate-700 text-white hover:text-cyan-300 flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Reset GIS view"
                      onClick={() => setMapZoom(1)}
                      className="w-8 h-8 rounded-lg bg-[#0F1E24]/95 border border-slate-700 text-white hover:text-cyan-300 flex items-center justify-center cursor-pointer"
                    >
                      <Crosshair className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Interactive Pins */}
                  {mapPins
                    .filter((p) => mapFilter === 'all' || p.type === mapFilter)
                    .map((pin) => {
                      const isActive = pin.id === activePinIncident?.id;
                      return (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() => setSelectedPinId(pin.id)}
                          style={{ left: pin.x, top: pin.y }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg transition-transform cursor-pointer ${
                            pin.color
                          } ${isActive ? 'scale-125 ring-4 ring-cyan-400/50' : 'hover:scale-110'}`}
                          title="Inspect GPS Pin"
                        >
                          <MapPin className="w-4 h-4 text-white" />
                        </button>
                      );
                    })}

                  {/* Active Pin Callout Card */}
                  {activePinIncident && (
                    <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 bg-white rounded-xl p-3.5 shadow-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-bold text-[#E06236]">
                          {activePinIncident.refCode}
                        </span>
                        <span className="text-slate-500">{activePinIncident.reportedAt}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {activePinIncident.address}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1">
                        {activePinIncident.title}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-600">
                          Reporter: <strong className="text-slate-900">{activePinIncident.reporterName}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectIncident(activePinIncident.id);
                            onNavigate('directory');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#0F1E24] text-cyan-300 text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Inspect &amp; Dispatch
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Public Works Squads on Field */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>Active Public Works Squads on Field</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => onNavigate('dispatch')}
                    className="text-xs font-bold text-cyan-700 hover:text-[#E06236] inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Field Dispatch Console</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-[#F4F7F9]">
                    <div className="relative h-40 bg-[#0F1E24]">
                      <SafeImage
                        src={HOTLINKED_IMAGES.asphaltCrewPatch}
                        alt="AKRMA Asphalt Patch Crew #08"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded bg-[#0A1419]/90 text-white text-[10px] font-bold">
                        AKRMA Asphalt Patch Crew #08
                      </span>
                      <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded bg-[#0A1419]/90 text-cyan-300 text-[10px] font-bold">
                        Zone 2: Uyo Central
                      </span>
                    </div>
                    <div className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">Active Resurfacing</span>
                        <span className="font-bold text-emerald-700 tabular-nums">78% Complete</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Hot mix bitumen compaction underway on Oron Road dual carriage.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-[#F4F7F9]">
                    <div className="relative h-40 bg-[#0F1E24]">
                      <SafeImage
                        src={HOTLINKED_IMAGES.drainageCanalCrew}
                        alt="Drainage & Stormwater Bureau"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded bg-[#0A1419]/90 text-white text-[10px] font-bold">
                        AKSEPB Drainage Bureau
                      </span>
                      <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded bg-[#0A1419]/90 text-cyan-300 text-[10px] font-bold">
                        Zone 5: Eket Axis
                      </span>
                    </div>
                    <div className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">Emergency Desilting</span>
                        <span className="font-bold text-[#E06236]">Desilting in Progress</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Secondary drainage clearing ahead of heavy tidal seasonal rainfall.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT 4 COLS: Rapid Intake Portal + Accountability Assurance */}
            <div className="xl:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
                <div className="flex items-center gap-4 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIntakeTab('log')}
                    className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      intakeTab === 'log'
                        ? 'border-cyan-600 text-slate-900'
                        : 'border-transparent text-slate-500'
                    }`}
                  >
                    Log Civic Incident
                  </button>
                  <button
                    type="button"
                    onClick={() => setIntakeTab('track')}
                    className={`pb-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      intakeTab === 'track'
                        ? 'border-cyan-600 text-slate-900'
                        : 'border-transparent text-slate-500'
                    }`}
                  >
                    Lifecycle Tracker
                  </button>
                </div>

                {intakeTab === 'log' ? (
                  <form onSubmit={handleRapidDispatch} className="space-y-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">
                        Rapid Intake Portal
                      </p>
                      <h3 className="text-lg font-bold text-slate-900">Tell us what’s wrong</h3>
                      <p className="text-xs text-slate-600">
                        Submit verified civic evidence directly to field engineering squads.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(
                        [
                          'Pothole / Road Failure',
                          'Blocked Drainage',
                          'Waste Heap / Sanitation',
                          'Streetlight Failure',
                        ] as IncidentCategory[]
                      ).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setIntakeCategory(cat)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-colors cursor-pointer ${
                            intakeCategory === cat
                              ? 'bg-[#0F1E24] text-cyan-300 border-[#0F1E24]'
                              : 'bg-[#F4F7F9] text-slate-900 border-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'low' as const, label: 'Low' },
                        { value: 'moderate' as const, label: 'Moderate' },
                        { value: 'critical' as const, label: 'Serious' },
                      ].map((sev) => (
                        <button
                          key={sev.value}
                          type="button"
                          onClick={() => setIntakeSeverity(sev.value)}
                          className={`py-2 px-2 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                            intakeSeverity === sev.value
                              ? sev.value === 'critical'
                                ? 'bg-red-700 text-white border-red-700'
                                : 'bg-[#0F1E24] text-cyan-300 border-[#0F1E24]'
                              : 'bg-[#F4F7F9] text-slate-700 border-slate-200'
                          }`}
                        >
                          {sev.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="min-w-0">
                        <label htmlFor="ops-state" className="block text-[11px] font-semibold text-[#4A5568] mb-1">
                          State
                        </label>
                        <select
                          id="ops-state"
                          value={intakeStateKey}
                          onChange={(e) => handleStateChange(e.target.value)}
                          className="w-full min-w-0 max-w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-2.5 py-2 text-xs font-medium text-[#1A1D1A]"
                        >
                          {Object.entries(NIGERIAN_CADASTRE).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="min-w-0">
                        <label htmlFor="ops-lga" className="block text-[11px] font-semibold text-[#4A5568] mb-1">
                          Local Govt. Area
                        </label>
                        <select
                          id="ops-lga"
                          value={intakeLgaKey}
                          onChange={(e) => setIntakeLgaKey(e.target.value)}
                          className="w-full min-w-0 max-w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-2.5 py-2 text-xs font-medium text-[#1A1D1A]"
                        >
                          {availableLgas.map(([k, v]) => (
                            <option key={k} value={k}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <input
                      type="text"
                      required
                      value={intakeAddress}
                      onChange={(e) => setIntakeAddress(e.target.value)}
                      placeholder="Street location & landmark"
                      className="w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs text-[#1A1D1A]"
                    />

                    {intakePhotoUrl ? (
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/60 p-2.5 space-y-2">
                        <div className="relative w-full h-36 rounded-lg overflow-hidden border border-emerald-200 bg-slate-900">
                          <img
                            src={intakePhotoUrl}
                            alt={intakePhotoName || 'Uploaded geotagged evidence'}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            aria-label="Remove uploaded evidence"
                            onClick={() => {
                              setIntakePhotoUrl('');
                              setIntakePhotoName('');
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-emerald-900 truncate">
                            {intakePhotoName || 'Evidence attached'} · EXIF Verified
                          </span>
                          <label className="px-2 py-0.5 rounded bg-white border border-emerald-300 text-emerald-900 font-semibold hover:bg-emerald-100 shrink-0 cursor-pointer">
                            <span>Replace</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleIntakePhotoUpload}
                              className="sr-only"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="block w-full border border-dashed border-[#CBD5E1] bg-[#F4F7F9] hover:border-[#E06236] rounded-xl p-3.5 text-center cursor-pointer transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIntakePhotoUpload}
                          className="sr-only"
                        />
                        <Upload className="w-4 h-4 mx-auto mb-1 text-[#E06236]" />
                        <div className="text-[11px] font-bold text-[#1A1D1A]">
                          Attach photographic evidence
                        </div>
                        <div className="text-[10px] text-[#4A5568]">
                          Click to upload image from device
                        </div>
                      </label>
                    )}

                    <div>
                      <label htmlFor="ops-phone" className="block text-[11px] font-semibold text-[#4A5568] mb-1">
                        Reporter Phone (for SMS Work-Order Updates)
                      </label>
                      <input
                        id="ops-phone"
                        type="tel"
                        value={intakePhone}
                        onChange={(e) => setIntakePhone(e.target.value)}
                        className="w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs font-mono text-[#1A1D1A]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#E06236] hover:bg-[#D35400] text-white py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Rapid Response Unit</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="ops-track-input" className="block text-xs font-bold text-[#1A1D1A] mb-1">
                        Lookup Reference Code
                      </label>
                      <input
                        id="ops-track-input"
                        type="text"
                        value={trackCodeQuery}
                        onChange={(e) => setTrackCodeQuery(e.target.value)}
                        className="w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs font-mono text-[#1A1D1A]"
                      />
                    </div>
                    {trackedIncident ? (
                      <div className="p-4 rounded-xl bg-[#F4F7F9] border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-[#0F1E24]">
                            {trackedIncident.refCode}
                          </span>
                          <span className="font-bold text-[#E06236] uppercase text-[10px]">
                            {trackedIncident.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">{trackedIncident.title}</div>
                        <div className="text-[11px] text-slate-600">
                          Unit: {trackedIncident.assignedUnit} · SLA: {trackedIncident.slaLabel}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectIncident(trackedIncident.id);
                            onNavigate('directory');
                          }}
                          className="w-full mt-2 py-2 rounded-lg bg-[#0F1E24] text-cyan-300 text-xs font-bold cursor-pointer"
                        >
                          Open Full Audit Trail
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600">
                        No incident matched that reference code. Try STF-2026-004892.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Public Accountability Assurance */}
              <div className="bg-[#0F1E24] text-white rounded-2xl p-5 border border-cyan-500/20 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0A1419] border border-cyan-500/25 text-cyan-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-cyan-300">
                    Public Accountability Assurance
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Every submission generates an open-source cryptographic audit token registered on the Akwa Ibom State Open Governance Ledger.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE LEDGER TABLE */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="text-cyan-700">Live Operations Ledger</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-slate-600 tabular-nums">{filteredLedger.length} Active</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Recent Incident Telemetry &amp; Work Orders
                </h2>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                <div className="relative w-full sm:w-auto">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    placeholder="Search reference code or street"
                    className="w-full sm:w-56 rounded-lg border border-slate-200 bg-[#F4F7F9] pl-8 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <select
                  aria-label="Filter ledger by State"
                  value={ledgerState}
                  onChange={(e) => {
                    setLedgerState(e.target.value);
                    setLedgerLga('all');
                  }}
                  className="w-full sm:w-auto rounded-lg border border-slate-200 bg-[#F4F7F9] px-3 py-2 text-xs font-medium text-slate-900"
                >
                  <option value="all">All 36 States + FCT</option>
                  {allStatesList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter ledger by LGA"
                  value={ledgerLga}
                  onChange={(e) => setLedgerLga(e.target.value)}
                  className="w-full sm:w-auto sm:max-w-[220px] rounded-lg border border-slate-200 bg-[#F4F7F9] px-3 py-2 text-xs font-medium text-slate-900"
                >
                  <option value="all">
                    {ledgerState === 'all' ? 'All LGAs (774)' : `All LGAs in ${ledgerState}`}
                  </option>
                  {ledgerLgaOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F1E24] hover:bg-[#162B33] text-cyan-300 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 pr-4">Reference Code</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Location &amp; LGA</th>
                    <th className="py-3 pr-4">Reported</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Assigned Unit</th>
                    <th className="py-3 pr-4">SLA Countdown</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredLedger.map((inc) => (
                    <tr key={inc.id} className="hover:bg-[#F4F7F9] transition-colors">
                      <td className="py-3.5 pr-4 font-mono font-bold text-[#0F1E24] whitespace-nowrap">
                        {inc.refCode}
                      </td>
                      <td className="py-3.5 pr-4 font-semibold text-slate-900 whitespace-nowrap">
                        {inc.category}
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-slate-900">{inc.address}</div>
                        <div className="text-[11px] text-slate-500">{inc.lga}</div>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-600 whitespace-nowrap">{inc.reportedAt}</td>
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            inc.status === 'fixed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : inc.status === 'in_progress'
                              ? 'bg-cyan-50 text-cyan-800'
                              : inc.status === 'assigned'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {inc.status === 'fixed' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span className="capitalize">{inc.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 text-slate-900 font-medium whitespace-nowrap">
                        {inc.assignedUnit}
                      </td>
                      <td className="py-3.5 pr-4 font-mono font-bold text-[#E06236] tabular-nums whitespace-nowrap">
                        {inc.slaLabel}
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        {inc.status === 'pending' || inc.status === 'under_review' ? (
                          <button
                            type="button"
                            onClick={() => onDispatchIncident(inc.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#0F1E24] hover:bg-[#162B33] text-cyan-300 text-[11px] font-bold cursor-pointer"
                          >
                            Dispatch
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectIncident(inc.id);
                              onNavigate('directory');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-[11px] font-bold cursor-pointer"
                          >
                            {inc.status === 'fixed' ? 'View Audit' : 'Telemetry'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
      </div>
    </div>
  );
};
