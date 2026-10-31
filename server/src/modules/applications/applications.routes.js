import { Router } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import { requireVerifiedCollege } from '../../middleware/collegeAccess.js';

const router = Router();

// 1. Get all applications made by the current user
router.get('/mine', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select(`
        id, gig_id, message, status, created_at,
        gigs(id, title, category, price_paise, delivery_days, status, seller_id, profiles!gigs_seller_id_fkey(id, full_name, avatar_url))
      `)
      .eq('applicant_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ applications: data || [] });
  } catch (e) {
    next(e);
  }
});

// 2. Accept, reject or withdraw an application
router.patch('/:id', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected', 'withdrawn'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted, rejected, or withdrawn' });
    }

    // Fetch the application and the related gig
    const { data: app, error: appError } = await supabaseAdmin
      .from('applications')
      .select('id, gig_id, applicant_id, status, gigs(id, seller_id, college_id, price_paise, status, title)')
      .eq('id', req.params.id)
      .single();

    if (appError || !app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const gig = app.gigs;

    // Applicant can withdraw
    if (status === 'withdrawn') {
      if (app.applicant_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only withdraw your own application' });
      }
    } else {
      // Seller can accept or reject
      if (gig.seller_id !== req.user.id) {
        return res.status(403).json({ error: 'Only the gig poster can accept or reject applications' });
      }
    }

    // Update status
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from('applications')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    let createdOrder = null;

    // If accepted, automatically initialize an order between the buyer (gig poster) and seller (applicant)
    // Note: in a gig where buyer posts "Need a designer", the poster is buyer, applicant is seller.
    // Or if a student sells a gig "I will build website", poster is seller, applicant is buyer.
    if (status === 'accepted') {
      // Create order
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          gig_id: gig.id,
          buyer_id: gig.seller_id, // poster is hiring applicant
          seller_id: app.applicant_id,
          college_id: req.profile.college_id,
          agreed_price_paise: gig.price_paise,
          status: 'awaiting_payment'
        })
        .select()
        .single();

      if (!orderError) {
        createdOrder = order;
      }

      // Notify the applicant
      await supabaseAdmin.from('notifications').insert({
        user_id: app.applicant_id,
        title: 'Application Accepted! 🎉',
        body: `Your application for "${gig.title}" was accepted!`
      }).catch(() => {});
    }

    res.json({
      message: `Application marked as ${status}`,
      application: updatedApp,
      order: createdOrder
    });
  } catch (e) {
    next(e);
  }
});

export default router;

