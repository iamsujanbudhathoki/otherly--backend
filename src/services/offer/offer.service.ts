import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import {
  OfferFulfillType,
  OfferStatus,
  OrderSourceType,
  OrderStatus,
  RequestStatus,
  Role,
} from '../../constants/appConstant';
import { CustomerEntity } from '../../entities/customer/Customer.entity';
import { OfferEntity } from '../../entities/offer/Offer.entity';
import { OrderEntity } from '../../entities/order/Order.entity';
import { RequestEntity } from '../../entities/request/Request.entity';
import { VendorEntity } from '../../entities/vendor/Vendor.entity';
import { AppError } from '../../utils/appError.util';

export interface SubmitOfferDto {
  requestId: string;
  offeredQuantity: number;
  unitPrice: number;
  totalPrice?: number;
  deliveryDays?: number;
  fulfillType?: OfferFulfillType;
  notes?: string;
}

@injectable()
export class OfferService {
  private offerRepo = AppDataSource.getRepository(OfferEntity);
  private requestRepo = AppDataSource.getRepository(RequestEntity);
  private vendorRepo = AppDataSource.getRepository(VendorEntity);
  private customerRepo = AppDataSource.getRepository(CustomerEntity);
  private orderRepo = AppDataSource.getRepository(OrderEntity);

  async submitOffer(
    vendorUserId: string,
    data: SubmitOfferDto,
  ): Promise<OfferEntity> {
    const vendor = await this.vendorRepo.findOne({
      where: { userId: vendorUserId },
    });
    if (!vendor) {
      throw AppError.forbidden('Only registered vendors can submit offers');
    }

    const request = await this.requestRepo.findOne({
      where: { id: data.requestId },
    });
    if (!request) {
      throw AppError.notFound('Customer request not found');
    }

    if (request.status !== RequestStatus.OPEN) {
      throw AppError.badRequest(
        `Cannot submit offer for request with status '${request.status}'`,
      );
    }

    // Check if vendor already has a pending offer on this request
    const existingOffer = await this.offerRepo.findOne({
      where: {
        requestId: data.requestId,
        vendorId: vendor.id,
        status: OfferStatus.PENDING,
      },
    });
    if (existingOffer) {
      throw AppError.conflict(
        'You already have a pending offer on this request. Withdraw it first to submit a new one.',
      );
    }

    const totalPrice = data.totalPrice ?? data.unitPrice * data.offeredQuantity;

    const offer = this.offerRepo.create({
      requestId: data.requestId,
      vendorId: vendor.id,
      offeredQuantity: data.offeredQuantity,
      unitPrice: data.unitPrice,
      totalPrice,
      deliveryDays: data.deliveryDays ?? 3,
      fulfillType: data.fulfillType ?? OfferFulfillType.IN_STOCK,
      notes: data.notes?.trim(),
      status: OfferStatus.PENDING,
    });

    return await this.offerRepo.save(offer);
  }

  async getRequestOffers(
    userId: string,
    userRole: Role,
    requestId: string,
  ): Promise<OfferEntity[]> {
    const request = await this.requestRepo.findOne({
      where: { id: requestId },
      relations: ['customer'],
    });
    if (!request) {
      throw AppError.notFound('Customer request not found');
    }

    const qb = this.offerRepo
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.vendor', 'vendor')
      .leftJoinAndSelect('vendor.user', 'vendorUser')
      .leftJoinAndSelect('offer.request', 'request')
      .where('offer.requestId = :requestId', { requestId })
      .orderBy('offer.unitPrice', 'ASC');

    // If Customer is viewing, verify they own the request
    if (userRole === Role.CUSTOMER) {
      const customer = await this.customerRepo.findOne({
        where: { userId },
      });
      if (!customer || request.customerId !== customer.id) {
        throw AppError.forbidden(
          'You can only view offers for your own requests',
        );
      }
    } else if (userRole === Role.VENDOR) {
      // Vendors only see their own offers for confidentiality, unless Admin
      const vendor = await this.vendorRepo.findOne({ where: { userId } });
      if (vendor) {
        qb.andWhere('offer.vendorId = :vendorId', { vendorId: vendor.id });
      }
    }

    return await qb.getMany();
  }

  async getVendorOffers(
    vendorUserId: string,
    status?: OfferStatus,
  ): Promise<OfferEntity[]> {
    const vendor = await this.vendorRepo.findOne({
      where: { userId: vendorUserId },
    });
    if (!vendor) {
      throw AppError.forbidden('Vendor profile not found');
    }

    const qb = this.offerRepo
      .createQueryBuilder('offer')
      .leftJoinAndSelect('offer.request', 'request')
      .leftJoinAndSelect('request.customer', 'customer')
      .leftJoinAndSelect('customer.user', 'customerUser')
      .leftJoinAndSelect('request.subcategory', 'subcategory')
      .where('offer.vendorId = :vendorId', { vendorId: vendor.id })
      .orderBy('offer.createdAt', 'DESC');

    if (status) {
      qb.andWhere('offer.status = :status', { status });
    }

    return await qb.getMany();
  }

  async acceptOffer(
    customerUserId: string,
    offerId: string,
  ): Promise<{ offer: OfferEntity; order: OrderEntity }> {
    const customer = await this.customerRepo.findOne({
      where: { userId: customerUserId },
    });
    if (!customer) {
      throw AppError.forbidden('Customer profile not found');
    }

    const offer = await this.offerRepo.findOne({
      where: { id: offerId },
      relations: ['request', 'vendor', 'vendor.user'],
    });
    if (!offer) {
      throw AppError.notFound('Offer not found');
    }

    if (offer.request.customerId !== customer.id) {
      throw AppError.forbidden(
        'You can only accept offers for your own requests',
      );
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw AppError.badRequest(
        `Offer is not pending (status: ${offer.status})`,
      );
    }

    return await AppDataSource.transaction(async (manager) => {
      // 1. Mark accepted offer
      offer.status = OfferStatus.ACCEPTED;
      await manager.save(OfferEntity, offer);

      // 2. Reject other pending offers for this request
      await manager
        .createQueryBuilder()
        .update(OfferEntity)
        .set({ status: OfferStatus.REJECTED })
        .where(
          'requestId = :requestId AND id != :offerId AND status = :status',
          {
            requestId: offer.requestId,
            offerId: offer.id,
            status: OfferStatus.PENDING,
          },
        )
        .execute();

      // 3. Mark request fulfilled
      await manager.update(
        RequestEntity,
        { id: offer.requestId },
        { status: RequestStatus.FULFILLED },
      );

      // 4. Generate order
      const orderNumber = `ORD-REV-${Date.now().toString(36).toUpperCase()}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

      const order = manager.create(OrderEntity, {
        orderNumber,
        customerId: customer.id,
        vendorId: offer.vendorId,
        sourceType: OrderSourceType.REQUEST_OFFER,
        offerId: offer.id,
        requestId: offer.requestId,
        quantity: offer.offeredQuantity,
        unitPrice: offer.unitPrice,
        totalAmount: offer.totalPrice,
        shippingAddress:
          customer.shippingAddress ||
          offer.request.location ||
          'Standard Delivery',
        status: OrderStatus.CONFIRMED,
        notes: `Accepted offer for request: "${offer.request.title}"`,
      });

      const savedOrder = await manager.save(OrderEntity, order);

      return {
        offer,
        order: savedOrder,
      };
    });
  }

  async withdrawOffer(
    vendorUserId: string,
    offerId: string,
  ): Promise<OfferEntity> {
    const vendor = await this.vendorRepo.findOne({
      where: { userId: vendorUserId },
    });
    if (!vendor) {
      throw AppError.forbidden('Vendor profile not found');
    }

    const offer = await this.offerRepo.findOne({ where: { id: offerId } });
    if (!offer) {
      throw AppError.notFound('Offer not found');
    }

    if (offer.vendorId !== vendor.id) {
      throw AppError.forbidden('You can only withdraw your own offers');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw AppError.badRequest(
        `Cannot withdraw offer with status '${offer.status}'`,
      );
    }

    offer.status = OfferStatus.WITHDRAWN;
    return await this.offerRepo.save(offer);
  }
}
