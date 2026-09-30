import path from 'path';
import { DotenvConfig } from '../../config/env.config';

class MediaPathUtil {
  static TEMP_FOLDER_PATH = DotenvConfig.MEDIA_TEMP_PATH;
  static UPLOADS_FOLDER_PATH = DotenvConfig.MEDIA_UPLOAD_PATH;

  static generateMediaPathForProduct(id: string) {
    return path.join(MediaPathUtil.UPLOADS_FOLDER_PATH, 'product', id);
  }

  static generateMediaPathForLetter(letterId: string) {
    return path.join(MediaPathUtil.UPLOADS_FOLDER_PATH, 'letters', letterId);
  }
}

export { MediaPathUtil, MediaPathUtil as PathUtil };
