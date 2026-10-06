import { Field, Float, Int, ObjectType } from 'type-graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CommonEntity } from '../common/common.entity';
import { SellerType } from '../../constants/appConstant';
import type { OfferEntity } from '../offer/Offer.entity';
import type { OrderEntity } from '../order/Order.entity';
import type { ProductEntity } from '../product/Product.entity';
import { User } from '../user/User.entity';

@ObjectType({ description: 'Vendor profile entity for suppliers and sellers' })
@Entity('vendors')
export class VendorEntity extends CommonEntity {
  @Field()
  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.vendor, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field(() => SellerType)
  @Column({
    type: 'enum',
    enum: SellerType,
    default: SellerType.INDIVIDUAL,
  })
  sellerType: SellerType;

  @Field()
  @Column({ name: 'business_name', length: 200 })
  businessName: string;

  @Field({ nullable: true })
  @Column({ name: 'pan_number', nullable: true, length: 50 })
  panNumber?: string;

  @Field(() => [String], { nullable: true })
  @Column({
    name: 'document_media_ids',
    type: 'simple-array',
    nullable: true,
  })
  documentMediaIds?: string[];

  @Field({ nullable: true })
  @Column({
    name: 'business_registration_number',
    nullable: true,
    length: 100,
  })
  businessRegistrationNumber?: string;

  @Field({ nullable: true })
  @Column({ name: 'business_address', nullable: true, type: 'text' })
  businessAddress?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  city?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  state?: string;

  @Field({ nullable: true })
  @Column({ name: 'postal_code', nullable: true, length: 20 })
  postalCode?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100, default: 'Nepal' })
  country?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Field()
  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Field(() => Float)
  @Column({
    name: 'rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.0,
  })
  rating: number;

  @Field(() => Int)
  @Column({ name: 'total_reviews', type: 'int', default: 0 })
  totalReviews: number;

  @OneToMany('ProductEntity', (product: ProductEntity) => product.vendor)
  products: ProductEntity[];

  @OneToMany('OfferEntity', (offer: OfferEntity) => offer.vendor)
  offers: OfferEntity[];

  @OneToMany('OrderEntity', (order: OrderEntity) => order.vendor)
  orders: OrderEntity[];
}
