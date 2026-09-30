import { autoInjectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { DotenvConfig } from '../../config/env.config';
import { TokenEnum } from '../../constants/appConstant';
import messages from '../../constants/messages.constants';
import { Admin } from '../../entities/admin/Admin.entity';
import { Token, TokenOwnerType } from '../../entities/token/Token.entity';
import { AdminLoginResponse } from '../../interfaces/admin.interface';
import { AdminAuthSchema } from '../../schemas/admin-auth.schema';
import { AppError } from '../../utils/appError.util';
import BcryptService from '../../utils/bcrypt.util';
import { JwtUtil } from '../../utils/jwt.util';

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
}
