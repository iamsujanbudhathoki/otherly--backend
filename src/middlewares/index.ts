import compression from 'compression';
import cors from 'cors';
import express, { urlencoded } from 'express';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../../public/swagger.json';
import { DotenvConfig, Environment } from '../config/env.config';
import messages from '../constants/messages.constants';
import errorHandler from '../middlewares/errorhandler.middleware';
import { RegisterRoutes } from '../routes/routes';

export const configMiddleware = (app: express.Application) => {
  const allowedOrigins: (string | RegExp)[] =
    DotenvConfig.NODE_ENV === Environment.PRODUCTION
      ? [
          'https://stradmontsolutions.com',
          'https://www.stradmontsolutions.com',
          DotenvConfig.FRONTEND_BASE_URL,
        ]
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
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(express.json());
  app.use(compression());

  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 1000,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  app.use(limiter);

  app.use(
    urlencoded({
      extended: true,
    }),
  );

  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: messages.welcomeMessage,
      data: {
        service: 'Stradmont Solutions API',
        status: 'healthy',
        docs:
          DotenvConfig.NODE_ENV === Environment.DEVELOPMENT
            ? `${DotenvConfig.BASE_URL}/api-docs`
            : undefined,
      },
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  });

  if (DotenvConfig.NODE_ENV === Environment.DEVELOPMENT) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    app.get('/swagger-json', (_req, res) => res.json(swaggerDocument));
  }

  if (DotenvConfig.MEDIA_UPLOAD_PATH) {
    app.use(express.static(DotenvConfig.MEDIA_UPLOAD_PATH));
  }

  RegisterRoutes(app);
  app.use(errorHandler);
};
