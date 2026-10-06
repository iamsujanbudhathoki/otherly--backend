import { injectable } from 'tsyringe';
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { Role } from '../../constants/appConstant';
import { CustomerEntity } from '../../entities/customer/Customer.entity';
import { CustomerService } from '../../services/customer/customer.service';
import { GraphQLContext } from '../context';
import { UpdateCustomerProfileInput } from '../inputs/profile.input';
import { CustomerStatsType } from '../types/stats.type';

@injectable()
@Resolver(() => CustomerEntity)
export class CustomerResolver {
  constructor(private readonly customerService: CustomerService) {}

  @Authorized([Role.CUSTOMER])
  @Query(() => CustomerEntity, {
    description: 'Retrieve the customer profile for the authenticated buyer',
  })
  async myCustomerProfile(
    @Ctx() { user }: GraphQLContext,
  ): Promise<CustomerEntity> {
    return await this.customerService.getProfile(user!.sub);
  }

  @Authorized([Role.CUSTOMER])
  @Query(() => CustomerStatsType, {
    description:
      'Retrieve buyer summary activity stats (total requests, active, orders)',
  })
  async customerStats(
    @Ctx() { user }: GraphQLContext,
  ): Promise<CustomerStatsType> {
    return await this.customerService.getCustomerStats(user!.sub);
  }

  @Authorized([Role.CUSTOMER])
  @Mutation(() => CustomerEntity, {
    description: 'Update customer address and preferences (Customers only)',
  })
  async updateCustomerProfile(
    @Ctx() { user }: GraphQLContext,
    @Arg('input') input: UpdateCustomerProfileInput,
  ): Promise<CustomerEntity> {
    return await this.customerService.updateProfile(user!.sub, input);
  }
}
