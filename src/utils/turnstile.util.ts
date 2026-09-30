import { DotenvConfig } from '../config/env.config';
import { logger } from '../config/logger.config';
import messages from '../constants/messages.constants';
import { AppError } from './appError.util';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export class TurnstileUtil {
  static isConfigured(): boolean {
    return Boolean(DotenvConfig.TURNSTILE_SECRET_KEY);
  }

  /**
   * Verifies a Cloudflare Turnstile token against Cloudflare's siteverify endpoint.
   * When `TURNSTILE_SECRET_KEY` is configured, a valid token is mandatory.
   */
  static async verifyToken(
    token?: string,
    remoteIp?: string,
  ): Promise<boolean> {
    if (!this.isConfigured()) {
      return true;
    }

    if (!token || !token.trim()) {
      throw AppError.badRequest(messages.turnstileRequired);
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', DotenvConfig.TURNSTILE_SECRET_KEY);
      formData.append('response', token.trim());
      if (remoteIp) {
        formData.append('remoteip', remoteIp);
      }

      const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const result = (await response.json()) as TurnstileVerifyResponse;

      if (!result.success) {
        logger.warn(
          `Cloudflare Turnstile verification failed: ${(result['error-codes'] || []).join(', ')}`,
        );
        throw AppError.badRequest(messages.turnstileFailed);
      }

      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error verifying Cloudflare Turnstile token', error);
      throw AppError.badRequest(messages.turnstileFailed);
    }
  }
}
