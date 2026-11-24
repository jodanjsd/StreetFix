import { db } from './index.ts';
import { users } from './schema.ts';
import { getSupabaseAdmin } from './supabase.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string
) {
  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const payload: { uid: string; email: string; display_name?: string | null } = {
        uid,
        email,
        ...(displayName ? { display_name: displayName } : {}),
      };
      const { data, error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'uid' })
        .select('id, uid, email, display_name, role, created_at')
        .single();

      if (error) throw error;
      return {
        id: data.id as number,
        uid: data.uid as string,
        email: data.email as string,
        displayName: (data.display_name as string | null) ?? null,
        role: (data.role as string) || 'resident',
        createdAt: data.created_at ? new Date(data.created_at as string) : null,
      };
    }

    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName ? { displayName } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}
