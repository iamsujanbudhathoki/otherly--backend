import { injectable } from 'tsyringe';
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Role } from '../../constants/appConstant';
import { VendorEntity } from '../../entities/vendor/Vendor.entity';
import { VendorService } from '../../services/vendor/vendor.service';
import { GraphQLContext } from '../context';
import {
  UpdateVendorProfileInput,
  VendorFilterInput,
} from '../inputs/profile.input';
import { VendorStatsType } from '../types/stats.type';

@injectable()
@Resolver(() => VendorEntity)
export class VendorResolver {
  constructor(private readonly vendorService: VendorService) {}

  @Query(() => [VendorEntity], {
    description: 'Browse marketplace vendors directory',
  })
  async vendors(
    @Arg('filter', { nullable: true }) filter?: VendorFilterInput,
  ): Promise<VendorEntity[]> {
    return await this.vendorService.getAllVendors(filter || {});
  }

  @Query(() => VendorEntity, {
    nullable: true,
    description: 'Retrieve public storefront profile of a vendor by ID',
  })
  async vendor(@Arg('id') id: string): Promise<VendorEntity | null> {
    try {
      return await this.vendorService.getVendorById(id);
    } catch {
      return null;
    }
  }

  @Authorized([Role.VENDOR])
  @Query(() => VendorEntity, {
    description: 'Retrieve the vendor profile for the authenticated supplier',
  })
  async myVendorProfile(
    @Ctx() { user }: GraphQLContext,
  ): Promise<VendorEntity> {
    return await this.vendorService.getProfile(user!.sub);
  }

  @Authorized([Role.VENDOR])
  @Query(() => VendorStatsType, {
    description:
      'Retrieve vendor business activity stats (products, active offers, orders, rating)',
  })
  async vendorStats(@Ctx() { user }: GraphQLContext): Promise<VendorStatsType> {
    return await this.vendorService.getVendorStats(user!.sub);
  }

  @Authorized([Role.VENDOR])
  @Mutation(() => VendorEntity, {
    description:
      'Update vendor business details, address, and description (Vendors only)',
  })
  async updateVendorProfile(
    @Ctx() { user }: GraphQLContext,
    @Arg('input') input: UpdateVendorProfileInput,
  ): Promise<VendorEntity> {
    return await this.vendorService.updateProfile(user!.sub, input);
  }
}
