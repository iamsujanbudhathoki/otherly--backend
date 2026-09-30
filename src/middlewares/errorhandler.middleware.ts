import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ValidateError } from 'tsoa';
import messages from '../constants/messages.constants';
import { AppError } from '../utils/appError.util';

const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof AppError) {
    return res.status(+error?.statusCode || 400).json({
      success: false,
      message: error?.message ?? 'Internal server error',
      data: null,
    });
  }

  if (error instanceof ValidateError) {
    return res.status(400).json({
      success: false,
      message: 'Validation Failed',
      details: error?.fields,
      data: null,
    });
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File Size Exceeded. Please upload within 8MB',
      details: error.message,
      data: null,
    });
  }

  console.error('Error', error);
  return res.status(500).json({
    success: false,
    message: messages.serverError,
    data: null,
  });
};

export default errorHandler;
