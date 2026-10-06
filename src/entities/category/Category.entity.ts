import { Field, Int, ObjectType } from 'type-graphql';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { CommonEntity } from '../common/common.entity';
import { SubcategoryEntity } from './Subcategory.entity';

@ObjectType({ description: 'Product and request category' })
@Entity('categories')
export class CategoryEntity extends CommonEntity {
  @Field()
  @Column({ length: 150 })
  name: string;

  @Field()
  @Index({ unique: true })
  @Column({ length: 150, unique: true })
  slug: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Field({
    nullable: true,
    description: 'Referenced Media asset ID for category icon',
  })
  @Column({ name: 'icon_media_id', nullable: true, type: 'uuid' })
  iconMediaId?: string;

  @Field({
    nullable: true,
    description: 'Referenced Media asset ID for banner image',
  })
  @Column({ name: 'banner_media_id', nullable: true, type: 'uuid' })
  bannerMediaId?: string;

  // Legacy string columns kept for direct URLs or backwards-compatibility
  @Field({ nullable: true })
  @Column({ nullable: true, length: 500 })
  icon?: string;

  @Field({ nullable: true })
  @Column({ name: 'banner_image', nullable: true, length: 500 })
  bannerImage?: string;

  @Field(() => Int)
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Field()
  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Field()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Field(() => [SubcategoryEntity], { nullable: true })
  @OneToMany(
    () => SubcategoryEntity,
    (subcategory: SubcategoryEntity) => subcategory.category,
  )
  subcategories?: SubcategoryEntity[];
}
