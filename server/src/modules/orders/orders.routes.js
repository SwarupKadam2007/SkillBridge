import { Router } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import { requireVerifiedCollege } from '../../middleware/collegeAccess.js';

const router = Router();

// 1. Get all orders for current user (as buyer or seller)
router.get(['/', '/mine'], requireVerifiedCollege, async (req, res, next) => {
  try {
    const { role } = req.query; // 'buyer', 'seller', or empty for both
    let query = supabaseAdmin
      .from('orders')
      .select(`
        id, gig_id, buyer_id, seller_id, agreed_price_paise, status, due_at, created_at, updated_at,
        gigs(id, title, category, delivery_days),
        buyer:profiles!orders_buyer_id_fkey(id, full_name, avatar_url),
        seller:profiles!orders_seller_id_fkey(id, full_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (role === 'buyer') {
      query = query.eq('buyer_id', req.user.id);
    } else if (role === 'seller') {
      query = query.eq('seller_id', req.user.id);
    } else {
      query = query.or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ orders: data || [] });
  } catch (e) {
    next(e);
  }
});

// 2. Create order from gig
router.post('/', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { gigId, sellerId, priceRupees } = req.body;
    if (!gigId || !sellerId || !Number.isFinite(Number(priceRupees)) || Number(priceRupees) <= 0) {
      return res.status(400).json({ error: 'gigId, sellerId and valid priceRupees are required' });
    }
    if (sellerId === req.user.id) {
      return res.status(400).json({ error: 'Cannot hire yourself' });
    }

    const { data: gig, error: gigError } = await supabaseAdmin
      .from('gigs')
      .select('id, college_id, seller_id, status, delivery_days, title')
      .eq('id', gigId)
      .single();

    if (gigError || !gig || gig.college_id !== req.profile.college_id) {
      return res.status(400).json({ error: 'Gig is not available for this campus order' });
    }

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + (gig.delivery_days || 3));

    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        gig_id: gigId,
        buyer_id: req.user.id,
        seller_id: sellerId,
        college_id: req.profile.college_id,
        agreed_price_paise: Math.round(Number(priceRupees) * 100),
        status: 'awaiting_payment',
        due_at: dueAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Create initial escrow record
    await supabaseAdmin.from('escrow_transactions').insert({
      order_id: data.id,
      status: 'not_funded'
    }).catch(() => {});

    // Notify seller
    await supabaseAdmin.from('notifications').insert({
      user_id: sellerId,
      title: 'New Order Created',
      body: `A new order has been created for "${gig.title}".`
    }).catch(() => {});

    res.status(201).json({ order: data, message: 'Order created successfully' });
  } catch (e) {
    next(e);
  }
});

// 3. Get single order details with deliveries and escrow
router.get('/:id', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        gigs(id, title, category, description, delivery_days),
        buyer:profiles!orders_buyer_id_fkey(id, full_name, avatar_url, course),
        seller:profiles!orders_seller_id_fkey(id, full_name, avatar_url, course),
        deliveries(*),
        escrow_transactions(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied to this order' });
    }

    res.json({
      order,
      isBuyer: order.buyer_id === req.user.id,
      isSeller: order.seller_id === req.user.id
    });
  } catch (e) {
    next(e);
  }
});

// 4. Update order status (Delivery, Acceptance, Cancellation)
router.patch('/:id/status', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['funded', 'in_progress', 'delivered', 'accepted', 'cancelled', 'disputed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });

    const isBuyer = order.buyer_id === req.user.id;
    const isSeller = order.seller_id === req.user.id;
    if (!isBuyer && !isSeller) return res.status(403).json({ error: 'Access denied' });

    // Enforce role-based state transitions
    if (status === 'delivered' && !isSeller) {
      return res.status(403).json({ error: 'Only the seller can mark an order as delivered' });
    }
    if (status === 'accepted' && !isBuyer) {
      return res.status(403).json({ error: 'Only the buyer can accept and complete an order' });
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Handle Escrow transition on acceptance
    if (status === 'accepted') {
      await supabaseAdmin.from('escrow_transactions').update({
        status: 'released',
        released_at: new Date().toISOString()
      }).eq('order_id', req.params.id).catch(() => {});

      // Notify seller
      await supabaseAdmin.from('notifications').insert({
        user_id: order.seller_id,
        title: 'Order Completed & Payment Released! 🎉',
        body: `Buyer accepted your delivery! Funds (₹${(order.agreed_price_paise / 100).toFixed(0)}) have been released.`
      }).catch(() => {});
    }

    res.json({ message: `Order status updated to ${status}`, order: updatedOrder });
  } catch (e) {
    next(e);
  }
});

// 5. Submit work delivery
router.post('/:id/deliveries', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { note, filePath } = req.body;
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });
    if (order.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the seller can submit delivery for this order' });
    }

    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .insert({
        order_id: req.params.id,
        submitted_by: req.user.id,
        note: note || 'Work delivered as requested.',
        file_path: filePath || null
      })
      .select()
      .single();

    if (deliveryError) throw deliveryError;

    // Automatically transition order to 'delivered'
    await supabaseAdmin
      .from('orders')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    // Notify buyer
    await supabaseAdmin.from('notifications').insert({
      user_id: order.buyer_id,
      title: 'Order Delivered! 📦',
      body: 'The seller submitted the work delivery. Please review and accept.'
    }).catch(() => {});

    res.status(201).json({ message: 'Delivery submitted successfully', delivery });
  } catch (e) {
    next(e);
  }
});

// 6. Simulate Escrow Payment (for demo and local testing)
router.post('/:id/simulate-escrow', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the buyer can fund this order' });
    }

    // Update order status to 'funded'
    const { data: updatedOrder, error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'funded', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Update escrow
    await supabaseAdmin.from('escrow_transactions').upsert({
      order_id: req.params.id,
      status: 'funded',
      funded_at: new Date().toISOString()
    }, { onConflict: 'order_id' }).catch(() => {});

    // Notify seller
    await supabaseAdmin.from('notifications').insert({
      user_id: order.seller_id,
      title: 'Escrow Funded! 💰',
      body: `Buyer has deposited ₹${(order.agreed_price_paise / 100).toFixed(0)} into escrow. You can safely start work!`
    }).catch(() => {});

    res.json({
      message: 'Escrow funded successfully (simulated mode)',
      order: updatedOrder
    });
  } catch (e) {
    next(e);
  }
});

export default router;
