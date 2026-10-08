import { In } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Media } from '../entities/media/media.entity';

export class MediaHelper {
  private static get mediaRepo() {
    return AppDataSource.getRepository(Media);
  }

  static async getMediaById(
    mediaId?: string | null,
  ): Promise<Media | undefined> {
    if (!mediaId) {
      return undefined;
    }
    const item = await this.mediaRepo.findOne({ where: { id: mediaId } });
    if (!item) {
      return undefined;
    }
    return item;
  }

  static async getMediaUrlById(
    mediaId?: string | null,
  ): Promise<string | undefined> {
    if (!mediaId) {
      return undefined;
    }
    const item = await this.mediaRepo.findOne({ where: { id: mediaId } });
    if (!item) {
      return undefined;
    }
    return item.url;
  }

  static async getMediaByIds(mediaIds?: string[] | null): Promise<Media[]> {
    if (!mediaIds || mediaIds.length === 0) {
      return [];
    }
    return await this.mediaRepo.find({
      where: { id: In(mediaIds) },
    });
  }

  static async getMediaUrlsByIds(
    mediaIds?: string[] | null,
  ): Promise<string[]> {
    if (!mediaIds || mediaIds.length === 0) {
      return [];
    }
    const items = await this.mediaRepo.find({
      where: { id: In(mediaIds) },
    });
    return items.map((item) => item.url);
  }
}
