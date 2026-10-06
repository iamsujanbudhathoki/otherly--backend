import { injectable } from 'tsyringe';
import {
  Arg,
  Authorized,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { Role } from '../../constants/appConstant';
import { CategoryEntity } from '../../entities/category/Category.entity';
import { SubcategoryEntity } from '../../entities/category/Subcategory.entity';
import { Media } from '../../entities/media/media.entity';
import { CategoryService } from '../../services/category/category.service';
import { MediaHelper } from '../../utils/media.util';
import {
  CreateCategoryInput,
  CreateSubcategoryInput,
  UpdateCategoryInput,
  UpdateSubcategoryInput,
} from '../inputs/category.input';

@injectable()
@Resolver(() => CategoryEntity)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @FieldResolver(() => String, {
    nullable: true,
    description: 'Centralized public URL of category icon',
  })
  async iconUrl(@Root() category: CategoryEntity): Promise<string | undefined> {
    if (category.iconMediaId) {
      return await MediaHelper.getMediaUrlById(category.iconMediaId);
    }
    return category.icon;
  }

  @FieldResolver(() => String, {
    nullable: true,
    description: 'Centralized public URL of category banner image',
  })
  async bannerImageUrl(
    @Root() category: CategoryEntity,
  ): Promise<string | undefined> {
    if (category.bannerMediaId) {
      return await MediaHelper.getMediaUrlById(category.bannerMediaId);
    }
    return category.bannerImage;
  }

  @FieldResolver(() => Media, {
    nullable: true,
    description: 'Centralized Media asset object for category icon',
  })
  async iconMedia(
    @Root() category: CategoryEntity,
  ): Promise<Media | undefined> {
    if (category.iconMediaId) {
      return await MediaHelper.getMediaById(category.iconMediaId);
    }
    return undefined;
  }

  @FieldResolver(() => Media, {
    nullable: true,
    description: 'Centralized Media asset object for banner image',
  })
  async bannerMedia(
    @Root() category: CategoryEntity,
  ): Promise<Media | undefined> {
    if (category.bannerMediaId) {
      return await MediaHelper.getMediaById(category.bannerMediaId);
    }
    return undefined;
  }

  @Query(() => [CategoryEntity], {
    description: 'Retrieve all product/request categories',
  })
  async categories(
    @Arg('activeOnly', { defaultValue: true, nullable: true })
    activeOnly?: boolean,
  ): Promise<CategoryEntity[]> {
    return await this.categoryService.getAllCategories(activeOnly);
  }

  @Query(() => [CategoryEntity], {
    description:
      'Retrieve featured categories for homepage/navigation highlights',
  })
  async featuredCategories(): Promise<CategoryEntity[]> {
    return await this.categoryService.getFeaturedCategories();
  }

  @Query(() => CategoryEntity, {
    nullable: true,
    description: 'Retrieve a category by unique slug',
  })
  async category(@Arg('slug') slug: string): Promise<CategoryEntity | null> {
    try {
      return await this.categoryService.getCategoryBySlug(slug);
    } catch {
      return null;
    }
  }

  @Query(() => [SubcategoryEntity], {
    description: 'Retrieve subcategories, optionally filtered by categoryId',
  })
  async subcategories(
    @Arg('categoryId', { nullable: true }) categoryId?: string,
    @Arg('activeOnly', { defaultValue: true, nullable: true })
    activeOnly?: boolean,
  ): Promise<SubcategoryEntity[]> {
    return await this.categoryService.getSubcategories(categoryId, activeOnly);
  }

  @Query(() => SubcategoryEntity, {
    nullable: true,
    description: 'Retrieve a subcategory by unique slug',
  })
  async subcategory(
    @Arg('slug') slug: string,
  ): Promise<SubcategoryEntity | null> {
    try {
      return await this.categoryService.getSubcategoryBySlug(slug);
    } catch {
      return null;
    }
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => CategoryEntity, {
    description: 'Create a new top-level category (Admin only)',
  })
  async createCategory(
    @Arg('input') input: CreateCategoryInput,
  ): Promise<CategoryEntity> {
    return await this.categoryService.createCategory(input);
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => CategoryEntity, {
    description: 'Update an existing category (Admin only)',
  })
  async updateCategory(
    @Arg('id') id: string,
    @Arg('input') input: UpdateCategoryInput,
  ): Promise<CategoryEntity> {
    return await this.categoryService.updateCategory(id, input);
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => Boolean, {
    description: 'Soft-delete a category (Admin only)',
  })
  async deleteCategory(@Arg('id') id: string): Promise<boolean> {
    await this.categoryService.deleteCategory(id);
    return true;
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => SubcategoryEntity, {
    description: 'Create a new subcategory (Admin only)',
  })
  async createSubcategory(
    @Arg('input') input: CreateSubcategoryInput,
  ): Promise<SubcategoryEntity> {
    return await this.categoryService.createSubcategory(input);
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => SubcategoryEntity, {
    description: 'Update an existing subcategory (Admin only)',
  })
  async updateSubcategory(
    @Arg('id') id: string,
    @Arg('input') input: UpdateSubcategoryInput,
  ): Promise<SubcategoryEntity> {
    return await this.categoryService.updateSubcategory(id, input);
  }

  @Authorized([Role.ADMIN])
  @Mutation(() => Boolean, {
    description: 'Soft-delete a subcategory (Admin only)',
  })
  async deleteSubcategory(@Arg('id') id: string): Promise<boolean> {
    await this.categoryService.deleteSubcategory(id);
    return true;
  }
}
