import { BeforeRemove, Column, Entity } from 'typeorm';
import { MediaType } from '../../constants/appConstant';
import { PathUtil } from '../../utils/media/mediaPath';
import { deleteFile } from '../../utils/media/migrateMedia';
import { CommonEntity } from '../common/common.entity';

@Entity()
export class Media extends CommonEntity {
  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'file_name' })
  name: string;

  @Column({ name: 'file_size', nullable: true })
  fileSize: string;

  @Column({
    type: 'enum',
    enum: MediaType,
  })
  mediaType: MediaType;

  @Column({ name: 'file_path', nullable: true })
  path: string;

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
