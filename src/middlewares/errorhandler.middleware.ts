import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ValidateError } from 'tsoa';
import { DotenvConfig, Environment } from '../config/env.config';
import messages from '../constants/messages.constants';
import { AppError } from '../utils/appError.util';

const errorHandler = (
  error: Error | AppError | ValidateError | multer.MulterError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof AppError) {
    return res.status(+error.statusCode || 400).json({
      success: false,
      message: error.message ?? 'Bad Request',
      data: null,
    });
  }

  if (error instanceof ValidateError) {
    return res.status(400).json({
      success: false,
      message: 'Validation Failed',
      details: error.fields,
      data: null,
    });
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      details: error.message,
      data: null,
    });
  }

  // Log raw unexpected errors internally
  console.error('[UNHANDLED_EXCEPTION]:', error);

  const isDev = DotenvConfig.NODE_ENV === Environment.DEVELOPMENT;

  return res.status(500).json({
    success: false,
    message: messages.serverError,
    details: isDev ? error.message : undefined,
    stack: isDev ? error.stack : undefined,
    data: null,
  });
};

export default errorHandler;
