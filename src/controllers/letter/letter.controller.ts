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
import { LetterKind } from '../../constants/appConstant';
import messages from '../../constants/messages.constants';
import { AdminPermission } from '../../entities/admin/Admin.entity';
import { LetterEntity } from '../../entities/letter/Letter.entity';
import { ApiResponse } from '../../interfaces/apiResponse.interface';
import { RequestValidator } from '../../middlewares/validator.middleware';
import {
  CreateLetterSchema,
  UpdateLetterSchema,
} from '../../schemas/letter.schema';
import { LetterService } from '../../services/letter/letter.service';

@Route('letters')
@Tags('Stradmont Letters')
@autoInjectable()
export class LetterController extends Controller {
  constructor(private letterService?: LetterService) {
    super();
  }

  @Get('/')
  async getAllLetters(
    @Query() page?: number,
    @Query() limit?: number,
    @Query() search?: string,
    @Query() kind?: LetterKind,
    @Query() publishedOnly?: boolean,
  ) {
    const result = await this.letterService!.getAll({
      page,
      limit,
      search,
      kind,
      publishedOnly,
    });
    return {
      ...result,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Get('/{slug}')
  async getLetterBySlug(
    @Path() slug: string,
  ): Promise<ApiResponse<LetterEntity>> {
    const data = await this.letterService!.getBySlug(slug);
    return {
      data,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Post('/')
  @Security('jwt', [AdminPermission.LETTERS])
  @SuccessResponse('201', 'Created')
  @Middlewares(RequestValidator.validate(CreateLetterSchema))
  async createLetter(
    @Body() body: CreateLetterSchema,
  ): Promise<ApiResponse<LetterEntity>> {
    this.setStatus(201);
    const data = await this.letterService!.create(body);
    return {
      data,
      message: messages.dataInserted,
      success: true,
    };
  }

  @Patch('/{slug}')
  @Security('jwt', [AdminPermission.LETTERS])
  @Middlewares(RequestValidator.validate(UpdateLetterSchema))
  async updateLetter(
    @Path() slug: string,
    @Body() body: UpdateLetterSchema,
  ): Promise<ApiResponse<LetterEntity>> {
    const data = await this.letterService!.update(slug, body);
    return {
      data,
      message: messages.dataUpdated,
      success: true,
    };
  }

  @Delete('/{slug}')
  @Security('jwt', [AdminPermission.LETTERS])
  async deleteLetter(@Path() slug: string): Promise<ApiResponse<null>> {
    await this.letterService!.delete(slug);
    return {
      data: null,
      message: messages.dataDeleted,
      success: true,
    };
  }
}
