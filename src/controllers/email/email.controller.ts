import {
  Controller,
  Get,
  Path,
  Post,
  Query,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { autoInjectable } from 'tsyringe';
import { EmailDeliveryStatus, MailType } from '../../constants/appConstant';
import messages from '../../constants/messages.constants';
import { EmailLogEntity } from '../../entities/email/EmailLog.entity';
import { ApiResponse } from '../../interfaces/apiResponse.interface';
import emailUtil from '../../utils/email.util';

@Route('emails')
@Tags('Email Logs')
@autoInjectable()
export class EmailController extends Controller {
  @Get('/')
  @Security('jwt')
  async getEmailLogs(
    @Query() page?: number,
    @Query() limit?: number,
    @Query() status?: EmailDeliveryStatus,
    @Query() mailType?: MailType,
  ) {
    const result = await emailUtil.getEmailLogs({
      page,
      limit,
      status,
      mailType,
    });
    return {
      ...result,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Post('/{id}/retry')
  @Security('jwt')
  async retryEmail(@Path() id: string): Promise<ApiResponse<EmailLogEntity>> {
    const data = await emailUtil.retryEmailById(id);
    return {
      data,
      message: messages.actionCompleted,
      success: true,
    };
  }
}
