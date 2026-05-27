'use strict';

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const path     = require('path');

const { connectDB }           = require('./src/config/db');
const routes                  = require('./src/routes');
const { notFoundHandler, globalErrorHandler } = require('./src/middlewares/error.middleware');
const { apiLimiter }          = require('./src/middlewares/rateLimiter.middleware');
const logger                  = require('./src/utils/logger');
const { initSocket }          = require('./src/services/socket.service');

// ─── App instance ─────────────────────────────────────────────────────────────
const app  = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploads
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders:   ['X-Total-Count'],
  credentials:      true,
  maxAge:           86400, // 24 hours preflight cache
}));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logging ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    { stream: { write: (msg) => logger.http(msg.trim()) } }
  ));
}

// ─── Static files (uploaded documents) ───────────────────────────────────────
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge:    '1d',
    etag:      true,
    lastModified: true,
  })
);

// ─── Global rate limiter ──────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Trust proxy (for accurate IP behind Nginx/load balancer) ─────────────────
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Root health check ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success:     true,
    name:        'Travelya Backend API',
    version:     '1.0.0',
    description: 'Super Travel App — Rides, Buses, Hotels',
    docs:        '/api/health',
    timestamp:   new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(globalErrorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const bootstrap = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀  Travelya API running on http://localhost:${PORT}`);
      logger.info(`🌍  Environment : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📦  Database    : ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    });

    // Initialize Socket.io
    initSocket(server);

    // ─── Graceful shutdown ───────────────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.warn(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        try {
          const { sequelize } = require('./src/config/db');
          await sequelize.close();
          logger.info('Database connection closed');
        } catch (err) {
          logger.error('Error closing DB connection', err);
        }
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Promise Rejection:', { reason: String(reason) });
    });

    // Uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', { message: err.message, stack: err.stack });
      process.exit(1);
    });

    return server;
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

bootstrap();

module.exports = app; // exported for testing
