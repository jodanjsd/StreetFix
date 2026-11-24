import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { AuthRequest, requireAuth } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import {
  BackendGlobalPolicies,
  BackendResidentAccount,
  BackendStaffRecord,
  RoleLevel,
  createAdvisory,
  createStaff,
  deleteIncidentById,
  deleteResidentById,
  deleteStaff,
  findResidentById,
  findResidentByIdentifier,
  findStaffById,
  findStaffByServiceId,
  getPolicies,
  listAdvisories,
  listIncidents,
  listNotifications,
  listResidents,
  listStaff,
  syncIncidents,
  syncNotifications,
  updateResidentById,
  updateStaff,
  upsertGoogleResident,
  upsertPolicies,
  upsertResident,
} from './src/db/repositories.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sanitizeForPublic(record: BackendStaffRecord) {
  const { passcode: _omit, ...safe } = record;
  return safe;
}

function sanitizeResident(record: BackendResidentAccount) {
  const { password: _omit, ...safe } = record;
  return safe;
}

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase() || 'AD';
}

function normalizePhoneServer(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234') && digits.length >= 13) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return raw.trim();
}

function sendSanitizedServerError(res: express.Response, error: unknown) {
  console.error('Request failed:', error);
  res.status(500).json({ error: 'Database query failed. Please try again later.' });
}

async function authenticateHeaderOfficer(
  req: express.Request
): Promise<BackendStaffRecord | null> {
  const serviceId = String(req.header('x-officer-service-id') || '').trim();
  const passcode = String(req.header('x-officer-passcode') || '').trim();
  if (!serviceId || !passcode) return null;

  const matched = await findStaffByServiceId(serviceId);
  if (!matched || matched.status !== 'Active') return null;
  if (matched.passcode !== passcode) return null;
  return matched;
}

async function requireOfficer(
  req: express.Request,
  res: express.Response
): Promise<BackendStaffRecord | null> {
  const actor = await authenticateHeaderOfficer(req);
  if (!actor) {
    res.status(401).json({
      error: 'Authentication failed. Valid Admin or HQ officer credentials required.',
    });
    return null;
  }
  return actor;
}

async function requireStreetFixOffice(
  req: express.Request,
  res: express.Response
): Promise<BackendStaffRecord | null> {
  const actor = await authenticateHeaderOfficer(req);
  if (!actor) {
    res.status(401).json({
      error: 'Authentication failed. Valid officer Service ID and passcode required.',
    });
    return null;
  }
  if (!actor.isStreetFixOffice) {
    res.status(403).json({
      error:
        'Access denied: Only the Office of StreetFix (Website Backend) is authorized for this action.',
    });
    return null;
  }
  return actor;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'StreetFix Office Backend' });
  });

  // ==========================
  // 0. FIREBASE AUTH SESSION SYNC
  // ==========================
  app.post('/api/auth/session', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@users.streetfix.ng`;
      const displayName = req.user!.name;
      const avatarUrl = typeof req.user!.picture === 'string' ? req.user!.picture : undefined;

      const user = await getOrCreateUser(uid, email, displayName);
      const resident = await upsertGoogleResident({
        uid,
        email,
        displayName,
        avatarUrl,
      });

      if (resident.status === 'Suspended') {
        res.status(403).json({
          error: `Resident account for ${resident.name} is currently suspended by the Office of StreetFix.`,
        });
        return;
      }

      res.json({
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        resident: sanitizeResident(resident),
      });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.get('/api/users/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || `${req.user!.uid}@users.streetfix.ng`,
        req.user!.name
      );
      res.json({ user });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // ==========================
  // 1. STAFF & HQ ADMIN AUTH
  // ==========================
  app.get('/api/staff', async (_req, res) => {
    try {
      const staffRows = await listStaff();
      res.json({ staff: staffRows.map(sanitizeForPublic) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.post('/api/auth/admin-login', async (req, res) => {
    try {
      const serviceId = String(req.body?.serviceId || '').trim();
      const passcode = String(req.body?.passcode || '').trim();

      if (!serviceId || !passcode) {
        res.status(400).json({ error: 'Enter both your Official Service ID and Admin Passcode.' });
        return;
      }

      const matched = await findStaffByServiceId(serviceId);
      if (!matched) {
        res.status(401).json({
          error:
            'No authorized officer account found for this Service ID. Only officers registered by the Office of StreetFix can log in.',
        });
        return;
      }
      if (matched.status === 'Suspended') {
        res.status(403).json({
          error: `Clearance suspended for ${matched.name}. Contact Office of StreetFix.`,
        });
        return;
      }
      if (matched.status === 'Pending') {
        res.status(403).json({
          error: `Clearance pending approval for ${matched.name}. Contact Office of StreetFix.`,
        });
        return;
      }
      if (matched.passcode !== passcode) {
        res.status(401).json({
          error: 'Incorrect Admin Passcode. Please verify your clearance credentials.',
        });
        return;
      }

      res.json({ officer: sanitizeForPublic(matched) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // Admin Self-Service Profile Update (ONLY important personal/contact fields allowed)
  app.patch('/api/admins/me/profile', async (req, res) => {
    try {
      const actor = await authenticateHeaderOfficer(req);
      if (!actor) {
        res.status(401).json({ error: 'Valid officer authentication required.' });
        return;
      }

      const body = req.body || {};
      const restrictedKeys = [
        'serviceId',
        'roleLevel',
        'department',
        'lgaJurisdiction',
        'title',
        'mfaMethod',
        'status',
        'isStreetFixOffice',
      ];
      const attemptedRestricted = restrictedKeys.filter(
        (k) => body[k] !== undefined && body[k] !== actor[k as keyof BackendStaffRecord]
      );
      if (attemptedRestricted.length > 0 && !actor.isStreetFixOffice) {
        res.status(403).json({
          error: `Restricted fields (${attemptedRestricted.join(', ')}) can only be modified by the Office of StreetFix (Website Backend).`,
        });
        return;
      }

      const nextName =
        typeof body.name === 'string' && body.name.trim() ? body.name.trim() : actor.name;
      const nextEmail =
        typeof body.email === 'string' ? body.email.trim() : actor.email;
      const nextPhone =
        typeof body.phone === 'string' ? body.phone.trim() : actor.phone;
      const nextAvatarUrl =
        typeof body.avatarUrl === 'string' ? body.avatarUrl : actor.avatarUrl;
      const nextPasscode =
        typeof body.newPasscode === 'string' && body.newPasscode.trim().length >= 6
          ? body.newPasscode.trim()
          : actor.passcode;

      const updatedRecord: BackendStaffRecord = {
        ...actor,
        name: nextName,
        initials: makeInitials(nextName),
        email: nextEmail,
        phone: nextPhone,
        avatarUrl: nextAvatarUrl,
        passcode: nextPasscode,
        lastAction: 'Updated personal contact/profile info',
        lastTelemetry: 'Just now',
        updatedAt: new Date().toISOString(),
      };

      const saved = await updateStaff(updatedRecord);
      res.json({ officer: sanitizeForPublic(saved || updatedRecord) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // HQ ONLY: Register new Admin
  app.post('/api/office/admins', async (req, res) => {
    try {
      const officeActor = await requireStreetFixOffice(req, res);
      if (!officeActor) return;

      const body = req.body || {};
      const name = String(body.name || '').trim();
      if (!name) {
        res.status(400).json({ error: 'Admin full name is required.' });
        return;
      }

      const requestedServiceId = String(body.serviceId || '').trim();
      const serviceId =
        requestedServiceId || `#STF-ADM-${Math.floor(1000 + Math.random() * 8999)}`;

      const duplicate = await findStaffByServiceId(serviceId);
      if (duplicate) {
        res.status(409).json({
          error: `Service ID ${serviceId} is already assigned to ${duplicate.name}.`,
        });
        return;
      }

      const passcode = String(body.passcode || '').trim() || 'AdminClearance#2026';
      const created: BackendStaffRecord = {
        id: `st-${Date.now()}`,
        initials: makeInitials(name),
        avatarUrl: typeof body.avatarUrl === 'string' ? body.avatarUrl : undefined,
        name,
        serviceId,
        title: String(body.title || 'Municipal Operations Officer').trim(),
        department: String(body.department || 'Akwa Ibom Roads (AKRMA)').trim(),
        roleLevel: (body.roleLevel as RoleLevel) || 'FIELD SQUAD LEAD',
        lgaJurisdiction: String(body.lgaJurisdiction || 'Uyo LGA, Akwa Ibom State').trim(),
        mfaMethod: String(body.mfaMethod || '2FA Active').trim(),
        lastTelemetry: 'Just registered',
        lastAction: `Registered by ${officeActor.name}`,
        status: body.status === 'Pending' || body.status === 'Suspended' ? body.status : 'Active',
        email: typeof body.email === 'string' ? body.email.trim() : undefined,
        phone: typeof body.phone === 'string' ? body.phone.trim() : undefined,
        passcode,
        isStreetFixOffice: Boolean(body.isStreetFixOffice),
        updatedAt: new Date().toISOString(),
      };

      const saved = await createStaff(created);
      res.status(201).json({ officer: sanitizeForPublic(saved) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // HQ ONLY: Edit ALL parts of any Admin profile
  app.patch('/api/office/admins/:id', async (req, res) => {
    try {
      const officeActor = await requireStreetFixOffice(req, res);
      if (!officeActor) return;

      const targetId = req.params.id;
      const existing = await findStaffById(targetId);
      if (!existing) {
        res.status(404).json({ error: 'Admin account not found.' });
        return;
      }

      const body = req.body || {};
      const isHqOrSelf =
        targetId === 'st-hq' ||
        targetId === officeActor.id ||
        Boolean(existing.isStreetFixOffice);

      if (
        isHqOrSelf &&
        typeof body.status === 'string' &&
        body.status !== existing.status
      ) {
        res.status(400).json({
          error:
            'Self-suspension/activation and HQ root account status changes are prohibited.',
        });
        return;
      }

      const nextServiceId =
        typeof body.serviceId === 'string' && body.serviceId.trim()
          ? body.serviceId.trim()
          : existing.serviceId;

      const duplicate = await findStaffByServiceId(nextServiceId);
      if (duplicate && duplicate.id !== targetId) {
        res.status(409).json({
          error: `Service ID ${nextServiceId} is already assigned to ${duplicate.name}.`,
        });
        return;
      }

      const nextName =
        typeof body.name === 'string' && body.name.trim()
          ? body.name.trim()
          : existing.name;

      const updatedRecord: BackendStaffRecord = {
        ...existing,
        name: nextName,
        initials: makeInitials(nextName),
        serviceId:
          existing.id === 'st-hq' || existing.isStreetFixOffice
            ? existing.serviceId
            : nextServiceId,
        title:
          typeof body.title === 'string' && body.title.trim()
            ? body.title.trim()
            : existing.title,
        department:
          typeof body.department === 'string' && body.department.trim()
            ? body.department.trim()
            : existing.department,
        roleLevel: (body.roleLevel as RoleLevel) || existing.roleLevel,
        lgaJurisdiction:
          typeof body.lgaJurisdiction === 'string' && body.lgaJurisdiction.trim()
            ? body.lgaJurisdiction.trim()
            : existing.lgaJurisdiction,
        mfaMethod:
          typeof body.mfaMethod === 'string' && body.mfaMethod.trim()
            ? body.mfaMethod.trim()
            : existing.mfaMethod,
        status: isHqOrSelf
          ? existing.status
          : body.status === 'Active' || body.status === 'Suspended' || body.status === 'Pending'
          ? body.status
          : existing.status,
        email: typeof body.email === 'string' ? body.email.trim() : existing.email,
        phone: typeof body.phone === 'string' ? body.phone.trim() : existing.phone,
        avatarUrl:
          typeof body.avatarUrl === 'string' ? body.avatarUrl : existing.avatarUrl,
        passcode:
          typeof body.passcode === 'string' && body.passcode.trim().length >= 6
            ? body.passcode.trim()
            : existing.passcode,
        lastAction: `Profile updated by ${officeActor.name}`,
        lastTelemetry: 'Just now',
        updatedAt: new Date().toISOString(),
      };

      const saved = await updateStaff(updatedRecord);
      res.json({ officer: sanitizeForPublic(saved || updatedRecord) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // HQ ONLY: Toggle Admin clearance Active/Suspended
  app.patch('/api/office/admins/:id/status', async (req, res) => {
    try {
      const officeActor = await requireStreetFixOffice(req, res);
      if (!officeActor) return;

      const targetId = req.params.id;
      const existing = await findStaffById(targetId);
      if (!existing) {
        res.status(404).json({ error: 'Admin account not found.' });
        return;
      }

      if (
        targetId === 'st-hq' ||
        targetId === officeActor.id ||
        Boolean(existing.isStreetFixOffice)
      ) {
        res.status(400).json({
          error:
            'Self-suspension/activation and HQ root account status changes are prohibited.',
        });
        return;
      }

      const nextStatus: BackendStaffRecord['status'] =
        existing.status === 'Active' ? 'Suspended' : 'Active';
      const updatedRecord: BackendStaffRecord = {
        ...existing,
        status: nextStatus,
        lastAction: `Status set to ${nextStatus} by ${officeActor.name}`,
        lastTelemetry: 'Just now',
        updatedAt: new Date().toISOString(),
      };

      const saved = await updateStaff(updatedRecord);
      res.json({ officer: sanitizeForPublic(saved || updatedRecord) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // HQ ONLY: Permanently revoke/delete an Admin account
  app.delete('/api/office/admins/:id', async (req, res) => {
    try {
      const officeActor = await requireStreetFixOffice(req, res);
      if (!officeActor) return;

      const targetId = req.params.id;
      const existing = await findStaffById(targetId);
      if (!existing) {
        res.status(404).json({ error: 'Admin account not found.' });
        return;
      }

      if (
        targetId === 'st-hq' ||
        targetId === officeActor.id ||
        Boolean(existing.isStreetFixOffice)
      ) {
        res.status(400).json({
          error:
            'Self-deletion and HQ root account removal are prohibited.',
        });
        return;
      }

      await deleteStaff(targetId);
      res.json({ deletedId: targetId, serviceId: existing.serviceId });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // ==========================
  // 2. GLOBAL POLICIES (HQ ONLY MUTATE)
  // ==========================
  app.get('/api/office/policies', async (_req, res) => {
    try {
      const policies = await getPolicies();
      res.json({ policies });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.patch('/api/office/policies', async (req, res) => {
    try {
      const officeActor = await requireStreetFixOffice(req, res);
      if (!officeActor) return;

      const currentPolicies = await getPolicies();
      const body = req.body || {};
      const nextPolicies: BackendGlobalPolicies = {
        exifStrict:
          typeof body.exifStrict === 'boolean' ? body.exifStrict : currentPolicies.exifStrict,
        autoRoutePotholes:
          typeof body.autoRoutePotholes === 'boolean'
            ? body.autoRoutePotholes
            : currentPolicies.autoRoutePotholes,
        autoEscalateSla:
          typeof body.autoEscalateSla === 'boolean'
            ? body.autoEscalateSla
            : currentPolicies.autoEscalateSla,
        openLedger:
          typeof body.openLedger === 'boolean' ? body.openLedger : currentPolicies.openLedger,
        slaTargetHours:
          body.slaTargetHours === '24' || body.slaTargetHours === '48' || body.slaTargetHours === '72'
            ? body.slaTargetHours
            : currentPolicies.slaTargetHours,
      };

      const saved = await upsertPolicies(nextPolicies);
      res.json({ policies: saved });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // ==========================
  // 3. RESIDENT ACCOUNTS + SELF-PROFILE + HQ MODERATION
  // ==========================
  app.get('/api/residents', async (req, res) => {
    try {
      const officer = await requireOfficer(req, res);
      if (!officer) return;

      const residents = await listResidents();
      res.json({ residents: residents.map(sanitizeResident) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.post('/api/auth/resident-login', async (req, res) => {
    try {
      const identifier = String(req.body?.identifier || '').trim();
      const password = String(req.body?.password || '');
      if (!identifier || !password) {
        res.status(400).json({ error: 'Enter both your registered email/phone and password.' });
        return;
      }

      const matched = await findResidentByIdentifier(identifier);
      if (!matched) {
        res.status(401).json({
          error: 'No account found for this email or phone number. Please create a free account first.',
        });
        return;
      }
      if (matched.status === 'Suspended') {
        res.status(403).json({
          error: `Resident account for ${matched.name} is currently suspended by the Office of StreetFix.`,
        });
        return;
      }
      if (!matched.password || matched.password !== password) {
        res.status(401).json({ error: 'Incorrect password. Please check your password and try again.' });
        return;
      }

      res.json({ resident: sanitizeResident(matched) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.post('/api/residents/upsert', async (req, res) => {
    try {
      const account = req.body as BackendResidentAccount;
      if (!account || !account.id || !account.email) {
        res.status(400).json({ error: 'Valid resident account payload required.' });
        return;
      }
      const saved = await upsertResident({
        ...account,
        status: account.status || 'Active',
      });
      res.json({ resident: sanitizeResident(saved) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.patch('/api/residents/me/profile', async (req, res) => {
    try {
      const body = req.body || {};
      const targetEmail = String(body.currentEmail || body.email || '').trim().toLowerCase();
      const targetPhone = normalizePhoneServer(String(body.currentPhone || body.phone || ''));
      const existing =
        (targetEmail ? await findResidentByIdentifier(targetEmail) : null) ||
        (targetPhone ? await findResidentByIdentifier(targetPhone) : null);

      if (!existing) {
        res.status(404).json({ error: 'Resident account not found.' });
        return;
      }
      if (existing.status === 'Suspended') {
        res.status(403).json({ error: 'Resident account is suspended by StreetFix HQ.' });
        return;
      }

      const updated: BackendResidentAccount = {
        ...existing,
        name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name,
        email:
          typeof body.email === 'string' && body.email.trim()
            ? body.email.trim().toLowerCase()
            : existing.email,
        phone:
          typeof body.phone === 'string' && body.phone.trim()
            ? normalizePhoneServer(body.phone)
            : existing.phone,
        state: typeof body.state === 'string' && body.state.trim() ? body.state.trim() : existing.state,
        lga: typeof body.lga === 'string' && body.lga.trim() ? body.lga.trim() : existing.lga,
        avatarUrl: typeof body.avatarUrl === 'string' ? body.avatarUrl : existing.avatarUrl,
        password:
          typeof body.newPassword === 'string' && body.newPassword.length >= 6
            ? body.newPassword
            : existing.password,
      };
      const saved = await updateResidentById(updated);
      res.json({ resident: sanitizeResident(saved || updated) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // HQ ONLY: Moderate Resident account (Verify / Suspend / Activate)
  app.patch('/api/office/residents/:id', async (req, res) => {
    try {
      const officeActor = await requireStreetFixOffice(req, res);
      if (!officeActor) return;

      const existing = await findResidentById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: 'Resident account not found.' });
        return;
      }
      const body = req.body || {};
      const updated: BackendResidentAccount = {
        ...existing,
        verified: typeof body.verified === 'boolean' ? body.verified : existing.verified,
        status:
          body.status === 'Active' || body.status === 'Suspended'
            ? body.status
            : existing.status || 'Active',
      };
      const saved = await updateResidentById(updated);
      res.json({ resident: sanitizeResident(saved || updated) });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // HQ ONLY: Delete Resident account
  app.delete('/api/office/residents/:id', async (req, res) => {
    try {
      const officeActor = await requireStreetFixOffice(req, res);
      if (!officeActor) return;

      const deleted = await deleteResidentById(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Resident account not found.' });
        return;
      }
      res.json({ deletedId: req.params.id });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // ==========================
  // 4. INCIDENTS, NOTIFICATIONS & ADVISORIES
  // ==========================
  app.get('/api/incidents', async (_req, res) => {
    try {
      const incidentRows = await listIncidents();
      res.json({
        seeded: incidentRows.length > 0,
        incidents: incidentRows,
      });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.post('/api/incidents/sync', async (req, res) => {
    try {
      const incoming = req.body?.incidents;
      if (!Array.isArray(incoming)) {
        res.status(400).json({ error: 'incidents array required' });
        return;
      }
      const count = await syncIncidents(incoming);
      res.json({ ok: true, count });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // HQ ONLY: Purge / permanently delete an incident record
  app.delete('/api/office/incidents/:id', async (req, res) => {
    try {
      const officeActor = await requireStreetFixOffice(req, res);
      if (!officeActor) return;

      await deleteIncidentById(req.params.id);
      res.json({ deletedId: req.params.id });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.get('/api/notifications', async (_req, res) => {
    try {
      const notifRows = await listNotifications();
      res.json({
        seeded: notifRows.length > 0,
        notifications: notifRows,
      });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.post('/api/notifications/sync', async (req, res) => {
    try {
      const incoming = req.body?.notifications;
      if (!Array.isArray(incoming)) {
        res.status(400).json({ error: 'notifications array required' });
        return;
      }
      const count = await syncNotifications(incoming);
      res.json({ ok: true, count });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.get('/api/advisories', async (_req, res) => {
    try {
      const advisoryRows = await listAdvisories();
      res.json({ advisories: advisoryRows });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  app.post('/api/advisories', async (req, res) => {
    try {
      const officer = await requireOfficer(req, res);
      if (!officer) return;

      const text = String(req.body?.text || '').trim();
      if (!text) {
        res.status(400).json({ error: 'Advisory text is required.' });
        return;
      }
      const entry = await createAdvisory({
        id: `b-${Date.now()}`,
        time: `Today · ${new Date().toLocaleTimeString('en-NG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })} WAT`,
        author: `${officer.name} (${officer.serviceId})`,
        text,
      });
      res.status(201).json({ advisory: entry });
    } catch (error) {
      sendSanitizedServerError(res, error);
    }
  });

  // Vite dev middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(viteServer.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`StreetFix server & Office Backend listening on http://0.0.0.0:${port}`);
  });
}

startServer();
