import express from 'express';
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
  Request,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { autoInjectable } from 'tsyringe';
import { ContactStatus, ContactTopic } from '../../constants/appConstant';
import messages from '../../constants/messages.constants';
import { AdminPermission } from '../../entities/admin/Admin.entity';
import { ContactUsEntity } from '../../entities/contact-us/ContactUs.entity';
import { ApiResponse } from '../../interfaces/apiResponse.interface';
import { contactRateLimiter } from '../../middlewares/rateLimiter.middleware';
import { RequestValidator } from '../../middlewares/validator.middleware';
import {
  CreateContactSchema,
  UpdateContactStatusSchema,
} from '../../schemas/contact.schema';
import { ContactService } from '../../services/contact/contact.service';

@Route('contact')
@Tags('Contact Us')
@autoInjectable()
export class ContactController extends Controller {
  constructor(private contactService?: ContactService) {
    super();
  }

  @Post('/')
  @SuccessResponse('201', 'Created')
  @Middlewares(
    contactRateLimiter,
    RequestValidator.validate(CreateContactSchema),
  )
  async submitContact(
    @Body() body: CreateContactSchema,
    @Request() req: express.Request,
  ): Promise<ApiResponse<ContactUsEntity>> {
    this.setStatus(201);
    const remoteIp =
      (req.headers['cf-connecting-ip'] as string) ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip;
    const data = await this.contactService!.create(body, remoteIp);
    return {
      data,
      message: messages.contactSubmitted,
      success: true,
    };
  }

  @Get('/')
  @Security('jwt', [AdminPermission.CONTACTS])
  async getAllContacts(
    @Query() page?: number,
    @Query() limit?: number,
    @Query() search?: string,
    @Query() topic?: ContactTopic,
    @Query() status?: ContactStatus,
  ) {
    const result = await this.contactService!.getAll({
      page,
      limit,
      search,
      topic,
      status,
    });
    return {
      ...result,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Get('/{id}')
  @Security('jwt', [AdminPermission.CONTACTS])
  async getContactById(
    @Path() id: string,
  ): Promise<ApiResponse<ContactUsEntity>> {
    const data = await this.contactService!.getById(id);
    return {
      data,
      message: messages.dataFetched,
      success: true,
    };
  }

  @Patch('/{id}/status')
  @Security('jwt', [AdminPermission.CONTACTS])
  @Middlewares(RequestValidator.validate(UpdateContactStatusSchema))
  async updateContactStatus(
    @Path() id: string,
    @Body() body: UpdateContactStatusSchema,
  ): Promise<ApiResponse<ContactUsEntity>> {
    const data = await this.contactService!.updateStatus(id, body);
    return {
      data,
      message: messages.dataUpdated,
      success: true,
    };
  }

  @Delete('/{id}')
  @Security('jwt', [AdminPermission.CONTACTS])
  async deleteContact(@Path() id: string): Promise<ApiResponse<null>> {
    await this.contactService!.delete(id);
    return {
      data: null,
      message: messages.dataDeleted,
      success: true,
    };
  }
}
