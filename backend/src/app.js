import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env.js';
import { query } from './config/db.js';
import apiRoutes from './routes/index.js';
import { auditLogger } from './middleware/auditLogger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { asyncHandler } from './utils/asyncHandler.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.corsOrigin.split(',').map(origin => origin.trim()),
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use('/uploads', express.static(path.resolve(env.uploadsDir)));
app.use(auditLogger);

app.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await query('SELECT 1');
    res.json({ status: 'ok', service: 'volunteer-management-api' });
  })
);

app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
