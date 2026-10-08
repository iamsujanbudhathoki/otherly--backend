import { injectable } from 'tsyringe';
import { Arg, Authorized, Int, Mutation, Query, Resolver } from 'type-graphql';
import { Role } from '../../constants/appConstant';
import { AuthService } from '../../services/auth/auth.service';
import { PaginatedUsersType, UserProfileType } from '../types/user.type';

@injectable()
@Resolver()
export class AdminResolver {
  constructor(private readonly authService: AuthService) {}

  @Authorized([Role.ADMIN])
  @Query(() => PaginatedUsersType, {
    description: 'Retrieve paginated users for admin management',
  })
  async adminUsers(
    @Arg('page', () => Int, { nullable: true, defaultValue: 1 }) page?: number,
    @Arg('limit', () => Int, { nullable: true, defaultValue: 20 })
    limit?: number,
    @Arg('role', () => Role, { nullable: true }) role?: Role,
    @Arg('search', { nullable: true }) search?: string,
    @Arg('isActive', { nullable: true }) isActive?: boolean,
    @Arg('isVendorVerified', { nullable: true }) isVendorVerified?: boolean,
  ): Promise<PaginatedUsersType> {
    const result = await this.authService.adminGetUsers({
      page,
      limit,
      role,
      search,
      isActive,
      isVendorVerified,
    });
    return result as unknown as PaginatedUsersType;
  }

  @Authorized([Role.ADMIN])
  @Query(() => UserProfileType, {
    description: 'Retrieve user details by ID (Admin only)',
  })
  async adminUser(@Arg('id') id: string): Promise<UserProfileType> {
    const user = await this.authService.adminGetUserById(id);
    return user as unknown as UserProfileType;
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => UserProfileType, {
    description: 'Update user account active/suspended status (Admin only)',
  })
  async adminUpdateUserStatus(
    @Arg('id') id: string,
    @Arg('isActive') isActive: boolean,
  ): Promise<UserProfileType> {
    const user = await this.authService.adminUpdateUserStatus(id, isActive);
    return user as unknown as UserProfileType;
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => UserProfileType, {
    description: 'Verify or unverify vendor status (Admin only)',
  })
  async adminVerifyVendor(
    @Arg('id') id: string,
    @Arg('isVerified') isVerified: boolean,
  ): Promise<UserProfileType> {
    const user = await this.authService.adminVerifyVendor(id, isVerified);
    return user as unknown as UserProfileType;
  }
}
