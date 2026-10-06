import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { OfferStatus } from '../../constants/appConstant';
import { OfferEntity } from '../../entities/offer/Offer.entity';
import { OrderEntity } from '../../entities/order/Order.entity';
import { ProductEntity } from '../../entities/product/Product.entity';
import { VendorEntity } from '../../entities/vendor/Vendor.entity';
import { AppError } from '../../utils/appError.util';

export interface UpdateVendorProfileDto {
  businessName?: string;
  businessRegistrationNumber?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
}

@injectable()
export class VendorService {
  private vendorRepo = AppDataSource.getRepository(VendorEntity);
  private productRepo = AppDataSource.getRepository(ProductEntity);
  private offerRepo = AppDataSource.getRepository(OfferEntity);
  private orderRepo = AppDataSource.getRepository(OrderEntity);

  async getProfile(userId: string): Promise<VendorEntity> {
    const vendor = await this.vendorRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!vendor) {
      throw AppError.notFound('Vendor profile not found');
    }
    return vendor;
  }

  async getVendorById(id: string): Promise<VendorEntity> {
    const vendor = await this.vendorRepo.findOne({
      where: { id },
      relations: ['user', 'products'],
    });
    if (!vendor) {
      throw AppError.notFound('Vendor not found');
    }
    return vendor;
  }

  async getAllVendors(
    filter: { verifiedOnly?: boolean; search?: string } = {},
  ): Promise<VendorEntity[]> {
    const qb = this.vendorRepo
      .createQueryBuilder('vendor')
      .leftJoinAndSelect('vendor.user', 'user')
      .orderBy('vendor.rating', 'DESC');

    if (filter.verifiedOnly) {
      qb.andWhere('vendor.isVerified = :isVerified', { isVerified: true });
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(vendor.businessName) LIKE :search OR LOWER(vendor.city) LIKE :search OR LOWER(vendor.description) LIKE :search)',
        { search: `%${filter.search.toLowerCase()}%` },
      );
    }

    return await qb.getMany();
  }

  async updateProfile(
    userId: string,
    data: UpdateVendorProfileDto,
  ): Promise<VendorEntity> {
    const vendor = await this.getProfile(userId);

    if (data.businessName !== undefined)
      vendor.businessName = data.businessName.trim();
    if (data.businessRegistrationNumber !== undefined)
      vendor.businessRegistrationNumber =
        data.businessRegistrationNumber.trim();
    if (data.businessAddress !== undefined)
      vendor.businessAddress = data.businessAddress.trim();
    if (data.city !== undefined) vendor.city = data.city.trim();
    if (data.state !== undefined) vendor.state = data.state.trim();
    if (data.postalCode !== undefined)
      vendor.postalCode = data.postalCode.trim();
    if (data.country !== undefined) vendor.country = data.country.trim();
    if (data.description !== undefined)
      vendor.description = data.description.trim();

    return await this.vendorRepo.save(vendor);
  }

  async getVendorStats(userId: string) {
    const vendor = await this.getProfile(userId);

    const [totalProducts, activeOffers, totalOrders] = await Promise.all([
      this.productRepo.count({ where: { vendorId: vendor.id } }),
      this.offerRepo.count({
        where: { vendorId: vendor.id, status: OfferStatus.PENDING },
      }),
      this.orderRepo.count({ where: { vendorId: vendor.id } }),
    ]);

    return {
      totalProducts,
      activeOffers,
      totalOrders,
      rating: Number(vendor.rating),
      totalReviews: vendor.totalReviews,
    };
  }
}
