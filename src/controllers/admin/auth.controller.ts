import { Body, Controller, Middlewares, Post, Route, Tags } from 'tsoa';
import { autoInjectable } from 'tsyringe';
import messages from '../../constants/messages.constants';
import { AdminLoginResponse } from '../../interfaces/admin.interface';
import { ApiResponse } from '../../interfaces/apiResponse.interface';
import { RequestValidator } from '../../middlewares/validator.middleware';
import { AdminAuthSchema } from '../../schemas/admin-auth.schema';
import { AdminAuthService } from '../../services/admin/auth.service';

@Route('/admin/auth')
@Tags('Admin Auth System')
@autoInjectable()
export class AdminAuthController extends Controller {
  constructor(private adminAuthService?: AdminAuthService) {
    super();
  }

  @Post('')
  @Middlewares(RequestValidator.validate(AdminAuthSchema))
  async create(
    @Body() body: AdminAuthSchema,
  ): Promise<ApiResponse<AdminLoginResponse>> {
    const data = await this.adminAuthService!.login(body);

    return {
      data,
      message: messages.validLogin,
      success: true,
    };
  }
}
