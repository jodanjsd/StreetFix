import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Clock,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Star,
} from 'lucide-react';
import { Incident, ScreenRoute } from '../types';
import { HOTLINKED_IMAGES } from '../data/mockData';
import { SafeImage } from '../components/SafeImage';

interface ExecutiveAnalyticsProps {
  incidents: Incident[];
  onNavigate: (route: ScreenRoute) => void;
  onNotify: (msg: string) => void;
}

const BASE_SCORECARD = [
  {
    rank: 1,
    name: 'Akwa Ibom Rapid Asphalt Taskforce (AKRMA)',
    matchKey: 'AKRMA',
    sub: 'Municipal Squad #04 · Zone 1',
    sector: 'Arterial Roads',
    zone: 'Uyo & Itu',
    turnaround: '2.8 Days',
    csat: '4.9',
    audit: '99.1% Pass',
    tier: 'EXCELLENCE',
  },
  {
    rank: 2,
    name: 'Akwa Ibom Drainage & Flood Unit',
    matchKey: 'Drainage',
    sub: 'Hydraulic Engineering · Zone 2',
    sector: 'Drainage & Culverts',
    zone: 'Uyo & Itu',
    turnaround: '3.2 Days',
    csat: '4.8',
    audit: '98.4% Pass',
    tier: 'EXCELLENCE',
  },
  {
    rank: 3,
    name: 'AKSEPB Swift Emergency Squad',
    matchKey: 'AKSEPB',
    sub: 'Municipal Squad #09 · Waste',
    sector: 'Refuse & Canals',
    zone: 'Eket & Coastal',
    turnaround: '2.1 Days',
    csat: '4.7',
    audit: '97.2% Pass',
    tier: 'HIGH COMPLIANCE',
  },
  {
    rank: 4,
    name: 'Ibom Power & FCDA Electrical Maintenance',
    matchKey: 'Electrical',
    sub: 'Lighting & Signal Grid',
    sector: 'Streetlights & Signals',
    zone: 'Eket & Coastal',
    turnaround: '2.4 Days',
    csat: '4.6',
    audit: '95.8% Pass',
    tier: 'HIGH COMPLIANCE',
  },
];

export const ExecutiveAnalytics: React.FC<ExecutiveAnalyticsProps> = ({
  incidents,
  onNavigate,
  onNotify,
}) => {
  const [cycle, setCycle] = useState('Q1 2026 / Live Ledger');
  const [zoneFilter, setZoneFilter] = useState('All Zones');
  const [selectedHotspotIdx, setSelectedHotspotIdx] = useState(0);

  const metrics = useMemo(() => {
    const total = incidents.length;
    const fixed = incidents.filter((i) => i.status === 'fixed').length;
    const open = incidents.filter((i) => i.status !== 'fixed');
    const criticalOpen = open.filter((i) => i.severity === 'critical').length;
    const verifiedExif = incidents.filter((i) => i.exifVerified).length;
    const resolutionPct = total > 0 ? ((fixed / total) * 100).toFixed(1) : '0.0';
    const avgOpenSlaHours =
      open.length > 0
        ? (
            open.reduce((acc, item) => acc + (item.slaRemainingHours || 0), 0) /
            open.length
          ).toFixed(1)
        : '0.0';
    return {
      total,
      fixed,
      openCount: open.length,
      criticalOpen,
      verifiedExif,
      resolutionPct,
      avgOpenSlaHours,
    };
  }, [incidents]);

  const lgaMatrix = useMemo(() => {
    const byLga = new Map<string, Incident[]>();
    incidents.forEach((inc) => {
      const key = inc.lga || 'Unknown LGA';
      byLga.set(key, [...(byLga.get(key) || []), inc]);
    });

    return Array.from(byLga.entries())
      .map(([lga, items]) => {
        const catCounts: Record<string, number> = {};
        items.forEach((i) => {
          catCounts[i.category] = (catCounts[i.category] || 0) + 1;
        });
        const primaryFault =
          Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed Infrastructure';
        const fixedInLga = items.filter((i) => i.status === 'fixed').length;
        const criticalInLga = items.filter(
          (i) => i.severity === 'critical' && i.status !== 'fixed'
        ).length;
        const openItems = items.filter((i) => i.status !== 'fixed');
        const avgSlaHrs =
          openItems.length > 0
            ? `${Math.round(
                openItems.reduce((sum, i) => sum + (i.slaRemainingHours || 24), 0) /
                  openItems.length
              )}h left`
            : 'All Cleared';
        const slaPct = items.length > 0 ? Math.round((fixedInLga / items.length) * 100) : 100;
        const color =
          criticalInLga > 0
            ? 'bg-red-500'
            : openItems.length > 0
            ? 'bg-amber-500'
            : 'bg-emerald-600';

        return {
          lga,
          state: items[0]?.state || '',
          volume: items.length,
          openCount: openItems.length,
          criticalInLga,
          primaryFault,
          mttr: avgSlaHrs,
          sla: `${slaPct}% Resolved`,
          color,
        };
      })
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6);
  }, [incidents]);

  const hotspotChips = useMemo(() => {
    if (lgaMatrix.length === 0) {
      return ['No active hotspots · 0 Reports · All Clear'];
    }
    return lgaMatrix.slice(0, 3).map(
      (row) =>
        `${row.lga} (${row.state}) · ${row.volume} Report${row.volume === 1 ? '' : 's'} · ${row.openCount} Open (${row.primaryFault})`
    );
  }, [lgaMatrix]);

  const activeHotspot =
    hotspotChips[selectedHotspotIdx] || hotspotChips[0] || 'No hotspot telemetry';

  const categoryBreakdown = useMemo(() => {
    const groups = [
      {
        name: 'Potholes & Road Hazards',
        match: (c: string) => c.includes('Pothole'),
        color: 'bg-cyan-600',
      },
      {
        name: 'Canals & Drainage Networks',
        match: (c: string) => c.includes('Drainage') || c.includes('Water'),
        color: 'bg-[#E06236]',
      },
      {
        name: 'Waste Disposal & Sanitation',
        match: (c: string) => c.includes('Waste'),
        color: 'bg-emerald-600',
      },
      {
        name: 'Streetlights & Traffic Signals',
        match: (c: string) => c.includes('Streetlight') || c.includes('Traffic'),
        color: 'bg-[#0F1E24]',
      },
    ];

    return groups.map((g) => {
      const matched = incidents.filter((i) => g.match(i.category));
      const resolved = matched.filter((i) => i.status === 'fixed').length;
      const inFlight = matched.filter(
        (i) => i.status === 'in_progress' || i.status === 'assigned'
      ).length;
      const pct =
        matched.length > 0 ? Math.round(((resolved + inFlight * 0.5) / matched.length) * 100) : 100;
      return {
        name: g.name,
        ratio: `${resolved} Fixed / ${matched.length} Total`,
        pct: Math.max(8, Math.min(100, pct)),
        avg: `${inFlight} in field · ${matched.length - resolved - inFlight} queued`,
        badge: matched.length === 0 ? 'Clear' : resolved === matched.length ? '100% Closed' : 'Active SLA',
        color: g.color,
      };
    });
  }, [incidents]);

  const scorecardRows = useMemo(() => {
    return BASE_SCORECARD.map((row) => {
      const assigned = incidents.filter((i) =>
        i.assignedUnit.toLowerCase().includes(row.matchKey.toLowerCase()) ||
        (row.matchKey === 'Electrical' &&
          (i.assignedUnit.includes('Power') || i.assignedUnit.includes('Electrical')))
      );
      const resolved = assigned.filter((i) => i.status === 'fixed').length;
      return {
        ...row,
        orders: `${assigned.length} Active/Logged`,
        votes: `${resolved} certified`,
      };
    }).filter((row) => zoneFilter === 'All Zones' || row.zone === zoneFilter);
  }, [incidents, zoneFilter]);

  const seriousDrainageCount = incidents.filter(
    (i) => i.category === 'Blocked Drainage' && i.status !== 'fixed'
  ).length;

  const handleExportBriefing = () => {
    const csv = [
      'Section,Metric,Volume,PrimaryFaultOrDetail,SLA',
      ...lgaMatrix.map(
        (r) => `"LGA Matrix","${r.lga} (${r.state})",${r.volume},"${r.primaryFault}","${r.sla}"`
      ),
      ...scorecardRows.map(
        (r) => `"Scorecard","${r.name}","${r.orders}","${r.sector}","${r.audit}"`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'streetfix_executive_sla_briefing.csv';
    link.click();
    URL.revokeObjectURL(url);
    onNotify(`Exported Executive SLA Briefing (${cycle}) with ${incidents.length} live records.`);
  };

  return (
    <div className="flex flex-col">
      {/* Tactical Module Header Banner */}
      <section className="bg-[#0F1E24] text-white border-b border-cyan-500/20 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-cyan-400">
              <span>Executive Telemetry</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-300 font-medium">Live Cadastre Audit Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Municipal Infrastructure Intelligence &amp; SLA Compliance Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Real-time civic fault telemetry, contractor resolution velocity, and spatial auditing across 36 States + FCT
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <select
              aria-label="Reporting Cycle"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="rounded-lg border border-slate-700 bg-[#0A1419] px-3.5 py-2.5 text-xs font-bold text-slate-100"
            >
              <option>Q1 2026 / Live Ledger</option>
              <option>FY 2025 Annual Audit</option>
              <option>Last 30 Days Rolling</option>
            </select>

            <button
              type="button"
              onClick={handleExportBriefing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#0A1419] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Export Briefing</span>
            </button>
          </div>
        </div>
      </section>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Early-Warning Advisory Banner */}
        <section className="bg-[#FFF4EE] border border-[#FCD9C8] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E06236] text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#E06236]">
                Early Warning Radar · Drainage &amp; Critical Infrastructure
              </div>
              <h2 className="text-sm font-bold text-[#1A1D1A]">
                Active Flood &amp; Hazard Priority: {seriousDrainageCount} open drainage case(s) and{' '}
                {metrics.criticalOpen} critical hazard(s) currently queued in live telemetry
              </h2>
              <p className="text-xs text-[#4A5568]">
                Click Dispatch Desilting Unit to jump directly into the Triage Matrix or open GIS Telemetry for spatial tracking.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onNotify('Routing to Triage Matrix for Drainage Desilting & Critical Dispatch.');
                onNavigate('triage');
              }}
              className="px-4 py-2.5 rounded-xl bg-[#E06236] hover:bg-[#D35400] text-white text-xs font-bold cursor-pointer"
            >
              Dispatch Desilting Unit
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ops')}
              className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F4F7F9] text-xs font-bold text-[#1A1D1A] cursor-pointer"
            >
              View Telemetry
            </button>
          </div>
        </section>

        {/* 4 Live KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#4A5568]">
              <span>Live Tracked Reports</span>
              <TrendingUp className="w-4 h-4 text-[#E06236]" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
              {metrics.total.toLocaleString()}
            </div>
            <div className="text-xs text-[#4A5568] font-semibold">
              <span className="text-[#E06236]">{metrics.openCount} active open</span> ·{' '}
              {metrics.criticalOpen} critical
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#4A5568]">
              <span>Avg Open SLA Window</span>
              <Clock className="w-4 h-4 text-[#132E20]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
                {metrics.avgOpenSlaHours} hrs
              </span>
              <span className="text-xs text-[#4A5568]">avg remaining</span>
            </div>
            <div className="text-xs text-emerald-700 font-semibold">
              24h emergency SLA on critical hazards
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#4A5568]">
              <span>Resolution Rate (Live)</span>
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
              {metrics.resolutionPct}%
            </div>
            <div className="text-xs text-[#4A5568]">
              {metrics.fixed} of {metrics.total} logged reports certified
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#4A5568]">
              <span>EXIF Verified Evidence</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
              {metrics.verifiedExif}
            </div>
            <div className="text-xs text-emerald-700 font-semibold">
              Geotagged citizen &amp; field photos
            </div>
          </div>
        </div>

        {/* Middle Grid: Live LGA Fault Matrix + Category SLA Breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: GIS Heatmap + LGA Table */}
          <section className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#1A1D1A]">
                  Live Local Government Area (LGA) Fault Matrix
                </h2>
                <p className="text-xs text-[#4A5568]">
                  Aggregated directly from active and certified reports in StreetFix telemetry
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Cleared</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">Open Queue</span>
                <span className="px-2 py-0.5 rounded bg-red-50 text-red-700">Critical</span>
              </div>
            </div>

            <div className="relative min-h-[280px] sm:h-64 rounded-xl overflow-hidden border border-slate-200 bg-[#0F1E24]">
              <SafeImage
                src={HOTLINKED_IMAGES.lagosHeatmap}
                alt="Infrastructure Fault Concentration Heatmap"
                className="w-full h-full object-cover absolute inset-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1419]/90 via-transparent to-transparent" />

              {/* Interactive Hotspot Chips */}
              <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2">
                {hotspotChips.map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedHotspotIdx(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      selectedHotspotIdx === idx
                        ? 'bg-cyan-400 text-[#0A1419]'
                        : 'bg-[#0F1E24]/90 text-white hover:bg-[#162B33]'
                    }`}
                  >
                    {label.split(' · ')[0]}
                  </button>
                ))}
              </div>

              <div className="absolute bottom-3 left-3 right-3 px-3.5 py-2.5 rounded-xl bg-[#0F1E24]/95 border border-cyan-500/25 text-xs text-white flex items-center justify-between gap-2">
                <span className="font-semibold truncate">{activeHotspot}</span>
                <span className="font-mono text-[11px] text-cyan-300 shrink-0">GIS LIVE</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[11px] font-bold uppercase text-[#4A5568]">
                    <th className="py-2.5 pr-3">Local Government Area</th>
                    <th className="py-2.5 pr-3">Reports</th>
                    <th className="py-2.5 pr-3">Primary Fault Type</th>
                    <th className="py-2.5 pr-3">Open SLA Avg</th>
                    <th className="py-2.5 text-right">Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {lgaMatrix.map((row) => (
                    <tr key={`${row.state}-${row.lga}`}>
                      <td className="py-3 pr-3 font-bold text-[#1A1D1A] flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${row.color}`} />
                        <span>{row.lga}</span>
                      </td>
                      <td className="py-3 pr-3 font-mono font-bold tabular-nums">
                        {row.volume.toLocaleString()}
                      </td>
                      <td className="py-3 pr-3 text-[#4A5568]">{row.primaryFault}</td>
                      <td className="py-3 pr-3 font-mono tabular-nums">{row.mttr}</td>
                      <td className="py-3 text-right font-mono font-bold text-[#132E20] tabular-nums">
                        {row.sla}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right 5 Cols: Category SLA Breakdown */}
          <section className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#1A1D1A]">Category SLA Breakdown</h2>
                <p className="text-xs text-[#4A5568]">
                  Live resolution and active dispatch progress across civil categories
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-[#0F1E24] text-cyan-300 font-mono text-[10px] font-bold shrink-0">
                TARGET: ≤ 48 HRS
              </span>
            </div>

            <div className="space-y-4">
              {categoryBreakdown.map((cat) => (
                <div
                  key={cat.name}
                  className="p-4 rounded-xl bg-[#F4F7F9] border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-bold text-slate-900">{cat.name}</span>
                    <span className="font-mono font-bold text-[#0F1E24] tabular-nums">
                      {cat.ratio}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.color}`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{cat.avg}</span>
                    <span className="font-bold text-emerald-700">✓ {cat.badge}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#0F1E24]">Aggregate Certified Fixes:</span>
              <span className="font-mono font-extrabold text-[#0A1419] tabular-nums">
                {metrics.fixed} / {metrics.total} ({metrics.resolutionPct}%)
              </span>
            </div>
          </section>
        </div>

        {/* Department & Contractor SLA Performance Scorecard */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 md:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Department &amp; Contractor SLA Performance Scorecard
              </h2>
              <p className="text-xs text-slate-600">
                Municipal response squads tracked by assigned case volume and closeout audit quality
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['All Zones', 'Uyo & Itu', 'Eket & Coastal'].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoneFilter(z)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    zoneFilter === z
                      ? 'bg-[#0F1E24] text-cyan-300'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] font-bold uppercase text-[#4A5568]">
                  <th className="py-3 pr-4">Rank &amp; Entity Name</th>
                  <th className="py-3 pr-4">Operations Sector</th>
                  <th className="py-3 pr-4">Assigned Cases</th>
                  <th className="py-3 pr-4">Avg Turnaround</th>
                  <th className="py-3 pr-4">Resident CSAT</th>
                  <th className="py-3 pr-4">Photo Audit</th>
                  <th className="py-3 text-right">Status Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {scorecardRows.map((row) => (
                  <tr key={row.rank} className="hover:bg-[#F4F7F9]">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#F4FBE4] text-[#132E20] font-mono font-bold flex items-center justify-center shrink-0">
                          {row.rank}
                        </span>
                        <div>
                          <div className="font-bold text-[#1A1D1A]">{row.name}</div>
                          <div className="text-[11px] text-[#4A5568]">{row.sub}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="px-2.5 py-1 rounded-lg bg-[#F3F4EF] font-semibold text-[#1A1D1A]">
                        {row.sector}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 font-mono font-bold tabular-nums">{row.orders}</td>
                    <td className="py-3.5 pr-4 font-semibold text-emerald-700 tabular-nums">
                      {row.turnaround}
                    </td>
                    <td className="py-3.5 pr-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-[#1A1D1A] tabular-nums">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {row.csat}
                      </span>
                      <span className="text-[#4A5568] ml-1 text-[11px]">({row.votes})</span>
                    </td>
                    <td className="py-3.5 pr-4 font-semibold text-emerald-700 tabular-nums">
                      {row.audit}
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          row.tier === 'EXCELLENCE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.tier === 'HIGH COMPLIANCE'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {row.tier}
                      </span>
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

