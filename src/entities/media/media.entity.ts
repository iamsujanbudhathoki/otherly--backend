import { Field, ObjectType } from 'type-graphql';
import { Column, Entity } from 'typeorm';
import { MediaType } from '../../constants/appConstant';
import { CommonEntity } from '../common/common.entity';

@ObjectType({ description: 'Centralized media asset record' })
@Entity('media')
export class Media extends CommonEntity {
  @Field()
  @Column({ name: 'mime_type' })
  mimeType: string;

  @Field()
  @Column({ name: 'file_name' })
  name: string;

  @Field({ nullable: true })
  @Column({ name: 'file_size', nullable: true })
  fileSize: string;

  @Field(() => MediaType)
  @Column({
    type: 'enum',
    enum: MediaType,
  })
  mediaType: MediaType;

  @Column({ name: 'file_path' })
  path: string;

  @Field({
    description: 'Fully qualified public URL for this centralized media asset',
  })
  get url(): string {
    return this.path;
  }
}
