import { autoInjectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { DotenvConfig } from '../../config/env.config';
import { MediaType } from '../../constants/appConstant';
import { Media } from '../../entities/media/media.entity';
import { AppError } from '../../utils/appError.util';

@autoInjectable()
export class MediaService {
  private mediaRepo = AppDataSource.getRepository(Media);

  async uploadSingle(
    mediaType: MediaType,
    mimeType: string,
    fileName: string,
    fileSize?: number,
  ): Promise<Media> {
    const m = this.mediaRepo.create({
      name: fileName,
      mediaType,
      mimeType,
      fileSize: fileSize ? String(fileSize) : '0',
      path: `${DotenvConfig.BASE_URL}/temp/${fileName}`,
    });
    return await this.mediaRepo.save(m);
  }

  async getById(id: string): Promise<Media> {
    const item = await this.mediaRepo.findOne({ where: { id } });
    if (!item) {
      throw AppError.notFound('Media asset not found');
    }
    return item;
  }

  async delete(id: string): Promise<void> {
    const item = await this.getById(id);
    await this.mediaRepo.remove(item);
  }
}

export default new MediaService();
