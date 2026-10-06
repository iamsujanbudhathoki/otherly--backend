import express from 'express';
import {
  Body,
  Controller,
  Middlewares,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { autoInjectable } from 'tsyringe';
import messages from '../../constants/messages.constants';
import { ApiResponse } from '../../interfaces/apiResponse.interface';
import { UserProfileResponse } from '../../interfaces/auth.interface';
import { RequestValidator } from '../../middlewares/validator.middleware';
import {
  OnboardCompanySellerSchema,
  OnboardIndividualSellerSchema,
} from '../../schemas/vendor.schema';
import { VendorService } from '../../services/vendor/vendor.service';

@Route('vendor')
@Tags('Vendor')
@autoInjectable()
export class VendorController extends Controller {
  constructor(private vendorService?: VendorService) {
    super();
  }

  @Post('/onboard/individual')
  @Security('jwt')
  @Middlewares(RequestValidator.validate(OnboardIndividualSellerSchema))
  async onboardIndividual(
    @Body() body: OnboardIndividualSellerSchema,
    @Request() req: express.Request,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const data = await this.vendorService!.onboardIndividual(
      req.user!.sub,
      body,
    );
    return {
      data,
      message: messages.sellerOnboarded,
      success: true,
    };
  }

  @Post('/onboard/company')
  @Security('jwt')
  @Middlewares(RequestValidator.validate(OnboardCompanySellerSchema))
  async onboardCompany(
    @Body() body: OnboardCompanySellerSchema,
    @Request() req: express.Request,
  ): Promise<ApiResponse<UserProfileResponse>> {
    const data = await this.vendorService!.onboardCompany(req.user!.sub, body);
    return {
      data,
      message: messages.sellerOnboarded,
      success: true,
    };
  }
}
