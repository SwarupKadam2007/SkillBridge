import { Router } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import { requireVerifiedCollege } from '../../middleware/collegeAccess.js';

const router = Router();

// 1. Get all notifications for current user
router.get('/', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, title, body, read_at, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const unreadCount = (data || []).filter(n => !n.read_at).length;
    res.json({ notifications: data || [], unreadCount });
  } catch (e) {
    next(e);
  }
});

// 2. Mark a notification as read
router.patch('/:id/read', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ notification: data });
  } catch (e) {
    next(e);
  }
});

// 3. Mark all notifications as read
router.post('/read-all', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', req.user.id)
      .is('read_at', null);

    if (error) throw error;
    res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    next(e);
  }
});

export default router;

