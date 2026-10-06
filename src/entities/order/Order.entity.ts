import { Field, Float, Int, ObjectType } from 'type-graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { OrderSourceType, OrderStatus } from '../../constants/appConstant';
import { CommonEntity } from '../common/common.entity';
import { CustomerEntity } from '../customer/Customer.entity';
import { OfferEntity } from '../offer/Offer.entity';
import { ProductEntity } from '../product/Product.entity';
import { RequestEntity } from '../request/Request.entity';
import { VendorEntity } from '../vendor/Vendor.entity';

@ObjectType({
  description:
    'Order transaction created from either a direct product purchase or an accepted reverse request offer',
})
@Entity('orders')
export class OrderEntity extends CommonEntity {
  @Field()
  @Index({ unique: true })
  @Column({ name: 'order_number', length: 50, unique: true })
  orderNumber: string;

  @Field()
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Field(() => CustomerEntity)
  @ManyToOne(() => CustomerEntity, (customer) => customer.orders, {
    onDelete: 'RESTRICT',
    eager: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;

  @Field()
  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Field(() => VendorEntity)
  @ManyToOne(() => VendorEntity, (vendor) => vendor.orders, {
    onDelete: 'RESTRICT',
    eager: true,
  })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorEntity;

  @Field(() => OrderSourceType)
  @Column({
    name: 'source_type',
    type: 'enum',
    enum: OrderSourceType,
    default: OrderSourceType.DIRECT_PURCHASE,
  })
  sourceType: OrderSourceType;

  @Field({ nullable: true })
  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId?: string;

  @Field(() => ProductEntity, { nullable: true })
  @ManyToOne(() => ProductEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({ name: 'product_id' })
  product?: ProductEntity;

  @Field({ nullable: true })
  @Column({ name: 'offer_id', type: 'uuid', nullable: true })
  offerId?: string;

  @Field(() => OfferEntity, { nullable: true })
  @ManyToOne(() => OfferEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({ name: 'offer_id' })
  offer?: OfferEntity;

  @Field({ nullable: true })
  @Column({ name: 'request_id', type: 'uuid', nullable: true })
  requestId?: string;

  @Field(() => RequestEntity, { nullable: true })
  @ManyToOne(() => RequestEntity, {
    nullable: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({ name: 'request_id' })
  request?: RequestEntity;

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  quantity: number;

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
    name: 'total_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  totalAmount: number;

  @Field()
  @Column({ name: 'shipping_address', type: 'text' })
  shippingAddress: string;

  @Field(() => OrderStatus)
  @Index()
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  notes?: string;
}
