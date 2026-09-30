import {
  Body,
  Controller,
  Delete,
  Get,
  Middlewares,
  Patch,
  Path,
  Post,
  Query,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { autoInjectable } from 'tsyringe';
import messages from '../../constants/messages.constants';
import { AdminPermission } from '../../entities/admin/Admin.entity';
import { ProductEntity } from '../../entities/product/Product.entity';
import { ApiResponse } from '../../interfaces/apiResponse.interface';
import { RequestValidator } from '../../middlewares/validator.middleware';
import {
  CreateProductSchema,
  UpdateProductSchema,
} from '../../schemas/product.schema';
import { ProductService } from '../../services/product/product.service';

@Route('products')
@Tags('Products')
@autoInjectable()
export class ProductController extends Controller {
  constructor(private productService?: ProductService) {
    super();
  }

  @Get('/')
  async getAllProducts(
    @Query() activeOnly?: boolean,
  ): Promise<ApiResponse<ProductEntity[]>> {
    const data = await this.productService!.getAll(activeOnly ?? true);
    return {
      data,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Get('/{slug}')
  async getProductBySlug(
    @Path() slug: string,
  ): Promise<ApiResponse<ProductEntity>> {
    const data = await this.productService!.getBySlug(slug);
    return {
      data,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Post('/')
  @Security('jwt', [AdminPermission.PRODUCT])
  @SuccessResponse('201', 'Created')
  @Middlewares(RequestValidator.validate(CreateProductSchema))
  async createProduct(
    @Body() body: CreateProductSchema,
  ): Promise<ApiResponse<ProductEntity>> {
    this.setStatus(201);
    const data = await this.productService!.create(body);
    return {
      data,
      message: messages.dataInserted,
      success: true,
    };
  }

  @Patch('/{slug}')
  @Security('jwt', [AdminPermission.PRODUCT])
  @Middlewares(RequestValidator.validate(UpdateProductSchema))
  async updateProduct(
    @Path() slug: string,
    @Body() body: UpdateProductSchema,
  ): Promise<ApiResponse<ProductEntity>> {
    const data = await this.productService!.update(slug, body);
    return {
      data,
      message: messages.dataUpdated,
      success: true,
    };
  }

  @Delete('/{slug}')
  @Security('jwt', [AdminPermission.PRODUCT])
  async deleteProduct(@Path() slug: string): Promise<ApiResponse<null>> {
    await this.productService!.delete(slug);
    return {
      data: null,
      message: messages.dataDeleted,
      success: true,
    };
  }
}
