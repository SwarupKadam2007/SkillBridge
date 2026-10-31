import { Router } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';

const router = Router();

// Supabase Auth owns sign-in. This endpoint returns the app profile for a valid JWT.
router.get('/me', async (req, res, next) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id,full_name,username,avatar_url,bio,course,graduation_year,college_id,college_verified_at,colleges(id,name,slug)')
      .eq('id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        phone: req.user.phone,
        created_at: req.user.created_at
      },
      profile: profile || null
    });
  } catch (e) {
    next(e);
  }
});

// Update profile details
router.put('/me', async (req, res, next) => {
  try {
    const { full_name, username, bio, course, graduation_year, avatar_url } = req.body;
    
    const updates = {
      updated_at: new Date().toISOString()
    };
    if (typeof full_name === 'string') updates.full_name = full_name.trim();
    if (typeof username === 'string') updates.username = username.trim().toLowerCase();
    if (typeof bio === 'string') updates.bio = bio.trim();
    if (typeof course === 'string') updates.course = course.trim();
    if (graduation_year !== undefined) updates.graduation_year = Number(graduation_year) || null;
    if (typeof avatar_url === 'string') updates.avatar_url = avatar_url.trim();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select('id,full_name,username,avatar_url,bio,course,graduation_year,college_id,college_verified_at,colleges(id,name,slug)')
      .single();

    if (error) throw error;
    res.json({ message: 'Profile updated successfully', profile: data });
  } catch (e) {
    next(e);
  }
});

export default router;
