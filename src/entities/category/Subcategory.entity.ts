import { Field, Int, ObjectType } from 'type-graphql';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CommonEntity } from '../common/common.entity';
import type { ProductEntity } from '../product/Product.entity';
import type { RequestEntity } from '../request/Request.entity';
import { CategoryEntity } from './Category.entity';

@ObjectType({ description: 'Subcategory belonging to a main category' })
@Entity('subcategories')
export class SubcategoryEntity extends CommonEntity {
  @Field()
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Field(() => CategoryEntity)
  @ManyToOne(() => CategoryEntity, (category) => category.subcategories, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

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

  @Field(() => Int)
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Field()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany('ProductEntity', (product: ProductEntity) => product.subcategory)
  products: ProductEntity[];

  @OneToMany('RequestEntity', (request: RequestEntity) => request.subcategory)
  requests: RequestEntity[];
}
