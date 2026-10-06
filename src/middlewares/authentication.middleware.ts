import express from 'express';
import { Role } from '../constants/appConstant';
import messages from '../constants/messages.constants';
import { AdminPermission } from '../entities/admin/Admin.entity';
import { AppError } from '../utils/appError.util';
import { JwtPayload, JwtUtil } from '../utils/jwt.util';

export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[],
): Promise<JwtPayload> {
  if (securityName !== 'jwt') {
    throw AppError.unAuthorized(messages.unAuthorized);
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw AppError.unAuthorized(messages.invalidToken);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw AppError.unAuthorized(messages.invalidToken);
  }

  const payload = JwtUtil.verify(token);
  request.user = payload;

  // If specific scopes / roles are required
  if (scopes && scopes.length > 0) {
    // Super admin bypasses scope checks
    if (payload.role === Role.SUPER_ADMIN) {
      return payload;
    }

    const hasRole = scopes.includes(payload.role);
    const hasPermission =
      payload.permissions &&
      scopes.some((scope) =>
        payload.permissions?.includes(scope as AdminPermission),
      );

    if (!hasRole && !hasPermission) {
      throw AppError.forbidden(messages.unAuthorized);
    }
  }

  return payload;
}
