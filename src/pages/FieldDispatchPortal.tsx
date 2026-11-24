import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Camera,
  ShieldCheck,
  Clock,
  Truck,
  Upload,
  Wrench,
} from 'lucide-react';
import { Incident, ScreenRoute, UserSession } from '../types';
import { HOTLINKED_IMAGES } from '../data/mockData';
import { SafeImage } from '../components/SafeImage';
import { readCompressedImageFile } from '../utils/imageUpload';

interface FieldDispatchPortalProps {
  incidents: Incident[];
  selectedIncidentId: string;
  session?: UserSession | null;
  onSelectIncident: (id: string) => void;
  onCheckIn: (id: string) => void;
  onResolveIncident: (
    id: string,
    payload: {
      afterPhotoUrl: string;
      asphaltTons: number;
      crewHours: number;
      equipment: string;
      notes: string;
    }
  ) => void;
  onNavigate: (route: ScreenRoute) => void;
  onNotify: (msg: string, urgent?: boolean) => void;
}

export const FieldDispatchPortal: React.FC<FieldDispatchPortalProps> = ({
  incidents,
  selectedIncidentId,
  session,
  onSelectIncident,
  onCheckIn,
  onResolveIncident,
  onNotify,
}) => {
  const officerName = session?.name || 'Engr. Iniobong Ekpo';
  const officerRole = session?.isStreetFixOffice
    ? 'HQ Backend Authority'
    : session?.roleLevel || 'Squad 4 Lead';
  const officerDept = session?.jurisdiction || 'AKRMA Yard, Uyo Urban';
  const officerServiceId = session?.serviceId || '#AKSG-WRK-4091';
  const officerAvatar = session?.avatarUrl || HOTLINKED_IMAGES.engrIniobongEkpo;
  const workOrders = incidents.filter((i) => i.status !== 'fixed');
  const activeJob =
    workOrders.find((i) => i.id === selectedIncidentId) || workOrders[0] || incidents[0];

  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string>('');
  const [asphaltTons, setAsphaltTons] = useState<number>(2.8);
  const [crewHours, setCrewHours] = useState<number>(3.5);
  const [equipment, setEquipment] = useState<string>('Caterpillar Vibratory Roller');
  const [notes, setNotes] = useState<string>(
    'Sub-base reinforced with crushed granite aggregate and compacted to municipal grade spec. Applied 60/70 penetration asphalt overlay. Surface cooled and traffic cones ready for removal.'
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readCompressedImageFile(
      file,
      (dataUrl) => {
        setAfterPhotoUrl(dataUrl);
        onNotify(`Attached post-repair EXIF proof: ${file.name}`);
      },
      (err) => onNotify(err, true)
    );
    e.target.value = '';
  };

  const handleSubmitResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeJob) return;
    const proof = afterPhotoUrl || HOTLINKED_IMAGES.finishedRoadStriping;
    onResolveIncident(activeJob.id, {
      afterPhotoUrl: proof,
      asphaltTons,
      crewHours,
      equipment,
      notes,
    });
    setAfterPhotoUrl('');
  };

  return (
    <div className="flex flex-col">
      {/* Field Squad Tactical Sub-Header Ribbon */}
      <section className="bg-[#0F1E24] text-white border-b border-cyan-500/20 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <SafeImage
              src={officerAvatar}
              alt={officerName}
              className="w-12 h-12 rounded-xl object-cover border border-cyan-400/50 shrink-0"
            />
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-cyan-400">
                <Truck className="w-4 h-4 shrink-0" />
                <span>{officerName} · {officerRole}</span>
                <span className="text-slate-600" aria-hidden="true">·</span>
                <span className="text-slate-300">{officerDept}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Field Dispatch &amp; Completion Studio
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
            <span>
              Assigned Orders: <strong className="text-white tabular-nums">{workOrders.length} Active</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>
              Depot Distance: <strong className="text-[#E06236] tabular-nums">{activeJob?.distanceKm || 1.4} km</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span className="font-mono text-[11px] font-bold text-cyan-300">
              RTK-GPS: ±0.05m
            </span>
          </div>
        </div>
      </section>

      {/* Main Split Workspace */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT 5 COLS: Daily Work Orders Queue */}
        <section className="lg:col-span-5 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Daily Work Orders Queue</h2>
              <p className="text-xs text-slate-600">
                Prioritized civic infrastructure interventions for Squad 4
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#0F1E24] text-cyan-300 text-[11px] font-bold tabular-nums shrink-0">
              {workOrders.length} Pending Dispatch
            </span>
          </div>

          <div className="space-y-3">
            {workOrders.map((job) => {
              const isSelected = activeJob?.id === job.id;
              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => onSelectIncident(job.id)}
                  className={`w-full text-left rounded-2xl p-5 border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-white border-[#E06236] ring-1 ring-[#E06236]/30 shadow-sm'
                      : 'bg-white border-[#E2E8F0] hover:border-[#132E20]/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#F3F4EF] font-mono text-[11px] font-bold text-[#132E20]">
                        {job.refCode}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          job.severity === 'critical'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {job.severity === 'critical' ? 'P1 Critical Emergency' : 'Scheduled Maintenance'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-[#B96417] font-mono text-[11px] font-bold tabular-nums">
                      SLA {job.slaLabel}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-[#1A1D1A]">{job.title}</h2>
                    <p className="text-xs text-[#4A5568] mt-1 line-clamp-2">{job.description}</p>
                  </div>

                  {isSelected ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#F4F7F9] border border-[#E2E8F0] text-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-[#4A5568]">Coordinates</div>
                        <div className="font-mono font-semibold text-[#1A1D1A] tabular-nums">
                          {job.lat}, {job.lng}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase text-[#4A5568]">Proximity</div>
                        <div className="font-semibold text-[#E06236] tabular-nums">
                          {job.distanceKm} km from depot
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-[#4A5568] tabular-nums">
                      {job.confirmations} Resident Confirmations
                    </span>
                    <span className="font-bold text-[#E06236]">
                      {isSelected ? 'Active Job Site →' : 'View Specs →'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* RIGHT 7 COLS: Route Navigation & Live Job Completion Studio */}
        {activeJob && (
          <section className="lg:col-span-7 space-y-6 min-w-0">
            {/* Route Navigation & Geofence Verification */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#1A1D1A] flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-[#E06236] shrink-0" />
                    <span>Route Navigation &amp; Geofence Verification</span>
                  </h2>
                  <p className="text-xs text-[#4A5568]">
                    Turn-by-turn guidance from Public Works Depot to {activeJob.address}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {activeJob.checkedIn ? 'GEOFENCE LOCKED (ON SITE)' : 'GEOFENCE ARMED (50m)'}
                </span>
              </div>

              {/* Dark Carbon-Teal Vector Route Canvas */}
              <div className="relative min-h-[240px] h-auto sm:h-56 rounded-xl bg-[#0A1419] border border-slate-800 overflow-hidden p-4 flex flex-col justify-between gap-3">
                <div className="absolute inset-0 ops-telemetry-grid opacity-80 pointer-events-none" />
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                  <div className="px-3 py-2 rounded-lg bg-[#0F1E24]/95 border border-cyan-500/20 text-xs">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Next Turn in 320 Meters
                    </div>
                    <div className="font-bold text-white">Bear right onto Atiku Abubakar Way</div>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-[#0F1E24]/95 border border-cyan-500/20 text-xs text-left sm:text-right">
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Estimated Transit
                    </div>
                    <div className="font-mono font-bold text-cyan-300 tabular-nums">
                      4 MIN ({activeJob.distanceKm} KM)
                    </div>
                  </div>
                </div>

                {/* SVG Route Arc */}
                <svg className="relative z-10 w-full h-16" viewBox="0 0 600 80" preserveAspectRatio="none">
                  <path
                    d="M 30 60 Q 260 40 570 22"
                    stroke="#22D3EE"
                    strokeWidth="3.5"
                    strokeDasharray="8 6"
                    fill="none"
                  />
                  <circle cx="30" cy="60" r="6" fill="#22D3EE" />
                  <circle cx="570" cy="22" r="8" fill="#E06236" stroke="#FFFFFF" strokeWidth="2.5" />
                </svg>

                <div className="relative z-10 flex items-center justify-between text-[11px]">
                  <span className="px-2.5 py-1 rounded bg-[#0F1E24] text-slate-300 font-semibold border border-slate-700">
                    Start: PW Depot, Yard 2
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#E06236] text-white font-bold">
                    Target: {activeJob.refCode}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F4F7F9] border border-slate-200">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">
                      Officer Proximity: Within 35m of Site
                    </div>
                    <div className="text-slate-600">
                      Hardware GPS locked. Geofence condition fulfilled.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onCheckIn(activeJob.id)}
                  className={`px-5 py-2.5 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 ${
                    activeJob.checkedIn
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0F1E24] hover:bg-[#162B33] text-cyan-300'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>{activeJob.checkedIn ? 'Checked In on Site ✓' : 'Arrived on Site / Check-In'}</span>
                </button>
              </div>
            </div>

            {/* Live Job Completion & Resolution Studio */}
            <form
              onSubmit={handleSubmitResolution}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1A1D1A]">
                    Live Job Completion &amp; Resolution Studio
                  </h2>
                  <p className="text-xs text-[#4A5568]">
                    Document intervention, material log, and upload signed closeout proof
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-[#F3F4EF] font-mono text-xs font-bold text-[#132E20]">
                  JOB REF: {activeJob.refCode}
                </span>
              </div>

              {/* Before & After Photographic Evidence */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#1A1D1A]">
                    Photographic Evidence (Before &amp; After Patching)
                  </span>
                  <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Auto-EXIF Geotag Verification On
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stage 01: Before */}
                  <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-[#F4F7F9]">
                    <div className="relative h-44 bg-[#132E20]">
                      <SafeImage
                        src={activeJob.beforePhotoUrl}
                        alt="Before Work Site"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#0A1419]/90 text-white text-[10px] font-bold">
                        STAGE 01: BEFORE WORK
                      </span>
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-[#0A1419]/90 text-cyan-300 font-mono text-[10px]">
                        LAT {activeJob.lat}
                      </span>
                    </div>
                    <div className="px-3 py-2 flex items-center justify-between text-[11px]">
                      <span className="text-[#4A5568]">Initial citizen submission</span>
                      <span className="font-bold text-[#E06236]">Verified by Citizen App</span>
                    </div>
                  </div>

                  {/* Stage 02: After */}
                  <label className="rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#E06236] overflow-hidden bg-[#F4F7F9] flex flex-col justify-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="sr-only"
                    />
                    {afterPhotoUrl ? (
                      <div className="relative h-full min-h-[210px]">
                        <img
                          src={afterPhotoUrl}
                          alt="Completed patch proof"
                          className="w-full h-44 object-cover"
                        />
                        <div className="px-3 py-2 flex items-center justify-between text-[11px] bg-emerald-50 text-emerald-800 font-bold">
                          <span>After Proof Attached</span>
                          <span>Click to replace</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 text-center space-y-2 min-h-[210px] flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#FFF4EE] text-[#E06236] flex items-center justify-center">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-[#1A1D1A]">
                          Upload Completed Patch Proof
                        </div>
                        <p className="text-[11px] text-[#4A5568]">
                          Snap or drop high-res image. Geofence checks location &amp; timestamp automatically.
                        </p>
                        <span className="px-2.5 py-0.5 rounded bg-white border border-[#E2E8F0] text-[10px] font-mono font-bold text-[#132E20]">
                          STAMP: GPS ± 5m REQUIRED
                        </span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Materials & Resource Consumption Log */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-[#1A1D1A]">
                    Materials &amp; Resource Consumption Log
                  </h3>
                  <p className="text-[11px] text-[#4A5568]">
                    Declare all municipal raw ingredients and machinery units expended for inventory ledger
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="fd-tons" className="block text-[11px] font-semibold text-[#4A5568] mb-1">
                      Hot Asphalt Batch (Metric Tons)
                    </label>
                    <input
                      id="fd-tons"
                      type="number"
                      step="0.1"
                      value={asphaltTons}
                      onChange={(e) => setAsphaltTons(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-sm font-mono font-bold text-[#1A1D1A]"
                    />
                  </div>
                  <div>
                    <label htmlFor="fd-hrs" className="block text-[11px] font-semibold text-[#4A5568] mb-1">
                      Crew Field Hours Logged
                    </label>
                    <input
                      id="fd-hrs"
                      type="number"
                      step="0.5"
                      value={crewHours}
                      onChange={(e) => setCrewHours(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-sm font-mono font-bold text-[#1A1D1A]"
                    />
                  </div>
                  <div>
                    <label htmlFor="fd-equip" className="block text-[11px] font-semibold text-[#4A5568] mb-1">
                      Equipment Deployed
                    </label>
                    <select
                      id="fd-equip"
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs font-semibold text-[#1A1D1A]"
                    >
                      <option>Caterpillar Vibratory Roller</option>
                      <option>Vacuum Hydro-Jet Desilter</option>
                      <option>Boom Bucket Aerial Lift</option>
                      <option>AKSEPB Compactor Unit</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Field Supervisor Closeout Notes */}
              <div className="space-y-1.5">
                <label htmlFor="fd-notes" className="block text-xs font-bold text-[#1A1D1A]">
                  Field Supervisor Closeout Notes &amp; Quality Assurance
                </label>
                <textarea
                  id="fd-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] p-3 text-xs text-[#1A1D1A] focus:bg-white focus:border-[#132E20] focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2 text-[11px] text-[#4A5568]">
                  <SafeImage
                    src={officerAvatar}
                    alt={officerName}
                    className="w-5 h-5 rounded-full object-cover border border-slate-300 shrink-0"
                  />
                  <span>Signed digitally by {officerName} ({officerServiceId})</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    onNotify(
                      `Requested heavy equipment re-routing backup for ${activeJob.refCode}.`
                    )
                  }
                  className="py-3 px-4 rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] hover:bg-[#EDEEE9] text-xs font-bold text-[#1A1D1A] inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wrench className="w-4 h-4 text-[#4A5568]" />
                  <span>Request Specialized Equipment</span>
                </button>
                <button
                  type="submit"
                  className="py-3 px-4 rounded-xl bg-[#D35400] hover:bg-[#b84900] text-white text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Submit Resolution Evidence for Verification</span>
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
};
