import { injectable } from 'tsyringe';
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { OrderStatus, Role } from '../../constants/appConstant';
import { OrderEntity } from '../../entities/order/Order.entity';
import { OrderService } from '../../services/order/order.service';
import { GraphQLContext } from '../context';
import { CreateDirectOrderInput } from '../inputs/order.input';

@injectable()
@Resolver(() => OrderEntity)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Authorized()
  @Query(() => [OrderEntity], {
    description:
      'Retrieve orders for the authenticated user (customer purchases or vendor sales)',
  })
  async myOrders(@Ctx() { user }: GraphQLContext): Promise<OrderEntity[]> {
    if (user!.role === Role.VENDOR) {
      return await this.orderService.getVendorOrders(user!.sub);
    }
    return await this.orderService.getCustomerOrders(user!.sub);
  }

  @Authorized()
  @Query(() => OrderEntity, {
    description: 'Retrieve details of an order by ID',
  })
  async order(
    @Ctx() { user }: GraphQLContext,
    @Arg('id') id: string,
  ): Promise<OrderEntity> {
    return await this.orderService.getOrderById(user!.sub, user!.role, id);
  }

  @Authorized([Role.CUSTOMER])
  @Mutation(() => OrderEntity, {
    description:
      'Directly purchase a product from a vendor in traditional e-commerce fashion (Customers only)',
  })
  async createDirectOrder(
    @Ctx() { user }: GraphQLContext,
    @Arg('input') input: CreateDirectOrderInput,
  ): Promise<OrderEntity> {
    return await this.orderService.createDirectOrder(user!.sub, input);
  }

  @Authorized([Role.VENDOR, Role.ADMIN])
  @Mutation(() => OrderEntity, {
    description:
      'Update the fulfillment status of an order (Vendors and Admins only)',
  })
  async updateOrderStatus(
    @Ctx() { user }: GraphQLContext,
    @Arg('orderId') orderId: string,
    @Arg('status', () => OrderStatus) status: OrderStatus,
  ): Promise<OrderEntity> {
    return await this.orderService.updateOrderStatus(
      user!.sub,
      user!.role,
      orderId,
      status,
    );
  }

  @Authorized()
  @Mutation(() => OrderEntity, {
    description:
      'Cancel an existing order and restore inventory if direct purchase',
  })
  async cancelOrder(
    @Ctx() { user }: GraphQLContext,
    @Arg('orderId') orderId: string,
    @Arg('reason', { nullable: true }) reason?: string,
  ): Promise<OrderEntity> {
    return await this.orderService.cancelOrder(
      user!.sub,
      user!.role,
      orderId,
      reason,
    );
  }
}
