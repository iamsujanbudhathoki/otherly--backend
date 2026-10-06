import { Field, Float, Int, ObjectType } from 'type-graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { RequestStatus } from '../../constants/appConstant';
import { SubcategoryEntity } from '../category/Subcategory.entity';
import { CommonEntity } from '../common/common.entity';
import { CustomerEntity } from '../customer/Customer.entity';
import type { OfferEntity } from '../offer/Offer.entity';

@ObjectType({
  description:
    'Customer product or project request posted in the reverse marketplace',
})
@Entity('customer_requests')
export class RequestEntity extends CommonEntity {
  @Field()
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Field(() => CustomerEntity)
  @ManyToOne(() => CustomerEntity, (customer) => customer.requests, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;

  @Field({ nullable: true })
  @Column({ name: 'subcategory_id', type: 'uuid', nullable: true })
  subcategoryId?: string;

  @Field(() => SubcategoryEntity, { nullable: true })
  @ManyToOne(() => SubcategoryEntity, (sub) => sub.requests, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory?: SubcategoryEntity;

  @Field()
  @Column({ length: 200 })
  title: string;

  @Field()
  @Column({ type: 'text' })
  description: string;

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Field(() => Float, { nullable: true })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  budget?: number;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 200 })
  location?: string;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'required_within_days', type: 'int', nullable: true })
  requiredWithinDays?: number;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  deadline?: Date;

  @Field(() => [String], {
    nullable: true,
    description: 'Centralized Media asset UUID references for attachments',
  })
  @Column({ name: 'attachment_media_ids', type: 'simple-array', default: '' })
  attachmentMediaIds?: string[];

  @Field(() => RequestStatus)
  @Index()
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.OPEN,
  })
  status: RequestStatus;

  @OneToMany('OfferEntity', (offer: OfferEntity) => offer.request)
  offers: OfferEntity[];
}
