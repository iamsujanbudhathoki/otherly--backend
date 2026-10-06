import { autoInjectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { DotenvConfig } from '../../config/env.config';
import { Role, TokenEnum, UserMode } from '../../constants/appConstant';
import messages from '../../constants/messages.constants';
import { Admin } from '../../entities/admin/Admin.entity';
import { CustomerEntity } from '../../entities/customer/Customer.entity';
import { Token, TokenOwnerType } from '../../entities/token/Token.entity';
import { User } from '../../entities/user/User.entity';
import { VendorEntity } from '../../entities/vendor/Vendor.entity';
import {
  AuthResponse,
  ToggleModeResponse,
  TokenResponse,
  UserProfileResponse,
} from '../../interfaces/auth.interface';
import {
  ChangePasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  SendOtpSchema,
  UpdateProfileSchema,
  VerifyOtpSchema,
} from '../../schemas/auth.schema';
import { OtpService } from '../otp/otp.service';
import { AppError } from '../../utils/appError.util';
import BcryptService from '../../utils/bcrypt.util';
import emailUtil from '../../utils/email.util';
import { JwtPayload, JwtUtil } from '../../utils/jwt.util';
import { paginateResponse, skipTakeMaker } from '../../utils/pageAndLimit';

@autoInjectable()
export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private customerRepo = AppDataSource.getRepository(CustomerEntity);
  private vendorRepo = AppDataSource.getRepository(VendorEntity);
  private adminRepo = AppDataSource.getRepository(Admin);
  private tokenRepo = AppDataSource.getRepository(Token);

  constructor(private otpService?: OtpService) {}

  private async sanitizeUser(user: User): Promise<UserProfileResponse> {
    let customer = user.customer;
    let vendor = user.vendor;

    if (!customer) {
      customer =
        (await this.customerRepo.findOne({ where: { userId: user.id } })) ??
        undefined;
    }
    if (!vendor) {
      vendor =
        (await this.vendorRepo.findOne({ where: { userId: user.id } })) ??
        undefined;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      activeMode: user.activeMode || UserMode.CUSTOMER,
      hasSellerProfile: !!vendor,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isVendorVerified: vendor ? vendor.isVerified : user.isVendorVerified,
      isActive: user.isActive,
      phoneNumber: user.phoneNumber,
      avatar: user.avatar,
      businessName: vendor ? vendor.businessName : user.businessName,
      businessAddress: vendor ? vendor.businessAddress : user.businessAddress,
      customer: customer
        ? {
            id: customer.id,
            shippingAddress: customer.shippingAddress,
            city: customer.city,
            state: customer.state,
            postalCode: customer.postalCode,
            country: customer.country,
            preferences: customer.preferences,
            notes: customer.notes,
          }
        : undefined,
      vendor: vendor
        ? {
            id: vendor.id,
            sellerType: vendor.sellerType,
            businessName: vendor.businessName,
            panNumber: vendor.panNumber,
            documentMediaIds: vendor.documentMediaIds,
            businessRegistrationNumber: vendor.businessRegistrationNumber,
            businessAddress: vendor.businessAddress,
            city: vendor.city,
            state: vendor.state,
            postalCode: vendor.postalCode,
            country: vendor.country,
            description: vendor.description,
            isVerified: vendor.isVerified,
            rating: Number(vendor.rating || 0),
            totalReviews: vendor.totalReviews || 0,
          }
        : undefined,
      createdAt: user.createdAt,
    };
  }

  async register(data: RegisterSchema): Promise<UserProfileResponse> {
    const email = data.email.trim().toLowerCase();

    // Check if email is already registered across User or Admin tables
    const [existingUser, existingAdmin] = await Promise.all([
      this.userRepo.findOne({ where: { email } }),
      this.adminRepo.findOne({ where: { email } }),
    ]);

    if (existingUser || existingAdmin) {
      throw AppError.conflict(messages.userAlreadyExists);
    }

    const assignedRole =
      data.role === Role.VENDOR ? Role.VENDOR : Role.CUSTOMER;

    const user = this.userRepo.create({
      name: data.name.trim(),
      email,
      password: data.password,
      role: assignedRole,
      isEmailVerified: false,
      isActive: true,
      phoneNumber: data.phoneNumber?.trim(),
      businessName: data.businessName?.trim(),
      businessAddress: data.businessAddress?.trim(),
    });

    const savedUser = await this.userRepo.save(user);

    // Create corresponding Customer or Vendor profile entity
    if (savedUser.role === Role.VENDOR) {
      const vendor = this.vendorRepo.create({
        userId: savedUser.id,
        businessName: data.businessName?.trim() || savedUser.name,
        businessAddress: data.businessAddress?.trim(),
        isVerified: false,
        rating: 0,
        totalReviews: 0,
      });
      await this.vendorRepo.save(vendor);
      savedUser.vendor = vendor;
    } else {
      const customer = this.customerRepo.create({
        userId: savedUser.id,
        shippingAddress: data.businessAddress?.trim(),
      });
      await this.customerRepo.save(customer);
      savedUser.customer = customer;
    }

    // Issue email verification token (valid for 24 hours)
    const verificationToken = JwtUtil.sign(
      {
        sub: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
      },
      86400,
    );

    const tokenRecord = this.tokenRepo.create({
      ownerId: savedUser.id,
      ownerType: TokenOwnerType.USER,
      type: TokenEnum.EMAIL_VERIFICATION_TOKEN,
      token: verificationToken,
    });
    await this.tokenRepo.save(tokenRecord);

    // Send verification email
    const verificationUrl = `${DotenvConfig.FRONTEND_BASE_URL}/verify-email?token=${verificationToken}`;
    if (savedUser.email) {
      await emailUtil.sendVerificationEmail(savedUser.email, {
        name: savedUser.name || 'User',
        verificationUrl,
      });
    }

    return await this.sanitizeUser(savedUser);
  }

  async verifyEmail(tokenStr: string): Promise<void> {
    let payload: JwtPayload;
    try {
      payload = JwtUtil.verify(tokenStr);
    } catch {
      throw AppError.badRequest(messages.invalidVerificationToken);
    }

    const storedToken = await this.tokenRepo.findOne({
      where: {
        token: tokenStr,
        ownerId: payload.sub,
        ownerType: TokenOwnerType.USER,
        type: TokenEnum.EMAIL_VERIFICATION_TOKEN,
      },
    });

    if (!storedToken) {
      throw AppError.badRequest(messages.invalidVerificationToken);
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw AppError.notFound(messages.userNotFound);
    }

    user.isEmailVerified = true;
    await this.userRepo.save(user);

    // Delete verification token once verified
    await this.tokenRepo.delete({ id: storedToken.id });
  }

  async resendVerification(emailStr: string): Promise<void> {
    const email = emailStr.trim().toLowerCase();
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      // Avoid user enumeration
      return;
    }

    if (user.isEmailVerified) {
      throw AppError.badRequest(messages.emailAlreadyVerified);
    }

    const verificationToken = JwtUtil.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      86400,
    );

    const existingToken = await this.tokenRepo.findOne({
      where: {
        ownerId: user.id,
        ownerType: TokenOwnerType.USER,
        type: TokenEnum.EMAIL_VERIFICATION_TOKEN,
      },
    });

    if (existingToken) {
      existingToken.token = verificationToken;
      await this.tokenRepo.save(existingToken);
    } else {
      const newToken = this.tokenRepo.create({
        ownerId: user.id,
        ownerType: TokenOwnerType.USER,
        type: TokenEnum.EMAIL_VERIFICATION_TOKEN,
        token: verificationToken,
      });
      await this.tokenRepo.save(newToken);
    }

    const verificationUrl = `${DotenvConfig.FRONTEND_BASE_URL}/verify-email?token=${verificationToken}`;
    if (user.email) {
      await emailUtil.sendVerificationEmail(user.email, {
        name: user.name || 'User',
        verificationUrl,
      });
    }
  }

  async login(data: LoginSchema): Promise<AuthResponse> {
    const email = data.email.trim().toLowerCase();

    // Check in users table
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.customer', 'customer')
      .leftJoinAndSelect('user.vendor', 'vendor')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw AppError.unAuthorized(messages.invalidAuth);
    }

    if (!user.isActive) {
      throw AppError.forbidden(messages.unAuthorized);
    }

    if (!user.password) {
      throw AppError.unAuthorized(messages.invalidAuth);
    }

    const isPasswordValid = await BcryptService.compare(
      data.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw AppError.unAuthorized(messages.invalidAuth);
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
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
        ownerId: user.id,
        ownerType: TokenOwnerType.USER,
        type: TokenEnum.REFRESH_TOKEN,
      },
    });

    if (existingToken) {
      existingToken.token = refreshToken;
      await this.tokenRepo.save(existingToken);
    } else {
      const newToken = this.tokenRepo.create({
        ownerId: user.id,
        ownerType: TokenOwnerType.USER,
        type: TokenEnum.REFRESH_TOKEN,
        token: refreshToken,
      });
      await this.tokenRepo.save(newToken);
    }

    const sanitizedUser = await this.sanitizeUser(user);

    return {
      user: sanitizedUser,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshTokenStr: string): Promise<TokenResponse> {
    let payload: JwtPayload;
    try {
      payload = JwtUtil.verify(refreshTokenStr);
    } catch {
      throw AppError.unAuthorized(messages.invalidToken);
    }

    const storedToken = await this.tokenRepo.findOne({
      where: {
        ownerId: payload.sub,
        token: refreshTokenStr,
        type: TokenEnum.REFRESH_TOKEN,
      },
    });

    if (!storedToken) {
      throw AppError.unAuthorized(messages.invalidToken);
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw AppError.forbidden(messages.unAuthorized);
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
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

  async logout(userId: string): Promise<void> {
    await this.tokenRepo.delete({
      ownerId: userId,
      type: TokenEnum.REFRESH_TOKEN,
    });
  }

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['customer', 'vendor'],
    });
    if (!user) {
      throw AppError.notFound(messages.userNotFound);
    }
    return await this.sanitizeUser(user);
  }

  async changePassword(
    userId: string,
    data: ChangePasswordSchema,
  ): Promise<void> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw AppError.notFound(messages.userNotFound);
    }

    if (!user.password) {
      throw AppError.badRequest(
        'No password set on this account. Please use reset password or mobile login.',
      );
    }

    const isOldValid = await BcryptService.compare(
      data.oldPassword,
      user.password,
    );
    if (!isOldValid) {
      throw AppError.badRequest(messages.invalidOldPassword);
    }

    user.password = data.newPassword;
    await this.userRepo.save(user);

    // Invalidate refresh tokens
    await this.tokenRepo.delete({
      ownerId: userId,
      type: TokenEnum.REFRESH_TOKEN,
    });
  }

  async forgotPassword(emailStr: string): Promise<void> {
    const email = emailStr.trim().toLowerCase();
    const user = await this.userRepo.findOne({
      where: { email, isActive: true },
    });

    if (!user || !user.email) {
      return;
    }

    const resetToken = JwtUtil.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      3600, // 1 hour
    );

    const existingReset = await this.tokenRepo.findOne({
      where: {
        ownerId: user.id,
        type: TokenEnum.PASSWORD_RESET_TOKEN,
      },
    });

    if (existingReset) {
      existingReset.token = resetToken;
      await this.tokenRepo.save(existingReset);
    } else {
      const newToken = this.tokenRepo.create({
        ownerId: user.id,
        ownerType: TokenOwnerType.USER,
        type: TokenEnum.PASSWORD_RESET_TOKEN,
        token: resetToken,
      });
      await this.tokenRepo.save(newToken);
    }

    const resetUrl = `${DotenvConfig.FRONTEND_BASE_URL}/reset-password?token=${resetToken}`;
    await emailUtil.sendPasswordResetEmail(user.email, {
      name: user.name || 'User',
      resetUrl,
    });
  }

  async resetPassword(data: ResetPasswordSchema): Promise<void> {
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
        type: TokenEnum.PASSWORD_RESET_TOKEN,
      },
    });

    if (!storedToken) {
      throw AppError.badRequest(messages.invalidResetToken);
    }

    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw AppError.badRequest(messages.invalidResetToken);
    }

    user.password = data.newPassword;
    await this.userRepo.save(user);

    // Remove reset token and all active sessions
    await this.tokenRepo.delete({
      ownerId: user.id,
    });
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileSchema,
  ): Promise<UserProfileResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['customer', 'vendor'],
    });
    if (!user) {
      throw AppError.notFound(messages.userNotFound);
    }

    if (data.name !== undefined) user.name = data.name.trim();
    if (data.phoneNumber !== undefined)
      user.phoneNumber = data.phoneNumber.trim();
    if (data.avatar !== undefined) user.avatar = data.avatar.trim();
    if (data.businessName !== undefined)
      user.businessName = data.businessName.trim();
    if (data.businessAddress !== undefined)
      user.businessAddress = data.businessAddress.trim();

    const updatedUser = await this.userRepo.save(user);

    if (
      user.role === Role.VENDOR &&
      (data.businessName !== undefined || data.businessAddress !== undefined)
    ) {
      let vendor = user.vendor;
      if (!vendor) {
        vendor =
          (await this.vendorRepo.findOne({ where: { userId } })) ?? undefined;
      }
      if (vendor) {
        if (data.businessName !== undefined)
          vendor.businessName = data.businessName.trim();
        if (data.businessAddress !== undefined)
          vendor.businessAddress = data.businessAddress.trim();
        await this.vendorRepo.save(vendor);
        updatedUser.vendor = vendor;
      }
    }

    return await this.sanitizeUser(updatedUser);
  }

  async checkEmailAvailable(emailStr: string): Promise<boolean> {
    const email = emailStr.trim().toLowerCase();
    const [user, admin] = await Promise.all([
      this.userRepo.findOne({ where: { email } }),
      this.adminRepo.findOne({ where: { email } }),
    ]);
    return !user && !admin;
  }

  async deactivateAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw AppError.notFound(messages.userNotFound);
    }

    user.isActive = false;
    await this.userRepo.save(user);

    // Invalidate all tokens
    await this.tokenRepo.delete({ ownerId: userId });
  }

  async adminGetUsers(query: {
    page?: number;
    limit?: number;
    role?: Role;
    search?: string;
    isActive?: boolean;
    isVendorVerified?: boolean;
  }) {
    const { skip, take } = skipTakeMaker({
      page: query.page,
      limit: query.limit,
    });

    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.customer', 'customer')
      .leftJoinAndSelect('user.vendor', 'vendor')
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.isVendorVerified !== undefined) {
      qb.andWhere(
        '(user.isVendorVerified = :isVendorVerified OR vendor.isVerified = :isVendorVerified)',
        {
          isVendorVerified: query.isVendorVerified,
        },
      );
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(vendor.businessName) LIKE :search OR LOWER(user.businessName) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    const [users, total] = await qb.getManyAndCount();
    const sanitized = await Promise.all(users.map((u) => this.sanitizeUser(u)));
    return paginateResponse([sanitized, total], query.limit, query.page);
  }

  async adminGetUserById(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['customer', 'vendor'],
    });
    if (!user) {
      throw AppError.notFound(messages.userNotFound);
    }
    return await this.sanitizeUser(user);
  }

  async adminUpdateUserStatus(
    userId: string,
    isActive: boolean,
  ): Promise<UserProfileResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['customer', 'vendor'],
    });
    if (!user) {
      throw AppError.notFound(messages.userNotFound);
    }

    user.isActive = isActive;
    const saved = await this.userRepo.save(user);

    if (!isActive) {
      // Invalidate active sessions if deactivated/banned
      await this.tokenRepo.delete({ ownerId: userId });
    }

    return await this.sanitizeUser(saved);
  }

  async adminVerifyVendor(
    userId: string,
    isVerified: boolean,
  ): Promise<UserProfileResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['customer', 'vendor'],
    });
    if (!user) {
      throw AppError.notFound(messages.userNotFound);
    }

    if (user.role !== Role.VENDOR) {
      throw AppError.badRequest('Only vendors can be verified');
    }

    user.isVendorVerified = isVerified;
    const saved = await this.userRepo.save(user);

    const vendor = await this.vendorRepo.findOne({ where: { userId } });
    if (vendor) {
      vendor.isVerified = isVerified;
      await this.vendorRepo.save(vendor);
      saved.vendor = vendor;
    }

    return await this.sanitizeUser(saved);
  }

  async sendOtp(data: SendOtpSchema): Promise<{
    success: boolean;
    cooldownSeconds: number;
    otp: string;
  }> {
    return await this.otpService!.sendOtp(data.phoneNumber);
  }

  async verifyOtp(data: VerifyOtpSchema): Promise<AuthResponse> {
    const cleanPhone = this.otpService!.normalizePhoneNumber(data.phoneNumber);
    await this.otpService!.verifyOtp(cleanPhone, data.otp);

    let user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.customer', 'customer')
      .leftJoinAndSelect('user.vendor', 'vendor')
      .where('user.phoneNumber = :phone', { phone: cleanPhone })
      .getOne();

    if (!user) {
      // Automatic Just-In-Time signup for new mobile user
      const lastDigits = cleanPhone.slice(-4);
      user = this.userRepo.create({
        phoneNumber: cleanPhone,
        name: `User-${lastDigits}`,
        role: Role.CUSTOMER,
        isActive: true,
        isPhoneVerified: true,
        isEmailVerified: false,
      });
      user = await this.userRepo.save(user);

      // Create linked customer entity
      const customer = this.customerRepo.create({
        userId: user.id,
      });
      await this.customerRepo.save(customer);
      user.customer = customer;
    } else {
      if (!user.isActive) {
        throw AppError.forbidden(messages.unAuthorized);
      }
      if (!user.isPhoneVerified) {
        user.isPhoneVerified = true;
        await this.userRepo.save(user);
      }
    }

    const tokenPayload = {
      sub: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    const accessToken = JwtUtil.sign(
      tokenPayload,
      DotenvConfig.JWT_ACCESS_EXPIRES_SECONDS,
    );
    const refreshToken = JwtUtil.sign(
      tokenPayload,
      DotenvConfig.JWT_REFRESH_EXPIRES_SECONDS,
    );

    // Save refresh token to tokenRepo
    const existingToken = await this.tokenRepo.findOne({
      where: {
        ownerId: user.id,
        ownerType: TokenOwnerType.USER,
        type: TokenEnum.REFRESH_TOKEN,
      },
    });

    if (existingToken) {
      existingToken.token = refreshToken;
      await this.tokenRepo.save(existingToken);
    } else {
      const newToken = this.tokenRepo.create({
        ownerId: user.id,
        ownerType: TokenOwnerType.USER,
        type: TokenEnum.REFRESH_TOKEN,
        token: refreshToken,
      });
      await this.tokenRepo.save(newToken);
    }

    return {
      user: await this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async toggleMode(userId: string): Promise<ToggleModeResponse> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['vendor'],
    });
    if (!user) {
      throw AppError.notFound(messages.userNotFound);
    }

    const newMode =
      user.activeMode === UserMode.SELLER ? UserMode.CUSTOMER : UserMode.SELLER;
    user.activeMode = newMode;
    await this.userRepo.save(user);

    const hasSellerProfile = !!user.vendor;

    return {
      activeMode: user.activeMode,
      hasSellerProfile,
      isVendorVerified: user.vendor ? user.vendor.isVerified : false,
    };
  }
}
