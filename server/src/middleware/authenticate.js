import { supabasePublic } from '../config/supabase.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const { data, error } = await supabasePublic.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired token' });

    req.user = data.user;
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}
