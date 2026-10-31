import { Router } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import { requireVerifiedCollege } from '../../middleware/collegeAccess.js';
import { validateAcademicIntegrity } from '../../middleware/academicIntegrity.js';

const router = Router();

// 1. Get gigs for user's college
router.get('/', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let query = supabaseAdmin
      .from('gigs')
      .select('id, title, description, category, price_paise, delivery_days, status, created_at, seller_id, profiles!gigs_seller_id_fkey(id, full_name, avatar_url, course)')
      .eq('college_id', req.profile.college_id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50);

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ gigs: data || [] });
  } catch (e) {
    next(e);
  }
});

// 2. Get my posted gigs
router.get('/mine', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('gigs')
      .select(`
        id, title, description, category, price_paise, delivery_days, status, created_at,
        applications(id, status)
      `)
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach application summary count
    const enriched = (data || []).map(gig => ({
      ...gig,
      applicant_count: gig.applications ? gig.applications.length : 0,
      pending_count: gig.applications ? gig.applications.filter(a => a.status === 'pending').length : 0
    }));

    res.json({ gigs: enriched });
  } catch (e) {
    next(e);
  }
});

// 3. Post a new gig
router.post('/', requireVerifiedCollege, validateAcademicIntegrity, async (req, res, next) => {
  try {
    const { title, description, category, priceRupees, deliveryDays } = req.body;
    if (
      !title || title.trim().length < 5 ||
      !description || description.trim().length < 10 ||
      !category ||
      !Number.isFinite(Number(priceRupees)) || Number(priceRupees) <= 0 ||
      !Number.isInteger(Number(deliveryDays)) || Number(deliveryDays) < 1
    ) {
      return res.status(400).json({
        error: 'Please provide valid title (min 5 chars), description (min 10 chars), category, positive price, and delivery days (>=1).'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('gigs')
      .insert({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        price_paise: Math.round(Number(priceRupees) * 100),
        delivery_days: Number(deliveryDays),
        seller_id: req.user.id,
        college_id: req.profile.college_id,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ gig: data });
  } catch (e) {
    next(e);
  }
});

// 4. Get a single gig by ID
router.get('/:id', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data: gig, error } = await supabaseAdmin
      .from('gigs')
      .select('*, profiles!gigs_seller_id_fkey(id, full_name, avatar_url, bio, course, graduation_year)')
      .eq('id', req.params.id)
      .eq('college_id', req.profile.college_id)
      .single();

    if (error || !gig) return res.status(404).json({ error: 'Gig not found or not in your campus' });

    // Check if the current user has already applied
    const { data: existingApp } = await supabaseAdmin
      .from('applications')
      .select('id, status, created_at')
      .eq('gig_id', req.params.id)
      .eq('applicant_id', req.user.id)
      .maybeSingle();

    res.json({
      gig,
      isOwner: gig.seller_id === req.user.id,
      myApplication: existingApp || null
    });
  } catch (e) {
    next(e);
  }
});

// 5. Get applications for a gig (Owner only)
router.get('/:id/applications', requireVerifiedCollege, async (req, res, next) => {
  try {
    // Verify user is the seller
    const { data: gig, error: gigError } = await supabaseAdmin
      .from('gigs')
      .select('id, seller_id, title')
      .eq('id', req.params.id)
      .single();

    if (gigError || !gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the gig poster can view applications' });
    }

    const { data: applications, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id, gig_id, applicant_id, message, status, created_at, profiles!applications_applicant_id_fkey(id, full_name, avatar_url, bio, course, graduation_year)')
      .eq('gig_id', req.params.id)
      .order('created_at', { ascending: false });

    if (appError) throw appError;
    res.json({ applications: applications || [], gigTitle: gig.title });
  } catch (e) {
    next(e);
  }
});

// 6. Apply to a gig
router.post('/:id/applications', requireVerifiedCollege, validateAcademicIntegrity, async (req, res, next) => {
  try {
    const { message = '' } = req.body;
    const { data: gig, error: gigError } = await supabaseAdmin
      .from('gigs')
      .select('id, seller_id, college_id, status, title')
      .eq('id', req.params.id)
      .single();

    if (gigError || !gig || gig.college_id !== req.profile.college_id || gig.status !== 'open') {
      return res.status(404).json({ error: 'Gig is unavailable or closed' });
    }
    if (gig.seller_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot apply to your own gig' });
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        gig_id: gig.id,
        applicant_id: req.user.id,
        message: message.trim() || 'I am interested in completing this gig.'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'You have already applied for this gig' });
      }
      throw error;
    }

    // Send in-app notification to seller
    await supabaseAdmin.from('notifications').insert({
      user_id: gig.seller_id,
      title: 'New Gig Application',
      body: `A student applied to your gig "${gig.title}".`
    }).catch(() => {});

    res.status(201).json({ application: data, message: 'Application submitted successfully' });
  } catch (e) {
    next(e);
  }
});

// 7. Update gig status (Owner only)
router.patch('/:id', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { status, title, description, priceRupees, deliveryDays } = req.body;
    const { data: gig, error: gigError } = await supabaseAdmin
      .from('gigs')
      .select('id, seller_id')
      .eq('id', req.params.id)
      .single();

    if (gigError || !gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the gig poster can update this listing' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (status && ['open', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      updates.status = status;
    }
    if (title) updates.title = title.trim();
    if (description) updates.description = description.trim();
    if (priceRupees) updates.price_paise = Math.round(Number(priceRupees) * 100);
    if (deliveryDays) updates.delivery_days = Number(deliveryDays);

    const { data, error } = await supabaseAdmin
      .from('gigs')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ gig: data });
  } catch (e) {
    next(e);
  }
});

export default router;
