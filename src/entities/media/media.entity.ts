import { Field, ObjectType } from 'type-graphql';
import { BeforeRemove, Column, Entity } from 'typeorm';
import { DotenvConfig } from '../../config/env.config';
import { MediaType } from '../../constants/appConstant';
import { PathUtil } from '../../utils/media/mediaPath';
import { deleteFile } from '../../utils/media/migrateMedia';
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

  @Column({ name: 'file_path', nullable: true })
  path: string;

  @Field({
    description: 'Fully qualified public URL for this centralized media asset',
  })
  get url(): string {
    if (this.path && this.path.startsWith('http')) {
      return this.path;
    }
    return `${DotenvConfig.BASE_URL}/temp/${this.name}`;
  }

  @BeforeRemove()
  async deleteFile() {
    switch (this.mediaType) {
      case MediaType.PRODUCT_IMAGE: {
        const filePath =
          PathUtil.generateMediaPathForProduct(this.id) + '/' + this.name;
        await deleteFile(filePath);
        break;
      }
      case MediaType.LETTER_COVER: {
        const filePath =
          PathUtil.generateMediaPathForLetter(this.id) + '/' + this.name;
        await deleteFile(filePath);
        break;
      }
      default:
        break;
    }
  }
}
