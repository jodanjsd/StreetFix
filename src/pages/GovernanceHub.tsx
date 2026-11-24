import React, { useState } from 'react';
import {
  Users,
  Building2,
  ShieldCheck,
  Download,
  UserPlus,
  Search,
  Lock,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Incident, ScreenRoute, StaffMember, UserSession } from '../types';
import { DEPARTMENT_QUOTAS, NIGERIAN_CADASTRE } from '../data/mockData';
import { SafeImage } from '../components/SafeImage';

interface GovernanceHubProps {
  incidents: Incident[];
  staff: StaffMember[];
  session?: UserSession | null;
  residentCount?: number;
  isStreetFixOffice?: boolean;
  onAddStaff: (member: Omit<StaffMember, 'id'>) => void;
  onToggleStaffStatus: (id: string) => void;
  onNavigate: (route: ScreenRoute) => void;
  onNotify: (msg: string) => void;
}

export const GovernanceHub: React.FC<GovernanceHubProps> = ({
  staff,
  session = null,
  residentCount = 0,
  isStreetFixOffice = false,
  onAddStaff,
  onToggleStaffStatus,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'departments' | 'rbac' | 'audit'>('staff');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Accounts');
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Invite form state
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('Field Engineer');
  const [newDepartment, setNewDepartment] = useState('Akwa Ibom Roads (AKRMA)');
  const [newRoleLevel, setNewRoleLevel] = useState<StaffMember['roleLevel']>('FIELD SQUAD LEAD');
  const [inviteStateKey, setInviteStateKey] = useState('akwa_ibom');
  const [inviteLgaKey, setInviteLgaKey] = useState('uyo');

  const selectedInviteState = NIGERIAN_CADASTRE[inviteStateKey] || NIGERIAN_CADASTRE.akwa_ibom;
  const inviteLgaEntries = Object.entries(selectedInviteState.lgas);

  // Exclude the Office of StreetFix (HQ) root backend authority from regular municipal officer rosters
  const municipalOfficers = staff.filter((s) => !s.isStreetFixOffice && s.id !== 'st-hq');

  const isSelfOfficer = (member: StaffMember) =>
    Boolean(
      session?.serviceId &&
        member.serviceId.toLowerCase() === session.serviceId.toLowerCase()
    );

  const uniqueDepts = Array.from(new Set(municipalOfficers.map((s) => s.department)));

  const filteredStaff = municipalOfficers.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.serviceId.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.lgaJurisdiction.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'All Roles' || s.roleLevel === roleFilter;
    const matchesDept = deptFilter === 'All Departments' || s.department === deptFilter;
    const matchesStatus =
      statusFilter === 'All Accounts' ||
      (statusFilter === 'Active Accounts' && s.status === 'Active') ||
      (statusFilter === 'Suspended' && s.status === 'Suspended');
    return matchesQ && matchesRole && matchesDept && matchesStatus;
  });

  const handleExportAuditCsv = () => {
    const headers = ['ServiceID', 'Name', 'Title', 'Department', 'RoleLevel', 'Jurisdiction', 'MFA', 'Status'];
    const rows = filteredStaff.map((s) => [
      s.serviceId,
      `"${s.name}"`,
      `"${s.title}"`,
      `"${s.department}"`,
      s.roleLevel,
      `"${s.lgaJurisdiction}"`,
      s.mfaMethod,
      s.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'streetfix_rbac_access_audit.csv';
    link.click();
    URL.revokeObjectURL(url);
    onNotify('Exported Municipal Personnel Access Audit CSV.');
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStreetFixOffice) {
      onNotify('Restricted: Only the Office of StreetFix (Website Backend) can register new admins.');
      setShowInviteModal(false);
      return;
    }
    if (!newName.trim()) return;
    const parts = newName.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : newName.trim().slice(0, 2).toUpperCase();
    const randomCode = Math.floor(1000 + Math.random() * 8999);
    const lgaLabel =
      inviteLgaKey === 'all'
        ? `Statewide (${selectedInviteState.name})`
        : `${selectedInviteState.lgas[inviteLgaKey]?.name || 'Uyo LGA'}, ${selectedInviteState.name}`;
    onAddStaff({
      initials,
      name: newName.trim(),
      serviceId: `#AKSG-WRK-${randomCode}`,
      title: newTitle.trim() || 'Field Officer',
      department: newDepartment,
      roleLevel: newRoleLevel,
      lgaJurisdiction: lgaLabel,
      mfaMethod: '2FA Active',
      lastTelemetry: 'Just invited',
      lastAction: 'Provisioned RBAC Clearance',
      status: 'Active',
    });
    setNewName('');
    setShowInviteModal(false);
  };

  const roleBadgeStyle = (role: StaffMember['roleLevel']) => {
    switch (role) {
      case 'FIELD SQUAD LEAD':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'TRIAGE OFFICER':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'AGENCY DIRECTOR':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'SUPER ADMIN':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="flex flex-col">
      {/* Tactical Module Header Banner */}
      <section className="bg-[#0F1E24] text-white border-b border-cyan-500/20 px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-cyan-400">
              Akwa Ibom State Ministry of Works · Identity &amp; Access Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Municipal Personnel &amp; Departmental Governance Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Manage administrative privileges, field engineering squads, agency access, and role-based clearance across all 31 LGAs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportAuditCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-700 bg-[#0A1419] hover:bg-slate-800 text-xs font-bold text-slate-100 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Access Audit (CSV)</span>
            </button>
            {isStreetFixOffice ? (
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#0A1419] text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Admin (Office)</span>
              </button>
            ) : (
              <span
                title="Only the Office of StreetFix (Website Backend) can register new admins"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-200 text-xs font-semibold whitespace-nowrap shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Admin Registration: StreetFix Office Only</span>
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* 4 KPI Strip (Computed Live) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#4A5568]">
              <span>Active Officer Accounts</span>
              <Users className="w-4 h-4 text-[#132E20]" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
              {municipalOfficers.filter((s) => s.status === 'Active').length} / {municipalOfficers.length}
            </div>
            <div className="text-[11px] text-[#4A5568]">
              {residentCount} Verified Residents · Municipal Admin Roster
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#4A5568]">
              <span>Registered Agencies</span>
              <Building2 className="w-4 h-4 text-[#132E20]" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
              {uniqueDepts.length} Depts
            </div>
            <div className="text-[11px] text-[#4A5568]">AKRMA, AKSEPB, AKSWC, IPOWER</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#4A5568]">
              <span>Active Field Leads</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
              {municipalOfficers.filter((s) => s.status === 'Active' && (s.roleLevel === 'FIELD SQUAD LEAD' || s.roleLevel === 'FIELD TECHNICIAN')).length} Field
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold">36 States + FCT · 774 LGAs</div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[#4A5568]">
              <span>Security &amp; MFA Coverage</span>
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-3xl font-extrabold text-[#1A1D1A] tabular-nums">
              {municipalOfficers.length > 0
                ? `${Math.round((municipalOfficers.filter((s) => Boolean(s.mfaMethod)).length / municipalOfficers.length) * 100)}%`
                : '100%'}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold">
              {municipalOfficers.filter((s) => s.status === 'Suspended').length} Suspended · MFA Enforced
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto border-b border-slate-200">
          {[
            { key: 'staff' as const, label: 'Municipal Staff & Users', badge: `${municipalOfficers.length} Listed` },
            { key: 'departments' as const, label: 'Departments & Maintenance Units' },
            { key: 'rbac' as const, label: 'Role Matrix / RBAC' },
            { key: 'audit' as const, label: 'Security Audit Log' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === tab.key
                  ? 'border-cyan-600 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-2 py-0.5 rounded bg-slate-200/70 text-[#0F1E24] text-[10px] font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left 8 Cols */}
          <section className="xl:col-span-8 space-y-4">
            {activeTab === 'staff' && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
                {/* Search + Filter Dropdowns */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#4A5568] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by staff name, AKSG Service ID, or assigned LGA..."
                      className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] pl-10 pr-4 py-2.5 text-xs text-[#1A1D1A] focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <select
                      aria-label="Filter by role clearance"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs font-medium text-[#1A1D1A]"
                    >
                      <option>All Roles</option>
                      <option>FIELD SQUAD LEAD</option>
                      <option>TRIAGE OFFICER</option>
                      <option>AGENCY DIRECTOR</option>
                      <option>SUPER ADMIN</option>
                      <option>FIELD TECHNICIAN</option>
                    </select>
                    <select
                      aria-label="Filter by department"
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs font-medium text-[#1A1D1A]"
                    >
                      <option>All Departments</option>
                      {uniqueDepts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter by account status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-lg border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs font-medium text-[#1A1D1A]"
                    >
                      <option>All Accounts</option>
                      <option>Active Accounts</option>
                      <option>Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Mobile Officer Cards */}
                <div className="md:hidden space-y-3">
                  {filteredStaff.map((s) => {
                    const isSelf = isSelfOfficer(s);
                    const canToggleStatus =
                      isStreetFixOffice && !isSelf && !s.isStreetFixOffice && s.id !== 'st-hq';
                    return (
                      <div
                        key={`mob-${s.id}`}
                        className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {s.avatarUrl ? (
                              <SafeImage
                                src={s.avatarUrl}
                                alt={s.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                              />
                            ) : (
                              <span className="w-10 h-10 rounded-full bg-[#E6F4EA] text-[#132E20] font-bold flex items-center justify-center shrink-0 text-xs">
                                {s.initials}
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-[#1A1D1A] truncate">
                                {s.name}
                              </div>
                              <div className="text-[11px] text-[#4A5568] font-mono truncate">
                                {s.serviceId} · {s.title}
                              </div>
                            </div>
                          </div>
                          {canToggleStatus ? (
                            <button
                              type="button"
                              onClick={() => onToggleStaffStatus(s.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer shrink-0 ${
                                s.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              {s.status}
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                                s.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              <Lock className="w-3 h-3 opacity-70" />
                              <span>{s.status}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-2 border-t border-[#E2E8F0]">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${roleBadgeStyle(
                              s.roleLevel
                            )}`}
                          >
                            {s.roleLevel}
                          </span>
                          <span className="text-[#4A5568] truncate">{s.department}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#4A5568]">
                          <span>{s.lgaJurisdiction}</span>
                          <span className="font-semibold text-emerald-700">{s.mfaMethod}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Staff Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[11px] font-bold uppercase text-[#4A5568]">
                        <th className="py-3 pr-3">Officer &amp; Service ID</th>
                        <th className="py-3 pr-3">Department</th>
                        <th className="py-3 pr-3">Role Level</th>
                        <th className="py-3 pr-3">Jurisdiction</th>
                        <th className="py-3 pr-3">Security (MFA)</th>
                        <th className="py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredStaff.map((s) => {
                        const isSelf = isSelfOfficer(s);
                        const canToggleStatus =
                          isStreetFixOffice && !isSelf && !s.isStreetFixOffice && s.id !== 'st-hq';
                        return (
                          <tr key={s.id} className="hover:bg-[#F4F7F9]">
                            <td className="py-3.5 pr-3">
                              <div className="flex items-center gap-3">
                                {s.avatarUrl ? (
                                  <SafeImage
                                    src={s.avatarUrl}
                                    alt={s.name}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-300 shrink-0"
                                  />
                                ) : (
                                  <span className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#132E20] font-bold flex items-center justify-center shrink-0">
                                    {s.initials}
                                  </span>
                                )}
                                <div>
                                  <div className="font-bold text-[#1A1D1A]">{s.name}</div>
                                  <div className="text-[11px] text-[#4A5568] font-mono">
                                    {s.serviceId} · {s.title}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 pr-3 font-medium text-[#1A1D1A]">{s.department}</td>
                            <td className="py-3.5 pr-3">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap ${roleBadgeStyle(
                                  s.roleLevel
                                )}`}
                              >
                                {s.roleLevel}
                              </span>
                            </td>
                            <td className="py-3.5 pr-3 text-[#4A5568]">{s.lgaJurisdiction}</td>
                            <td className="py-3.5 pr-3 font-semibold text-emerald-700 whitespace-nowrap">
                              {s.mfaMethod}
                            </td>
                            <td className="py-3.5 text-right whitespace-nowrap">
                              {canToggleStatus ? (
                                <button
                                  type="button"
                                  onClick={() => onToggleStaffStatus(s.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                    s.status === 'Active'
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                                  }`}
                                  title="Office Backend: Click to toggle Active / Suspended clearance"
                                >
                                  {s.status}
                                </button>
                              ) : (
                                <span
                                  title={
                                    isSelf
                                      ? 'Self-suspension or activation is prohibited'
                                      : 'Only Office of StreetFix (Website Backend) can alter clearance status'
                                  }
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                    s.status === 'Active'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-red-50 text-red-700'
                                  }`}
                                >
                                  <Lock className="w-3 h-3 opacity-70" />
                                  <span>{s.status}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'departments' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DEPARTMENT_QUOTAS.map((dq) => (
                  <div
                    key={dq.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1A1D1A]">{dq.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                        {dq.slaRate}
                      </span>
                    </div>
                    <div className="text-xs text-[#4A5568] flex items-center justify-between">
                      <span>Squads: {dq.activeSquads} Active</span>
                      <span>Personnel: {dq.staffCount}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${dq.utilizationPct}%`, backgroundColor: dq.barColor }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'rbac' && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-[#1A1D1A]">
                  Role-Based Access Control (RBAC) Enforcement Table
                </h2>
                <div className="space-y-2.5 text-xs">
                  {[
                    { cap: 'Register/Verify Account, Edit Own Profile, Submit & Confirm Reports', tier: 'Resident (Reporter)' },
                    { cap: 'Triage Reports, Dispatch Squads, Check In, Certify & Reopen Cases', tier: 'Admin + HQ' },
                    { cap: 'Post Official Engineer Replies & Broadcast Field Advisories', tier: 'Admin + HQ' },
                    { cap: 'Edit Own Important Admin Profile (Photo, Name, Email, Phone, Passcode)', tier: 'Admin (Self) + HQ' },
                    { cap: 'Register / Delete Admins, Edit ALL Admin Profile Parts & Clearance', tier: 'HQ (Office of StreetFix) Only' },
                    { cap: 'Modify Global SLA Policies, Moderate Residents & Purge Case Records', tier: 'HQ (Office of StreetFix) Only' },
                  ].map((r) => (
                    <div
                      key={r.cap}
                      className="p-3.5 rounded-xl bg-[#F4F7F9] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4"
                    >
                      <span className="font-semibold text-slate-900">{r.cap}</span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#0F1E24] text-cyan-300 font-bold text-[11px] shrink-0 self-start sm:self-auto">
                        {r.tier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 space-y-3">
                <h2 className="text-base font-bold text-[#1A1D1A]">
                  Recent Security &amp; Telemetry Audit Trail
                </h2>
                {municipalOfficers.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-[#F4F7F9] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#1A1D1A]">{s.name}</span>
                      <span className="text-[#4A5568]"> — {s.lastAction}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#4A5568] shrink-0">
                      {s.lastTelemetry}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right 4 Cols: Department Operational Quotas + RBAC Matrix */}
          <aside className="xl:col-span-4 space-y-6">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#1A1D1A]">Department Operational Quotas</h2>
                <span className="text-[11px] font-mono font-bold text-[#4A5568]">Q1 2026</span>
              </div>

              <div className="space-y-3">
                {DEPARTMENT_QUOTAS.map((dq) => (
                  <div
                    key={dq.id}
                    className="p-3.5 rounded-xl bg-[#F4F7F9] border border-[#E2E8F0] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1A1D1A]">{dq.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dq.slaStatus === 'healthy'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {dq.slaRate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#4A5568]">
                      <span>Squads: {dq.activeSquads} Active</span>
                      <span>Staff: {dq.staffCount}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#E2E8F0] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${dq.utilizationPct}%`, backgroundColor: dq.barColor }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#132E20]" />
                <h2 className="text-sm font-bold text-[#1A1D1A]">RBAC Permission Matrix</h2>
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Submit & Confirm Reports', role: 'Resident' },
                  { label: 'Dispatch, Certify & Reopen', role: 'Admin + HQ' },
                  { label: 'Edit Own Important Profile', role: 'Admin (Self)' },
                  { label: 'Register & Delete Admins', role: 'HQ Only' },
                  { label: 'Edit All Admin Fields & Policies', role: 'HQ Only' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-b-0"
                  >
                    <span className="text-[#4A5568] font-medium">{item.label}</span>
                    <span className="px-2 py-0.5 rounded bg-[#F3F4EF] text-[#132E20] font-bold text-[10px]">
                      {item.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Invite Officer Modal (Office of StreetFix Backend Only) */}
      {isStreetFixOffice && showInviteModal && (
        <div className="fixed inset-0 z-50 bg-[#0A1419]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleInviteSubmit}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h2 className="text-base font-bold text-[#1A1D1A]">
                Invite Municipal Officer / Admin
              </h2>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 rounded-lg hover:bg-[#F3F4EF] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label htmlFor="inv-name" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                Officer Full Name *
              </label>
              <input
                id="inv-name"
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Engr. Segun Ogunleye"
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] px-3.5 py-2 text-xs text-[#1A1D1A]"
              />
            </div>

            <div>
              <label htmlFor="inv-title" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                Title / Squad
              </label>
              <input
                id="inv-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] px-3.5 py-2 text-xs text-[#1A1D1A]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="inv-state" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                  State (36 States + FCT)
                </label>
                <select
                  id="inv-state"
                  value={inviteStateKey}
                  onChange={(e) => {
                    const nextState = e.target.value;
                    setInviteStateKey(nextState);
                    const firstLga = Object.keys(NIGERIAN_CADASTRE[nextState]?.lgas || {})[0] || 'all';
                    setInviteLgaKey(firstLga);
                  }}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs text-[#1A1D1A]"
                >
                  {Object.entries(NIGERIAN_CADASTRE).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="inv-lga" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                  Local Govt. Area (LGA)
                </label>
                <select
                  id="inv-lga"
                  value={inviteLgaKey}
                  onChange={(e) => setInviteLgaKey(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs text-[#1A1D1A]"
                >
                  <option value="all">All LGAs (Statewide)</option>
                  {inviteLgaEntries.map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="inv-dept" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                Department / Agency
              </label>
              <select
                id="inv-dept"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs text-[#1A1D1A]"
              >
                <option>Akwa Ibom Roads (AKRMA)</option>
                <option>Civic Operations Command</option>
                <option>AKSEPB Waste &amp; Drainage</option>
                <option>Akwa Ibom Water Co. (AKSWC)</option>
                <option>Ibom Power &amp; Lighting</option>
              </select>
            </div>

            <div>
              <label htmlFor="inv-role" className="block text-xs font-semibold text-[#1A1D1A] mb-1">
                RBAC Clearance Tier
              </label>
              <select
                id="inv-role"
                value={newRoleLevel}
                onChange={(e) => setNewRoleLevel(e.target.value as StaffMember['roleLevel'])}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F4F7F9] px-3 py-2 text-xs text-[#1A1D1A]"
              >
                <option value="FIELD SQUAD LEAD">FIELD SQUAD LEAD</option>
                <option value="TRIAGE OFFICER">TRIAGE OFFICER</option>
                <option value="AGENCY DIRECTOR">AGENCY DIRECTOR</option>
                <option value="FIELD TECHNICIAN">FIELD TECHNICIAN</option>
                <option value="SUPER ADMIN">SUPER ADMIN</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#4A5568] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0F1E24] hover:bg-[#162B33] text-cyan-300 text-xs font-bold cursor-pointer"
              >
                Provision Officer Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
