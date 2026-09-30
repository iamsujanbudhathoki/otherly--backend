import { Column, Entity } from 'typeorm';
import { CommonEntity } from '../common/common.entity';

@Entity({
  name: 'products',
})
export class ProductEntity extends CommonEntity {
  @Column({ name: 'name', length: 150 })
  name: string;

  @Column({ name: 'slug', length: 150, unique: true })
  slug: string;

  @Column({ name: 'tag', length: 80 })
  tag: string;

  @Column({ name: 'status', length: 80 })
  status: string;

  @Column({ name: 'logo', length: 500 })
  logo: string;

  @Column({ name: 'url', length: 500 })
  url: string;

  @Column({ name: 'body', type: 'text' })
  body: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
