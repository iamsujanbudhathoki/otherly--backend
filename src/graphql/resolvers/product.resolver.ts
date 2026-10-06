import { injectable } from 'tsyringe';
import {
  Arg,
  Authorized,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import { Role } from '../../constants/appConstant';
import { Media } from '../../entities/media/media.entity';
import { ProductEntity } from '../../entities/product/Product.entity';
import { ProductService } from '../../services/product/product.service';
import { MediaHelper } from '../../utils/media.util';
import { GraphQLContext } from '../context';
import {
  CreateProductInput,
  ProductFilterInput,
  UpdateProductInput,
} from '../inputs/product.input';

@injectable()
@Resolver(() => ProductEntity)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @FieldResolver(() => [String], {
    description: 'Centralized public URLs of product images',
  })
  async imageUrls(@Root() product: ProductEntity): Promise<string[]> {
    const ids =
      product.imageMediaIds && product.imageMediaIds.length > 0
        ? product.imageMediaIds
        : [];
    if (ids.length > 0) {
      return await MediaHelper.getMediaUrlsByIds(ids);
    }
    return product.images || [];
  }

  @FieldResolver(() => [Media], {
    nullable: true,
    description: 'Centralized Media asset objects for product images',
  })
  async media(@Root() product: ProductEntity): Promise<Media[]> {
    const ids =
      product.imageMediaIds && product.imageMediaIds.length > 0
        ? product.imageMediaIds
        : [];
    if (ids.length > 0) {
      return await MediaHelper.getMediaByIds(ids);
    }
    return [];
  }

  @Query(() => [ProductEntity], {
    description:
      'Browse products with search, category, subcategory, price, and vendor filters',
  })
  async products(
    @Arg('filter', { nullable: true }) filter?: ProductFilterInput,
  ): Promise<ProductEntity[]> {
    return await this.productService.getAll(filter || {});
  }

  @Query(() => ProductEntity, {
    nullable: true,
    description: 'Retrieve a single product by unique slug',
  })
  async product(@Arg('slug') slug: string): Promise<ProductEntity | null> {
    try {
      return await this.productService.getBySlug(slug);
    } catch {
      return null;
    }
  }

  @Query(() => ProductEntity, {
    nullable: true,
    description: 'Retrieve a single product by unique ID',
  })
  async productById(@Arg('id') id: string): Promise<ProductEntity | null> {
    try {
      return await this.productService.getById(id);
    } catch {
      return null;
    }
  }

  @Authorized([Role.VENDOR])
  @Query(() => [ProductEntity], {
    description: 'Retrieve products listed by the authenticated vendor',
  })
  async myVendorProducts(
    @Ctx() { user }: GraphQLContext,
    @Arg('activeOnly', { nullable: true }) activeOnly?: boolean,
  ): Promise<ProductEntity[]> {
    return await this.productService.getVendorProducts(user!.sub, activeOnly);
  }

  @Authorized([Role.VENDOR])
  @Mutation(() => ProductEntity, {
    description: 'List a new product in the marketplace (Vendors only)',
  })
  async createProduct(
    @Ctx() { user }: GraphQLContext,
    @Arg('input') input: CreateProductInput,
  ): Promise<ProductEntity> {
    return await this.productService.create(user!.sub, input);
  }

  @Authorized([Role.VENDOR])
  @Mutation(() => ProductEntity, {
    description: 'Update a product listed by the authenticated vendor',
  })
  async updateProduct(
    @Ctx() { user }: GraphQLContext,
    @Arg('id') id: string,
    @Arg('input') input: UpdateProductInput,
  ): Promise<ProductEntity> {
    return await this.productService.update(user!.sub, id, input);
  }

  @Authorized([Role.VENDOR])
  @Mutation(() => Boolean, {
    description: 'Delete a product listed by the authenticated vendor',
  })
  async deleteProduct(
    @Ctx() { user }: GraphQLContext,
    @Arg('id') id: string,
  ): Promise<boolean> {
    await this.productService.delete(user!.sub, id);
    return true;
  }
}
