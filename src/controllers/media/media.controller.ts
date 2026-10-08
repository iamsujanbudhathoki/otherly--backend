import express from 'express';
import path from 'path';
import {
  Controller,
  Delete,
  FormField,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
  UploadedFile,
} from 'tsoa';
import { autoInjectable } from 'tsyringe';
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
    if (!file) {
      this.setStatus(400);
      return {
        status: 'error',
        message: 'No file provided for upload',
      };
    }

    const validMediaTypeList = Object.values(MediaType);
    if (!validMediaTypeList.includes(mediaType as MediaType)) {
      this.setStatus(400);
      return {
        status: 'error',
        message: 'Invalid Media Type',
      };
    }

    const validateResponse = this.validate(file);
    if (validateResponse !== true) {
      this.setStatus(400);
      return validateResponse;
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const updatedFileName = uniqueSuffix + ext;

    const media = await mediaService.uploadSingle(
      mediaType as MediaType,
      file.mimetype,
      updatedFileName,
      file.size,
      file.buffer,
    );

    this.setStatus(201);
    return {
      status: 'success',
      data: {
        id: media.id,
        name: media.name,
        mimeType: media.mimeType,
        fileSize: media.fileSize,
        mediaType: media.mediaType,
        url: media.url,
      },
    };
  }

  @Get('/{id}')
  async getById(@Path() id: string) {
    const media = await mediaService.getById(id);
    return {
      success: true,
      data: {
        id: media.id,
        name: media.name,
        mimeType: media.mimeType,
        fileSize: media.fileSize,
        mediaType: media.mediaType,
        url: media.url,
      },
    };
  }

  @Delete('/{id}')
  @Security('jwt')
  async delete(@Path() id: string) {
    await mediaService.delete(id);
    return {
      success: true,
      message: 'Media asset deleted successfully',
    };
  }

  private validate(file: Express.Multer.File) {
    const acceptedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.svg',
      '.pdf',
      '.doc',
      '.docx',
    ];
    const maxFileSize = 1024 * 1024 * 10; // 10MB

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
