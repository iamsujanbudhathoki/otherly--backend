import fs from 'fs-extra';
import { MediaType } from '../../constants/appConstant';
import { PathUtil } from './mediaPath';

export const deleteFile = async (filePath: string) => {
  if (fs.existsSync(filePath)) {
    await fs.unlink(filePath);
  }
};

export const checkCreateDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.chmodSync(dirPath, 0o777);
  }
};

/**
 * @param mediaType type of media (PRODUCT_IMAGE or LETTER_COVER)
 * @param fileName name of file
 * @param id entity id owning the media
 */
export const migrateMedia = async (
  mediaType: MediaType,
  fileName: string,
  id: string,
) => {
  switch (mediaType) {
    case MediaType.PRODUCT_IMAGE: {
      const productGeneratedPath = PathUtil.generateMediaPathForProduct(id);
      checkCreateDir(productGeneratedPath);
      fs.move(
        `${PathUtil.TEMP_FOLDER_PATH}/${fileName}`,
        `${productGeneratedPath}/${fileName}`,
        (err) => {
          if (err) {
            console.error('Error while moving file', err);
          }
        },
      );
      break;
    }

    case MediaType.LETTER_COVER: {
      const letterCoverPath = PathUtil.generateMediaPathForLetter(id);
      checkCreateDir(letterCoverPath);
      fs.move(
        `${PathUtil.TEMP_FOLDER_PATH}/${fileName}`,
        `${letterCoverPath}/${fileName}`,
        (err) => {
          if (err) {
            console.error('Error while moving file', err);
          }
        },
      );
      break;
    }

    default:
      break;
  }
};
