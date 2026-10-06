import express from 'express';
import {
  Body,
  Controller,
  Get,
  Middlewares,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { autoInjectable } from 'tsyringe';
import messages from '../../constants/messages.constants';
import {
  AdminLoginResponse,
  AdminProfileResponse,
  RefreshTokenResponse,
} from '../../interfaces/admin.interface';
import { ApiResponse } from '../../interfaces/apiResponse.interface';
import { RequestValidator } from '../../middlewares/validator.middleware';
import {
  AdminAuthSchema,
  AdminChangePasswordSchema,
  AdminForgotPasswordSchema,
  AdminRefreshTokenSchema,
  AdminResetPasswordSchema,
} from '../../schemas/admin-auth.schema';
import { AdminAuthService } from '../../services/admin/auth.service';

@Route('/admin/auth')
@Tags('Admin Auth System')
@autoInjectable()
export class AdminAuthController extends Controller {
  constructor(private adminAuthService?: AdminAuthService) {
    super();
  }

  @Post('/login')
  @Middlewares(RequestValidator.validate(AdminAuthSchema))
  async login(
    @Body() body: AdminAuthSchema,
  ): Promise<ApiResponse<AdminLoginResponse>> {
    const data = await this.adminAuthService!.login(body);
    return {
      data,
      message: messages.validLogin,
      success: true,
    };
  }

  @Post('/refresh')
  @Middlewares(RequestValidator.validate(AdminRefreshTokenSchema))
  async refresh(
    @Body() body: AdminRefreshTokenSchema,
  ): Promise<ApiResponse<RefreshTokenResponse>> {
    const data = await this.adminAuthService!.refreshToken(body.refreshToken);
    return {
      data,
      message: messages.tokenRefreshed,
      success: true,
    };
  }

  @Post('/logout')
  @Security('jwt')
  async logout(@Request() req: express.Request): Promise<ApiResponse<null>> {
    await this.adminAuthService!.logout(req.user!.sub);
    return {
      data: null,
      message: messages.logoutSuccess,
      success: true,
    };
  }

  @Get('/me')
  @Security('jwt')
  async getProfile(
    @Request() req: express.Request,
  ): Promise<ApiResponse<AdminProfileResponse>> {
    const data = await this.adminAuthService!.getProfile(req.user!.sub);
    return {
      data,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Post('/change-password')
  @Security('jwt')
  @Middlewares(RequestValidator.validate(AdminChangePasswordSchema))
  async changePassword(
    @Body() body: AdminChangePasswordSchema,
    @Request() req: express.Request,
  ): Promise<ApiResponse<null>> {
    await this.adminAuthService!.changePassword(req.user!.sub, body);
    return {
      data: null,
      message: messages.passwordChanged,
      success: true,
    };
  }

  @Post('/forgot-password')
  @Middlewares(RequestValidator.validate(AdminForgotPasswordSchema))
  async forgotPassword(
    @Body() body: AdminForgotPasswordSchema,
  ): Promise<ApiResponse<null>> {
    await this.adminAuthService!.forgotPassword(body.email);
    return {
      data: null,
      message: messages.passwordResetSent,
      success: true,
    };
  }

  @Post('/reset-password')
  @Middlewares(RequestValidator.validate(AdminResetPasswordSchema))
  async resetPassword(
    @Body() body: AdminResetPasswordSchema,
  ): Promise<ApiResponse<null>> {
    await this.adminAuthService!.resetPassword(body);
    return {
      data: null,
      message: messages.passwordResetSuccess,
      success: true,
    };
  }
}
