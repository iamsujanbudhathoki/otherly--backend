import { autoInjectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import messages from '../../constants/messages.constants';
import { ProductEntity } from '../../entities/product/Product.entity';
import {
  CreateProductSchema,
  UpdateProductSchema,
} from '../../schemas/product.schema';
import { AppError } from '../../utils/appError.util';

@autoInjectable()
export class ProductService {
  private productRepo = AppDataSource.getRepository(ProductEntity);

  async create(data: CreateProductSchema): Promise<ProductEntity> {
    const existing = await this.productRepo.findOne({
      where: { slug: data.slug.trim() },
    });
    if (existing) {
      throw AppError.conflict(messages.productAlreadyExists);
    }

    const product = this.productRepo.create({
      ...data,
      slug: data.slug.trim(),
      isActive: data.isActive ?? true,
    });
    return await this.productRepo.save(product);
  }

  async getAll(activeOnly = true): Promise<ProductEntity[]> {
    const where = activeOnly ? { isActive: true } : {};
    return await this.productRepo.find({
      where,
      order: { createdAt: 'ASC' },
    });
  }

  async getBySlug(slug: string): Promise<ProductEntity> {
    const product = await this.productRepo.findOne({ where: { slug } });
    if (!product) {
      throw AppError.notFound(messages.productNotFound);
    }
    return product;
  }

  async update(
    slug: string,
    data: UpdateProductSchema,
  ): Promise<ProductEntity> {
    const product = await this.getBySlug(slug);
    Object.assign(product, data);
    return await this.productRepo.save(product);
  }

  async delete(slug: string): Promise<void> {
    const product = await this.getBySlug(slug);
    await this.productRepo.softRemove(product);
  }
}
