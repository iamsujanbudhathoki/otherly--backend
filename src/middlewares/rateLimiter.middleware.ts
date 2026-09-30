import { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';

export const contactRateLimiter: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 submissions per 15 minutes per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'Too many contact requests from this IP. Please try again after 15 minutes.',
  },
});
