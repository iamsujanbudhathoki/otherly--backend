import { injectable } from 'tsyringe';
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { OfferStatus, Role } from '../../constants/appConstant';
import { OfferEntity } from '../../entities/offer/Offer.entity';
import { OfferService } from '../../services/offer/offer.service';
import { GraphQLContext } from '../context';
import { SubmitOfferInput } from '../inputs/offer.input';
import { AcceptOfferPayload } from '../types/stats.type';

@injectable()
@Resolver(() => OfferEntity)
export class OfferResolver {
  constructor(private readonly offerService: OfferService) {}

  @Authorized()
  @Query(() => [OfferEntity], {
    description:
      'Retrieve offers submitted for a specific request (filtered by permission)',
  })
  async requestOffers(
    @Ctx() { user }: GraphQLContext,
    @Arg('requestId') requestId: string,
  ): Promise<OfferEntity[]> {
    return await this.offerService.getRequestOffers(
      user!.sub,
      user!.role,
      requestId,
    );
  }

  @Authorized([Role.VENDOR])
  @Query(() => [OfferEntity], {
    description: 'Retrieve all offers submitted by the authenticated vendor',
  })
  async myVendorOffers(
    @Ctx() { user }: GraphQLContext,
    @Arg('status', () => OfferStatus, { nullable: true })
    status?: OfferStatus,
  ): Promise<OfferEntity[]> {
    return await this.offerService.getVendorOffers(user!.sub, status);
  }

  @Authorized([Role.VENDOR])
  @Mutation(() => OfferEntity, {
    description:
      'Submit a quote/offer responding to a customer request (Vendors only)',
  })
  async submitOffer(
    @Ctx() { user }: GraphQLContext,
    @Arg('input') input: SubmitOfferInput,
  ): Promise<OfferEntity> {
    return await this.offerService.submitOffer(user!.sub, input);
  }

  @Authorized([Role.CUSTOMER])
  @Mutation(() => AcceptOfferPayload, {
    description:
      'Accept a vendor offer for a request, closing negotiation and creating an Order (Customers only)',
  })
  async acceptOffer(
    @Ctx() { user }: GraphQLContext,
    @Arg('offerId') offerId: string,
  ): Promise<AcceptOfferPayload> {
    return await this.offerService.acceptOffer(user!.sub, offerId);
  }

  @Authorized([Role.VENDOR])
  @Mutation(() => OfferEntity, {
    description: 'Withdraw a pending offer (Vendors only)',
  })
  async withdrawOffer(
    @Ctx() { user }: GraphQLContext,
    @Arg('offerId') offerId: string,
  ): Promise<OfferEntity> {
    return await this.offerService.withdrawOffer(user!.sub, offerId);
  }
}
