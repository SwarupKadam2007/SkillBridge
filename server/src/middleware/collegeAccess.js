import { supabaseAdmin } from '../config/supabase.js';

export async function requireVerifiedCollege(req, res, next) {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles').select('college_id,college_verified_at').eq('id', req.user.id).single();
    if (error || !profile?.college_id || !profile?.college_verified_at) {
      return res.status(403).json({ error: 'Verify your college before using the marketplace' });
    }
    req.profile = profile;
    next();
  } catch (error) { next(error); }
}
