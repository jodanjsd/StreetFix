import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
  var _supabaseAdminClient: SupabaseClient | undefined;
  var _supabaseAdminConfigKey: string | undefined;
}

const PRIVATE_OR_LOCAL_HOST_PATTERN =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[::1\])/i;

function parseValidSupabaseUrl(rawUrl?: string): string | null {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed || trimmed.includes('MY_SUPABASE')) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return null;
    }
    const host = parsed.hostname.toLowerCase();
    if (PRIVATE_OR_LOCAL_HOST_PATTERN.test(host)) {
      return null;
    }
    if (!host.endsWith('.supabase.co') && !host.endsWith('.supabase.in')) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function getValidServiceRoleKey(rawKey?: string): string | null {
  const trimmed = (rawKey || '').trim();
  if (!trimmed || trimmed.includes('MY_SUPABASE')) {
    return null;
  }
  return trimmed;
}

export function isExternalSupabaseEnabled(): boolean {
  return Boolean(
    parseValidSupabaseUrl(process.env.SUPABASE_URL) &&
      getValidServiceRoleKey(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = parseValidSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = getValidServiceRoleKey(
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  const configKey = `${supabaseUrl}::${serviceRoleKey.slice(-8)}`;
  if (!global._supabaseAdminClient || global._supabaseAdminConfigKey !== configKey) {
    global._supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    global._supabaseAdminConfigKey = configKey;
  }

  return global._supabaseAdminClient;
}
