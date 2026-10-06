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
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  let user: JwtPayload | undefined;
  if (token) {
    try {
      user = JwtUtil.verify(token);
    } catch {
      // Token is invalid/expired; user remains unauthenticated
    }
  }

  return { req, res, user };
};
