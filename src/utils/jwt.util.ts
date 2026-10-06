import crypto from 'crypto';
import { DotenvConfig } from '../config/env.config';
import { Role } from '../constants/appConstant';
import messages from '../constants/messages.constants';
import { AdminPermission } from '../entities/admin/Admin.entity';
import { AppError } from './appError.util';

export interface JwtPayload {
  sub: string;
  email?: string;
  phoneNumber?: string;
  role: Role;
  permissions?: AdminPermission[];
  iat: number;
  exp: number;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  let normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  while (normalized.length % 4 !== 0) {
    normalized += '=';
  }
  return Buffer.from(normalized, 'base64').toString('utf8');
}

export class JwtUtil {
  static sign(
    payload: Omit<JwtPayload, 'iat' | 'exp'>,
    expiresInSeconds = DotenvConfig.JWT_ACCESS_EXPIRES_SECONDS,
  ): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', DotenvConfig.JWT_SECRET)
      .update(signingInput)
      .digest();

    return `${signingInput}.${base64UrlEncode(signature)}`;
  }

  static verify(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw AppError.unAuthorized(messages.invalidToken);
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = base64UrlEncode(
      crypto
        .createHmac('sha256', DotenvConfig.JWT_SECRET)
        .update(signingInput)
        .digest(),
    );

    const sigBuffer = Buffer.from(encodedSignature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      throw AppError.unAuthorized(messages.invalidToken);
    }

    let payload: JwtPayload;
    try {
      payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;
    } catch {
      throw AppError.unAuthorized(messages.invalidToken);
    }

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      throw AppError.unAuthorized(messages.tokenExpired);
    }

    return payload;
  }
}
