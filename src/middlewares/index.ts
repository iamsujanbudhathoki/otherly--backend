import crypto from 'crypto';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import compression from 'compression';
import cors from 'cors';
import express, { urlencoded } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../../public/swagger.json';
import { AppDataSource } from '../config/database.config';
import { DotenvConfig, Environment } from '../config/env.config';
import messages from '../constants/messages.constants';
import { buildGraphQLContext, GraphQLContext } from '../graphql/context';
import errorHandler from '../middlewares/errorhandler.middleware';
import { RegisterRoutes } from '../routes/routes';

export const configMiddleware = (
  app: express.Application,
  apolloServer?: ApolloServer<GraphQLContext>,
) => {
  // 1. HTTP Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy:
        DotenvConfig.NODE_ENV === Environment.PRODUCTION ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. Request Correlation ID
  app.use((req, res, next) => {
    const requestId =
      (req.headers['x-request-id'] as string) || crypto.randomUUID();
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  // 3. CORS Configuration
  const allowedOrigins: (string | RegExp)[] =
    DotenvConfig.NODE_ENV === Environment.PRODUCTION
      ? [DotenvConfig.FRONTEND_BASE_URL]
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:4000',
          'http://localhost:5173',
          DotenvConfig.FRONTEND_BASE_URL,
        ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.some((allowed) =>
          typeof allowed === 'string'
            ? allowed === origin
            : allowed.test(origin),
        );
        if (isAllowed || DotenvConfig.NODE_ENV !== Environment.PRODUCTION) {
          return callback(null, true);
        }
        return callback(new Error('CORS policy: Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    }),
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(compression());
  app.use(
    urlencoded({
      extended: true,
      limit: '10mb',
    }),
  );

  // 4. Tiered Rate Limiting
  // Global API rate limiter (1000 requests per 10 minutes)
  const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      data: null,
    },
  });
  app.use(globalLimiter);

  // Strict rate limiter for sensitive authentication endpoints (prevent brute-force)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 25, // 25 attempts per 15 minutes window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message:
        'Too many authentication attempts from this IP, please try again after 15 minutes.',
      data: null,
    },
  });
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/auth/forgot-password', authLimiter);
  app.use('/api/v1/auth/reset-password', authLimiter);
  app.use('/api/v1/admin/auth/login', authLimiter);

  // GraphQL rate limiter
  const graphqlLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many GraphQL operations. Please slow down.',
      data: null,
    },
  });
  app.use('/graphql', graphqlLimiter);

  // 5. Mount Apollo GraphQL middleware
  if (apolloServer) {
    app.use(
      '/graphql',
      expressMiddleware(apolloServer, {
        context: buildGraphQLContext,
      }),
    );
  }

  // Root endpoint
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: messages.welcomeMessage,
      data: {
        service: 'Marketplace API',
        status: 'healthy',
        docs:
          DotenvConfig.NODE_ENV === Environment.DEVELOPMENT
            ? `${DotenvConfig.BASE_URL}/api-docs`
            : undefined,
        graphql: `${DotenvConfig.BASE_URL}/graphql`,
      },
    });
  });

  // 6. Deep Health check probe
  app.get('/health', async (_req, res) => {
    const isDbConnected = AppDataSource.isInitialized;
    const statusCode = isDbConnected ? 200 : 503;

    res.status(statusCode).json({
      success: isDbConnected,
      message: isDbConnected
        ? 'Service is healthy'
        : 'Database connection unavailable',
      data: {
        status: isDbConnected ? 'ok' : 'degraded',
        database: isDbConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Swagger Documentation (dev only)
  if (DotenvConfig.NODE_ENV === Environment.DEVELOPMENT) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.get('/swagger-json', (_req, res) => res.json(swaggerDocument));
  }

  // Static uploads
  if (DotenvConfig.MEDIA_UPLOAD_PATH) {
    app.use(express.static(DotenvConfig.MEDIA_UPLOAD_PATH));
  }

  // Register REST routes and error handling
  RegisterRoutes(app);
  app.use(errorHandler);
};
