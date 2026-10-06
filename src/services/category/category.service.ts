import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { CategoryEntity } from '../../entities/category/Category.entity';
import { SubcategoryEntity } from '../../entities/category/Subcategory.entity';
import { AppError } from '../../utils/appError.util';
import { slugify } from '../../utils/slugify';

@injectable()
export class CategoryService {
  private categoryRepo = AppDataSource.getRepository(CategoryEntity);
  private subcategoryRepo = AppDataSource.getRepository(SubcategoryEntity);

  async getAllCategories(activeOnly = true): Promise<CategoryEntity[]> {
    const where = activeOnly ? { isActive: true } : {};
    return await this.categoryRepo.find({
      where,
      relations: ['subcategories'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async getFeaturedCategories(): Promise<CategoryEntity[]> {
    return await this.categoryRepo.find({
      where: { isFeatured: true, isActive: true },
      relations: ['subcategories'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async getCategoryBySlug(slug: string): Promise<CategoryEntity> {
    const category = await this.categoryRepo.findOne({
      where: { slug },
      relations: ['subcategories'],
    });
    if (!category) {
      throw AppError.notFound(`Category with slug '${slug}' not found`);
    }
    return category;
  }

  async getCategoryById(id: string): Promise<CategoryEntity> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['subcategories'],
    });
    if (!category) {
      throw AppError.notFound(`Category not found`);
    }
    return category;
  }

  async createCategory(data: {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    bannerImage?: string;
    displayOrder?: number;
    isFeatured?: boolean;
  }): Promise<CategoryEntity> {
    const slug = data.slug?.trim() || slugify(data.name);
    const existing = await this.categoryRepo.findOne({ where: { slug } });
    if (existing) {
      throw AppError.conflict(`Category slug '${slug}' already exists`);
    }

    const category = this.categoryRepo.create({
      name: data.name.trim(),
      slug,
      description: data.description?.trim(),
      icon: data.icon?.trim(),
      bannerImage: data.bannerImage?.trim(),
      displayOrder: data.displayOrder ?? 0,
      isFeatured: data.isFeatured ?? false,
      isActive: true,
    });
    return await this.categoryRepo.save(category);
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      icon?: string;
      bannerImage?: string;
      displayOrder?: number;
      isFeatured?: boolean;
      isActive?: boolean;
    },
  ): Promise<CategoryEntity> {
    const category = await this.getCategoryById(id);

    if (data.name !== undefined) category.name = data.name.trim();
    if (data.slug !== undefined) category.slug = data.slug.trim();
    if (data.description !== undefined)
      category.description = data.description.trim();
    if (data.icon !== undefined) category.icon = data.icon.trim();
    if (data.bannerImage !== undefined)
      category.bannerImage = data.bannerImage.trim();
    if (data.displayOrder !== undefined)
      category.displayOrder = data.displayOrder;
    if (data.isFeatured !== undefined) category.isFeatured = data.isFeatured;
    if (data.isActive !== undefined) category.isActive = data.isActive;

    return await this.categoryRepo.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.getCategoryById(id);
    await this.categoryRepo.softRemove(category);
  }

  async getSubcategories(
    categoryId?: string,
    activeOnly = true,
  ): Promise<SubcategoryEntity[]> {
    const qb = this.subcategoryRepo
      .createQueryBuilder('sub')
      .leftJoinAndSelect('sub.category', 'category')
      .orderBy('sub.displayOrder', 'ASC')
      .addOrderBy('sub.name', 'ASC');

    if (categoryId) {
      qb.andWhere('sub.categoryId = :categoryId', { categoryId });
    }
    if (activeOnly) {
      qb.andWhere('sub.isActive = :isActive', { isActive: true });
    }

    return await qb.getMany();
  }

  async getSubcategoryBySlug(slug: string): Promise<SubcategoryEntity> {
    const sub = await this.subcategoryRepo.findOne({
      where: { slug },
      relations: ['category'],
    });
    if (!sub) {
      throw AppError.notFound(`Subcategory with slug '${slug}' not found`);
    }
    return sub;
  }

  async getSubcategoryById(id: string): Promise<SubcategoryEntity> {
    const sub = await this.subcategoryRepo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!sub) {
      throw AppError.notFound(`Subcategory not found`);
    }
    return sub;
  }

  async createSubcategory(data: {
    categoryId: string;
    name: string;
    slug?: string;
    description?: string;
    displayOrder?: number;
  }): Promise<SubcategoryEntity> {
    await this.getCategoryById(data.categoryId);

    const slug = data.slug?.trim() || slugify(data.name);
    const existing = await this.subcategoryRepo.findOne({ where: { slug } });
    if (existing) {
      throw AppError.conflict(`Subcategory slug '${slug}' already exists`);
    }

    const subcategory = this.subcategoryRepo.create({
      categoryId: data.categoryId,
      name: data.name.trim(),
      slug,
      description: data.description?.trim(),
      displayOrder: data.displayOrder ?? 0,
      isActive: true,
    });
    return await this.subcategoryRepo.save(subcategory);
  }

  async updateSubcategory(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      displayOrder?: number;
      isActive?: boolean;
    },
  ): Promise<SubcategoryEntity> {
    const sub = await this.getSubcategoryById(id);

    if (data.name !== undefined) sub.name = data.name.trim();
    if (data.slug !== undefined) sub.slug = data.slug.trim();
    if (data.description !== undefined)
      sub.description = data.description.trim();
    if (data.displayOrder !== undefined) sub.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) sub.isActive = data.isActive;

    return await this.subcategoryRepo.save(sub);
  }

  async deleteSubcategory(id: string): Promise<void> {
    const sub = await this.getSubcategoryById(id);
    await this.subcategoryRepo.softRemove(sub);
  }
}
