import { Field, Float, Int, ObjectType } from 'type-graphql';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SubcategoryEntity } from '../category/Subcategory.entity';
import { CommonEntity } from '../common/common.entity';
import { VendorEntity } from '../vendor/Vendor.entity';

@ObjectType({ description: 'Marketplace product listed by a vendor' })
@Entity('products')
export class ProductEntity extends CommonEntity {
  @Field()
  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Field(() => VendorEntity)
  @ManyToOne(() => VendorEntity, (vendor) => vendor.products, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'vendor_id' })
  vendor: VendorEntity;

  @Field({ nullable: true })
  @Column({ name: 'subcategory_id', type: 'uuid', nullable: true })
  subcategoryId?: string;

  @Field(() => SubcategoryEntity, { nullable: true })
  @ManyToOne(() => SubcategoryEntity, (sub) => sub.products, {
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
  @Index({ unique: true })
  @Column({ length: 220, unique: true })
  slug: string;

  @Field()
  @Column({ type: 'text' })
  description: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.0 })
  price: number;

  @Field(() => Float, { nullable: true })
  @Column({
    name: 'compare_at_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  compareAtPrice?: number;

  @Field(() => Int)
  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stockQuantity: number;

  @Field(() => [String], {
    description: 'Centralized Media asset UUID references for product images',
  })
  @Column({ name: 'image_media_ids', type: 'simple-array', default: '' })
  imageMediaIds: string[];

  // Legacy string column kept for direct URLs or backwards-compatibility
  @Field(() => [String], { nullable: true })
  @Column({ type: 'simple-array', default: '' })
  images: string[];

  @Field({ nullable: true })
  @Column({ nullable: true, length: 100 })
  sku?: string;

  @Field()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
