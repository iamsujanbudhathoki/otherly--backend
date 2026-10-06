import { autoInjectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { DotenvConfig } from '../../config/env.config';
import { TokenEnum } from '../../constants/appConstant';
import messages from '../../constants/messages.constants';
import { Admin } from '../../entities/admin/Admin.entity';
import { Token, TokenOwnerType } from '../../entities/token/Token.entity';
import {
  AdminLoginResponse,
  AdminProfileResponse,
  RefreshTokenResponse,
} from '../../interfaces/admin.interface';
import {
  AdminAuthSchema,
  AdminChangePasswordSchema,
  AdminResetPasswordSchema,
} from '../../schemas/admin-auth.schema';
import { AppError } from '../../utils/appError.util';
import BcryptService from '../../utils/bcrypt.util';
import { JwtPayload, JwtUtil } from '../../utils/jwt.util';

@autoInjectable()
export class AdminAuthService {
  private adminRepo = AppDataSource.getRepository(Admin);
  private tokenRepo = AppDataSource.getRepository(Token);

  async login(data: AdminAuthSchema): Promise<AdminLoginResponse> {
    const admin = await this.adminRepo
      .createQueryBuilder('admin')
      .addSelect('admin.password')
      .where('admin.email = :email', { email: data.email.trim().toLowerCase() })
      .getOne();

    if (!admin) {
      throw AppError.unAuthorized(messages.invalidAuth);
    }

    if (!admin.isActive) {
      throw AppError.forbidden(messages.unAuthorized);
    }

    const isPasswordValid = await BcryptService.compare(
      data.password,
      admin.password,
    );
    if (!isPasswordValid) {
      throw AppError.unAuthorized(messages.invalidAuth);
    }

    const tokenPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
    };

    const accessToken = JwtUtil.sign(
      tokenPayload,
      DotenvConfig.JWT_ACCESS_EXPIRES_SECONDS,
    );
    const refreshToken = JwtUtil.sign(
      tokenPayload,
      DotenvConfig.JWT_REFRESH_EXPIRES_SECONDS,
    );

    const existingToken = await this.tokenRepo.findOne({
      where: {
        ownerId: admin.id,
        ownerType: TokenOwnerType.ADMIN,
        type: TokenEnum.REFRESH_TOKEN,
      },
    });

    if (existingToken) {
      existingToken.token = refreshToken;
      await this.tokenRepo.save(existingToken);
    } else {
      const newToken = this.tokenRepo.create({
        ownerId: admin.id,
        ownerType: TokenOwnerType.ADMIN,
        type: TokenEnum.REFRESH_TOKEN,
        token: refreshToken,
      });
      await this.tokenRepo.save(newToken);
    }

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
      isActive: admin.isActive,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenStr: string): Promise<RefreshTokenResponse> {
    let payload: JwtPayload;
    try {
      payload = JwtUtil.verify(refreshTokenStr);
    } catch {
      throw AppError.unAuthorized(messages.invalidToken);
    }

    const storedToken = await this.tokenRepo.findOne({
      where: {
        ownerId: payload.sub,
        ownerType: TokenOwnerType.ADMIN,
        type: TokenEnum.REFRESH_TOKEN,
        token: refreshTokenStr,
      },
    });

    if (!storedToken) {
      throw AppError.unAuthorized(messages.invalidToken);
    }

    const admin = await this.adminRepo.findOne({ where: { id: payload.sub } });
    if (!admin || !admin.isActive) {
      throw AppError.forbidden(messages.unAuthorized);
    }

    const tokenPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
    };

    const accessToken = JwtUtil.sign(
      tokenPayload,
      DotenvConfig.JWT_ACCESS_EXPIRES_SECONDS,
    );
    const newRefreshToken = JwtUtil.sign(
      tokenPayload,
      DotenvConfig.JWT_REFRESH_EXPIRES_SECONDS,
    );

    storedToken.token = newRefreshToken;
    await this.tokenRepo.save(storedToken);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(adminId: string): Promise<void> {
    await this.tokenRepo.delete({
      ownerId: adminId,
      ownerType: TokenOwnerType.ADMIN,
      type: TokenEnum.REFRESH_TOKEN,
    });
  }

  async getProfile(adminId: string): Promise<AdminProfileResponse> {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) {
      throw AppError.notFound(messages.adminNotFound);
    }

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    };
  }

  async changePassword(
    adminId: string,
    data: AdminChangePasswordSchema,
  ): Promise<void> {
    const admin = await this.adminRepo
      .createQueryBuilder('admin')
      .addSelect('admin.password')
      .where('admin.id = :id', { id: adminId })
      .getOne();

    if (!admin) {
      throw AppError.notFound(messages.adminNotFound);
    }

    const isOldValid = await BcryptService.compare(
      data.oldPassword,
      admin.password,
    );
    if (!isOldValid) {
      throw AppError.badRequest(messages.invalidOldPassword);
    }

    admin.password = data.newPassword;
    await this.adminRepo.save(admin);

    // Invalidate refresh tokens so user re-authenticates on next session
    await this.tokenRepo.delete({
      ownerId: adminId,
      ownerType: TokenOwnerType.ADMIN,
      type: TokenEnum.REFRESH_TOKEN,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const admin = await this.adminRepo.findOne({
      where: { email: email.trim().toLowerCase(), isActive: true },
    });

    if (!admin) {
      return;
    }

    const resetToken = JwtUtil.sign(
      {
        sub: admin.id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
      },
      3600, // 1 hour validity
    );

    const existingReset = await this.tokenRepo.findOne({
      where: {
        ownerId: admin.id,
        ownerType: TokenOwnerType.ADMIN,
        type: TokenEnum.PASSWORD_RESET_TOKEN,
      },
    });

    if (existingReset) {
      existingReset.token = resetToken;
      await this.tokenRepo.save(existingReset);
    } else {
      const newToken = this.tokenRepo.create({
        ownerId: admin.id,
        ownerType: TokenOwnerType.ADMIN,
        type: TokenEnum.PASSWORD_RESET_TOKEN,
        token: resetToken,
      });
      await this.tokenRepo.save(newToken);
    }
  }

  async resetPassword(data: AdminResetPasswordSchema): Promise<void> {
    let payload: JwtPayload;
    try {
      payload = JwtUtil.verify(data.token);
    } catch {
      throw AppError.badRequest(messages.invalidResetToken);
    }

    const storedToken = await this.tokenRepo.findOne({
      where: {
        token: data.token,
        ownerId: payload.sub,
        ownerType: TokenOwnerType.ADMIN,
        type: TokenEnum.PASSWORD_RESET_TOKEN,
      },
    });

    if (!storedToken) {
      throw AppError.badRequest(messages.invalidResetToken);
    }

    const admin = await this.adminRepo.findOne({ where: { id: payload.sub } });
    if (!admin || !admin.isActive) {
      throw AppError.badRequest(messages.invalidResetToken);
    }

    admin.password = data.newPassword;
    await this.adminRepo.save(admin);

    // Remove reset token and any existing refresh tokens
    await this.tokenRepo.delete({
      ownerId: admin.id,
      ownerType: TokenOwnerType.ADMIN,
    });
  }
}
