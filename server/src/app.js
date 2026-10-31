import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { authenticate } from './middleware/authenticate.js';
import { notFound, errorHandler } from './middleware/errors.js';
import authRoutes from './modules/auth/auth.routes.js';
import collegeRoutes from './modules/college/college.routes.js';
import gigRoutes from './modules/gigs/gigs.routes.js';
import orderRoutes from './modules/orders/orders.routes.js';
import applicationRoutes from './modules/applications/applications.routes.js';
import chatRoutes from './modules/chat/chat.routes.js';
import reviewRoutes from './modules/reviews/reviews.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN === '*' ? true : (process.env.CLIENT_ORIGIN || true) }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

// Public health check
app.get('/health', (req, res) => res.json({ ok: true, service: 'skillbridge-api', timestamp: new Date().toISOString() }));

// Public payment gateway webhook
app.post('/api/payments/webhook', (req, res, next) => {
  paymentRoutes(req, res, next);
});

// Authenticated API routes
app.use('/api', authenticate);
app.use('/api', authRoutes);
app.use('/api/college', collegeRoutes);
app.use('/api/gigs', gigRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);

// Convenience aliases matching documentation
app.get('/api/my/applications', (req, res) => res.redirect(307, '/api/applications/mine'));
app.get('/api/my/orders', (req, res) => res.redirect(307, '/api/orders/mine'));
app.get('/api/my/gigs', (req, res) => res.redirect(307, '/api/gigs/mine'));

app.use(notFound);
app.use(errorHandler);

export default app;
