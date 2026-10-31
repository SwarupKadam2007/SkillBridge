import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '\n⚠️  WARNING: Supabase environment variables are missing in server/.env.\n' +
    'Please copy server/.env.example to server/.env and provide:\n' +
    '  - SUPABASE_URL\n' +
    '  - SUPABASE_ANON_KEY\n' +
    '  - SUPABASE_SERVICE_ROLE_KEY\n'
  );
}

// Service-role client is SERVER ONLY. Never send this key to the mobile app.
export const supabaseAdmin = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

export const supabasePublic = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key'
);
