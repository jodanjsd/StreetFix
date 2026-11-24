export type ScreenRoute =
  | 'resident'
  | 'report'
  | 'directory'
  | 'auth'
  | 'admin'
  | 'ops'
  | 'triage'
  | 'dispatch'
  | 'analytics'
  | 'governance';

export type IncidentStatus = 'pending' | 'under_review' | 'assigned' | 'in_progress' | 'fixed';

export type IncidentSeverity = 'low' | 'moderate' | 'critical';

export type IncidentCategory =
  | 'Pothole / Road Failure'
  | 'Blocked Drainage'
  | 'Waste Heap / Sanitation'
  | 'Streetlight Failure'
  | 'Pipe Burst / Water Leak'
  | 'Traffic Signal Defect';

export interface EyewitnessComment {
  id: string;
  author: string;
  role: string;
  isOfficial: boolean;
  timestamp: string;
  text: string;
}

export interface Incident {
  id: string;
  refCode: string;
  title: string;
  category: IncidentCategory;
  description: string;
  state: string;
  lga: string;
  ward: string;
  address: string;
  landmark: string;
  lat: string;
  lng: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  reportedAt: string;
  slaRemainingHours: number;
  slaLabel: string;
  confirmations: number;
  reporterName: string;
  reporterVerified: boolean;
  assignedUnit: string;
  assignedDepot: string;
  squadLead: string;
  beforePhotoUrl: string;
  progressPhotoUrl?: string;
  afterPhotoUrl?: string;
  exifVerified: boolean;
  distanceKm: number;
  comments: EyewitnessComment[];
  checkedIn?: boolean;
  materialsAsphaltTons?: number;
  crewHours?: number;
  reporterPhone?: string;
  updatedAt?: string;
}

export type NotificationActionType =
  | 'serious_report'
  | 'new_report'
  | 'assigned'
  | 'in_progress'
  | 'checked_in'
  | 'fixed'
  | 'reopened'
  | 'comment';

export interface AppNotification {
  id: string;
  audience: 'resident' | 'admin';
  recipientName?: string;
  incidentId: string;
  refCode: string;
  severity: IncidentSeverity;
  actionType: NotificationActionType;
  title: string;
  message: string;
  createdAt: string;
  timestampMs: number;
  read: boolean;
}

export interface StaffMember {
  id: string;
  initials: string;
  avatarUrl?: string;
  name: string;
  serviceId: string;
  title: string;
  department: string;
  roleLevel: 'FIELD SQUAD LEAD' | 'TRIAGE OFFICER' | 'AGENCY DIRECTOR' | 'SUPER ADMIN' | 'FIELD TECHNICIAN';
  lgaJurisdiction: string;
  mfaMethod: string;
  lastTelemetry: string;
  lastAction: string;
  status: 'Active' | 'Suspended' | 'Pending';
  email?: string;
  phone?: string;
  passcode?: string;
  isStreetFixOffice?: boolean;
  updatedAt?: string;
}

export interface DepartmentQuota {
  id: string;
  name: string;
  shortCode: string;
  slaRate: string;
  slaStatus: 'healthy' | 'warning';
  activeSquads: number;
  staffCount: number;
  utilizationPct: number;
  barColor: string;
}

export interface ResidentAccount {
  id: string;
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

export interface GlobalPolicies {
  exifStrict: boolean;
  autoRoutePotholes: boolean;
  autoEscalateSla: boolean;
  openLedger: boolean;
  slaTargetHours: '24' | '48' | '72';
}

export interface BroadcastAdvisory {
  id: string;
  time: string;
  author: string;
  text: string;
}

export interface UserSession {
  name: string;
  role: 'resident' | 'staff' | 'admin';
  jurisdiction: string;
  serviceId?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  roleLevel?: StaffMember['roleLevel'];
  isStreetFixOffice?: boolean;
}
