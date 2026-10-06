import { Field, ObjectType } from 'type-graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CommonEntity } from '../common/common.entity';
import type { OrderEntity } from '../order/Order.entity';
import type { RequestEntity } from '../request/Request.entity';
import { User } from '../user/User.entity';

@ObjectType({ description: 'Customer profile entity for buyers' })
@Entity('customers')
export class CustomerEntity extends CommonEntity {
  @Field()
  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.customer, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field({ nullable: true })
  @Column({ name: 'shipping_address', nullable: true, type: 'text' })
  shippingAddress?: string;

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
  preferences?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @OneToMany('RequestEntity', (request: RequestEntity) => request.customer)
  requests: RequestEntity[];

  @OneToMany('OrderEntity', (order: OrderEntity) => order.customer)
  orders: OrderEntity[];
}
