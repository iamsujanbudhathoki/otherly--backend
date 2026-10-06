import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import messages from '../../constants/messages.constants';
import { ProductEntity } from '../../entities/product/Product.entity';
import { VendorEntity } from '../../entities/vendor/Vendor.entity';
import {
  CreateProductSchema,
  UpdateProductSchema,
} from '../../schemas/product.schema';
import { AppError } from '../../utils/appError.util';
import { slugify } from '../../utils/slugify';

export interface ProductFilter {
  categoryId?: string;
  subcategoryId?: string;
  vendorId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  activeOnly?: boolean;
}

@injectable()
export class ProductService {
  private productRepo = AppDataSource.getRepository(ProductEntity);
  private vendorRepo = AppDataSource.getRepository(VendorEntity);

  async create(
    vendorUserId: string,
    data: CreateProductSchema,
  ): Promise<ProductEntity> {
    const vendor = await this.vendorRepo.findOne({
      where: { userId: vendorUserId },
    });
    if (!vendor) {
      throw AppError.forbidden('Only registered vendors can create products');
    }

    const slug = data.slug?.trim() || slugify(data.title);
    const existing = await this.productRepo.findOne({ where: { slug } });
    if (existing) {
      throw AppError.conflict(messages.productAlreadyExists);
    }

    const product = this.productRepo.create({
      vendorId: vendor.id,
      subcategoryId: data.subcategoryId,
      title: data.title.trim(),
      slug,
      description: data.description.trim(),
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      stockQuantity: data.stockQuantity ?? 0,
      imageMediaIds: data.imageMediaIds || data.images || [],
      images: data.images || [],
      sku: data.sku?.trim(),
      isActive: data.isActive ?? true,
    });

    return await this.productRepo.save(product);
  }

  async getAll(filter: ProductFilter = {}): Promise<ProductEntity[]> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.vendor', 'vendor')
      .leftJoinAndSelect('vendor.user', 'vendorUser')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .leftJoinAndSelect('subcategory.category', 'category')
      .orderBy('product.createdAt', 'DESC');

    if (filter.activeOnly !== false) {
      qb.andWhere('product.isActive = :isActive', { isActive: true });
    }

    if (filter.vendorId) {
      qb.andWhere('product.vendorId = :vendorId', {
        vendorId: filter.vendorId,
      });
    }

    if (filter.subcategoryId) {
      qb.andWhere('product.subcategoryId = :subcategoryId', {
        subcategoryId: filter.subcategoryId,
      });
    }

    if (filter.categoryId) {
      qb.andWhere('subcategory.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: filter.minPrice });
    }

    if (filter.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: filter.maxPrice });
    }

    if (filter.inStockOnly) {
      qb.andWhere('product.stockQuantity > 0');
    }

    if (filter.search) {
      qb.andWhere(
        '(LOWER(product.title) LIKE :search OR LOWER(product.description) LIKE :search OR LOWER(product.sku) LIKE :search)',
        { search: `%${filter.search.toLowerCase()}%` },
      );
    }

    return await qb.getMany();
  }

  async getBySlug(slug: string): Promise<ProductEntity> {
    const product = await this.productRepo.findOne({
      where: { slug },
      relations: [
        'vendor',
        'vendor.user',
        'subcategory',
        'subcategory.category',
      ],
    });
    if (!product) {
      throw AppError.notFound(messages.productNotFound);
    }
    return product;
  }

  async getById(id: string): Promise<ProductEntity> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: [
        'vendor',
        'vendor.user',
        'subcategory',
        'subcategory.category',
      ],
    });
    if (!product) {
      throw AppError.notFound(messages.productNotFound);
    }
    return product;
  }

  async getVendorProducts(
    vendorUserId: string,
    activeOnly?: boolean,
  ): Promise<ProductEntity[]> {
    const vendor = await this.vendorRepo.findOne({
      where: { userId: vendorUserId },
    });
    if (!vendor) {
      throw AppError.forbidden('Vendor profile not found');
    }

    const where: Record<string, unknown> = { vendorId: vendor.id };
    if (activeOnly !== undefined) {
      where.isActive = activeOnly;
    }

    return await this.productRepo.find({
      where,
      relations: ['subcategory', 'subcategory.category'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    vendorUserId: string,
    id: string,
    data: UpdateProductSchema,
  ): Promise<ProductEntity> {
    const vendor = await this.vendorRepo.findOne({
      where: { userId: vendorUserId },
    });
    if (!vendor) {
      throw AppError.forbidden('Vendor profile not found');
    }

    const product = await this.getById(id);
    if (product.vendorId !== vendor.id) {
      throw AppError.forbidden('You can only update your own products');
    }

    if (data.title !== undefined) product.title = data.title.trim();
    if (data.slug !== undefined) product.slug = data.slug.trim();
    if (data.description !== undefined)
      product.description = data.description.trim();
    if (data.price !== undefined) product.price = data.price;
    if (data.compareAtPrice !== undefined)
      product.compareAtPrice = data.compareAtPrice;
    if (data.stockQuantity !== undefined)
      product.stockQuantity = data.stockQuantity;
    if (data.subcategoryId !== undefined)
      product.subcategoryId = data.subcategoryId;
    if (data.imageMediaIds !== undefined)
      product.imageMediaIds = data.imageMediaIds;
    if (data.images !== undefined) product.images = data.images;
    if (data.sku !== undefined) product.sku = data.sku.trim();
    if (data.isActive !== undefined) product.isActive = data.isActive;

    return await this.productRepo.save(product);
  }

  async delete(vendorUserId: string, id: string): Promise<void> {
    const vendor = await this.vendorRepo.findOne({
      where: { userId: vendorUserId },
    });
    if (!vendor) {
      throw AppError.forbidden('Vendor profile not found');
    }

    const product = await this.getById(id);
    if (product.vendorId !== vendor.id) {
      throw AppError.forbidden('You can only delete your own products');
    }

    await this.productRepo.softRemove(product);
  }
}
