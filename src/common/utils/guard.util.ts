import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export function extractTokenFromHeader(req: Request): string | false {
  const [type, token] = req.headers.authorization?.split(' ') ?? [];

  return type === 'Bearer' ? token : false;
}

export function isPublicRoute(
  ctx: ExecutionContext,
  reflector: Reflector,
): boolean {
  const isPublic = reflector.getAllAndOverride('isPublic', [
    ctx.getHandler(),
    ctx.getClass(),
  ]);

  if (isPublic) return true;

  return false;
}

export function isPrivateRoute(
  ctx: ExecutionContext,
  reflector: Reflector,
): boolean {
  const isPublic = reflector.getAllAndOverride('isPrivate', [
    ctx.getHandler(),
    ctx.getClass(),
  ]);

  if (isPublic) return true;

  return false;
}
