import { Request, Response } from 'express';
import { JwtPayload, JwtUtil } from '../utils/jwt.util';

export interface GraphQLContext {
  req: Request;
  res: Response;
  user?: JwtPayload;
}

export const buildGraphQLContext = async ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<GraphQLContext> => {
  const authHeader = req.headers.authorization;
  let user: JwtPayload | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        user = JwtUtil.verify(token);
      } catch {
        // Token is invalid/expired; user remains unauthenticated
      }
    }
  }

  return { req, res, user };
};
