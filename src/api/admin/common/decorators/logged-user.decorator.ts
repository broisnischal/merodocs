import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

export const AdminLoggedUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const req = ctx.switchToHttp().getRequest();

    if (!req?.user?.id)
      throw new UnauthorizedException(
        'You are trying to access user when it is not authenticated',
      );

    if (!req?.user?.apartmentId)
      throw new UnauthorizedException('Invalid User! No apartment Id found');

    return req.user;
  },
);
