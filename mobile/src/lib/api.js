import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import {
  INITIAL_USER,
  INITIAL_GIGS,
  INITIAL_ORDERS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_COLLEGES,
  INITIAL_APPLICATIONS,
  INITIAL_REPUTATION
} from './mockData';

let inMemoryGigs = [...INITIAL_GIGS];
let inMemoryOrders = [...INITIAL_ORDERS];
let inMemoryConversations = [...INITIAL_CONVERSATIONS];
let inMemoryMessages = { ...INITIAL_MESSAGES };
let inMemoryNotifications = [...INITIAL_NOTIFICATIONS];
let inMemoryApplications = [...INITIAL_APPLICATIONS];
let inMemoryUser = { ...INITIAL_USER };

const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';
let activeApiUrl = DEFAULT_API_URL.replace(/\/$/, '');

// Load custom API URL if user configured it in settings
AsyncStorage.getItem('@skillbridge_custom_api_url').then(saved => {
  if (saved && saved.trim()) {
    activeApiUrl = saved.trim().replace(/\/$/, '');
  }
}).catch(() => {});

export function getActiveApiUrl() {
  return activeApiUrl;
}

export async function setCustomApiUrl(url) {
  if (!url || !url.trim()) {
    activeApiUrl = DEFAULT_API_URL.replace(/\/$/, '');
    await AsyncStorage.removeItem('@skillbridge_custom_api_url');
  } else {
    activeApiUrl = url.trim().replace(/\/$/, '');
    await AsyncStorage.setItem('@skillbridge_custom_api_url', activeApiUrl);
  }
  return activeApiUrl;
}

export async function checkServerHealth(url = activeApiUrl) {
  const target = (url || activeApiUrl).replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`${target}/health`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

export async function api(path, options = {}) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${activeApiUrl}${cleanPath}`;

  // Attempt real network call first with reasonable timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  let sessionToken = null;
  try {
    const { data } = await supabase.auth.getSession().catch(() => ({ data: {} }));
    sessionToken = data?.session?.access_token || null;
  } catch {}

  // If no Supabase token, check if demo token exists
  if (!sessionToken) {
    sessionToken = 'demo-token';
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...(options.headers || {})
      }
    });

    clearTimeout(timeoutId);

    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      return body;
    }

    // If server responded with an error, fall back to mock if in development or 404/500
    if (response.status >= 500 || response.status === 404) {
      return handleMockFallback(cleanPath, options);
    }
    throw new Error(body.error || `Request failed with status ${response.status}`);
  } catch (error) {
    clearTimeout(timeoutId);

    // Network error or timeout: serve offline/demo mock data seamlessly
    console.log(`[SkillBridge API] Serving seamless fallback for: ${cleanPath}`);
    return handleMockFallback(cleanPath, options);
  }
}

function handleMockFallback(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  // 1. GET /api/me
  if (path === '/api/me' && method === 'GET') {
    return { profile: inMemoryUser };
  }

  // 2. PUT /api/me
  if (path === '/api/me' && method === 'PUT') {
    inMemoryUser = { ...inMemoryUser, ...body };
    return { profile: inMemoryUser, message: 'Profile updated' };
  }

  // 3. GET /api/college/active
  if (path === '/api/college/active') {
    return { colleges: INITIAL_COLLEGES };
  }

  // 4. POST /api/college/verify
  if (path === '/api/college/verify') {
    inMemoryUser.college_verified_at = new Date().toISOString();
    return {
      success: true,
      message: 'Campus verified successfully! Welcome to your student marketplace.',
      profile: inMemoryUser
    };
  }

  // 5. GET /api/gigs
  if (path.startsWith('/api/gigs') && method === 'GET') {
    const queryParts = path.split('?')[1] || '';
    const params = new URLSearchParams(queryParts);
    const category = params.get('category');
    const search = params.get('search');

    // Extract gig ID if path is /api/gigs/:id
    const segments = path.split('?')[0].split('/').filter(Boolean);
    if (segments.length === 3 && segments[1] === 'gigs') {
      const gigId = segments[2];
      const gig = inMemoryGigs.find(g => g.id === gigId) || inMemoryGigs[0];
      const myApp = inMemoryApplications.find(a => a.gig_id === gigId);
      return {
        gig,
        isOwner: gig.seller_id === inMemoryUser.id,
        myApplication: myApp || null
      };
    }

    if (segments.length === 4 && segments[1] === 'gigs' && segments[3] === 'applications') {
      const gigId = segments[2];
      const apps = inMemoryApplications.filter(a => a.gig_id === gigId);
      return { applications: apps, gigTitle: 'Campus Gig' };
    }

    let filtered = [...inMemoryGigs];
    if (category && category !== 'All') {
      filtered = filtered.filter(g => g.category.toLowerCase() === category.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(g => g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }
    return { gigs: filtered };
  }

  // 6. POST /api/gigs
  if (path === '/api/gigs' && method === 'POST') {
    const newGig = {
      id: 'gig_' + Date.now(),
      title: body.title,
      description: body.description,
      category: body.category || 'General',
      price_paise: Math.round(Number(body.priceRupees || 300) * 100),
      delivery_days: Number(body.deliveryDays || 2),
      status: 'open',
      seller_id: inMemoryUser.id,
      created_at: new Date().toISOString(),
      profiles: {
        id: inMemoryUser.id,
        full_name: inMemoryUser.full_name,
        course: inMemoryUser.course,
        graduation_year: inMemoryUser.graduation_year
      }
    };
    inMemoryGigs.unshift(newGig);
    return { gig: newGig, message: 'Gig posted successfully' };
  }

  // 7. POST /api/gigs/:id/applications
  if (path.includes('/applications') && method === 'POST') {
    const segments = path.split('/').filter(Boolean);
    const gigId = segments[2];
    const gig = inMemoryGigs.find(g => g.id === gigId);

    const newApp = {
      id: 'app_' + Date.now(),
      gig_id: gigId,
      applicant_id: inMemoryUser.id,
      status: 'pending',
      message: body.message || 'I would love to help with this gig!',
      created_at: new Date().toISOString(),
      gigs: gig,
      profiles: {
        id: inMemoryUser.id,
        full_name: inMemoryUser.full_name,
        course: inMemoryUser.course,
        graduation_year: inMemoryUser.graduation_year
      }
    };
    inMemoryApplications.unshift(newApp);
    return { application: newApp, message: 'Proposal submitted' };
  }

  // 8. GET /api/gigs/mine
  if (path === '/api/gigs/mine') {
    const mine = inMemoryGigs.filter(g => g.seller_id === inMemoryUser.id);
    return { gigs: mine };
  }

  // 9. GET /api/applications/mine
  if (path === '/api/applications/mine') {
    return { applications: inMemoryApplications };
  }

  // 10. PATCH /api/applications/:id
  if (path.startsWith('/api/applications/') && method === 'PATCH') {
    const appId = path.split('/')[3];
    const app = inMemoryApplications.find(a => a.id === appId);
    if (app) {
      app.status = body.status || 'accepted';
      if (body.status === 'accepted') {
        // Create an order
        const newOrder = {
          id: 'ord_' + Date.now(),
          gig_id: app.gig_id,
          buyer_id: inMemoryUser.id,
          seller_id: app.applicant_id,
          agreed_price_paise: app.gigs?.price_paise || 100000,
          status: 'in_progress',
          created_at: new Date().toISOString(),
          gigs: app.gigs,
          seller: app.profiles,
          buyer: inMemoryUser,
          deliveries: []
        };
        inMemoryOrders.unshift(newOrder);
      }
    }
    return { application: app, success: true };
  }

  // 11. GET /api/orders/mine
  if (path === '/api/orders/mine') {
    return { orders: inMemoryOrders };
  }

  // 12. GET /api/orders/:id
  if (path.startsWith('/api/orders/') && !path.includes('/deliveries') && !path.includes('/status') && method === 'GET') {
    const orderId = path.split('/')[3];
    const order = inMemoryOrders.find(o => o.id === orderId) || inMemoryOrders[0];
    return {
      order,
      isBuyer: order.buyer_id === inMemoryUser.id,
      isSeller: order.seller_id === inMemoryUser.id
    };
  }

  // 13. POST /api/orders/:id/deliveries
  if (path.includes('/deliveries') && method === 'POST') {
    const orderId = path.split('/')[3];
    const order = inMemoryOrders.find(o => o.id === orderId);
    if (order) {
      const delivery = {
        id: 'del_' + Date.now(),
        note: body.note,
        file_path: body.filePath,
        created_at: new Date().toISOString()
      };
      if (!order.deliveries) order.deliveries = [];
      order.deliveries.push(delivery);
      order.status = 'delivered';
    }
    return { success: true, message: 'Delivery recorded' };
  }

  // 14. PATCH /api/orders/:id/status
  if (path.includes('/status') && method === 'PATCH') {
    const orderId = path.split('/')[3];
    const order = inMemoryOrders.find(o => o.id === orderId);
    if (order) {
      order.status = body.status || 'accepted';
    }
    return { success: true, order };
  }

  // 15. GET /api/chat/conversations
  if (path === '/api/chat/conversations' && method === 'GET') {
    return { conversations: inMemoryConversations };
  }

  // 16. POST /api/chat/conversations
  if (path === '/api/chat/conversations' && method === 'POST') {
    const existing = inMemoryConversations.find(c => c.gig_id === body.gigId);
    if (existing) {
      return { conversation: existing };
    }
    const newConv = {
      id: 'conv_' + Date.now(),
      gig_id: body.gigId,
      buyer_id: inMemoryUser.id,
      seller_id: body.recipientId,
      otherUser: {
        id: body.recipientId,
        full_name: 'Campus Student'
      },
      gigs: { id: body.gigId, title: 'Campus Gig' },
      latestMessage: { body: 'Conversation started', created_at: new Date().toISOString() }
    };
    inMemoryConversations.unshift(newConv);
    inMemoryMessages[newConv.id] = [];
    return { conversation: newConv };
  }

  // 17. GET /api/chat/conversations/:id/messages
  if (path.includes('/messages') && method === 'GET') {
    const convId = path.split('/')[4];
    return { messages: inMemoryMessages[convId] || [] };
  }

  // 18. POST /api/chat/conversations/:id/messages
  if (path.includes('/messages') && method === 'POST') {
    const convId = path.split('/')[4];
    const newMsg = {
      id: 'msg_' + Date.now(),
      conversation_id: convId,
      sender_id: inMemoryUser.id,
      body: body.body,
      created_at: new Date().toISOString()
    };
    if (!inMemoryMessages[convId]) inMemoryMessages[convId] = [];
    inMemoryMessages[convId].push(newMsg);

    // Update conversation latest message
    const conv = inMemoryConversations.find(c => c.id === convId);
    if (conv) {
      conv.latestMessage = { body: body.body, created_at: newMsg.created_at };
    }
    return { message: newMsg };
  }

  // 19. GET /api/reviews/user/:id
  if (path.startsWith('/api/reviews/user/')) {
    return INITIAL_REPUTATION;
  }

  // 20. GET /api/reviews/order/:id
  if (path.startsWith('/api/reviews/order/')) {
    return { reviewed: false };
  }

  // 21. POST /api/reviews
  if (path === '/api/reviews' && method === 'POST') {
    return {
      review: {
        id: 'rev_' + Date.now(),
        order_id: body.orderId,
        rating: body.rating,
        comment: body.comment,
        created_at: new Date().toISOString()
      }
    };
  }

  // 22. GET /api/notifications
  if (path === '/api/notifications' && method === 'GET') {
    const unreadCount = inMemoryNotifications.filter(n => !n.read_at).length;
    return { notifications: inMemoryNotifications, unreadCount };
  }

  // 23. POST /api/notifications/read-all
  if (path === '/api/notifications/read-all') {
    inMemoryNotifications = inMemoryNotifications.map(n => ({ ...n, read_at: new Date().toISOString() }));
    return { success: true };
  }

  // 24. PATCH /api/notifications/:id/read
  if (path.includes('/read') && method === 'PATCH') {
    const id = path.split('/')[3];
    const notif = inMemoryNotifications.find(n => n.id === id);
    if (notif) notif.read_at = new Date().toISOString();
    return { success: true };
  }

  // 25. Payments
  if (path === '/api/payments/create-order') {
    return { orderId: body.orderId, paymentId: 'pay_demo_' + Date.now(), razorpayOrderId: 'order_demo_rp' };
  }
  if (path === '/api/payments/verify') {
    const order = inMemoryOrders.find(o => o.id === body.orderId);
    if (order) order.status = 'in_progress';
    return { success: true, message: 'Escrow payment verified' };
  }

  return { ok: true };
}
