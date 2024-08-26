import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

// Outside the request, where apartmentId and flat is not required
export const ClientUnassigned = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentClientUser => {
    const req = ctx.switchToHttp().getRequest();
    if (!req?.user?.id) throw new UnauthorizedException('User not authorized!');
    return req.user;
  },
);

export const Apartment = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();

    if (!req?.apartmentId)
      throw new UnauthorizedException('Invalid, No apartment Id found');

    return req.apartmentId;
  },
);

export const Flat = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();

    if (!req?.flatId)
      throw new UnauthorizedException('Invalid, User not assigned to flat!');

    return req.flatId;
  },
);

// ? FlatClientUser - Required { flatId, userId }
export const FlatClientUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): FlatClientUserAuth => {
    const req = ctx.switchToHttp().getRequest();

    if (!req?.user?.id) throw new UnauthorizedException('User not authorized!');
    if (!req?.flatId)
      throw new UnauthorizedException('Invalid, User not assigned to flat!');
    if (!req.apartmentId)
      throw new UnauthorizedException(
        'Invalid User, is not assigned to apartment.',
      );

    if (!req.currentState) throw new UnauthorizedException('Invalid User!');

    return {
      id: req.user.id,
      apartmentId: req.apartmentId,
      flatId: req.flatId,
      currentState: req.currentState,
      name: req.user.name,
      contact: req.user.contact,
    };
  },
);

// ? FlatNotClientUser - Or case { userId } | { userId , flatId }
export const FlatNotClientUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): FlatOrUserId => {
    const req = ctx.switchToHttp().getRequest();
    if (!req?.user?.id) throw new UnauthorizedException('User not authorized!');

    if (req.flatId) {
      // if (!req.currentState) throw new UnauthorizedException('Invalid User!');

      return {
        id: req.user.id,
        flatId: req.flatId,
        apartmentId: req.apartmentId,
      };
    } else {
      return {
        id: req.user.id,
      };
    }
  },
);
