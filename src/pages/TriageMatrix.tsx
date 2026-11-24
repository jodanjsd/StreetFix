import React, { useState } from 'react';
import {
  Download,
  Send,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  X,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { Incident, ScreenRoute } from '../types';
import { NIGERIAN_CADASTRE, getCadastreLgaOptions } from '../data/mockData';
import { SafeImage } from '../components/SafeImage';

interface TriageMatrixProps {
  incidents: Incident[];
  onNavigate: (route: ScreenRoute) => void;
  onAssignUnit: (id: string, unit: string) => void;
  onBatchDispatch: (ids: string[]) => void;
  onSelectIncident: (id: string) => void;
  onNotify: (msg: string) => void;
}

const SQUAD_OPTIONS = [
  'Unassigned',
  'AKRMA Squad 4',
  'Akwa Ibom Drainage Unit #12',
  'AKSEPB Compactor Truck #22',
  'Ibom Power Streetlight Unit',
  'AKRMA Rapid Unit 02',
];

export const TriageMatrix: React.FC<TriageMatrixProps> = ({
  incidents,
  onNavigate,
  onAssignUnit,
  onBatchDispatch,
  onSelectIncident,
  onNotify,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([incidents[0]?.id || 'inc-1']);
  const [stateFilter, setStateFilter] = useState('all');
  const [lgaFilter, setLgaFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedId, setInspectedId] = useState<string | null>(null);

  const criticalCount = incidents.filter((i) => i.severity === 'critical' && i.status !== 'fixed').length;

  const allStatesList = Object.values(NIGERIAN_CADASTRE).map((s) => s.name);
  const lgaOptions = getCadastreLgaOptions(
    stateFilter,
    incidents
      .filter((i) => stateFilter === 'all' || i.state === stateFilter)
      .map((i) => i.lga)
  );
  const uniqueCategories = Array.from(new Set(incidents.map((i) => i.category)));

  const filtered = incidents.filter((inc) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQ =
      !q ||
      inc.refCode.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q) ||
      inc.address.toLowerCase().includes(q) ||
      inc.reporterName.toLowerCase().includes(q);
    const matchesState = stateFilter === 'all' || inc.state === stateFilter;
    const matchesLga = lgaFilter === 'all' || inc.lga === lgaFilter;
    const matchesCat = categoryFilter === 'all' || inc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchesSev = severityFilter === 'all' || inc.severity === severityFilter;
    return matchesQ && matchesState && matchesLga && matchesCat && matchesStatus && matchesSev;
  });

  const inspectedIncident = incidents.find((i) => i.id === inspectedId) || null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((i) => i.id));
    }
  };

  const handleBatchDispatchClick = () => {
    if (selectedIds.length === 0) {
      onNotify('Select at least one incident row to batch dispatch.');
      return;
    }
    onBatchDispatch(selectedIds);
  };

  const handleExportCsv = () => {
    const headers = ['RefCode', 'Category', 'LGA', 'Address', 'Severity', 'Status', 'AssignedUnit', 'SLA'];
    const rows = filtered.map((i) => [
      i.refCode,
      `"${i.category}"`,
      `"${i.lga}"`,
      `"${i.address.replace(/"/g, '""')}"`,
      i.severity,
      i.status,
      `"${i.assignedUnit}"`,
      `"${i.slaLabel}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'streetfix_triage_matrix.csv';
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Exported Incident Telemetry CSV.');
  };

  return (
    <div className="flex flex-col">
      {/* Tactical Module Header Banner */}
      <section className="bg-[#0F1E24] text-white border-b border-cyan-500/20 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-cyan-400">
              Akwa Ibom State Ministry of Works · Priority Dispatch Queue
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Administrative Triage &amp; Incident Dispatch Matrix
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-700 bg-[#0A1419] hover:bg-slate-800 text-xs font-bold text-slate-100 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Telemetry CSV</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDispatchClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#E06236] hover:bg-[#D35400] text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Batch Dispatch Squad ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </section>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* 4 KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#4A5568]">
              <span>Total Unassigned</span>
              <Clock className="w-4 h-4 text-[#E06236]" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
              {incidents.filter((i) => i.assignedUnit === 'Unassigned' || i.status === 'pending').length}
            </div>
            <div className="text-[11px] font-semibold text-[#E06236]">Requires immediate squad routing</div>
          </div>

          <div className="bg-white border border-red-200 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#4A5568]">
              <span>Critical SLA at Risk</span>
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-3xl font-extrabold text-red-700 tabular-nums">{criticalCount}</div>
            <div className="text-[11px] font-semibold text-red-600">High hazard arterial faults</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#4A5568]">
              <span>Pending Evidence Audit</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
              {incidents.filter((i) => i.exifVerified).length}
            </div>
            <div className="text-[11px] text-[#4A5568]">EXIF GPS tags verified</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[#4A5568]">
              <span>Active Crews Deployed</span>
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
              {
                new Set(
                  incidents
                    .filter((i) => i.assignedUnit && i.assignedUnit !== 'Unassigned' && i.status !== 'fixed')
                    .map((i) => i.assignedUnit)
                ).size
              }
            </div>
            <div className="text-[11px] font-semibold text-emerald-700">
              {incidents.filter((i) => i.assignedUnit !== 'Unassigned' && i.status !== 'fixed').length} active assignments
            </div>
          </div>
        </div>

        {/* 6-Filter + Reset Bar */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 items-end">
          <div>
            <label htmlFor="tri-search" className="block text-[11px] font-bold text-[#4A5568] mb-1">
              Search Ticket / Street
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#4A5568] absolute left-2.5 top-2.5" />
              <input
                id="tri-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="STF-2026..."
                className="w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] pl-8 pr-2.5 py-2 text-xs text-[#1A1D1A]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tri-state" className="block text-[11px] font-bold text-[#4A5568] mb-1">
              State (36 + FCT)
            </label>
            <select
              id="tri-state"
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setLgaFilter('all');
              }}
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-2.5 py-2 text-xs text-[#1A1D1A]"
            >
              <option value="all">All 36 States + FCT</option>
              {allStatesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tri-lga" className="block text-[11px] font-bold text-[#4A5568] mb-1">
              Local Govt Area (LGA)
            </label>
            <select
              id="tri-lga"
              value={lgaFilter}
              onChange={(e) => setLgaFilter(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-2.5 py-2 text-xs text-[#1A1D1A]"
            >
              <option value="all">
                {stateFilter === 'all' ? 'All LGAs (774)' : `All LGAs in ${stateFilter}`}
              </option>
              {lgaOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tri-cat" className="block text-[11px] font-bold text-[#4A5568] mb-1">
              Incident Category
            </label>
            <select
              id="tri-cat"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-2.5 py-2 text-xs text-[#1A1D1A]"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tri-status" className="block text-[11px] font-bold text-[#4A5568] mb-1">
              Status State
            </label>
            <select
              id="tri-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-2.5 py-2 text-xs text-[#1A1D1A]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="fixed">Resolved</option>
            </select>
          </div>

          <div>
            <label htmlFor="tri-sev" className="block text-[11px] font-bold text-[#4A5568] mb-1">
              Severity Filter
            </label>
            <select
              id="tri-sev"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-2.5 py-2 text-xs text-[#1A1D1A]"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStateFilter('all');
              setLgaFilter('all');
              setCategoryFilter('all');
              setStatusFilter('all');
              setSeverityFilter('all');
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F1E24] hover:bg-[#162B33] text-cyan-300 px-3 py-2 text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </section>

        {/* Triage Matrix Table + Optional Inspection Drawer */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <section
            className={`${
              inspectedIncident ? 'xl:col-span-8' : 'xl:col-span-12'
            } bg-white border border-slate-200 rounded-2xl overflow-hidden`}
          >
            <div className="px-4 sm:px-5 py-3.5 bg-[#F4F7F9] border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all incidents"
                />
                <span className="tabular-nums">
                  {selectedIds.length} Incidents Selected · Showing {filtered.length} records
                </span>
              </div>
              <span className="text-cyan-700 font-mono text-[11px] font-semibold">Live Matrix Sync</span>
            </div>

            {/* Mobile Triage Cards */}
            <div className="lg:hidden divide-y divide-[#F1F5F9]">
              {filtered.map((inc) => {
                const isChecked = selectedIds.includes(inc.id);
                const slaPct =
                  inc.status === 'fixed'
                    ? 100
                    : inc.severity === 'critical'
                    ? 85
                    : inc.severity === 'moderate'
                    ? 55
                    : 30;
                return (
                  <div
                    key={`mob-${inc.id}`}
                    className={`p-4 space-y-3 ${isChecked ? 'bg-[#FFF9F5]' : 'bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(inc.id)}
                          aria-label={`Select ${inc.refCode}`}
                          className="mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-bold text-[#E06236]">
                            {inc.refCode}
                          </div>
                          <div className="text-xs font-bold text-[#1A1D1A] break-words">
                            {inc.category}
                          </div>
                          <div className="text-[11px] text-[#4A5568] break-words">
                            {inc.address}, {inc.lga} · {inc.reporterName}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectedId(inc.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#0F1E24] hover:bg-[#162B33] text-cyan-300 text-[11px] font-bold cursor-pointer shrink-0"
                      >
                        Inspect
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold tabular-nums">
                        <span
                          className={
                            inc.status === 'fixed'
                              ? 'text-emerald-700'
                              : inc.severity === 'critical'
                              ? 'text-red-700'
                              : 'text-[#B96417]'
                          }
                        >
                          {inc.slaLabel}
                        </span>
                        <span className="uppercase text-[10px] text-[#4A5568]">{inc.severity}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            inc.status === 'fixed'
                              ? 'bg-emerald-600'
                              : inc.severity === 'critical'
                              ? 'bg-red-600'
                              : 'bg-[#E06236]'
                          }`}
                          style={{ width: `${slaPct}%` }}
                        />
                      </div>
                    </div>

                    <select
                      aria-label={`Assign squad for ${inc.refCode} on mobile`}
                      value={inc.assignedUnit}
                      onChange={(e) => onAssignUnit(inc.id, e.target.value)}
                      className="w-full rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-2.5 py-2 text-xs font-semibold text-[#1A1D1A]"
                    >
                      {!SQUAD_OPTIONS.includes(inc.assignedUnit) && (
                        <option value={inc.assignedUnit}>{inc.assignedUnit}</option>
                      )}
                      {SQUAD_OPTIONS.map((sq) => (
                        <option key={sq} value={sq}>
                          {sq}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {/* Desktop Triage Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                    <th className="py-3 pl-5 pr-2 w-8"></th>
                    <th className="py-3 pr-4">Incident Ref</th>
                    <th className="py-3 pr-4">Category &amp; LGA</th>
                    <th className="py-3 pr-4">Citizen Reporter</th>
                    <th className="py-3 pr-4">SLA Countdown</th>
                    <th className="py-3 pr-4">Engineering Squad</th>
                    <th className="py-3 pr-5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-xs">
                  {filtered.map((inc) => {
                    const isChecked = selectedIds.includes(inc.id);
                    const slaPct =
                      inc.status === 'fixed'
                        ? 100
                        : inc.severity === 'critical'
                        ? 85
                        : inc.severity === 'moderate'
                        ? 55
                        : 30;
                    return (
                      <tr
                        key={inc.id}
                        className={`transition-colors ${
                          isChecked ? 'bg-[#FFF9F5]' : 'hover:bg-[#F4F7F9]'
                        }`}
                      >
                        <td className="py-3.5 pl-5 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelect(inc.id)}
                            aria-label={`Select ${inc.refCode}`}
                          />
                        </td>
                        <td className="py-3.5 pr-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-[#E06236]">{inc.refCode}</div>
                          <div className="text-[11px] text-[#4A5568]">{inc.reportedAt}</div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <div className="font-bold text-[#1A1D1A]">{inc.category}</div>
                          <div className="text-[11px] text-[#4A5568]">
                            {inc.address}, {inc.lga}
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 whitespace-nowrap">
                          <div className="font-semibold text-[#1A1D1A]">{inc.reporterName}</div>
                          <div className="text-[11px] text-emerald-700 font-medium">
                            {inc.reporterVerified ? 'Verified Resident' : 'Anonymous'}
                          </div>
                        </td>
                        <td className="py-3.5 pr-4 min-w-[140px]">
                          <div className="flex items-center justify-between text-[11px] font-mono font-bold tabular-nums mb-1">
                            <span
                              className={
                                inc.status === 'fixed'
                                  ? 'text-emerald-700'
                                  : inc.severity === 'critical'
                                  ? 'text-red-700'
                                  : 'text-[#B96417]'
                              }
                            >
                              {inc.slaLabel}
                            </span>
                            <span className="uppercase text-[10px] text-[#4A5568]">{inc.severity}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                inc.status === 'fixed'
                                  ? 'bg-emerald-600'
                                  : inc.severity === 'critical'
                                  ? 'bg-red-600'
                                  : 'bg-[#E06236]'
                              }`}
                              style={{ width: `${slaPct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 pr-4">
                          <select
                            aria-label={`Assign squad for ${inc.refCode}`}
                            value={inc.assignedUnit}
                            onChange={(e) => onAssignUnit(inc.id, e.target.value)}
                            className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1A1D1A] focus:border-[#132E20] focus:outline-none"
                          >
                            {!SQUAD_OPTIONS.includes(inc.assignedUnit) && (
                              <option value={inc.assignedUnit}>{inc.assignedUnit}</option>
                            )}
                            {SQUAD_OPTIONS.map((sq) => (
                              <option key={sq} value={sq}>
                                {sq}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 pr-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setInspectedId(inc.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#0F1E24] hover:bg-[#162B33] text-cyan-300 text-[11px] font-bold cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Inspection Drawer */}
          {inspectedIncident && (
            <aside className="xl:col-span-4 bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[#E06236]">
                    {inspectedIncident.refCode}
                  </span>
                  <h2 className="text-base font-bold text-[#1A1D1A] mt-0.5">
                    {inspectedIncident.title}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close inspection drawer"
                  onClick={() => setInspectedId(null)}
                  className="p-1.5 rounded-lg hover:bg-[#F3F4EF] text-[#4A5568] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="h-40 rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#132E20]">
                <SafeImage
                  src={inspectedIncident.beforePhotoUrl}
                  alt={inspectedIncident.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <p className="text-xs text-[#4A5568] leading-relaxed">
                {inspectedIncident.description}
              </p>

              <div className="p-3 rounded-xl bg-[#F4F7F9] border border-[#E2E8F0] space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-[#1A1D1A]">
                  <MapPin className="w-3.5 h-3.5 text-[#E06236]" />
                  <span>
                    {inspectedIncident.address}, {inspectedIncident.lga}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#4A5568]">
                  GPS: {inspectedIncident.lat}, {inspectedIncident.lng}
                </div>
                <div className="text-[11px] text-[#4A5568]">
                  Assigned: <strong className="text-[#1A1D1A]">{inspectedIncident.assignedUnit}</strong>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectIncident(inspectedIncident.id);
                    onNavigate('dispatch');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E06236] hover:bg-[#D35400] text-white text-xs font-bold cursor-pointer"
                >
                  Push to Field Dispatch Studio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectIncident(inspectedIncident.id);
                    onNavigate('directory');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] hover:bg-[#EDEEE9] text-[#1A1D1A] text-xs font-bold cursor-pointer"
                >
                  View Full Public Lifecycle
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
