import { Field, ObjectType } from 'type-graphql';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  OneToOne,
} from 'typeorm';
import { Role } from '../../constants/appConstant';
import BcryptService from '../../utils/bcrypt.util';
import { CommonEntity } from '../common/common.entity';
import type { CustomerEntity } from '../customer/Customer.entity';
import type { VendorEntity } from '../vendor/Vendor.entity';

@ObjectType({
  description:
    'Base User entity representing identity, authentication, and core profile',
})
@Entity('users')
export class User extends CommonEntity {
  @Field({ nullable: true })
  @Column({ length: 150, nullable: true })
  name?: string;

  @Field({ nullable: true })
  @Index({ unique: true })
  @Column({ length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ select: false, nullable: true })
  password?: string;

  @Field(() => Role)
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CUSTOMER,
  })
  role: Role;

  @Field()
  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Field()
  @Column({ type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Field()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field({ nullable: true })
  @Index({ unique: true })
  @Column({ nullable: true, length: 25, unique: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  @Column({ name: 'avatar_media_id', nullable: true, type: 'uuid' })
  avatarMediaId?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, length: 500 })
  avatar?: string;

  // Legacy/denormalized fields kept for backwards-compatibility
  @Field({ nullable: true })
  @Column({ nullable: true, length: 200 })
  businessName?: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  businessAddress?: string;

  @Field()
  @Column({ type: 'boolean', default: false })
  isVendorVerified: boolean;

  @OneToOne('CustomerEntity', (customer: CustomerEntity) => customer.user)
  customer?: CustomerEntity;

  @OneToOne('VendorEntity', (vendor: VendorEntity) => vendor.user)
  vendor?: VendorEntity;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (
      this.password &&
      !this.password.startsWith('$2a$') &&
      !this.password.startsWith('$2b$')
    ) {
      this.password = await BcryptService.hash(this.password);
    }
  }
}
