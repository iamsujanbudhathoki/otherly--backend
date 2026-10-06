import { Field, Float, Int, ObjectType } from 'type-graphql';
import { OfferEntity } from '../../entities/offer/Offer.entity';
import { OrderEntity } from '../../entities/order/Order.entity';

@ObjectType({ description: 'Customer activity statistics' })
export class CustomerStatsType {
  @Field(() => Int)
  totalRequests: number;

  @Field(() => Int)
  activeRequests: number;

  @Field(() => Int)
  totalOrders: number;
}

@ObjectType({ description: 'Vendor business statistics' })
export class VendorStatsType {
  @Field(() => Int)
  totalProducts: number;

  @Field(() => Int)
  activeOffers: number;

  @Field(() => Int)
  totalOrders: number;

  @Field(() => Float)
  rating: number;

  @Field(() => Int)
  totalReviews: number;
}

@ObjectType({ description: 'Result of accepting an offer' })
export class AcceptOfferPayload {
  @Field(() => OfferEntity)
  offer: OfferEntity;

  @Field(() => OrderEntity)
  order: OrderEntity;
}
