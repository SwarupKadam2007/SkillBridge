import { Router } from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../../config/supabase.js';
import { requireVerifiedCollege } from '../../middleware/collegeAccess.js';

const router = Router();

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

// 1. Create a payment gateway order (Razorpay or Campus Escrow Checkout)
router.post('/create-order', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, buyer_id, seller_id, agreed_price_paise, status, gigs(title)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the buyer can initiate escrow payment' });
    }
    if (order.status !== 'awaiting_payment') {
      return res.status(400).json({ error: `Order is already in '${order.status}' status` });
    }

    // Check if live Razorpay keys are configured
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader
        },
        body: JSON.stringify({
          amount: order.agreed_price_paise,
          currency: 'INR',
          receipt: `sb_${order.id.slice(0, 10)}`,
          notes: {
            orderId: order.id,
            buyerId: req.user.id
          }
        })
      });

      const rzpData = await rzpResponse.json();
      if (!rzpResponse.ok) {
        throw new Error(rzpData.error?.description || 'Razorpay order creation failed');
      }

      return res.json({
        provider: 'razorpay',
        keyId: RAZORPAY_KEY_ID,
        amountPaise: order.agreed_price_paise,
        razorpayOrderId: rzpData.id,
        order
      });
    }

    // Fallback: Campus Escrow Checkout (Built-in Simulated Mode for instant testing without KYC)
    const simulatedPaymentId = 'pay_sim_' + crypto.randomBytes(8).toString('hex');

    res.json({
      provider: 'campus_escrow',
      isSimulated: true,
      amountPaise: order.agreed_price_paise,
      paymentId: simulatedPaymentId,
      message: 'Payment order created with Campus Escrow Safe Vault.',
      order
    });
  } catch (e) {
    next(e);
  }
});

// 2. Verify payment & lock funds into Escrow
router.post('/verify', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { orderId, paymentId, razorpayOrderId, razorpaySignature } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, buyer_id, seller_id, agreed_price_paise, status, gigs(title)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the buyer can verify payment' });
    }

    // If Razorpay signature provided, verify cryptographically
    if (razorpaySignature && RAZORPAY_KEY_SECRET && razorpayOrderId) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ error: 'Invalid payment signature verification' });
      }
    }

    const effectivePaymentId = paymentId || `pay_${crypto.randomBytes(8).toString('hex')}`;

    // 1. Record payment
    const { data: paymentRecord, error: payError } = await supabaseAdmin
      .from('payments')
      .upsert({
        order_id: order.id,
        provider: razorpaySignature ? 'razorpay' : 'campus_escrow',
        provider_payment_id: effectivePaymentId,
        amount_paise: order.agreed_price_paise,
        status: 'paid'
      }, { onConflict: 'order_id' })
      .select()
      .single();

    if (payError) throw payError;

    // 2. Transition order status to 'funded'
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'funded',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Update Escrow status to 'funded'
    await supabaseAdmin
      .from('escrow_transactions')
      .upsert({
        order_id: order.id,
        payment_id: paymentRecord.id,
        status: 'funded',
        funded_at: new Date().toISOString()
      }, { onConflict: 'order_id' });

    // 4. Notify seller
    await supabaseAdmin.from('notifications').insert({
      user_id: order.seller_id,
      title: 'Payment Escrowed! 💰',
      body: `Buyer deposited ₹${(order.agreed_price_paise / 100).toFixed(0)} into escrow for "${order.gigs?.title || 'Gig'}". You can safely start work!`
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Payment verified and deposited into Escrow! Seller has been notified.',
      order: updatedOrder,
      payment: paymentRecord
    });
  } catch (e) {
    next(e);
  }
});

// 3. Webhook receiver for Razorpay / payment gateway events
router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (webhookSecret && signature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== signature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    console.log(`Payment Webhook Event received: ${event}`);

    res.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

export default router;

