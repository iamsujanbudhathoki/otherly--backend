import crypto from 'crypto';
import { autoInjectable } from 'tsyringe';
import { AppError } from '../../utils/appError.util';
import { RedisUtil } from '../../utils/redis.util';
import { SmsService } from '../sms/sms.service';

interface InMemoryOtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  cooldownUntil: number;
}

@autoInjectable()
export class OtpService {
  private inMemoryOtpStore = new Map<string, InMemoryOtpRecord>();
  private readonly OTP_TTL_SECONDS = 300; // 5 minutes
  private readonly COOLDOWN_SECONDS = 60; // 1 minute between sends
  private readonly MAX_ATTEMPTS = 5;

  constructor(private smsService?: SmsService) {}

  /**
   * Generates a secure 6-digit numeric OTP.
   */
  private generateOtpCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Normalizes a phone number to standard format (removes spaces, dashes, etc.).
   */
  public normalizePhoneNumber(phone: string): string {
    const trimmed = phone.trim().replace(/[\s\-()]/g, '');
    if (!trimmed) {
      throw AppError.badRequest('Invalid phone number provided');
    }
    return trimmed;
  }

  /**
   * Generates and dispatches an OTP to the given phone number.
   * Enforces cooldown and records TTL.
   */
  async sendOtp(rawPhoneNumber: string): Promise<{
    success: boolean;
    cooldownSeconds: number;
    otp: string;
  }> {
    const phoneNumber = this.normalizePhoneNumber(rawPhoneNumber);
    const redis = RedisUtil.redis;

    // 1. Check cooldown
    if (redis && redis.status === 'ready') {
      const cooldown = await redis.get(`otp:cooldown:${phoneNumber}`);
      if (cooldown) {
        const remainingTtl = await redis.ttl(`otp:cooldown:${phoneNumber}`);
        throw AppError.badRequest(
          `Please wait ${remainingTtl > 0 ? remainingTtl : 60} seconds before requesting another code.`,
        );
      }
    } else {
      const existing = this.inMemoryOtpStore.get(phoneNumber);
      if (existing && Date.now() < existing.cooldownUntil) {
        const remaining = Math.ceil(
          (existing.cooldownUntil - Date.now()) / 1000,
        );
        throw AppError.badRequest(
          `Please wait ${remaining} seconds before requesting another code.`,
        );
      }
    }

    const otp = this.generateOtpCode();

    // 2. Persist OTP and cooldown
    if (redis && redis.status === 'ready') {
      await redis.set(
        `otp:code:${phoneNumber}`,
        otp,
        'EX',
        this.OTP_TTL_SECONDS,
      );
      await redis.set(
        `otp:cooldown:${phoneNumber}`,
        '1',
        'EX',
        this.COOLDOWN_SECONDS,
      );
      await redis.del(`otp:attempts:${phoneNumber}`);
    } else {
      this.inMemoryOtpStore.set(phoneNumber, {
        otp,
        expiresAt: Date.now() + this.OTP_TTL_SECONDS * 1000,
        attempts: 0,
        cooldownUntil: Date.now() + this.COOLDOWN_SECONDS * 1000,
      });
    }

    // 3. Dispatch via SMS service
    await this.smsService!.sendOtp(phoneNumber, otp);

    return {
      success: true,
      cooldownSeconds: this.COOLDOWN_SECONDS,
      otp,
    };
  }

  /**
   * Verifies an OTP submitted for a phone number.
   * Tracks failed attempts and invalidates on success or attempt limit.
   */
  async verifyOtp(rawPhoneNumber: string, code: string): Promise<boolean> {
    const phoneNumber = this.normalizePhoneNumber(rawPhoneNumber);
    const cleanOtp = code.trim();
    const redis = RedisUtil.redis;

    if (redis && redis.status === 'ready') {
      const storedOtp = await redis.get(`otp:code:${phoneNumber}`);
      if (!storedOtp) {
        throw AppError.badRequest(
          'Verification code has expired or was never requested.',
        );
      }

      const attempts = await redis.incr(`otp:attempts:${phoneNumber}`);
      if (attempts > this.MAX_ATTEMPTS) {
        await redis.del(`otp:code:${phoneNumber}`);
        await redis.del(`otp:attempts:${phoneNumber}`);
        throw AppError.badRequest(
          'Maximum attempts exceeded. Please request a new verification code.',
        );
      }

      if (storedOtp !== cleanOtp) {
        const remainingAttempts = this.MAX_ATTEMPTS - attempts;
        throw AppError.badRequest(
          `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
        );
      }

      // Valid OTP -> consume and clean up
      await redis.del(`otp:code:${phoneNumber}`);
      await redis.del(`otp:attempts:${phoneNumber}`);
      return true;
    } else {
      const record = this.inMemoryOtpStore.get(phoneNumber);
      if (!record || Date.now() > record.expiresAt) {
        this.inMemoryOtpStore.delete(phoneNumber);
        throw AppError.badRequest(
          'Verification code has expired or was never requested.',
        );
      }

      record.attempts += 1;
      if (record.attempts > this.MAX_ATTEMPTS) {
        this.inMemoryOtpStore.delete(phoneNumber);
        throw AppError.badRequest(
          'Maximum attempts exceeded. Please request a new verification code.',
        );
      }

      if (record.otp !== cleanOtp) {
        const remainingAttempts = this.MAX_ATTEMPTS - record.attempts;
        throw AppError.badRequest(
          `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
        );
      }

      // Valid OTP -> delete record
      this.inMemoryOtpStore.delete(phoneNumber);
      return true;
    }
  }
}
