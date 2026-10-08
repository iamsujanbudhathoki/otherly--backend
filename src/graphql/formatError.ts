import { GraphQLFormattedError } from 'graphql';
import { ArgumentValidationError } from 'type-graphql';
import { DotenvConfig, Environment } from '../config/env.config';
import { AppError } from '../utils/appError.util';

export interface FormattedValidationError {
  field: string;
  message: string;
  constraints?: Record<string, string>;
}

export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError {
  const originalError = (error as any)?.originalError;

  // 1. Handle TypeGraphQL / class-validator ArgumentValidationError
  if (originalError instanceof ArgumentValidationError) {
    const rawValidationErrors =
      (originalError as any).extensions?.validationErrors ||
      (originalError as any).validationErrors ||
      [];
    const validationErrors: FormattedValidationError[] = [];

    for (const validationErr of rawValidationErrors) {
      if (validationErr.constraints) {
        validationErrors.push({
          field: validationErr.property,
          message: String(Object.values(validationErr.constraints)[0]),
          constraints: validationErr.constraints,
        });
      }
      // If there are nested children errors
      if (validationErr.children && validationErr.children.length > 0) {
        for (const child of validationErr.children) {
          if (child.constraints) {
            validationErrors.push({
              field: `${validationErr.property}.${child.property}`,
              message: String(Object.values(child.constraints)[0]),
              constraints: child.constraints,
            });
          }
        }
      }
    }

    const firstMsg =
      validationErrors.length > 0
        ? validationErrors[0].message
        : 'Validation failed';

    return {
      message: firstMsg,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions: {
        code: 'BAD_USER_INPUT',
        statusCode: 400,
        validationErrors,
      },
    };
  }

  // 2. Handle Custom Domain AppError (e.g., AppError.notFound, AppError.forbidden)
  if (originalError instanceof AppError) {
    let code = 'INTERNAL_SERVER_ERROR';
    if (originalError.statusCode === 400) code = 'BAD_USER_INPUT';
    else if (originalError.statusCode === 401) code = 'UNAUTHENTICATED';
    else if (originalError.statusCode === 403) code = 'FORBIDDEN';
    else if (originalError.statusCode === 404) code = 'NOT_FOUND';
    else if (originalError.statusCode === 409) code = 'CONFLICT';

    return {
      message: originalError.message,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions: {
        code,
        statusCode: originalError.statusCode,
      },
    };
  }

  // 3. Handle TypeGraphQL Access Denied / Authorization error
  if (
    formattedError.message.includes('Access denied') ||
    formattedError.message.includes('Unauthorized')
  ) {
    return {
      message: formattedError.message,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions: {
        code: 'FORBIDDEN',
        statusCode: 403,
      },
    };
  }

  // 4. In Production, mask unexpected unhandled internal server / database errors
  if (DotenvConfig.NODE_ENV === Environment.PRODUCTION) {
    const isClientSafe =
      formattedError.extensions?.code === 'BAD_USER_INPUT' ||
      formattedError.extensions?.code === 'GRAPHQL_VALIDATION_FAILED' ||
      formattedError.extensions?.code === 'GRAPHQL_PARSE_FAILED';

    if (!isClientSafe) {
      console.error(
        '[GraphQL Uncaught Error]:',
        originalError || formattedError,
      );
      return {
        message: 'Internal server error occurred. Please try again later.',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500,
        },
      };
    }
  }

  return formattedError;
}
