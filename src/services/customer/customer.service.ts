import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { RequestStatus } from '../../constants/appConstant';
import { CustomerEntity } from '../../entities/customer/Customer.entity';
import { OrderEntity } from '../../entities/order/Order.entity';
import { RequestEntity } from '../../entities/request/Request.entity';
import { AppError } from '../../utils/appError.util';

export interface UpdateCustomerProfileDto {
  shippingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  preferences?: string;
  notes?: string;
}

@injectable()
export class CustomerService {
  private customerRepo = AppDataSource.getRepository(CustomerEntity);
  private requestRepo = AppDataSource.getRepository(RequestEntity);
  private orderRepo = AppDataSource.getRepository(OrderEntity);

  async getProfile(userId: string): Promise<CustomerEntity> {
    const customer = await this.customerRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!customer) {
      throw AppError.notFound('Customer profile not found');
    }
    return customer;
  }

  async updateProfile(
    userId: string,
    data: UpdateCustomerProfileDto,
  ): Promise<CustomerEntity> {
    const customer = await this.getProfile(userId);

    if (data.shippingAddress !== undefined)
      customer.shippingAddress = data.shippingAddress.trim();
    if (data.city !== undefined) customer.city = data.city.trim();
    if (data.state !== undefined) customer.state = data.state.trim();
    if (data.postalCode !== undefined)
      customer.postalCode = data.postalCode.trim();
    if (data.country !== undefined) customer.country = data.country.trim();
    if (data.preferences !== undefined)
      customer.preferences = data.preferences.trim();
    if (data.notes !== undefined) customer.notes = data.notes.trim();

    return await this.customerRepo.save(customer);
  }

  async getCustomerStats(userId: string) {
    const customer = await this.getProfile(userId);

    const [totalRequests, activeRequests, totalOrders] = await Promise.all([
      this.requestRepo.count({ where: { customerId: customer.id } }),
      this.requestRepo.count({
        where: { customerId: customer.id, status: RequestStatus.OPEN },
      }),
      this.orderRepo.count({ where: { customerId: customer.id } }),
    ]);

    return {
      totalRequests,
      activeRequests,
      totalOrders,
    };
  }
}
