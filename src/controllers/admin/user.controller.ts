import {
  Body,
  Controller,
  Get,
  Middlewares,
  Patch,
  Path,
  Query,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { autoInjectable } from 'tsyringe';
import { Role } from '../../constants/appConstant';
import messages from '../../constants/messages.constants';
import { ApiResponse } from '../../interfaces/apiResponse.interface';
import { UserProfileResponse } from '../../interfaces/auth.interface';
import { RequestValidator } from '../../middlewares/validator.middleware';
import {
  AdminUpdateUserStatusSchema,
  AdminVerifyVendorSchema,
} from '../../schemas/auth.schema';
import { AuthService } from '../../services/auth/auth.service';

@Route('/admin/users')
@Tags('Admin User Management')
@Security('jwt', [Role.ADMIN])
@autoInjectable()
export class AdminUserController extends Controller {
  constructor(private authService?: AuthService) {
    super();
  }

  @Get('/')
  async getUsers(
    @Query() page?: number,
    @Query() limit?: number,
    @Query() role?: Role,
    @Query() search?: string,
    @Query() isActive?: boolean,
    @Query() isVendorVerified?: boolean,
  ) {
    const result = await this.authService!.adminGetUsers({
      page,
      limit,
      role,
      search,
      isActive,
      isVendorVerified,
    });
    return {
      ...result,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Get('/{id}')
  async getUserById(
    @Path() id: string,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const data = await this.authService!.adminGetUserById(id);
    return {
      data,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Patch('/{id}/status')
  @Middlewares(RequestValidator.validate(AdminUpdateUserStatusSchema))
  async updateUserStatus(
    @Path() id: string,
    @Body() body: AdminUpdateUserStatusSchema,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const data = await this.authService!.adminUpdateUserStatus(
      id,
      body.isActive,
    );
    return {
      data,
      message: messages.dataUpdated,
      success: true,
    };
  }

  @Patch('/{id}/verify-vendor')
  @Middlewares(RequestValidator.validate(AdminVerifyVendorSchema))
  async verifyVendor(
    @Path() id: string,
    @Body() body: AdminVerifyVendorSchema,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const data = await this.authService!.adminVerifyVendor(id, body.isVerified);
    return {
      data,
      message: messages.dataUpdated,
      success: true,
    };
  }
}
