import { Field, Float, Int, ObjectType } from 'type-graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { OfferFulfillType, OfferStatus } from '../../constants/appConstant';
import { CommonEntity } from '../common/common.entity';
import { RequestEntity } from '../request/Request.entity';
import { VendorEntity } from '../vendor/Vendor.entity';

@ObjectType({
  description: 'Vendor quote or offer submitted for a customer request',
})
@Entity('vendor_offers')
export class OfferEntity extends CommonEntity {
  @Field()
  @Index()
  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @Field(() => RequestEntity)
  @ManyToOne(() => RequestEntity, (request) => request.offers, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'request_id' })
  request: RequestEntity;

  @Field()
  @Index()
  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Field(() => VendorEntity)
  @ManyToOne(() => VendorEntity, (vendor) => vendor.offers, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorEntity;

  @Field(() => Int)
  @Column({ name: 'offered_quantity', type: 'int' })
  offeredQuantity: number;

  @Field(() => Float)
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  unitPrice: number;

  @Field(() => Float)
  @Column({
    name: 'total_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  totalPrice: number;

  @Field(() => Int)
  @Column({ name: 'delivery_days', type: 'int', default: 3 })
  deliveryDays: number;

  @Field(() => OfferFulfillType)
  @Column({
    name: 'fulfill_type',
    type: 'enum',
    enum: OfferFulfillType,
    default: OfferFulfillType.IN_STOCK,
  })
  fulfillType: OfferFulfillType;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Field(() => OfferStatus)
  @Index()
  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;
}
