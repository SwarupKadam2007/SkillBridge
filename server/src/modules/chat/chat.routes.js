import { Router } from 'express';
import { supabaseAdmin } from '../../config/supabase.js';
import { requireVerifiedCollege } from '../../middleware/collegeAccess.js';

const router = Router();

// 1. Get all conversations for current user
router.get('/conversations', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data: convs, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        id, gig_id, buyer_id, seller_id, created_at,
        gigs(id, title, category, price_paise),
        buyer:profiles!conversations_buyer_id_fkey(id, full_name, avatar_url, course),
        seller:profiles!conversations_seller_id_fkey(id, full_name, avatar_url, course)
      `)
      .or(`buyer_id.eq.${req.user.id},seller_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Attach latest message for each conversation
    const enriched = await Promise.all(
      (convs || []).map(async (conv) => {
        const { data: latestMsg } = await supabaseAdmin
          .from('messages')
          .select('id, sender_id, body, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const isBuyer = conv.buyer_id === req.user.id;
        const otherUser = isBuyer ? conv.seller : conv.buyer;

        return {
          ...conv,
          otherUser,
          latestMessage: latestMsg || null
        };
      })
    );

    res.json({ conversations: enriched });
  } catch (e) {
    next(e);
  }
});

// 2. Start or get an existing conversation for a gig
router.post('/conversations', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { gigId, recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ error: 'recipientId is required' });
    }
    if (recipientId === req.user.id) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself' });
    }

    // Check if conversation already exists (either orientation)
    let query = supabaseAdmin
      .from('conversations')
      .select(`
        id, gig_id, buyer_id, seller_id, created_at,
        gigs(id, title, category, price_paise),
        buyer:profiles!conversations_buyer_id_fkey(id, full_name, avatar_url, course),
        seller:profiles!conversations_seller_id_fkey(id, full_name, avatar_url, course)
      `);

    if (gigId) {
      query = query.eq('gig_id', gigId);
    }

    query = query.or(
      `and(buyer_id.eq.${req.user.id},seller_id.eq.${recipientId}),and(buyer_id.eq.${recipientId},seller_id.eq.${req.user.id})`
    );

    const { data: existing, error: findError } = await query.maybeSingle();
    if (findError) throw findError;

    if (existing) {
      return res.json({ conversation: existing });
    }

    // Create new conversation
    const { data: created, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        gig_id: gigId || null,
        buyer_id: req.user.id,
        seller_id: recipientId
      })
      .select(`
        id, gig_id, buyer_id, seller_id, created_at,
        gigs(id, title, category, price_paise),
        buyer:profiles!conversations_buyer_id_fkey(id, full_name, avatar_url, course),
        seller:profiles!conversations_seller_id_fkey(id, full_name, avatar_url, course)
      `)
      .single();

    if (createError) throw createError;
    res.status(201).json({ conversation: created });
  } catch (e) {
    next(e);
  }
});

// 3. Get message history for a conversation
router.get('/conversations/:id/messages', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { data: conv, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, buyer_id, seller_id')
      .eq('id', req.params.id)
      .single();

    if (convError || !conv) return res.status(404).json({ error: 'Conversation not found' });
    if (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select(`
        id, conversation_id, sender_id, body, created_at,
        profiles!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    res.json({ messages: messages || [] });
  } catch (e) {
    next(e);
  }
});

// 4. Send a message
router.post('/conversations/:id/messages', requireVerifiedCollege, async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const { data: conv, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, buyer_id, seller_id, gigs(title)')
      .eq('id', req.params.id)
      .single();

    if (convError || !conv) return res.status(404).json({ error: 'Conversation not found' });
    if (conv.buyer_id !== req.user.id && conv.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: req.params.id,
        sender_id: req.user.id,
        body: body.trim()
      })
      .select(`
        id, conversation_id, sender_id, body, created_at,
        profiles!messages_sender_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    // Send in-app notification to the recipient
    const recipientId = conv.buyer_id === req.user.id ? conv.seller_id : conv.buyer_id;
    await supabaseAdmin.from('notifications').insert({
      user_id: recipientId,
      title: 'New Campus Message 💬',
      body: body.trim().slice(0, 100)
    }).catch(() => {});

    res.status(201).json({ message });
  } catch (e) {
    next(e);
  }
});

export default router;

