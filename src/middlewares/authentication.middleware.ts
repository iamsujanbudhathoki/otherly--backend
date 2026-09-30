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

  if (payload.role !== Role.ADMIN && payload.role !== Role.SUPER_ADMIN) {
    throw AppError.forbidden(messages.unAuthorized);
  }

  if (scopes && scopes.length > 0 && payload.role !== Role.SUPER_ADMIN) {
    const hasScope = scopes.every((scope) =>
      payload.permissions?.includes(scope as AdminPermission),
    );
    if (!hasScope) {
      throw AppError.forbidden(messages.unAuthorized);
    }
  }

  return payload;
}
