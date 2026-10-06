import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import {
  OrderSourceType,
  OrderStatus,
  Role,
} from '../../constants/appConstant';
import { CustomerEntity } from '../../entities/customer/Customer.entity';
import { OrderEntity } from '../../entities/order/Order.entity';
import { ProductEntity } from '../../entities/product/Product.entity';
import { VendorEntity } from '../../entities/vendor/Vendor.entity';
import { AppError } from '../../utils/appError.util';

export interface CreateDirectOrderDto {
  productId: string;
  quantity: number;
  shippingAddress: string;
  notes?: string;
}

@injectable()
export class OrderService {
  private orderRepo = AppDataSource.getRepository(OrderEntity);
  private productRepo = AppDataSource.getRepository(ProductEntity);
  private customerRepo = AppDataSource.getRepository(CustomerEntity);
  private vendorRepo = AppDataSource.getRepository(VendorEntity);

  async createDirectOrder(
    customerUserId: string,
    data: CreateDirectOrderDto,
  ): Promise<OrderEntity> {
    const customer = await this.customerRepo.findOne({
      where: { userId: customerUserId },
    });
    if (!customer) {
      throw AppError.forbidden('Only registered customers can place orders');
    }

    const product = await this.productRepo.findOne({
      where: { id: data.productId, isActive: true },
      relations: ['vendor'],
    });
    if (!product) {
      throw AppError.notFound('Product not found or inactive');
    }

    if (product.stockQuantity < data.quantity) {
      throw AppError.badRequest(
        `Insufficient stock available (Available: ${product.stockQuantity}, Requested: ${data.quantity})`,
      );
    }

    return await AppDataSource.transaction(async (manager) => {
      // Deduct inventory
      product.stockQuantity -= data.quantity;
      await manager.save(ProductEntity, product);

      const orderNumber = `ORD-DIR-${Date.now().toString(36).toUpperCase()}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

      const totalAmount = Number(product.price) * data.quantity;

      const order = manager.create(OrderEntity, {
        orderNumber,
        customerId: customer.id,
        vendorId: product.vendorId,
        sourceType: OrderSourceType.DIRECT_PURCHASE,
        productId: product.id,
        quantity: data.quantity,
        unitPrice: product.price,
        totalAmount,
        shippingAddress: data.shippingAddress.trim(),
        status: OrderStatus.CONFIRMED,
        notes: data.notes?.trim(),
      });

      return await manager.save(OrderEntity, order);
    });
  }

  async getCustomerOrders(customerUserId: string): Promise<OrderEntity[]> {
    const customer = await this.customerRepo.findOne({
      where: { userId: customerUserId },
    });
    if (!customer) {
      throw AppError.forbidden('Customer profile not found');
    }

    return await this.orderRepo.find({
      where: { customerId: customer.id },
      relations: ['vendor', 'vendor.user', 'product', 'offer', 'offer.request'],
      order: { createdAt: 'DESC' },
    });
  }

  async getVendorOrders(vendorUserId: string): Promise<OrderEntity[]> {
    const vendor = await this.vendorRepo.findOne({
      where: { userId: vendorUserId },
    });
    if (!vendor) {
      throw AppError.forbidden('Vendor profile not found');
    }

    return await this.orderRepo.find({
      where: { vendorId: vendor.id },
      relations: [
        'customer',
        'customer.user',
        'product',
        'offer',
        'offer.request',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderById(
    userId: string,
    userRole: Role,
    id: string,
  ): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: [
        'customer',
        'customer.user',
        'vendor',
        'vendor.user',
        'product',
        'offer',
        'offer.request',
      ],
    });
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
      return order;
    }

    if (userRole === Role.CUSTOMER && order.customer.userId !== userId) {
      throw AppError.forbidden('You do not have access to this order');
    }

    if (userRole === Role.VENDOR && order.vendor.userId !== userId) {
      throw AppError.forbidden('You do not have access to this order');
    }

    return order;
  }

  async updateOrderStatus(
    userId: string,
    userRole: Role,
    orderId: string,
    newStatus: OrderStatus,
  ): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['vendor'],
    });
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    if (userRole === Role.VENDOR) {
      const vendor = await this.vendorRepo.findOne({ where: { userId } });
      if (!vendor || order.vendorId !== vendor.id) {
        throw AppError.forbidden('You can only update your own orders');
      }
    }

    order.status = newStatus;
    return await this.orderRepo.save(order);
  }

  async cancelOrder(
    userId: string,
    userRole: Role,
    orderId: string,
    reason?: string,
  ): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: ['customer', 'vendor', 'product'],
    });
    if (!order) {
      throw AppError.notFound('Order not found');
    }

    if (userRole === Role.CUSTOMER && order.customer.userId !== userId) {
      throw AppError.forbidden('You can only cancel your own orders');
    }
    if (userRole === Role.VENDOR && order.vendor.userId !== userId) {
      throw AppError.forbidden('You can only cancel your own orders');
    }

    if (
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw AppError.badRequest(
        `Cannot cancel order with status '${order.status}'`,
      );
    }

    return await AppDataSource.transaction(async (manager) => {
      // If direct purchase, restore stock quantity
      if (
        order.sourceType === OrderSourceType.DIRECT_PURCHASE &&
        order.productId &&
        order.product
      ) {
        order.product.stockQuantity += order.quantity;
        await manager.save(ProductEntity, order.product);
      }

      order.status = OrderStatus.CANCELLED;
      if (reason) {
        order.notes = order.notes
          ? `${order.notes} | Cancel reason: ${reason}`
          : `Cancel reason: ${reason}`;
      }
      return await manager.save(OrderEntity, order);
    });
  }
}
