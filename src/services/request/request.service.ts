import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { RequestStatus } from '../../constants/appConstant';
import { CustomerEntity } from '../../entities/customer/Customer.entity';
import { RequestEntity } from '../../entities/request/Request.entity';
import { AppError } from '../../utils/appError.util';

export interface CreateRequestDto {
  title: string;
  description: string;
  quantity: number;
  subcategoryId?: string;
  budget?: number;
  location?: string;
  requiredWithinDays?: number;
  deadline?: Date;
  attachmentMediaIds?: string[];
}

export interface UpdateRequestDto {
  title?: string;
  description?: string;
  quantity?: number;
  subcategoryId?: string;
  budget?: number;
  location?: string;
  requiredWithinDays?: number;
  deadline?: Date;
  attachmentMediaIds?: string[];
}

export interface RequestFilterDto {
  subcategoryId?: string;
  categoryId?: string;
  status?: RequestStatus;
  search?: string;
}

@injectable()
export class RequestService {
  private requestRepo = AppDataSource.getRepository(RequestEntity);
  private customerRepo = AppDataSource.getRepository(CustomerEntity);

  async create(
    customerUserId: string,
    data: CreateRequestDto,
  ): Promise<RequestEntity> {
    const customer = await this.customerRepo.findOne({
      where: { userId: customerUserId },
    });
    if (!customer) {
      throw AppError.forbidden('Only customers can post product requests');
    }

    const request = this.requestRepo.create({
      customerId: customer.id,
      subcategoryId: data.subcategoryId,
      title: data.title.trim(),
      description: data.description.trim(),
      quantity: data.quantity,
      budget: data.budget,
      location: data.location?.trim(),
      requiredWithinDays: data.requiredWithinDays,
      deadline: data.deadline,
      attachmentMediaIds: data.attachmentMediaIds || [],
      status: RequestStatus.OPEN,
    });

    return await this.requestRepo.save(request);
  }

  async getAll(filter: RequestFilterDto = {}): Promise<RequestEntity[]> {
    const qb = this.requestRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.customer', 'customer')
      .leftJoinAndSelect('customer.user', 'customerUser')
      .leftJoinAndSelect('request.subcategory', 'subcategory')
      .leftJoinAndSelect('subcategory.category', 'category')
      .leftJoinAndSelect('request.offers', 'offers')
      .orderBy('request.createdAt', 'DESC');

    if (filter.status) {
      qb.andWhere('request.status = :status', { status: filter.status });
    } else {
      // Default to open requests for browsing
      qb.andWhere('request.status = :status', { status: RequestStatus.OPEN });
    }

    if (filter.subcategoryId) {
      qb.andWhere('request.subcategoryId = :subcategoryId', {
        subcategoryId: filter.subcategoryId,
      });
    }

    if (filter.categoryId) {
      qb.andWhere('subcategory.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(request.title) LIKE :search OR LOWER(request.description) LIKE :search OR LOWER(request.location) LIKE :search)',
        { search: `%${filter.search.toLowerCase()}%` },
      );
    }

    return await qb.getMany();
  }

  async getById(id: string): Promise<RequestEntity> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: [
        'customer',
        'customer.user',
        'subcategory',
        'subcategory.category',
        'offers',
        'offers.vendor',
        'offers.vendor.user',
      ],
    });
    if (!request) {
      throw AppError.notFound('Customer request not found');
    }
    return request;
  }

  async getCustomerRequests(
    customerUserId: string,
    status?: RequestStatus,
  ): Promise<RequestEntity[]> {
    const customer = await this.customerRepo.findOne({
      where: { userId: customerUserId },
    });
    if (!customer) {
      throw AppError.forbidden('Customer profile not found');
    }

    const where: Record<string, unknown> = { customerId: customer.id };
    if (status) {
      where.status = status;
    }

    return await this.requestRepo.find({
      where,
      relations: [
        'subcategory',
        'subcategory.category',
        'offers',
        'offers.vendor',
        'offers.vendor.user',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    customerUserId: string,
    id: string,
    data: UpdateRequestDto,
  ): Promise<RequestEntity> {
    const customer = await this.customerRepo.findOne({
      where: { userId: customerUserId },
    });
    if (!customer) {
      throw AppError.forbidden('Customer profile not found');
    }

    const request = await this.getById(id);
    if (request.customerId !== customer.id) {
      throw AppError.forbidden('You can only update your own requests');
    }

    if (
      request.status !== RequestStatus.OPEN &&
      request.status !== RequestStatus.DRAFT
    ) {
      throw AppError.badRequest(
        `Cannot update request with status '${request.status}'`,
      );
    }

    if (data.title !== undefined) request.title = data.title.trim();
    if (data.description !== undefined)
      request.description = data.description.trim();
    if (data.quantity !== undefined) request.quantity = data.quantity;
    if (data.subcategoryId !== undefined)
      request.subcategoryId = data.subcategoryId;
    if (data.budget !== undefined) request.budget = data.budget;
    if (data.location !== undefined) request.location = data.location.trim();
    if (data.requiredWithinDays !== undefined)
      request.requiredWithinDays = data.requiredWithinDays;
    if (data.deadline !== undefined) request.deadline = data.deadline;
    if (data.attachmentMediaIds !== undefined)
      request.attachmentMediaIds = data.attachmentMediaIds;

    return await this.requestRepo.save(request);
  }

  async cancel(customerUserId: string, id: string): Promise<RequestEntity> {
    const customer = await this.customerRepo.findOne({
      where: { userId: customerUserId },
    });
    if (!customer) {
      throw AppError.forbidden('Customer profile not found');
    }

    const request = await this.getById(id);
    if (request.customerId !== customer.id) {
      throw AppError.forbidden('You can only cancel your own requests');
    }

    if (request.status === RequestStatus.FULFILLED) {
      throw AppError.badRequest('Cannot cancel an already fulfilled request');
    }

    request.status = RequestStatus.CANCELLED;
    return await this.requestRepo.save(request);
  }
}
