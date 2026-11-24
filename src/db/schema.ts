import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('resident'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const staffMembers = pgTable('staff_members', {
  id: text('id').primaryKey(),
  initials: text('initials').notNull(),
  avatarUrl: text('avatar_url'),
  name: text('name').notNull(),
  serviceId: text('service_id').notNull().unique(),
  title: text('title').notNull(),
  department: text('department').notNull(),
  roleLevel: text('role_level').notNull(),
  lgaJurisdiction: text('lga_jurisdiction').notNull(),
  mfaMethod: text('mfa_method').notNull(),
  lastTelemetry: text('last_telemetry').notNull(),
  lastAction: text('last_action').notNull(),
  status: text('status').notNull().default('Active'),
  email: text('email'),
  phone: text('phone'),
  passcode: text('passcode').notNull(),
  isStreetFixOffice: boolean('is_street_fix_office').notNull().default(false),
  updatedAt: text('updated_at'),
});

export const residentAccounts = pgTable('resident_accounts', {
  id: text('id').primaryKey(),
  uid: text('uid'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  password: text('password').notNull(),
  state: text('state').notNull(),
  lga: text('lga').notNull(),
  ward: text('ward'),
  street: text('street'),
  plotNo: text('plot_no'),
  landmark: text('landmark'),
  avatarUrl: text('avatar_url'),
  whatsappAlerts: boolean('whatsapp_alerts').notNull().default(true),
  verified: boolean('verified').notNull().default(false),
  status: text('status').notNull().default('Active'),
  createdAt: text('created_at').notNull(),
});

export const incidents = pgTable('incidents', {
  id: text('id').primaryKey(),
  refCode: text('ref_code').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  state: text('state').notNull(),
  lga: text('lga').notNull(),
  ward: text('ward').notNull(),
  address: text('address').notNull(),
  landmark: text('landmark').notNull(),
  lat: text('lat').notNull(),
  lng: text('lng').notNull(),
  status: text('status').notNull(),
  severity: text('severity').notNull(),
  reportedAt: text('reported_at').notNull(),
  slaRemainingHours: integer('sla_remaining_hours').notNull(),
  slaLabel: text('sla_label').notNull(),
  confirmations: integer('confirmations').notNull().default(1),
  reporterName: text('reporter_name').notNull(),
  reporterVerified: boolean('reporter_verified').notNull().default(true),
  reporterUid: text('reporter_uid'),
  assignedUnit: text('assigned_unit').notNull(),
  assignedDepot: text('assigned_depot').notNull(),
  squadLead: text('squad_lead').notNull(),
  beforePhotoUrl: text('before_photo_url').notNull(),
  progressPhotoUrl: text('progress_photo_url'),
  afterPhotoUrl: text('after_photo_url'),
  exifVerified: boolean('exif_verified').notNull().default(false),
  distanceKm: doublePrecision('distance_km').notNull().default(1.0),
  comments: jsonb('comments').$type<unknown[]>().notNull().default([]),
  checkedIn: boolean('checked_in'),
  materialsAsphaltTons: doublePrecision('materials_asphalt_tons'),
  crewHours: doublePrecision('crew_hours'),
  reporterPhone: text('reporter_phone'),
  updatedAt: text('updated_at'),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  audience: text('audience').notNull(),
  recipientName: text('recipient_name'),
  incidentId: text('incident_id').notNull(),
  refCode: text('ref_code').notNull(),
  severity: text('severity').notNull(),
  actionType: text('action_type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  createdAt: text('created_at').notNull(),
  timestampMs: doublePrecision('timestamp_ms').notNull(),
  read: boolean('read').notNull().default(false),
});

export const advisories = pgTable('advisories', {
  id: text('id').primaryKey(),
  time: text('time').notNull(),
  author: text('author').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const globalPolicies = pgTable('global_policies', {
  id: integer('id').primaryKey(),
  exifStrict: boolean('exif_strict').notNull().default(true),
  autoRoutePotholes: boolean('auto_route_potholes').notNull().default(true),
  autoEscalateSla: boolean('auto_escalate_sla').notNull().default(true),
  openLedger: boolean('open_ledger').notNull().default(true),
  slaTargetHours: text('sla_target_hours').notNull().default('48'),
});

export const usersRelations = relations(users, ({ many }) => ({
  incidents: many(incidents),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  reporter: one(users, {
    fields: [incidents.reporterUid],
    references: [users.uid],
  }),
}));
