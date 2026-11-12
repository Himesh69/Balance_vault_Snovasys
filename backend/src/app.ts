import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import accountRoutes from './routes/account.routes.js';
import adminRoutes from './routes/admin.routes.js';

export const app = express();

// Security headers and CORS
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes (supporting both root and /api prefix)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/onboarding', onboardingRoutes);
app.use('/api/onboarding', onboardingRoutes);

app.use('/accounts', accountRoutes);
app.use('/api/accounts', accountRoutes);

app.use('/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

// Global error handler
app.use(errorHandler);

