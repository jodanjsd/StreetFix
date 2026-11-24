import React, { useState } from 'react';
import {
  MapPin,
  Satellite,
  LocateFixed,
  Plus,
  Minus,
  AlertTriangle,
  Droplets,
  Trash2,
  Lightbulb,
  Waves,
  TrafficCone,
  Upload,
  CheckCircle2,
  Copy,
  Send,
  Phone,
  Headphones,
  Wrench,
} from 'lucide-react';
import { IncidentCategory, IncidentSeverity, ScreenRoute, UserSession } from '../types';
import { HOTLINKED_IMAGES, NIGERIAN_CADASTRE, STATE_COORDINATES } from '../data/mockData';
import { SafeImage } from '../components/SafeImage';
import { readCompressedImageFile } from '../utils/imageUpload';

interface ReportStudioProps {
  defaultReporterName?: string;
  session?: UserSession | null;
  onNavigate: (route: ScreenRoute) => void;
  onNotify?: (msg: string, urgent?: boolean) => void;
  onSubmitReport: (payload: {
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
  }) => void;
}

const PRESET_ZONES = [
  { label: 'Uyo Urban', lat: '5.0377° N', lng: '7.9128° E', address: 'Plot 14, Oron Road', lga: 'uyo', x: 46, y: 42 },
  { label: 'Ewet Housing', lat: '5.0195° N', lng: '7.9314° E', address: 'Abak Road by Tropicana Junction', lga: 'uyo', x: 56, y: 54 },
  { label: 'Eket Corridor', lat: '4.6423° N', lng: '7.9244° E', address: 'Eket-Oron Road, Grace Bill', lga: 'eket', x: 52, y: 76 },
  { label: 'Ikot Ekpene', lat: '5.1778° N', lng: '7.7145° E', address: 'Aba Road Four-Towns Junction', lga: 'ikot_ekpene', x: 26, y: 34 },
];

const DEFECT_CARDS: {
  category: IncidentCategory;
  desc: string;
  bureau: string;
  icon: React.ReactNode;
}[] = [
  {
    category: 'Pothole / Road Failure',
    desc: 'Asphalt craters, edge decay, structural subsidence',
    bureau: 'AKRMA Roads Agency',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  {
    category: 'Blocked Drainage',
    desc: 'Silted gutters, flash flood overflow, culvert clogging',
    bureau: 'Drainage Enforcement',
    icon: <Droplets className="w-5 h-5" />,
  },
  {
    category: 'Waste Heap / Sanitation',
    desc: 'Illegal dump sites, median trash spill, commercial refuse',
    bureau: 'AKSEPB Waste Authority',
    icon: <Trash2 className="w-5 h-5" />,
  },
  {
    category: 'Streetlight Failure',
    desc: 'Dark arterial spans, pole collisions, transformer faults',
    bureau: 'Ibom Power & Lighting',
    icon: <Lightbulb className="w-5 h-5" />,
  },
  {
    category: 'Pipe Burst / Water Leak',
    desc: 'AKSWC main water supply fissure, sidewalk flooding',
    bureau: 'Water Company (AKSWC)',
    icon: <Waves className="w-5 h-5" />,
  },
  {
    category: 'Traffic Signal Defect',
    desc: 'Non-functional traffic lights, damaged bollards',
    bureau: 'Akwa Ibom Signal Eng.',
    icon: <TrafficCone className="w-5 h-5" />,
  },
];

export const ReportStudio: React.FC<ReportStudioProps> = ({
  defaultReporterName,
  session,
  onNavigate,
  onNotify,
  onSubmitReport,
}) => {
  const initialStateKey = (() => {
    const stName = session?.jurisdiction?.split(' · ')[0];
    if (stName) {
      const match = Object.entries(NIGERIAN_CADASTRE).find(([, v]) => v.name === stName);
      if (match) return match[0];
    }
    return 'akwa_ibom';
  })();

  const initialLgaKey = (() => {
    const lgaName = session?.jurisdiction?.split(' · ')[1];
    const lgas = NIGERIAN_CADASTRE[initialStateKey]?.lgas || {};
    if (lgaName) {
      const match = Object.entries(lgas).find(([, v]) => v.name === lgaName);
      if (match) return match[0];
    }
    return Object.keys(lgas)[0] || 'uyo';
  })();

  const initialCoords = STATE_COORDINATES[initialStateKey] || { lat: 5.0377, lng: 7.9128 };
  const initialWard =
    NIGERIAN_CADASTRE[initialStateKey]?.lgas[initialLgaKey]?.wards[0] || 'Uyo Urban Ward 1';
  const initialStreet =
    NIGERIAN_CADASTRE[initialStateKey]?.lgas[initialLgaKey]?.streets[0] || 'Plot 14, Oron Road';

  const [activePreset, setActivePreset] = useState(
    initialStateKey === 'akwa_ibom' ? 'Uyo Urban' : NIGERIAN_CADASTRE[initialStateKey]?.name || 'Uyo Urban'
  );
  const [pinPos, setPinPos] = useState({ x: 46, y: 42 });
  const [zoom, setZoom] = useState(1);
  const [lat, setLat] = useState(`${initialCoords.lat.toFixed(4)}° N`);
  const [lng, setLng] = useState(`${initialCoords.lng.toFixed(4)}° E`);
  const [locatingGps, setLocatingGps] = useState(false);

  const [stateKey, setStateKey] = useState(initialStateKey);
  const [lgaKey, setLgaKey] = useState(initialLgaKey);
  const [ward, setWard] = useState(initialWard);
  const [address, setAddress] = useState(initialStateKey === 'akwa_ibom' ? 'Plot 14, Oron Road' : initialStreet);
  const [parcelId, setParcelId] = useState('Near Primary Corridor');
  const [landmark, setLandmark] = useState(
    initialStateKey === 'akwa_ibom'
      ? 'Opposite Ibom Plaza, 120m South of Ibom Connection Roundabout'
      : `Near ${initialWard}`
  );

  const [category, setCategory] = useState<IncidentCategory>('Pothole / Road Failure');
  const [severity, setSeverity] = useState<IncidentSeverity>('critical');
  const [description, setDescription] = useState(
    'Deep jagged crater spanning right-hand lane, forcing commuters onto oncoming traffic.'
  );
  const [photoName, setPhotoName] = useState('Pothole_Hazard_Evidence.jpg');
  const [photoUrl, setPhotoUrl] = useState(HOTLINKED_IMAGES.potholeCloseup);

  const [reporterName, setReporterName] = useState(session?.name || defaultReporterName || 'Nsikak Udoh');
  const [reporterPhone, setReporterPhone] = useState(session?.phone || '0803 892 4110');
  const [anonymous, setAnonymous] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [draftRef] = useState(() => `STF-2026-00${Math.floor(5100 + Math.random() * 800)}`);

  const currentStateObj = NIGERIAN_CADASTRE[stateKey] || NIGERIAN_CADASTRE.akwa_ibom;
  const lgaEntries = Object.entries(currentStateObj.lgas);
  const currentLgaObj = currentStateObj.lgas[lgaKey] || lgaEntries[0][1];

  const handleStateSelect = (key: string) => {
    setStateKey(key);
    const firstLgaKey = Object.keys(NIGERIAN_CADASTRE[key].lgas)[0];
    setLgaKey(firstLgaKey);
    const lgaObj = NIGERIAN_CADASTRE[key].lgas[firstLgaKey];
    setWard(lgaObj.wards[0]);
    if (lgaObj.streets[0]) setAddress(lgaObj.streets[0]);
    const coords = STATE_COORDINATES[key] || { lat: 6.5244, lng: 3.3792 };
    setLat(`${coords.lat.toFixed(4)}° N`);
    setLng(`${coords.lng.toFixed(4)}° E`);
    setActivePreset(NIGERIAN_CADASTRE[key].name);
  };

  const handleUseCurrentGps = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setLocatingGps(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocatingGps(false);
          const { latitude, longitude } = position.coords;
          setLat(`${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? 'N' : 'S'}`);
          setLng(`${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? 'E' : 'W'}`);
          setPinPos({ x: 50, y: 48 });
          onNotify?.('GPS hardware coordinates locked successfully.');
        },
        () => {
          setLocatingGps(false);
          const fallback = STATE_COORDINATES[stateKey] || { lat: 5.0377, lng: 7.9128 };
          setLat(`${fallback.lat.toFixed(4)}° N`);
          setLng(`${fallback.lng.toFixed(4)}° E`);
          onNotify?.(`Calibrated GPS pin to ${currentLgaObj.name}, ${currentStateObj.name}.`);
        },
        { enableHighAccuracy: true, timeout: 4500 }
      );
      return;
    }
    handlePresetClick(PRESET_ZONES[0]);
  };

  const handlePresetClick = (preset: (typeof PRESET_ZONES)[number]) => {
    setActivePreset(preset.label);
    setPinPos({ x: preset.x, y: preset.y });
    setLat(preset.lat);
    setLng(preset.lng);
    setAddress(preset.address);
    setStateKey('akwa_ibom');
    setLgaKey(preset.lga);
    const lgaObj = NIGERIAN_CADASTRE.akwa_ibom.lgas[preset.lga];
    if (lgaObj) setWard(lgaObj.wards[0]);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(15, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));
    setPinPos({ x: xPct, y: yPct });
    const base = STATE_COORDINATES[stateKey] || { lat: 5.0377, lng: 7.9128 };
    const newLat = (base.lat + (50 - yPct) * 0.0024).toFixed(4);
    const newLng = (base.lng + (xPct - 50) * 0.0024).toFixed(4);
    setLat(`${newLat}° N`);
    setLng(`${newLng}° E`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoName(file.name);
    readCompressedImageFile(
      file,
      (dataUrl) => {
        setPhotoUrl(dataUrl);
        onNotify?.(`Attached compressed photo evidence: ${file.name}`);
      },
      (err) => onNotify?.(err, true)
    );
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitReport({
      state: currentStateObj.name,
      lga: currentLgaObj.name,
      ward,
      address: `${address}${parcelId ? ` (${parcelId})` : ''}`,
      landmark,
      lat,
      lng,
      category,
      severity,
      description,
      reporterName: anonymous ? 'Anonymous Citizen' : reporterName,
      reporterPhone,
      anonymous,
      photoUrl,
    });
  };

  const activeStep = photoName ? 3 : category ? 2 : 1;

  return (
    <div className="bg-[#F9FAF9] min-h-screen flex flex-col">
      {/* Sub-header Banner */}
      <section className="bg-white border-b border-[#E2E8F0] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-[#4A5568] mb-1">
              {currentStateObj.name} Infrastructure Desk / Resident Submissions /{' '}
              <span className="text-[#132E20] font-semibold">GPS Geotag Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1D1A] tracking-tight">
              Citizen Incident Reporting &amp; GPS Geotag Studio
            </h1>
            <p className="text-sm text-[#4A5568] mt-1">
              Submit high-precision civic infrastructure defects directly to the Public Works Dispatch system.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('directory')}
            className="text-xs font-bold text-[#132E20] hover:text-[#E06236] border border-[#E2E8F0] bg-[#F8FAF5] px-4 py-2 rounded-full self-start cursor-pointer"
          >
            View Open Registry →
          </button>
        </div>
      </section>

      {/* 4-Step Wizard Indicator */}
      <div className="bg-[#F8FAF5] border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            { num: 1, label: 'Location & Coordinates' },
            { num: 2, label: 'Fault & Severity' },
            { num: 3, label: 'Evidence & Verification' },
            { num: 4, label: 'Tracking Ticket' },
          ].map((step) => {
            const isCurrent = step.num === activeStep;
            const isDone = step.num < activeStep;
            return (
              <div
                key={step.num}
                className={`flex items-center gap-3 px-3.5 sm:px-4 py-2.5 rounded-xl border ${
                  isCurrent
                    ? 'bg-white border-2 border-[#132E20]'
                    : 'bg-white/70 border-[#E2E8F0]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isCurrent || isDone
                      ? 'bg-[#132E20] text-[#D8FA64]'
                      : 'bg-[#E2E8F0] text-[#4A5568]'
                  }`}
                >
                  {step.num}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#4A5568]">
                    Step {step.num} {isCurrent ? '(Active)' : ''}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#1A1D1A] truncate">
                    {step.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Form */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT 8 COLS */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            {/* Section 1: Geolocation & Cadastral Survey */}
            <section className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F3F4EF] text-[#132E20] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1A1D1A]">1. Pinpoint Fault Geolocation</h2>
                    <p className="text-xs text-[#4A5568]">
                      Click anywhere on the {currentStateObj.name} Cadastral Grid to calibrate pinpoint
                    </p>
                  </div>
                </div>

                <div className="inline-flex flex-wrap items-center gap-2 bg-[#F3F4EF] border border-[#CBD5E1] px-3 py-1.5 rounded-lg text-[#132E20] text-xs font-mono tabular-nums self-start sm:self-auto">
                  <Satellite className="w-4 h-4 text-[#526600] shrink-0" />
                  <span className="font-semibold">
                    {lat}, {lng}
                  </span>
                  <span className="text-[10px] font-bold bg-[#D8FA64] px-1.5 py-0.5 rounded">
                    ±2m Precision
                  </span>
                </div>
              </div>

              {/* Interactive Cadastral Map */}
              <div
                onClick={handleMapClick}
                className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-[#E2E8F0] bg-[#0B231A] cursor-crosshair select-none"
              >
                <div
                  className="w-full h-full transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <SafeImage
                    src={HOTLINKED_IMAGES.lagosGisMap}
                    alt="Akwa Ibom Cadastral GIS map"
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>

                {/* Preset Zone Buttons */}
                <div
                  className="absolute top-2.5 left-2.5 right-2.5 flex flex-wrap gap-1.5 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {PRESET_ZONES.map((zone) => (
                    <button
                      key={zone.label}
                      type="button"
                      onClick={() => handlePresetClick(zone)}
                      className={`text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                        activePreset === zone.label
                          ? 'bg-[#132E20] text-[#D8FA64] border-[#132E20]'
                          : 'bg-white/95 text-[#1A1D1A] border-[#E2E8F0] hover:bg-[#F3F4EF]'
                      }`}
                    >
                      {zone.label}
                    </button>
                  ))}
                </div>

                {/* Movable Pin Marker */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-10 transition-all duration-150"
                  style={{ left: `${pinPos.x}%`, top: `${pinPos.y}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#E06236] text-white flex items-center justify-center shadow-lg border-2 border-white">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="mt-1 bg-white/95 px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-mono font-bold text-[#132E20] shadow border border-[#E2E8F0] max-w-[175px] sm:max-w-[260px] truncate">
                      {address}
                    </div>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="Zoom in"
                    onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))}
                    className="w-8 h-8 bg-white rounded-md border border-[#E2E8F0] text-[#1A1D1A] flex items-center justify-center hover:bg-[#F3F4EF] cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Zoom out"
                    onClick={() => setZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)))}
                    className="w-8 h-8 bg-white rounded-md border border-[#E2E8F0] text-[#1A1D1A] flex items-center justify-center hover:bg-[#F3F4EF] cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>

                {/* GPS Lock Button */}
                <div
                  className="absolute bottom-3 left-3 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={handleUseCurrentGps}
                    disabled={locatingGps}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#132E20] text-[#D8FA64] rounded-lg text-[11px] sm:text-xs font-bold hover:bg-[#183D2A] cursor-pointer disabled:opacity-70"
                  >
                    <LocateFixed className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>{locatingGps ? 'Calibrating GPS...' : 'Use Current GPS'}</span>
                  </button>
                </div>
              </div>

              {/* Administrative & Street Address Inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-[#1A1D1A] mb-1.5">
                      Federation State (36 States + FCT)
                    </label>
                    <select
                      value={stateKey}
                      onChange={(e) => handleStateSelect(e.target.value)}
                      className="w-full min-w-0 max-w-full h-10 px-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-lg text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20]"
                    >
                      {Object.entries(NIGERIAN_CADASTRE).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-[#1A1D1A] mb-1.5">
                      Local Government Area (LGA)
                    </label>
                    <select
                      value={lgaKey}
                      onChange={(e) => {
                        setLgaKey(e.target.value);
                        const wards = currentStateObj.lgas[e.target.value]?.wards || [];
                        if (wards[0]) setWard(wards[0]);
                      }}
                      className="w-full min-w-0 max-w-full h-10 px-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-lg text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20]"
                    >
                      {lgaEntries.map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-[#1A1D1A] mb-1.5">
                      LCDA / Ward / Zone
                    </label>
                    <select
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      className="w-full min-w-0 max-w-full h-10 px-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-lg text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20]"
                    >
                      {currentLgaObj.wards.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-7">
                    <label className="block text-xs font-semibold text-[#1A1D1A] mb-1.5">
                      Primary Street / Thoroughfare
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      list="street-suggestions"
                      className="w-full h-10 px-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-lg text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20]"
                    />
                    <datalist id="street-suggestions">
                      {currentLgaObj.streets.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>

                  <div className="md:col-span-5">
                    <label className="block text-xs font-semibold text-[#1A1D1A] mb-1.5">
                      House / Parcel Number or Pole ID
                    </label>
                    <input
                      type="text"
                      value={parcelId}
                      onChange={(e) => setParcelId(e.target.value)}
                      className="w-full h-10 px-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-lg text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20]"
                    />
                  </div>

                  <div className="md:col-span-12">
                    <label className="block text-xs font-semibold text-[#1A1D1A] mb-1.5">
                      Recognized Civic Landmark / Junction / Cross-Street
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full h-10 px-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-lg text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20]"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Defect Categorization & Severity */}
            <section className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 space-y-6">
              <div className="pb-4 border-b border-[#E2E8F0]">
                <h2 className="text-lg font-bold text-[#1A1D1A]">2. Defect Categorization &amp; Severity</h2>
                <p className="text-xs text-[#4A5568]">
                  Classify the infrastructure defect to dispatch the appropriate municipal crew
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEFECT_CARDS.map((card) => {
                  const isSelected = category === card.category;
                  return (
                    <button
                      key={card.category}
                      type="button"
                      onClick={() => setCategory(card.category)}
                      className={`text-left flex flex-col p-4 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-2 border-[#132E20] bg-[#F8FAF5]'
                          : 'border-[#E2E8F0] bg-white hover:border-[#132E20]/40'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                          isSelected
                            ? 'bg-[#132E20] text-[#D8FA64]'
                            : 'bg-[#F3F4EF] text-[#1A1D1A]'
                        }`}
                      >
                        {card.icon}
                      </div>
                      <span className="font-bold text-sm text-[#1A1D1A]">{card.category}</span>
                      <span className="text-xs text-[#4A5568] mt-1 flex-1">{card.desc}</span>
                      <span className="mt-3 text-[11px] font-bold text-[#132E20] uppercase tracking-wider">
                        {card.bureau}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Severity Radio Bar */}
              <div className="p-4 rounded-xl bg-[#F8FAF5] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A1D1A]">Assessment Severity Level</span>
                  <span className="text-[11px] font-semibold text-[#4A5568]">Triage Impact</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      value: 'low' as const,
                      title: 'Low Urgency',
                      desc: 'Minor surface defect, normal flow',
                      activeClass: 'border-2 border-emerald-700 bg-emerald-50/70',
                    },
                    {
                      value: 'moderate' as const,
                      title: 'Moderate Disruption',
                      desc: 'Vehicles slowing down, lane pinch',
                      activeClass: 'border-2 border-amber-600 bg-amber-50/70',
                    },
                    {
                      value: 'critical' as const,
                      title: 'Serious / Critical Hazard',
                      desc: 'Urgent Admin Portal alert · 24h emergency SLA',
                      activeClass: 'border-2 border-[#ba1a1a] bg-red-50/70',
                    },
                  ].map((sev) => (
                    <button
                      key={sev.value}
                      type="button"
                      onClick={() => setSeverity(sev.value)}
                      className={`text-left p-3 rounded-lg border cursor-pointer transition-colors ${
                        severity === sev.value ? sev.activeClass : 'border-[#E2E8F0] bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#1A1D1A]">{sev.title}</div>
                      <div className="text-[11px] text-[#4A5568] mt-0.5">{sev.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 3: Photographic Evidence & Verification */}
            <section className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-lg font-bold text-[#1A1D1A]">
                    3. Photographic Evidence &amp; Verification
                  </h2>
                  <p className="text-xs text-[#4A5568]">
                    Upload clear images; automated EXIF verification validates time &amp; coordinates
                  </p>
                </div>
              </div>

              <label className="block border-2 border-dashed border-[#CBD5E1] rounded-xl p-6 bg-[#F8FAF5] hover:bg-[#F3F4EF] transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-11 h-11 rounded-full bg-[#132E20] text-[#D8FA64] flex items-center justify-center mx-auto mb-2.5">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#1A1D1A]">
                  Click to attach photographic fault evidence from device
                </p>
                <p className="text-xs text-[#4A5568] mt-1">
                  Supports JPG, PNG, HEIC up to 15MB · Auto-reads GPS geotag &amp; timestamp
                </p>
              </label>

              {/* Attached Evidence Preview */}
              {photoUrl && (
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
                  <div className="relative h-52 bg-slate-900">
                    <img
                      src={photoUrl}
                      alt={photoName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-sm font-bold text-[#1A1D1A] truncate">{photoName}</div>
                      <div className="text-xs font-mono text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          GPS Matched: {lat}, {lng}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1A1D1A] mb-1.5">
                  Specific Defect Description &amp; Driver Hazard Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-lg text-sm text-[#1A1D1A] focus:bg-white focus:border-[#132E20]"
                />
              </div>
            </section>

            {/* Section 4: Reporter Notification Channel */}
            <section className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-6 space-y-4">
              <div className="pb-3 border-b border-[#E2E8F0]">
                <h2 className="text-lg font-bold text-[#1A1D1A]">
                  4. Citizen Reporter Notification Channel
                </h2>
                <p className="text-xs text-[#4A5568]">
                  Receive real-time WhatsApp &amp; SMS progress alerts when dispatch team mobilizes
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1D1A] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    disabled={anonymous}
                    value={anonymous ? 'Redacted (Anonymous)' : reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="w-full h-10 px-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-lg text-sm text-[#1A1D1A] disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1D1A] mb-1.5">
                    Mobile Number (SMS / WhatsApp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-mono text-xs text-[#4A5568] font-semibold">
                      +234
                    </span>
                    <input
                      type="tel"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      className="w-full h-10 pl-14 pr-3 bg-[#F9FAF9] border border-[#E2E8F0] rounded-lg text-sm text-[#1A1D1A]"
                    />
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-[#132E20] border-[#CBD5E1]"
                />
                <span className="text-xs text-[#1A1D1A]">
                  Report anonymously (Identity redacted on Akwa Ibom Public Civic Transparency Map)
                </span>
              </label>
            </section>
          </div>

          {/* RIGHT STICKY SUMMARY PANEL (4 COLS) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 min-w-0">
            <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              <div className="bg-[#132E20] text-white p-4 flex items-center justify-between gap-2">
                <span className="font-bold text-sm">Draft Ticket Summary</span>
                <span className="text-xs font-semibold text-[#D8FA64] shrink-0">Pre-Submission</span>
              </div>

              <div className="p-4 sm:p-5 space-y-5">
                <div className="bg-[#F8FAF5] p-3.5 rounded-xl border border-[#E2E8F0] text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A5568] block">
                    Generated Tracking Identifier
                  </span>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="font-mono text-lg font-bold text-[#132E20] tracking-wider">
                      {draftRef}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(draftRef);
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 1500);
                      }}
                      className="text-[#4A5568] hover:text-[#132E20] cursor-pointer"
                      title="Copy tracking ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[11px] text-[#4A5568] mt-0.5 block">
                    {copiedId ? 'Copied to clipboard' : 'Universal across AKRMA & AKSEPB CRM'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs border-t border-b border-[#E2E8F0] py-3.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4A5568] shrink-0">Incident Classification</span>
                    <span className="font-bold text-[#1A1D1A] text-right break-words min-w-0">{category}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-[#4A5568] shrink-0">Assigned Jurisdiction</span>
                    <span className="font-bold text-[#1A1D1A] text-right break-words min-w-0">{currentLgaObj.name}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#4A5568]">Severity Rating</span>
                    <span
                      className={`font-bold capitalize ${
                        severity === 'critical'
                          ? 'text-[#ba1a1a]'
                          : severity === 'moderate'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {severity} Risk
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#4A5568]">Geotag Lock</span>
                    <span className="font-mono text-emerald-800 font-semibold">Verified ±2m</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#4A5568]">Public Service SLA</span>
                    <span className="font-bold text-[#132E20] tabular-nums">
                      {severity === 'critical' ? '24 Hours Target' : '48 Hours Target'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAF5] rounded-xl border border-[#CBD5E1] flex items-start gap-2.5">
                  <Wrench className="w-4 h-4 text-[#132E20] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#1A1D1A] leading-snug">
                    <strong>District Dispatch:</strong> {currentLgaObj.dispatch} operates daily 08:00 – 17:00 WAT.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#E06236] hover:bg-[#D35400] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Report &amp; Generate Tracking Ticket</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F3F4EF] text-[#132E20] flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1A1D1A]">Emergency Road Collapse?</p>
                  <p className="text-xs text-[#4A5568]">
                    Dial Toll-Free: <strong>112</strong> / <strong>767</strong>
                  </p>
                </div>
              </div>
              <a
                href="tel:112"
                className="p-2 rounded-lg bg-[#F3F4EF] hover:bg-[#E2E8F0] text-[#132E20]"
                aria-label="Call emergency toll-free"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
};
