import { injectable } from 'tsyringe';
import { Authorized, Ctx, Query, Resolver } from 'type-graphql';
import { UserMode } from '../../constants/appConstant';
import { AdminAuthService } from '../../services/admin/auth.service';
import { AuthService } from '../../services/auth/auth.service';
import { GraphQLContext } from '../context';
import { UserProfileType } from '../types/user.type';

@injectable()
@Resolver()
export class AuthResolver {
  constructor(
    private readonly authService: AuthService,
    private readonly adminAuthService: AdminAuthService,
  ) {}

  @Authorized()
  @Query(() => UserProfileType, {
    description:
      'Retrieve the profile of the currently authenticated user (Customer, Vendor, or Admin)',
  })
  async me(@Ctx() ctx: GraphQLContext): Promise<UserProfileType> {
    try {
      return await this.authService.getProfile(ctx.user!.sub);
    } catch {
      const admin = await this.adminAuthService.getProfile(ctx.user!.sub);
      return {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isEmailVerified: true,
        isPhoneVerified: false,
        activeMode: UserMode.CUSTOMER,
        hasSellerProfile: false,
        isVendorVerified: false,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      };
    }
  }
}
