import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

export const SuperAdminUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentClientUser => {
    const req = ctx.switchToHttp().getRequest();

    if (!req?.user?.id)
      throw new UnauthorizedException(
        'You are trying to access user when it is not authenticated',
      );

    return req.user;
  },
);
