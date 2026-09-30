import { autoInjectable } from 'tsyringe';
import { DotenvConfig } from '../../config/env.config';
import { MediaType } from '../../constants/appConstant';
import { Media } from '../../entities/media/media.entity';

@autoInjectable()
export class MediaService {
  async uploadSingle(
    mediaType: MediaType,
    mimeType: string,
    fileName: string,
    fileSize?: number,
  ) {
    const m = new Media();
    m.name = fileName;
    m.mediaType = mediaType;
    m.mimeType = mimeType;
    m.fileSize = fileSize ? String(fileSize) : '0';
    m.path = `${DotenvConfig.BASE_URL}/temp/${fileName}`;
    return await m.save();
  }
}

export default new MediaService();
