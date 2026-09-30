import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  Controller,
  FormField,
  Post,
  Request,
  Route,
  Security,
  Tags,
  UploadedFile,
} from 'tsoa';
import { autoInjectable } from 'tsyringe';
import { DotenvConfig } from '../../config/env.config';
import { MediaType } from '../../constants/appConstant';
import mediaService from '../../services/media/media.service';

@Route('media')
@Tags('Media')
@autoInjectable()
class MediaController extends Controller {
  @Post('/')
  @Security('jwt')
  async upload(
    @Request() _req: express.Request,
    @UploadedFile() file: Express.Multer.File,
    @FormField() mediaType: string,
  ) {
    const validMediaTypeList = Object.values(MediaType);
    if (!validMediaTypeList.includes(mediaType as MediaType)) {
      return {
        status: 'error',
        message: 'Invalid Media Type',
      };
    }

    const validateResponse = this.validate(file);
    if (validateResponse !== true) return validateResponse;

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const updatedFileName = uniqueSuffix + ext;

    if (!fs.existsSync(DotenvConfig.MEDIA_TEMP_PATH)) {
      fs.mkdirSync(DotenvConfig.MEDIA_TEMP_PATH, { recursive: true });
    }

    fs.writeFileSync(
      path.resolve(DotenvConfig.MEDIA_TEMP_PATH, updatedFileName),
      file.buffer,
    );

    const res = await mediaService.uploadSingle(
      mediaType as MediaType,
      file.mimetype,
      updatedFileName,
      file.size,
    );
    return res;
  }

  private validate(file: Express.Multer.File) {
    const acceptedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
    const maxFileSize = 1024 * 1024 * 5; // 5MB

    const ext = path.extname(file.originalname).toLowerCase();
    if (!acceptedExtensions.includes(ext)) {
      return {
        status: 'error',
        message:
          'File extension not supported. Supported extensions are : ' +
          acceptedExtensions.toString(),
      };
    }

    if (file.size > maxFileSize) {
      return {
        status: 'error',
        message:
          'File size exceeded. Maximum allowed size is ' +
          maxFileSize / (1024 * 1024) +
          'MB',
      };
    }
    return true;
  }
}

export { MediaController };
