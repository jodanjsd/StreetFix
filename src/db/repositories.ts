import { desc, eq, notInArray } from 'drizzle-orm';
import { db } from './index.ts';
import {
  advisories,
  globalPolicies,
  incidents,
  notifications,
  residentAccounts,
  staffMembers,
} from './schema.ts';
import { getSupabaseAdmin } from './supabase.ts';

export type RoleLevel =
  | 'FIELD SQUAD LEAD'
  | 'TRIAGE OFFICER'
  | 'AGENCY DIRECTOR'
  | 'SUPER ADMIN'
  | 'FIELD TECHNICIAN';

export interface BackendStaffRecord {
  id: string;
  initials: string;
  avatarUrl?: string;
  name: string;
  serviceId: string;
  title: string;
  department: string;
  roleLevel: RoleLevel;
  lgaJurisdiction: string;
  mfaMethod: string;
  lastTelemetry: string;
  lastAction: string;
  status: 'Active' | 'Suspended' | 'Pending';
  email?: string;
  phone?: string;
  passcode: string;
  isStreetFixOffice: boolean;
  updatedAt?: string;
}

export interface BackendGlobalPolicies {
  exifStrict: boolean;
  autoRoutePotholes: boolean;
  autoEscalateSla: boolean;
  openLedger: boolean;
  slaTargetHours: '24' | '48' | '72';
}

export interface BackendResidentAccount {
  id: string;
  uid?: string | null;
  name: string;
  email: string;
  phone: string;
  password: string;
  state: string;
  lga: string;
  ward?: string;
  street?: string;
  plotNo?: string;
  landmark?: string;
  avatarUrl?: string;
  whatsappAlerts: boolean;
  verified: boolean;
  status?: 'Active' | 'Suspended';
  createdAt: string;
}

export interface BackendIncident {
  id: string;
  refCode: string;
  title: string;
  category: string;
  description: string;
  state: string;
  lga: string;
  ward: string;
  address: string;
  landmark: string;
  lat: string;
  lng: string;
  status: string;
  severity: string;
  reportedAt: string;
  slaRemainingHours: number;
  slaLabel: string;
  confirmations: number;
  reporterName: string;
  reporterVerified: boolean;
  reporterUid?: string | null;
  assignedUnit: string;
  assignedDepot: string;
  squadLead: string;
  beforePhotoUrl: string;
  progressPhotoUrl?: string;
  afterPhotoUrl?: string;
  exifVerified: boolean;
  distanceKm: number;
  comments: unknown[];
  checkedIn?: boolean;
  materialsAsphaltTons?: number;
  crewHours?: number;
  reporterPhone?: string;
  updatedAt?: string;
}

export interface BackendNotification {
  id: string;
  audience: 'resident' | 'admin';
  recipientName?: string;
  incidentId: string;
  refCode: string;
  severity: string;
  actionType: string;
  title: string;
  message: string;
  createdAt: string;
  timestampMs: number;
  read: boolean;
}

export interface BackendAdvisory {
  id: string;
  time: string;
  author: string;
  text: string;
}

export const DEFAULT_STAFF_DB: BackendStaffRecord[] = [
  {
    id: 'st-hq',
    initials: 'SF',
    name: 'Office of StreetFix (HQ)',
    serviceId: '#STF-HQ-0001',
    title: 'Website Backend Authority',
    department: 'StreetFix Head Office (Backend)',
    roleLevel: 'SUPER ADMIN',
    lgaJurisdiction: 'Nationwide (36 States + FCT)',
    mfaMethod: 'Hardware Root Key',
    lastTelemetry: 'Online Now',
    lastAction: 'Root Backend Governance Active',
    status: 'Active',
    email: 'office@streetfix.ng',
    phone: '+234 1 227 0000',
    passcode: 'OfficeBackend#2026',
    isStreetFixOffice: true,
  },
  {
    id: 'st-1',
    initials: 'IE',
    name: 'Engr. Iniobong Ekpo',
    serviceId: '#AKSG-WRK-4091',
    title: 'Squad 4 Lead',
    department: 'Akwa Ibom Roads (AKRMA)',
    roleLevel: 'FIELD SQUAD LEAD',
    lgaJurisdiction: 'Uyo & Itu',
    mfaMethod: '2FA Active',
    lastTelemetry: '5 mins ago',
    lastAction: 'Dispatched STF-2026-004892',
    status: 'Active',
    email: 'iniobong.ekpo@akrma.ak.gov.ng',
    phone: '+234 803 412 8890',
    passcode: 'AdminClearance#2026',
    isStreetFixOffice: false,
  },
  {
    id: 'st-2',
    initials: 'EU',
    name: 'Ekemini Udo',
    serviceId: '#AKSG-TRG-1024',
    title: 'Central Intake',
    department: 'Civic Operations Command',
    roleLevel: 'TRIAGE OFFICER',
    lgaJurisdiction: 'Statewide Central (31 LGAs)',
    mfaMethod: 'Hardware Key',
    lastTelemetry: '12 mins ago',
    lastAction: 'Triaged 14 Potholes',
    status: 'Active',
    email: 'ekemini.udo@streetfix.ng',
    phone: '+234 806 552 1904',
    passcode: 'AdminClearance#2026',
    isStreetFixOffice: false,
  },
  {
    id: 'st-3',
    initials: 'OB',
    name: 'Dr. Ubong Bassey',
    serviceId: '#AKSG-DIR-0012',
    title: 'Bureau Chief',
    department: 'AKSEPB Waste & Drainage',
    roleLevel: 'AGENCY DIRECTOR',
    lgaJurisdiction: 'Statewide (Sanitation)',
    mfaMethod: '2FA Active',
    lastTelemetry: '2 hours ago',
    lastAction: 'Approved Drainage Batch',
    status: 'Active',
    email: 'ubong.bassey@aksepb.ak.gov.ng',
    phone: '+234 802 918 3341',
    passcode: 'AdminClearance#2026',
    isStreetFixOffice: false,
  },
  {
    id: 'st-4',
    initials: 'AB',
    name: 'Aisha Bello',
    serviceId: '#AKSG-SEC-8821',
    title: 'Security Officer',
    department: 'Govt Cyber Operations Hub',
    roleLevel: 'SUPER ADMIN',
    lgaJurisdiction: 'All 31 LGAs (Root)',
    mfaMethod: 'YubiKey Enforced',
    lastTelemetry: 'Online Now',
    lastAction: 'IP: 102.89.44.12 (Uyo Hub)',
    status: 'Active',
    email: 'aisha.bello@aksg.gov.ng',
    phone: '+234 809 771 4400',
    passcode: 'AdminClearance#2026',
    isStreetFixOffice: false,
  },
  {
    id: 'st-5',
    initials: 'IA',
    name: 'Itoro Akpan',
    serviceId: '#AKSG-FLD-2241',
    title: 'Paving Specialist',
    department: 'Akwa Ibom Roads (AKRMA)',
    roleLevel: 'FIELD TECHNICIAN',
    lgaJurisdiction: 'Eket & Ikot Ekpene',
    mfaMethod: 'SMS OTP',
    lastTelemetry: '41 mins ago',
    lastAction: 'Logged Material Receipt',
    status: 'Active',
    email: 'itoro.akpan@akrma.ak.gov.ng',
    phone: '+234 805 339 7712',
    passcode: 'AdminClearance#2026',
    isStreetFixOffice: false,
  },
];

export const DEFAULT_GLOBAL_POLICIES: BackendGlobalPolicies = {
  exifStrict: true,
  autoRoutePotholes: true,
  autoEscalateSla: true,
  openLedger: true,
  slaTargetHours: '48',
};

export const DEFAULT_ADVISORIES: BackendAdvisory[] = [
  {
    id: 'b-1',
    time: 'Today · 08:15 WAT',
    author: 'Aisha Bello (#AKSG-SEC-8821)',
    text: 'All Drainage Rapid Units placed on convective rainfall alert across Uyo, Eket, and Oron corridors.',
  },
];

function throwSanitizedDbError(error: unknown): never {
  console.error('Database query failed:', error);
  throw new Error('Database query failed. Please try again later.', {
    cause: error,
  });
}

function mapStaffRow(row: typeof staffMembers.$inferSelect): BackendStaffRecord {
  return {
    id: row.id,
    initials: row.initials,
    avatarUrl: row.avatarUrl ?? undefined,
    name: row.name,
    serviceId: row.serviceId,
    title: row.title,
    department: row.department,
    roleLevel: row.roleLevel as RoleLevel,
    lgaJurisdiction: row.lgaJurisdiction,
    mfaMethod: row.mfaMethod,
    lastTelemetry: row.lastTelemetry,
    lastAction: row.lastAction,
    status: row.status as BackendStaffRecord['status'],
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    passcode: row.passcode,
    isStreetFixOffice: row.isStreetFixOffice,
    updatedAt: row.updatedAt ?? undefined,
  };
}

function mapSupabaseStaffRow(row: Record<string, unknown>): BackendStaffRecord {
  return {
    id: String(row.id),
    initials: String(row.initials),
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    name: String(row.name),
    serviceId: String(row.service_id),
    title: String(row.title),
    department: String(row.department),
    roleLevel: row.role_level as RoleLevel,
    lgaJurisdiction: String(row.lga_jurisdiction),
    mfaMethod: String(row.mfa_method),
    lastTelemetry: String(row.last_telemetry),
    lastAction: String(row.last_action),
    status: row.status as BackendStaffRecord['status'],
    email: (row.email as string | null) ?? undefined,
    phone: (row.phone as string | null) ?? undefined,
    passcode: String(row.passcode),
    isStreetFixOffice: Boolean(row.is_street_fix_office),
    updatedAt: (row.updated_at as string | null) ?? undefined,
  };
}

function toSupabaseStaffRow(record: BackendStaffRecord) {
  return {
    id: record.id,
    initials: record.initials,
    avatar_url: record.avatarUrl ?? null,
    name: record.name,
    service_id: record.serviceId,
    title: record.title,
    department: record.department,
    role_level: record.roleLevel,
    lga_jurisdiction: record.lgaJurisdiction,
    mfa_method: record.mfaMethod,
    last_telemetry: record.lastTelemetry,
    last_action: record.lastAction,
    status: record.status,
    email: record.email ?? null,
    phone: record.phone ?? null,
    passcode: record.passcode,
    is_street_fix_office: record.isStreetFixOffice,
    updated_at: record.updatedAt ?? null,
  };
}

function mapResidentRow(
  row: typeof residentAccounts.$inferSelect
): BackendResidentAccount {
  return {
    id: row.id,
    uid: row.uid ?? undefined,
    name: row.name,
    email: row.email,
    phone: row.phone,
    password: row.password,
    state: row.state,
    lga: row.lga,
    ward: row.ward ?? undefined,
    street: row.street ?? undefined,
    plotNo: row.plotNo ?? undefined,
    landmark: row.landmark ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
    whatsappAlerts: row.whatsappAlerts,
    verified: row.verified,
    status: (row.status as BackendResidentAccount['status']) || 'Active',
    createdAt: row.createdAt,
  };
}

function mapSupabaseResidentRow(
  row: Record<string, unknown>
): BackendResidentAccount {
  return {
    id: String(row.id),
    uid: (row.uid as string | null) ?? undefined,
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    password: String(row.password || ''),
    state: String(row.state),
    lga: String(row.lga),
    ward: (row.ward as string | null) ?? undefined,
    street: (row.street as string | null) ?? undefined,
    plotNo: (row.plot_no as string | null) ?? undefined,
    landmark: (row.landmark as string | null) ?? undefined,
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    whatsappAlerts: Boolean(row.whatsapp_alerts),
    verified: Boolean(row.verified),
    status: ((row.status as string | null) as BackendResidentAccount['status']) || 'Active',
    createdAt: String(row.created_at),
  };
}

function toSupabaseResidentRow(record: BackendResidentAccount) {
  return {
    id: record.id,
    uid: record.uid ?? null,
    name: record.name,
    email: record.email,
    phone: record.phone,
    password: record.password,
    state: record.state,
    lga: record.lga,
    ward: record.ward ?? null,
    street: record.street ?? null,
    plot_no: record.plotNo ?? null,
    landmark: record.landmark ?? null,
    avatar_url: record.avatarUrl ?? null,
    whatsapp_alerts: record.whatsappAlerts,
    verified: record.verified,
    status: record.status || 'Active',
    created_at: record.createdAt,
  };
}

function mapIncidentRow(row: typeof incidents.$inferSelect): BackendIncident {
  return {
    id: row.id,
    refCode: row.refCode,
    title: row.title,
    category: row.category,
    description: row.description,
    state: row.state,
    lga: row.lga,
    ward: row.ward,
    address: row.address,
    landmark: row.landmark,
    lat: row.lat,
    lng: row.lng,
    status: row.status,
    severity: row.severity,
    reportedAt: row.reportedAt,
    slaRemainingHours: row.slaRemainingHours,
    slaLabel: row.slaLabel,
    confirmations: row.confirmations,
    reporterName: row.reporterName,
    reporterVerified: row.reporterVerified,
    reporterUid: row.reporterUid ?? undefined,
    assignedUnit: row.assignedUnit,
    assignedDepot: row.assignedDepot,
    squadLead: row.squadLead,
    beforePhotoUrl: row.beforePhotoUrl,
    progressPhotoUrl: row.progressPhotoUrl ?? undefined,
    afterPhotoUrl: row.afterPhotoUrl ?? undefined,
    exifVerified: row.exifVerified,
    distanceKm: row.distanceKm,
    comments: Array.isArray(row.comments) ? row.comments : [],
    checkedIn: row.checkedIn ?? undefined,
    materialsAsphaltTons: row.materialsAsphaltTons ?? undefined,
    crewHours: row.crewHours ?? undefined,
    reporterPhone: row.reporterPhone ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
  };
}

function mapSupabaseIncidentRow(row: Record<string, unknown>): BackendIncident {
  return {
    id: String(row.id),
    refCode: String(row.ref_code),
    title: String(row.title),
    category: String(row.category),
    description: String(row.description),
    state: String(row.state),
    lga: String(row.lga),
    ward: String(row.ward),
    address: String(row.address),
    landmark: String(row.landmark),
    lat: String(row.lat),
    lng: String(row.lng),
    status: String(row.status),
    severity: String(row.severity),
    reportedAt: String(row.reported_at),
    slaRemainingHours: Number(row.sla_remaining_hours) || 0,
    slaLabel: String(row.sla_label),
    confirmations: Number(row.confirmations) || 1,
    reporterName: String(row.reporter_name),
    reporterVerified: Boolean(row.reporter_verified),
    reporterUid: (row.reporter_uid as string | null) ?? undefined,
    assignedUnit: String(row.assigned_unit),
    assignedDepot: String(row.assigned_depot),
    squadLead: String(row.squad_lead),
    beforePhotoUrl: String(row.before_photo_url),
    progressPhotoUrl: (row.progress_photo_url as string | null) ?? undefined,
    afterPhotoUrl: (row.after_photo_url as string | null) ?? undefined,
    exifVerified: Boolean(row.exif_verified),
    distanceKm: Number(row.distance_km) || 1.0,
    comments: Array.isArray(row.comments) ? row.comments : [],
    checkedIn: (row.checked_in as boolean | null) ?? undefined,
    materialsAsphaltTons:
      row.materials_asphalt_tons !== null && row.materials_asphalt_tons !== undefined
        ? Number(row.materials_asphalt_tons)
        : undefined,
    crewHours:
      row.crew_hours !== null && row.crew_hours !== undefined
        ? Number(row.crew_hours)
        : undefined,
    reporterPhone: (row.reporter_phone as string | null) ?? undefined,
    updatedAt: (row.updated_at as string | null) ?? undefined,
  };
}

function toSupabaseIncidentRow(inc: BackendIncident) {
  return {
    id: inc.id,
    ref_code: inc.refCode,
    title: inc.title,
    category: inc.category,
    description: inc.description,
    state: inc.state,
    lga: inc.lga,
    ward: inc.ward,
    address: inc.address,
    landmark: inc.landmark,
    lat: inc.lat,
    lng: inc.lng,
    status: inc.status,
    severity: inc.severity,
    reported_at: inc.reportedAt,
    sla_remaining_hours: Math.round(Number(inc.slaRemainingHours) || 0),
    sla_label: inc.slaLabel,
    confirmations: Math.round(Number(inc.confirmations) || 1),
    reporter_name: inc.reporterName,
    reporter_verified: Boolean(inc.reporterVerified),
    reporter_uid: inc.reporterUid ?? null,
    assigned_unit: inc.assignedUnit,
    assigned_depot: inc.assignedDepot,
    squad_lead: inc.squadLead,
    before_photo_url: inc.beforePhotoUrl,
    progress_photo_url: inc.progressPhotoUrl ?? null,
    after_photo_url: inc.afterPhotoUrl ?? null,
    exif_verified: Boolean(inc.exifVerified),
    distance_km: Number(inc.distanceKm) || 1.0,
    comments: Array.isArray(inc.comments) ? inc.comments : [],
    checked_in: inc.checkedIn ?? null,
    materials_asphalt_tons: inc.materialsAsphaltTons ?? null,
    crew_hours: inc.crewHours ?? null,
    reporter_phone: inc.reporterPhone ?? null,
    updated_at: inc.updatedAt ?? null,
  };
}

function mapNotificationRow(
  row: typeof notifications.$inferSelect
): BackendNotification {
  return {
    id: row.id,
    audience: row.audience as 'resident' | 'admin',
    recipientName: row.recipientName ?? undefined,
    incidentId: row.incidentId,
    refCode: row.refCode,
    severity: row.severity,
    actionType: row.actionType,
    title: row.title,
    message: row.message,
    createdAt: row.createdAt,
    timestampMs: row.timestampMs,
    read: row.read,
  };
}

function mapSupabaseNotificationRow(
  row: Record<string, unknown>
): BackendNotification {
  return {
    id: String(row.id),
    audience: row.audience as 'resident' | 'admin',
    recipientName: (row.recipient_name as string | null) ?? undefined,
    incidentId: String(row.incident_id),
    refCode: String(row.ref_code),
    severity: String(row.severity),
    actionType: String(row.action_type),
    title: String(row.title),
    message: String(row.message),
    createdAt: String(row.created_at),
    timestampMs: Number(row.timestamp_ms) || Date.now(),
    read: Boolean(row.read),
  };
}

function toSupabaseNotificationRow(n: BackendNotification) {
  return {
    id: n.id,
    audience: n.audience,
    recipient_name: n.recipientName ?? null,
    incident_id: n.incidentId,
    ref_code: n.refCode,
    severity: n.severity,
    action_type: n.actionType,
    title: n.title,
    message: n.message,
    created_at: n.createdAt,
    timestamp_ms: Number(n.timestampMs) || Date.now(),
    read: Boolean(n.read),
  };
}

function normalizePhoneServer(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234') && digits.length >= 13) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return raw.trim();
}

const staffSeedPromises = new Map<string, Promise<void>>();
async function ensureDefaultStaffSeeded(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const cacheKey = supabase ? 'supabase' : 'drizzle';
  let pending = staffSeedPromises.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from('staff_members')
          .select('id')
          .limit(1);
        if (error) throw error;
        if (!data || data.length === 0) {
          const { error: insertErr } = await supabase
            .from('staff_members')
            .upsert(DEFAULT_STAFF_DB.map(toSupabaseStaffRow), {
              onConflict: 'id',
              ignoreDuplicates: true,
            });
          if (insertErr) throw insertErr;
        }
        return;
      }

      const existing = await db.select({ id: staffMembers.id }).from(staffMembers).limit(1);
      if (existing.length === 0) {
        await db
          .insert(staffMembers)
          .values(
            DEFAULT_STAFF_DB.map((item) => ({
              id: item.id,
              initials: item.initials,
              avatarUrl: item.avatarUrl ?? null,
              name: item.name,
              serviceId: item.serviceId,
              title: item.title,
              department: item.department,
              roleLevel: item.roleLevel,
              lgaJurisdiction: item.lgaJurisdiction,
              mfaMethod: item.mfaMethod,
              lastTelemetry: item.lastTelemetry,
              lastAction: item.lastAction,
              status: item.status,
              email: item.email ?? null,
              phone: item.phone ?? null,
              passcode: item.passcode,
              isStreetFixOffice: item.isStreetFixOffice,
              updatedAt: item.updatedAt ?? null,
            }))
          )
          .onConflictDoNothing();
      }
    })().catch((err) => {
      staffSeedPromises.delete(cacheKey);
      throw err;
    });
    staffSeedPromises.set(cacheKey, pending);
  }
  await pending;
}

export async function listStaff(): Promise<BackendStaffRecord[]> {
  try {
    await ensureDefaultStaffSeeded();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('staff_members').select('*');
      if (error) throw error;
      return (data || []).map((r) => mapSupabaseStaffRow(r as Record<string, unknown>));
    }

    const rows = await db.select().from(staffMembers);
    return rows.map(mapStaffRow);
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function findStaffById(id: string): Promise<BackendStaffRecord | null> {
  try {
    await ensureDefaultStaffSeeded();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSupabaseStaffRow(data as Record<string, unknown>) : null;
    }

    const rows = await db
      .select()
      .from(staffMembers)
      .where(eq(staffMembers.id, id))
      .limit(1);
    return rows[0] ? mapStaffRow(rows[0]) : null;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function findStaffByServiceId(
  serviceId: string
): Promise<BackendStaffRecord | null> {
  try {
    await ensureDefaultStaffSeeded();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('staff_members').select('*');
      if (error) throw error;
      const matched = (data || []).find(
        (r) =>
          String((r as Record<string, unknown>).service_id || '').toLowerCase() ===
          serviceId.trim().toLowerCase()
      );
      return matched ? mapSupabaseStaffRow(matched as Record<string, unknown>) : null;
    }

    const rows = await db.select().from(staffMembers);
    const matched = rows.find(
      (r) => r.serviceId.toLowerCase() === serviceId.trim().toLowerCase()
    );
    return matched ? mapStaffRow(matched) : null;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function createStaff(
  record: BackendStaffRecord
): Promise<BackendStaffRecord> {
  try {
    await ensureDefaultStaffSeeded();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('staff_members')
        .insert(toSupabaseStaffRow(record))
        .select('*')
        .single();
      if (error) throw error;
      return mapSupabaseStaffRow(data as Record<string, unknown>);
    }

    const rows = await db
      .insert(staffMembers)
      .values({
        id: record.id,
        initials: record.initials,
        avatarUrl: record.avatarUrl ?? null,
        name: record.name,
        serviceId: record.serviceId,
        title: record.title,
        department: record.department,
        roleLevel: record.roleLevel,
        lgaJurisdiction: record.lgaJurisdiction,
        mfaMethod: record.mfaMethod,
        lastTelemetry: record.lastTelemetry,
        lastAction: record.lastAction,
        status: record.status,
        email: record.email ?? null,
        phone: record.phone ?? null,
        passcode: record.passcode,
        isStreetFixOffice: record.isStreetFixOffice,
        updatedAt: record.updatedAt ?? null,
      })
      .returning();
    return mapStaffRow(rows[0]);
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function updateStaff(
  record: BackendStaffRecord
): Promise<BackendStaffRecord | null> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { id: _id, ...patch } = toSupabaseStaffRow(record);
      const { data, error } = await supabase
        .from('staff_members')
        .update(patch)
        .eq('id', record.id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data ? mapSupabaseStaffRow(data as Record<string, unknown>) : null;
    }

    const rows = await db
      .update(staffMembers)
      .set({
        initials: record.initials,
        avatarUrl: record.avatarUrl ?? null,
        name: record.name,
        serviceId: record.serviceId,
        title: record.title,
        department: record.department,
        roleLevel: record.roleLevel,
        lgaJurisdiction: record.lgaJurisdiction,
        mfaMethod: record.mfaMethod,
        lastTelemetry: record.lastTelemetry,
        lastAction: record.lastAction,
        status: record.status,
        email: record.email ?? null,
        phone: record.phone ?? null,
        passcode: record.passcode,
        isStreetFixOffice: record.isStreetFixOffice,
        updatedAt: record.updatedAt ?? null,
      })
      .where(eq(staffMembers.id, record.id))
      .returning();
    return rows[0] ? mapStaffRow(rows[0]) : null;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function deleteStaff(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      return Boolean(data && data.length > 0);
    }

    const rows = await db
      .delete(staffMembers)
      .where(eq(staffMembers.id, id))
      .returning({ id: staffMembers.id });
    return rows.length > 0;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function getPolicies(): Promise<BackendGlobalPolicies> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('global_policies')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const sla = String(data.sla_target_hours);
        return {
          exifStrict: Boolean(data.exif_strict),
          autoRoutePotholes: Boolean(data.auto_route_potholes),
          autoEscalateSla: Boolean(data.auto_escalate_sla),
          openLedger: Boolean(data.open_ledger),
          slaTargetHours:
            sla === '24' || sla === '48' || sla === '72' ? sla : '48',
        };
      }

      const { error: seedErr } = await supabase
        .from('global_policies')
        .upsert(
          {
            id: 1,
            exif_strict: DEFAULT_GLOBAL_POLICIES.exifStrict,
            auto_route_potholes: DEFAULT_GLOBAL_POLICIES.autoRoutePotholes,
            auto_escalate_sla: DEFAULT_GLOBAL_POLICIES.autoEscalateSla,
            open_ledger: DEFAULT_GLOBAL_POLICIES.openLedger,
            sla_target_hours: DEFAULT_GLOBAL_POLICIES.slaTargetHours,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      if (seedErr) throw seedErr;
      return { ...DEFAULT_GLOBAL_POLICIES };
    }

    const existing = await db
      .select()
      .from(globalPolicies)
      .where(eq(globalPolicies.id, 1))
      .limit(1);
    if (existing[0]) {
      return {
        exifStrict: existing[0].exifStrict,
        autoRoutePotholes: existing[0].autoRoutePotholes,
        autoEscalateSla: existing[0].autoEscalateSla,
        openLedger: existing[0].openLedger,
        slaTargetHours:
          existing[0].slaTargetHours === '24' ||
          existing[0].slaTargetHours === '48' ||
          existing[0].slaTargetHours === '72'
            ? existing[0].slaTargetHours
            : '48',
      };
    }

    await db
      .insert(globalPolicies)
      .values({ id: 1, ...DEFAULT_GLOBAL_POLICIES })
      .onConflictDoNothing();
    return { ...DEFAULT_GLOBAL_POLICIES };
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function upsertPolicies(
  nextPolicies: BackendGlobalPolicies
): Promise<BackendGlobalPolicies> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('global_policies')
        .upsert(
          {
            id: 1,
            exif_strict: nextPolicies.exifStrict,
            auto_route_potholes: nextPolicies.autoRoutePotholes,
            auto_escalate_sla: nextPolicies.autoEscalateSla,
            open_ledger: nextPolicies.openLedger,
            sla_target_hours: nextPolicies.slaTargetHours,
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();
      if (error) throw error;
      return {
        exifStrict: Boolean(data.exif_strict),
        autoRoutePotholes: Boolean(data.auto_route_potholes),
        autoEscalateSla: Boolean(data.auto_escalate_sla),
        openLedger: Boolean(data.open_ledger),
        slaTargetHours: data.sla_target_hours as '24' | '48' | '72',
      };
    }

    const rows = await db
      .insert(globalPolicies)
      .values({ id: 1, ...nextPolicies })
      .onConflictDoUpdate({
        target: globalPolicies.id,
        set: {
          exifStrict: nextPolicies.exifStrict,
          autoRoutePotholes: nextPolicies.autoRoutePotholes,
          autoEscalateSla: nextPolicies.autoEscalateSla,
          openLedger: nextPolicies.openLedger,
          slaTargetHours: nextPolicies.slaTargetHours,
        },
      })
      .returning();
    return {
      exifStrict: rows[0].exifStrict,
      autoRoutePotholes: rows[0].autoRoutePotholes,
      autoEscalateSla: rows[0].autoEscalateSla,
      openLedger: rows[0].openLedger,
      slaTargetHours: rows[0].slaTargetHours as '24' | '48' | '72',
    };
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function listResidents(): Promise<BackendResidentAccount[]> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('resident_accounts').select('*');
      if (error) throw error;
      return (data || []).map((r) => mapSupabaseResidentRow(r as Record<string, unknown>));
    }

    const rows = await db.select().from(residentAccounts);
    return rows.map(mapResidentRow);
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function findResidentById(
  id: string
): Promise<BackendResidentAccount | null> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('resident_accounts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSupabaseResidentRow(data as Record<string, unknown>) : null;
    }

    const rows = await db
      .select()
      .from(residentAccounts)
      .where(eq(residentAccounts.id, id))
      .limit(1);
    return rows[0] ? mapResidentRow(rows[0]) : null;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function findResidentByIdentifier(
  identifier: string
): Promise<BackendResidentAccount | null> {
  try {
    const normEmail = identifier.trim().toLowerCase();
    const normPhone = normalizePhoneServer(identifier);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('resident_accounts').select('*');
      if (error) throw error;
      const mapped = (data || []).map((r) =>
        mapSupabaseResidentRow(r as Record<string, unknown>)
      );
      return (
        mapped.find(
          (r) =>
            r.email.toLowerCase() === normEmail ||
            (normPhone && normalizePhoneServer(r.phone) === normPhone)
        ) || null
      );
    }

    const rows = await db.select().from(residentAccounts);
    const matched = rows.find(
      (r) =>
        r.email.toLowerCase() === normEmail ||
        (normPhone && normalizePhoneServer(r.phone) === normPhone)
    );
    return matched ? mapResidentRow(matched) : null;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function upsertResident(
  account: BackendResidentAccount
): Promise<BackendResidentAccount> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: existingRows, error: selectErr } = await supabase
        .from('resident_accounts')
        .select('*');
      if (selectErr) throw selectErr;

      const existingMapped = (existingRows || []).map((r) =>
        mapSupabaseResidentRow(r as Record<string, unknown>)
      );
      const matched = existingMapped.find(
        (a) =>
          a.id === account.id ||
          (account.uid && a.uid === account.uid) ||
          a.email.toLowerCase() === account.email.toLowerCase() ||
          (account.phone &&
            normalizePhoneServer(a.phone) === normalizePhoneServer(account.phone))
      );

      const targetId = matched ? matched.id : account.id;
      const merged: BackendResidentAccount = matched
        ? {
            ...matched,
            ...account,
            id: targetId,
            uid: account.uid ?? matched.uid ?? undefined,
            password: account.password || matched.password,
            status: account.status || matched.status || 'Active',
          }
        : {
            ...account,
            status: account.status || 'Active',
          };

      const { data, error } = await supabase
        .from('resident_accounts')
        .upsert(toSupabaseResidentRow(merged), { onConflict: 'id' })
        .select('*')
        .single();
      if (error) throw error;
      return mapSupabaseResidentRow(data as Record<string, unknown>);
    }

    const existingRows = await db.select().from(residentAccounts);
    const matched = existingRows.find(
      (a) =>
        a.id === account.id ||
        (account.uid && a.uid === account.uid) ||
        a.email.toLowerCase() === account.email.toLowerCase() ||
        (account.phone &&
          normalizePhoneServer(a.phone) === normalizePhoneServer(account.phone))
    );

    const targetId = matched ? matched.id : account.id;
    const merged: BackendResidentAccount = matched
      ? {
          ...mapResidentRow(matched),
          ...account,
          id: targetId,
          uid: account.uid ?? matched.uid ?? undefined,
          password: account.password || matched.password,
          status: account.status || (matched.status as 'Active' | 'Suspended') || 'Active',
        }
      : {
          ...account,
          status: account.status || 'Active',
        };

    const rows = await db
      .insert(residentAccounts)
      .values({
        id: merged.id,
        uid: merged.uid ?? null,
        name: merged.name,
        email: merged.email,
        phone: merged.phone,
        password: merged.password,
        state: merged.state,
        lga: merged.lga,
        ward: merged.ward ?? null,
        street: merged.street ?? null,
        plotNo: merged.plotNo ?? null,
        landmark: merged.landmark ?? null,
        avatarUrl: merged.avatarUrl ?? null,
        whatsappAlerts: merged.whatsappAlerts,
        verified: merged.verified,
        status: merged.status || 'Active',
        createdAt: merged.createdAt,
      })
      .onConflictDoUpdate({
        target: residentAccounts.id,
        set: {
          uid: merged.uid ?? null,
          name: merged.name,
          email: merged.email,
          phone: merged.phone,
          password: merged.password,
          state: merged.state,
          lga: merged.lga,
          ward: merged.ward ?? null,
          street: merged.street ?? null,
          plotNo: merged.plotNo ?? null,
          landmark: merged.landmark ?? null,
          avatarUrl: merged.avatarUrl ?? null,
          whatsappAlerts: merged.whatsappAlerts,
          verified: merged.verified,
          status: merged.status || 'Active',
        },
      })
      .returning();

    return mapResidentRow(rows[0]);
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function upsertGoogleResident(params: {
  uid: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}): Promise<BackendResidentAccount> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: existingRows, error: selectErr } = await supabase
        .from('resident_accounts')
        .select('*');
      if (selectErr) throw selectErr;

      const existingMapped = (existingRows || []).map((r) =>
        mapSupabaseResidentRow(r as Record<string, unknown>)
      );
      const matched = existingMapped.find(
        (r) =>
          r.uid === params.uid ||
          r.email.toLowerCase() === params.email.trim().toLowerCase()
      );

      if (matched) {
        const { data, error } = await supabase
          .from('resident_accounts')
          .update({
            uid: params.uid,
            name: matched.name || params.displayName || 'StreetFix Resident',
            avatar_url: matched.avatarUrl || params.avatarUrl || null,
            verified: true,
          })
          .eq('id', matched.id)
          .select('*')
          .single();
        if (error) throw error;
        return mapSupabaseResidentRow(data as Record<string, unknown>);
      }

      const newId = `res-g-${params.uid.slice(0, 12)}`;
      const { data, error } = await supabase
        .from('resident_accounts')
        .upsert(
          {
            id: newId,
            uid: params.uid,
            name:
              params.displayName?.trim() ||
              params.email.split('@')[0] ||
              'StreetFix Resident',
            email: params.email.trim().toLowerCase(),
            phone: '',
            password: '',
            state: 'Akwa Ibom State',
            lga: 'Uyo LGA',
            avatar_url: params.avatarUrl ?? null,
            whatsapp_alerts: true,
            verified: true,
            status: 'Active',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('*')
        .single();
      if (error) throw error;
      return mapSupabaseResidentRow(data as Record<string, unknown>);
    }

    const existingRows = await db.select().from(residentAccounts);
    const matched = existingRows.find(
      (r) =>
        r.uid === params.uid ||
        r.email.toLowerCase() === params.email.trim().toLowerCase()
    );

    if (matched) {
      const rows = await db
        .update(residentAccounts)
        .set({
          uid: params.uid,
          name: matched.name || params.displayName || 'StreetFix Resident',
          avatarUrl: matched.avatarUrl || params.avatarUrl || null,
          verified: true,
        })
        .where(eq(residentAccounts.id, matched.id))
        .returning();
      return mapResidentRow(rows[0]);
    }

    const newId = `res-g-${params.uid.slice(0, 12)}`;
    const rows = await db
      .insert(residentAccounts)
      .values({
        id: newId,
        uid: params.uid,
        name: params.displayName?.trim() || params.email.split('@')[0] || 'StreetFix Resident',
        email: params.email.trim().toLowerCase(),
        phone: '',
        password: '',
        state: 'Akwa Ibom State',
        lga: 'Uyo LGA',
        avatarUrl: params.avatarUrl ?? null,
        whatsappAlerts: true,
        verified: true,
        status: 'Active',
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: residentAccounts.id,
        set: {
          uid: params.uid,
          email: params.email.trim().toLowerCase(),
          verified: true,
        },
      })
      .returning();
    return mapResidentRow(rows[0]);
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function updateResidentById(
  record: BackendResidentAccount
): Promise<BackendResidentAccount | null> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { id: _id, created_at: _createdAt, ...patch } = toSupabaseResidentRow(record);
      const { data, error } = await supabase
        .from('resident_accounts')
        .update(patch)
        .eq('id', record.id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data ? mapSupabaseResidentRow(data as Record<string, unknown>) : null;
    }

    const rows = await db
      .update(residentAccounts)
      .set({
        uid: record.uid ?? null,
        name: record.name,
        email: record.email,
        phone: record.phone,
        password: record.password,
        state: record.state,
        lga: record.lga,
        ward: record.ward ?? null,
        street: record.street ?? null,
        plotNo: record.plotNo ?? null,
        landmark: record.landmark ?? null,
        avatarUrl: record.avatarUrl ?? null,
        whatsappAlerts: record.whatsappAlerts,
        verified: record.verified,
        status: record.status || 'Active',
      })
      .where(eq(residentAccounts.id, record.id))
      .returning();
    return rows[0] ? mapResidentRow(rows[0]) : null;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function deleteResidentById(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('resident_accounts')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      return Boolean(data && data.length > 0);
    }

    const rows = await db
      .delete(residentAccounts)
      .where(eq(residentAccounts.id, id))
      .returning({ id: residentAccounts.id });
    return rows.length > 0;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function listIncidents(): Promise<BackendIncident[]> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase.from('incidents').select('*');
      if (error) throw error;
      return (data || []).map((r) => mapSupabaseIncidentRow(r as Record<string, unknown>));
    }

    const rows = await db.select().from(incidents);
    return rows.map(mapIncidentRow);
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function syncIncidents(
  incoming: BackendIncident[]
): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: existingIdsData, error: fetchErr } = await supabase
        .from('incidents')
        .select('id');
      if (fetchErr) throw fetchErr;

      const incomingSet = new Set(incoming.map((inc) => inc.id));
      const staleIds = (existingIdsData || [])
        .map((r) => String((r as Record<string, unknown>).id))
        .filter((id) => !incomingSet.has(id));

      if (staleIds.length > 0) {
        const { error: delErr } = await supabase
          .from('incidents')
          .delete()
          .in('id', staleIds);
        if (delErr) throw delErr;
      }

      if (incoming.length > 0) {
        const { error: upsertErr } = await supabase
          .from('incidents')
          .upsert(incoming.map(toSupabaseIncidentRow), { onConflict: 'id' });
        if (upsertErr) throw upsertErr;
      }
      return incoming.length;
    }

    await db.transaction(async (tx) => {
      if (incoming.length === 0) {
        await tx.delete(incidents);
        return;
      }

      const incomingIds = incoming.map((inc) => inc.id);
      await tx.delete(incidents).where(notInArray(incidents.id, incomingIds));

      for (const inc of incoming) {
        await tx
          .insert(incidents)
          .values({
            id: inc.id,
            refCode: inc.refCode,
            title: inc.title,
            category: inc.category,
            description: inc.description,
            state: inc.state,
            lga: inc.lga,
            ward: inc.ward,
            address: inc.address,
            landmark: inc.landmark,
            lat: inc.lat,
            lng: inc.lng,
            status: inc.status,
            severity: inc.severity,
            reportedAt: inc.reportedAt,
            slaRemainingHours: Math.round(Number(inc.slaRemainingHours) || 0),
            slaLabel: inc.slaLabel,
            confirmations: Math.round(Number(inc.confirmations) || 1),
            reporterName: inc.reporterName,
            reporterVerified: Boolean(inc.reporterVerified),
            reporterUid: inc.reporterUid ?? null,
            assignedUnit: inc.assignedUnit,
            assignedDepot: inc.assignedDepot,
            squadLead: inc.squadLead,
            beforePhotoUrl: inc.beforePhotoUrl,
            progressPhotoUrl: inc.progressPhotoUrl ?? null,
            afterPhotoUrl: inc.afterPhotoUrl ?? null,
            exifVerified: Boolean(inc.exifVerified),
            distanceKm: Number(inc.distanceKm) || 1.0,
            comments: Array.isArray(inc.comments) ? inc.comments : [],
            checkedIn: inc.checkedIn ?? null,
            materialsAsphaltTons: inc.materialsAsphaltTons ?? null,
            crewHours: inc.crewHours ?? null,
            reporterPhone: inc.reporterPhone ?? null,
            updatedAt: inc.updatedAt ?? null,
          })
          .onConflictDoUpdate({
            target: incidents.id,
            set: {
              refCode: inc.refCode,
              title: inc.title,
              category: inc.category,
              description: inc.description,
              state: inc.state,
              lga: inc.lga,
              ward: inc.ward,
              address: inc.address,
              landmark: inc.landmark,
              lat: inc.lat,
              lng: inc.lng,
              status: inc.status,
              severity: inc.severity,
              reportedAt: inc.reportedAt,
              slaRemainingHours: Math.round(Number(inc.slaRemainingHours) || 0),
              slaLabel: inc.slaLabel,
              confirmations: Math.round(Number(inc.confirmations) || 1),
              reporterName: inc.reporterName,
              reporterVerified: Boolean(inc.reporterVerified),
              reporterUid: inc.reporterUid ?? null,
              assignedUnit: inc.assignedUnit,
              assignedDepot: inc.assignedDepot,
              squadLead: inc.squadLead,
              beforePhotoUrl: inc.beforePhotoUrl,
              progressPhotoUrl: inc.progressPhotoUrl ?? null,
              afterPhotoUrl: inc.afterPhotoUrl ?? null,
              exifVerified: Boolean(inc.exifVerified),
              distanceKm: Number(inc.distanceKm) || 1.0,
              comments: Array.isArray(inc.comments) ? inc.comments : [],
              checkedIn: inc.checkedIn ?? null,
              materialsAsphaltTons: inc.materialsAsphaltTons ?? null,
              crewHours: inc.crewHours ?? null,
              reporterPhone: inc.reporterPhone ?? null,
              updatedAt: inc.updatedAt ?? null,
            },
          });
      }
    });
    return incoming.length;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function deleteIncidentById(id: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('incidents')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      return Boolean(data && data.length > 0);
    }

    const rows = await db
      .delete(incidents)
      .where(eq(incidents.id, id))
      .returning({ id: incidents.id });
    return rows.length > 0;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function listNotifications(): Promise<BackendNotification[]> {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('timestamp_ms', { ascending: false });
      if (error) throw error;
      return (data || []).map((r) =>
        mapSupabaseNotificationRow(r as Record<string, unknown>)
      );
    }

    const rows = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.timestampMs));
    return rows.map(mapNotificationRow);
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function syncNotifications(
  incoming: BackendNotification[]
): Promise<number> {
  try {
    const capped = incoming.slice(0, 60);
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data: existingIdsData, error: fetchErr } = await supabase
        .from('notifications')
        .select('id');
      if (fetchErr) throw fetchErr;

      const incomingSet = new Set(capped.map((n) => n.id));
      const staleIds = (existingIdsData || [])
        .map((r) => String((r as Record<string, unknown>).id))
        .filter((id) => !incomingSet.has(id));

      if (staleIds.length > 0) {
        const { error: delErr } = await supabase
          .from('notifications')
          .delete()
          .in('id', staleIds);
        if (delErr) throw delErr;
      }

      if (capped.length > 0) {
        const { error: upsertErr } = await supabase
          .from('notifications')
          .upsert(capped.map(toSupabaseNotificationRow), { onConflict: 'id' });
        if (upsertErr) throw upsertErr;
      }
      return capped.length;
    }

    await db.transaction(async (tx) => {
      if (capped.length === 0) {
        await tx.delete(notifications);
        return;
      }

      const incomingIds = capped.map((n) => n.id);
      await tx.delete(notifications).where(notInArray(notifications.id, incomingIds));

      for (const n of capped) {
        await tx
          .insert(notifications)
          .values({
            id: n.id,
            audience: n.audience,
            recipientName: n.recipientName ?? null,
            incidentId: n.incidentId,
            refCode: n.refCode,
            severity: n.severity,
            actionType: n.actionType,
            title: n.title,
            message: n.message,
            createdAt: n.createdAt,
            timestampMs: Number(n.timestampMs) || Date.now(),
            read: Boolean(n.read),
          })
          .onConflictDoUpdate({
            target: notifications.id,
            set: {
              audience: n.audience,
              recipientName: n.recipientName ?? null,
              incidentId: n.incidentId,
              refCode: n.refCode,
              severity: n.severity,
              actionType: n.actionType,
              title: n.title,
              message: n.message,
              createdAt: n.createdAt,
              timestampMs: Number(n.timestampMs) || Date.now(),
              read: Boolean(n.read),
            },
          });
      }
    });
    return capped.length;
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

const advisoriesSeedPromises = new Map<string, Promise<void>>();
async function ensureDefaultAdvisoriesSeeded(): Promise<void> {
  const supabase = getSupabaseAdmin();
  const cacheKey = supabase ? 'supabase' : 'drizzle';
  let pending = advisoriesSeedPromises.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from('advisories')
          .select('id')
          .limit(1);
        if (error) throw error;
        if (!data || data.length === 0) {
          const { error: insertErr } = await supabase.from('advisories').upsert(
            DEFAULT_ADVISORIES.map((item) => ({
              id: item.id,
              time: item.time,
              author: item.author,
              text: item.text,
            })),
            { onConflict: 'id', ignoreDuplicates: true }
          );
          if (insertErr) throw insertErr;
        }
        return;
      }

      const existing = await db.select({ id: advisories.id }).from(advisories).limit(1);
      if (existing.length === 0) {
        await db
          .insert(advisories)
          .values(
            DEFAULT_ADVISORIES.map((item) => ({
              id: item.id,
              time: item.time,
              author: item.author,
              text: item.text,
            }))
          )
          .onConflictDoNothing();
      }
    })().catch((err) => {
      advisoriesSeedPromises.delete(cacheKey);
      throw err;
    });
    advisoriesSeedPromises.set(cacheKey, pending);
  }
  await pending;
}

export async function listAdvisories(): Promise<BackendAdvisory[]> {
  try {
    await ensureDefaultAdvisoriesSeeded();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('advisories')
        .select('id, time, author, text')
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data || []).map((r) => ({
        id: String(r.id),
        time: String(r.time),
        author: String(r.author),
        text: String(r.text),
      }));
    }

    const rows = await db
      .select()
      .from(advisories)
      .orderBy(desc(advisories.createdAt));
    return rows.slice(0, 40).map((r) => ({
      id: r.id,
      time: r.time,
      author: r.author,
      text: r.text,
    }));
  } catch (error) {
    throwSanitizedDbError(error);
  }
}

export async function createAdvisory(
  entry: BackendAdvisory
): Promise<BackendAdvisory> {
  try {
    await ensureDefaultAdvisoriesSeeded();
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from('advisories')
        .insert({
          id: entry.id,
          time: entry.time,
          author: entry.author,
          text: entry.text,
        })
        .select('id, time, author, text')
        .single();
      if (error) throw error;
      return {
        id: String(data.id),
        time: String(data.time),
        author: String(data.author),
        text: String(data.text),
      };
    }

    const rows = await db
      .insert(advisories)
      .values({
        id: entry.id,
        time: entry.time,
        author: entry.author,
        text: entry.text,
      })
      .returning();
    return {
      id: rows[0].id,
      time: rows[0].time,
      author: rows[0].author,
      text: rows[0].text,
    };
  } catch (error) {
    throwSanitizedDbError(error);
  }
}
