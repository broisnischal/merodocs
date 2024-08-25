import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Panel, TokenType } from 'src/jwt/jwt.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { extractTokenFromHeader, isPublicRoute } from '../utils';
import { AdminUser, GuardUser, SuperAdmin } from '@prisma/client';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // ? if route is public route should not check for the context
    if (isPublicRoute(ctx, this.reflector)) return true;

    const req = ctx.switchToHttp().getRequest();
    const token = extractTokenFromHeader(req);

    const panelRoute = req.path.split('/')[3] as
      | 'admin'
      | 'client'
      | 'guard'
      | 'superadmin';

    switch (panelRoute) {
      case 'admin':
        if (!token) throw new UnauthorizedException('User is not LoggedIn.');
        req.user = await this.activateForAdmin(token);
        break;

      case 'client':
        if (!token) throw new ForbiddenException('User is not LoggedIn.');
        const { apartmentId, user, flatId, currentState } =
          await this.activateForUser(token);
        req.user = user;
        req.apartmentId = apartmentId;
        req.flatId = flatId;
        req.currentState = currentState;
        break;

      case 'guard':
        if (!token) throw new UnauthorizedException('User is not LoggedIn.');
        req.user = await this.activateForGuard(token);
        break;

      case 'superadmin':
        if (!token) throw new UnauthorizedException('User is not LoggedIn.');
        req.user = await this.activateForSuperAdmin(token);
        break;
    }

    return true;
  }

  //For apartment admin
  private async activateForAdmin(token: string): Promise<AdminUser> {
    const payload = this.jwtService.decodeToken(
      token,
      Panel.ADMIN,
      TokenType.ACCESS,
    );

    if (!payload) throw new UnauthorizedException('Token is not valid.');

    const user = await this.prisma.adminUser.findUnique({
      where: {
        id: payload.id,
        NOT: {
          archive: true,
        },
        role: {
          NOT: {
            archive: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User is not valid.');

    if (user.blockedToken === token)
      throw new UnauthorizedException('Session is blocked');

    return user;
  }

  //For client panel
  private async activateForUser(token: string) {
    const payload = this.jwtService.decodeToken<{
      id: string;
      currentApartment: string;
      currentFlat: string;
    }>(token, Panel.USER, TokenType.ACCESS);

    if (!payload) throw new ForbiddenException();

    const user = await this.prisma.clientUser.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
        name: true,
        contact: true,
        email: true,
        apartments: true,
        verified: true,
        clientApartments: true,
        currentFlats: {
          select: {
            flatId: true,
            type: true,
            residing: true,
            offline: true,
            apartmentId: true,
            hasOwner: true,
          },
        },
      },
    });

    if (!user) throw new ForbiddenException("User doesn't exist");

    const currentFlat = user.currentFlats.find(
      (i) => i.flatId === payload.currentFlat,
    );

    let currentApartment: string | undefined;

    if (currentFlat) {
      const apartment = await this.prisma.apartment.findFirst({
        where: {
          Flat: {
            some: {
              id: currentFlat.flatId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (apartment) {
        currentApartment = apartment.id;
      }
    }

    return {
      user,
      apartmentId: currentApartment,
      flatId: currentFlat ? payload.currentFlat : undefined,
      currentState: currentFlat,
    };
  }

  //For superadmin
  private async activateForSuperAdmin(token: string): Promise<SuperAdmin> {
    const payload = this.jwtService.decodeToken(
      token,
      Panel.SUPERADMIN,
      TokenType.ACCESS,
    );

    if (!payload) throw new UnauthorizedException('Token is not valid.');

    const user = await this.prisma.superAdmin.findUnique({
      where: {
        id: payload.id,
        NOT: {
          archive: true,
        },
        role: {
          NOT: {
            archive: true,
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User is not valid.');

    if (user.blockedToken === token)
      throw new UnauthorizedException('Session is blocked');

    return user;
  }

  //For guard
  private async activateForGuard(token: string): Promise<GuardUser> {
    const payload = this.jwtService.decodeToken(
      token,
      Panel.GUARD,
      TokenType.ACCESS,
    );

    if (!payload) throw new ForbiddenException('Token is not valid.');

    const user = await this.prisma.guardUser.findUnique({
      where: {
        id: payload.id,
        NOT: {
          archive: true,
        },
      },
    });

    if (!user) throw new ForbiddenException('User is not valid.');

    if (user.blockedToken === token)
      throw new ForbiddenException('Session is blocked');

    return user;
  }
}
