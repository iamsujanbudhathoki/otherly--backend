import { Column, Entity } from 'typeorm';
import { LetterKind } from '../../constants/appConstant';
import { CommonEntity } from '../common/common.entity';

export interface LetterSection {
  heading?: string;
  paragraphs: string[];
}

@Entity({
  name: 'letters',
})
export class LetterEntity extends CommonEntity {
  @Column({ name: 'slug', length: 255, unique: true })
  slug: string;

  @Column({ name: 'number', length: 20 })
  number: string;

  @Column({
    name: 'kind',
    type: 'enum',
    enum: LetterKind,
    default: LetterKind.LETTER,
  })
  kind: LetterKind;

  @Column({ name: 'date', length: 80 })
  date: string;

  @Column({ name: 'read_time', length: 50 })
  readTime: string;

  @Column({ name: 'title', length: 255 })
  title: string;

  @Column({ name: 'body', type: 'text' })
  body: string;

  @Column({ name: 'image', length: 500 })
  image: string;

  @Column({ name: 'content', type: 'jsonb', default: [] })
  content: LetterSection[];

  @Column({ name: 'author', length: 120 })
  author: string;

  @Column({ name: 'author_title', length: 120 })
  authorTitle: string;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished: boolean;
}
