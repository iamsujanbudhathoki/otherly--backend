import { autoInjectable } from 'tsyringe';
import { AppDataSource } from '../../config/database.config';
import { MediaType } from '../../constants/appConstant';
import { Media } from '../../entities/media/media.entity';
import { AppError } from '../../utils/appError.util';
import { SupabaseStorageUtil } from '../../utils/supabase.util';

@autoInjectable()
export class MediaService {
  private mediaRepo = AppDataSource.getRepository(Media);

  async uploadSingle(
    mediaType: MediaType,
    mimeType: string,
    fileName: string,
    fileSize: number,
    fileBuffer: Buffer,
  ): Promise<Media> {
    const destinationPath = `uploads/${mediaType.toLowerCase()}/${fileName}`;
    const uploaded = await SupabaseStorageUtil.uploadBuffer(
      fileBuffer,
      destinationPath,
      mimeType,
    );

    const media = this.mediaRepo.create({
      name: fileName,
      mediaType,
      mimeType,
      fileSize: String(fileSize),
      path: uploaded.url,
    });
    return await this.mediaRepo.save(media);
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
    const storagePath = SupabaseStorageUtil.extractPathFromUrl(item.path);
    if (!storagePath) {
      throw AppError.badRequest(
        `Unable to determine Supabase storage path for media record: ${item.path}`,
      );
    }
    await SupabaseStorageUtil.deleteFile(storagePath);
    await this.mediaRepo.remove(item);
  }
}

export default new MediaService();
