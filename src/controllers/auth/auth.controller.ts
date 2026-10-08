import express from 'express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
  Patch,
  Post,
  Query,
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { autoInjectable } from 'tsyringe';
import messages from '../../constants/messages.constants';
import { ApiResponse } from '../../interfaces/apiResponse.interface';
import {
  AuthResponse,
  SendOtpResponse,
  TokenResponse,
  UserProfileResponse,
} from '../../interfaces/auth.interface';
import { RequestValidator } from '../../middlewares/validator.middleware';
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RefreshTokenSchema,
  RegisterSchema,
  ResendVerificationSchema,
  ResetPasswordSchema,
  SendOtpSchema,
  UpdateProfileSchema,
  VerifyEmailSchema,
  VerifyOtpSchema,
} from '../../schemas/auth.schema';
import { AuthService } from '../../services/auth/auth.service';

@Route('auth')
@Tags('Authentication')
@autoInjectable()
export class AuthController extends Controller {
  constructor(private authService?: AuthService) {
    super();
  }

  @Post('/otp/send')
  @Middlewares(RequestValidator.validate(SendOtpSchema))
  async sendOtp(
    @Body() body: SendOtpSchema,
  ): Promise<ApiResponse<SendOtpResponse>> {
    const data = await this.authService!.sendOtp(body.phoneNumber);
    return {
      data,
      message: 'Verification code sent to your mobile number successfully',
      success: true,
    };
  }

  @Post('/otp/verify')
  @Middlewares(RequestValidator.validate(VerifyOtpSchema))
  async verifyOtp(
    @Body() body: VerifyOtpSchema,
  ): Promise<ApiResponse<AuthResponse>> {
    const data = await this.authService!.verifyOtp(body.phoneNumber, body.otp);
    return {
      data,
      message: messages.validLogin,
      success: true,
    };
  }

  @Post('/register')
  @SuccessResponse('201', 'Created')
  @Middlewares(RequestValidator.validate(RegisterSchema))
  async register(
    @Body() body: RegisterSchema,
  ): Promise<ApiResponse<UserProfileResponse>> {
    this.setStatus(201);
    const data = await this.authService!.register(body);
    return {
      data,
      message: messages.userRegistered,
      success: true,
    };
  }

  @Post('/verify-email')
  @Middlewares(RequestValidator.validate(VerifyEmailSchema))
  async verifyEmail(
    @Body() body: VerifyEmailSchema,
  ): Promise<ApiResponse<null>> {
    await this.authService!.verifyEmail(body.token);
    return {
      data: null,
      message: messages.emailVerifiedSuccess,
      success: true,
    };
  }

  @Post('/resend-verification')
  @Middlewares(RequestValidator.validate(ResendVerificationSchema))
  async resendVerification(
    @Body() body: ResendVerificationSchema,
  ): Promise<ApiResponse<null>> {
    await this.authService!.resendVerification(body.email);
    return {
      data: null,
      message: messages.emailVerificationSent,
      success: true,
    };
  }

  @Post('/login')
  @Middlewares(RequestValidator.validate(LoginSchema))
  async login(@Body() body: LoginSchema): Promise<ApiResponse<AuthResponse>> {
    const data = await this.authService!.login(body);
    return {
      data,
      message: messages.validLogin,
      success: true,
    };
  }

  @Post('/refresh')
  @Middlewares(RequestValidator.validate(RefreshTokenSchema))
  async refresh(
    @Body() body: RefreshTokenSchema,
  ): Promise<ApiResponse<TokenResponse>> {
    const data = await this.authService!.refreshToken(body.refreshToken);
    return {
      data,
      message: messages.tokenRefreshed,
      success: true,
    };
  }

  @Post('/logout')
  @Security('jwt')
  async logout(@Request() req: express.Request): Promise<ApiResponse<null>> {
    await this.authService!.logout(req.user!.sub);
    return {
      data: null,
      message: messages.logoutSuccess,
      success: true,
    };
  }

  @Get('/me')
  @Security('jwt')
  async me(
    @Request() req: express.Request,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const data = await this.authService!.getProfile(req.user!.sub);
    return {
      data,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Post('/change-password')
  @Security('jwt')
  @Middlewares(RequestValidator.validate(ChangePasswordSchema))
  async changePassword(
    @Body() body: ChangePasswordSchema,
    @Request() req: express.Request,
  ): Promise<ApiResponse<null>> {
    await this.authService!.changePassword(req.user!.sub, body);
    return {
      data: null,
      message: messages.passwordChanged,
      success: true,
    };
  }

  @Post('/forgot-password')
  @Middlewares(RequestValidator.validate(ForgotPasswordSchema))
  async forgotPassword(
    @Body() body: ForgotPasswordSchema,
  ): Promise<ApiResponse<null>> {
    await this.authService!.forgotPassword(body.email);
    return {
      data: null,
      message: messages.passwordResetSent,
      success: true,
    };
  }

  @Post('/reset-password')
  @Middlewares(RequestValidator.validate(ResetPasswordSchema))
  async resetPassword(
    @Body() body: ResetPasswordSchema,
  ): Promise<ApiResponse<null>> {
    await this.authService!.resetPassword(body);
    return {
      data: null,
      message: messages.passwordResetSuccess,
      success: true,
    };
  }

  @Get('/check-email')
  async checkEmail(
    @Query() email: string,
  ): Promise<ApiResponse<{ available: boolean }>> {
    const available = await this.authService!.checkEmailAvailable(email);
    return {
      data: { available },
      message: messages.actionCompleted,
      success: true,
    };
  }

  @Patch('/profile')
  @Security('jwt')
  @Middlewares(RequestValidator.validate(UpdateProfileSchema))
  async updateProfile(
    @Body() body: UpdateProfileSchema,
    @Request() req: express.Request,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const data = await this.authService!.updateProfile(req.user!.sub, body);
    return {
      data,
      message: messages.dataUpdated,
      success: true,
    };
  }

  @Delete('/account')
  @Security('jwt')
  async deleteAccount(
    @Request() req: express.Request,
  ): Promise<ApiResponse<null>> {
    await this.authService!.deactivateAccount(req.user!.sub);
    return {
      data: null,
      message: messages.dataDeleted,
      success: true,
    };
  }
}
