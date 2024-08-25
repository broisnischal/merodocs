import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  RoutePermission,
  RoutePermissionCollection,
} from '../../api/admin/common/enums/route-permission.enum';
import { AccessRightEnum, AdminUser, SuperAdmin } from '@prisma/client';
import { isPrivateRoute, isPublicRoute } from '../utils';
import {
  superAdminPermissions,
  superadminPermissionNames,
} from 'src/api/superadmin/common/constants/route-permissions';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (
      isPublicRoute(ctx, this.reflector) ||
      isPrivateRoute(ctx, this.reflector)
    )
      return true;

    const req = ctx.switchToHttp().getRequest();

    const path = req.path.split('/') as string[];
    const method = req.method;

    const panelRoute = path[3];

    if (panelRoute === 'superadmin')
      return await this.canActivateForSuperAdmin(
        req.user as SuperAdmin,
        path.slice(4),
        method,
      );

    if (panelRoute !== 'admin') return true;

    const user = req.user as AdminUser;

    return await this.canActivateForAdmin(user, path, method);
  }

  private async canActivateForAdmin(
    user: AdminUser,
    path: string[],
    method: string,
  ) {
    const userpermissions = await this.prisma.adminPermission.findMany({
      where: {
        roleId: user.roleId,
      },
      select: {
        name: true,
        access: true,
      },
    });

    if (userpermissions.length === 0) throw new ForbiddenException();

    //! if route is 'gd' then it should check the route ahead
    const controllerRoute = path[4] === 'gd' ? path[5] : path[4];

    const collectionParent = this.returnRouteParentPermission(controllerRoute);

    if (!collectionParent) throw new ForbiddenException();

    const validPermission = userpermissions.find(
      (i) => i.name === collectionParent,
    );

    if (!validPermission) throw new ForbiddenException();

    switch (validPermission.access) {
      case AccessRightEnum.readonly: {
        if (method !== 'GET') throw new ForbiddenException();
        break;
      }

      default: {
        break;
      }
    }

    return true;
  }

  private returnRouteParentPermission(route: string): string | false {
    for (const i in RoutePermissionCollection) {
      const permissions = RoutePermission[RoutePermissionCollection[i]];

      const includePermission = permissions.includes(route);

      if (includePermission) return RoutePermissionCollection[i];
    }

    return false;
  }

  private async canActivateForSuperAdmin(
    user: SuperAdmin,
    paths: string[],
    method: string,
  ) {
    const topPermission = paths[0];
    const childPermission = paths.length === 2 ? paths[1] : undefined;
    const subChildPermission = paths.length === 3 ? paths[2] : undefined;

    // if permission is not in the superadmin permission list then give the access
    if (!superadminPermissionNames.includes(topPermission)) return true;

    const permission = await this.prisma.superAdminPermission.findFirst({
      where: {
        name: topPermission,
        roleId: user.roleId,
      },
      select: {
        name: true,
        access: true,
        children: true,
      },
    });

    if (!permission) throw new ForbiddenException();

    const children =
      (superAdminPermissions[topPermission] as string[]) || undefined;

    // Children permission access
    if (childPermission && children && children.includes(childPermission)) {
      const validPermission = permission.children.find(
        (i) => i === childPermission,
      );

      if (!validPermission) throw new ForbiddenException();
    }

    // Sub Children permission access
    if (
      subChildPermission &&
      children &&
      children.includes(subChildPermission)
    ) {
      const validPermission = permission.children.find(
        (i) => i === childPermission,
      );

      if (!validPermission) throw new ForbiddenException();
    }

    switch (permission.access) {
      case AccessRightEnum.readonly: {
        if (method !== 'GET') throw new ForbiddenException();
        break;
      }

      default: {
        break;
      }
    }

    return true;
  }
}
