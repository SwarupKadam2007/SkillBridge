import { Router } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import { requireVerifiedCollege } from '../../middleware/collegeAccess.js';

const router = Router();

// 1. Submit a review for a completed order
router.post('/', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!orderId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'orderId and an integer rating between 1 and 5 are required' });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, buyer_id, seller_id, status, gigs(title)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'accepted') {
      return res.status(400).json({ error: 'You can only review an order after delivery has been accepted and completed' });
    }

    const isBuyer = order.buyer_id === req.user.id;
    const isSeller = order.seller_id === req.user.id;
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'You are not a participant in this order' });
    }

    const revieweeId = isBuyer ? order.seller_id : order.buyer_id;

    const { data: review, error: reviewError } = await supabaseAdmin
      .from('reviews')
      .upsert({
        order_id: orderId,
        reviewer_id: req.user.id,
        reviewee_id: revieweeId,
        rating: numericRating,
        comment: (comment || '').trim() || null
      }, { onConflict: 'order_id,reviewer_id' })
      .select()
      .single();

    if (reviewError) throw reviewError;

    // Send notification to reviewee
    await supabaseAdmin.from('notifications').insert({
      user_id: revieweeId,
      title: 'New Review Received! ⭐',
      body: `You received a ${numericRating}-star review for "${order.gigs?.title || 'an order'}".`
    }).catch(() => {});

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (e) {
    next(e);
  }
});

// 2. Get reviews & reputation score for a student profile
router.get('/user/:userId', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select(`
        id, order_id, reviewer_id, rating, comment, created_at,
        reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url, course)
      `)
      .eq('reviewee_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const list = reviews || [];
    const totalCount = list.length;
    const averageRating = totalCount > 0
      ? (list.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1)
      : null;

    res.json({
      averageRating: averageRating ? Number(averageRating) : 5.0,
      totalReviews: totalCount,
      reviews: list
    });
  } catch (e) {
    next(e);
  }
});

// 3. Check if user already reviewed an order
router.get('/order/:orderId', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('order_id', req.params.orderId)
      .eq('reviewer_id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    res.json({ reviewed: Boolean(review), review: review || null });
  } catch (e) {
    next(e);
  }
});

export default router;

