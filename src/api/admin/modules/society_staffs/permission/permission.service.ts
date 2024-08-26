import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createPermissionDto } from './dtos/create-permssion.dto';
import {
  CreateParams,
  DeleteParams,
  UpdateParams,
} from 'src/api/admin/common/interface/admin.interface';
import { bulkCreatePermissionDto } from './dtos/bulkcreate-permission.dto';
import { updatePermissionDto } from './dtos/update-permission.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Injectable()
export class PermissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) {}

  async create(data: CreateParams<createPermissionDto>) {
    const { postData, apartmentId, loggedUserData } = data;

    const { name, roleId } = postData;

    const validRole = await this.prisma.adminRole.exists(apartmentId, {
      where: {
        id: roleId,
      },
    });

    if (!validRole) throw new BadRequestException('Invalid Role');

    const alreadyExist = await this.prisma.adminPermission.findUnique({
      where: {
        permissionIdentifier: {
          name,
          roleId,
        },
      },
    });

    if (alreadyExist) throw new ConflictException('Permission already exists');

    const permission = await this.prisma.adminPermission.create({
      data: {
        ...postData,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Created permission ${permission.name} for role ${validRole.name}`,
      type: 'role',
    });

    return permission;
  }

  async bulkCreate(data: CreateParams<bulkCreatePermissionDto>) {
    const { postData, apartmentId, loggedUserData } = data;

    const { permissions, roleId } = postData;

    const validRole = await this.prisma.adminRole.exists(apartmentId, {
      where: {
        id: roleId,
      },
    });

    if (!validRole) throw new BadRequestException('Invalid Role Id');

    const response = await Promise.all(
      permissions.map(async (item) => {
        try {
          const alreadyExist = await this.prisma.adminPermission.findUnique({
            where: {
              permissionIdentifier: {
                name: item.name,
                roleId,
              },
            },
          });

          if (alreadyExist)
            throw new ConflictException('Permission already exists');

          const permission = await this.prisma.adminPermission.create({
            data: {
              ...item,
              roleId,
              createdById: loggedUserData.id,
              updatedById: loggedUserData.id,
            },
          });

          return permission;
        } catch (error) {
          if (error instanceof HttpException) {
            return;
          }

          return;
        }
      }),
    );

    await this.activityService.create({
      loggedUserData,
      message: `Created multiple permissions for role ${validRole.name}`,
      type: 'role',
    });

    return response;
  }

  async update(data: UpdateParams<updatePermissionDto>) {
    const { id, postData, apartmentId, loggedUserData } = data;

    const valid = await this.prisma.adminPermission.findFirst({
      where: {
        id,
        role: {
          apartmentId,
        },
      },
    });

    if (!valid) throw new NotFoundException('Permission does not exist');

    const firstRole = await this.prisma.adminRole.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (valid.roleId === firstRole?.id)
      throw new ForbiddenException('Cannot change permission of default role');

    if (valid.roleId === loggedUserData.roleId)
      throw new ForbiddenException(
        'Cannot change permission on your own account',
      );

    const permission = await this.prisma.adminPermission.update({
      where: {
        id,
      },
      data: postData,
      include: {
        role: true,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Created permission ${permission.name} for role ${permission.role.name}`,
      type: 'role',
    });

    return permission;
  }

  async delete(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const valid = await this.prisma.adminPermission.findFirst({
      where: {
        id,
        role: {
          apartmentId,
        },
      },
      include: {
        role: true,
      },
    });

    if (!valid) throw new NotFoundException('Permission does not exist');

    const firstRole = await this.prisma.adminRole.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (valid.roleId === firstRole?.id)
      throw new ForbiddenException('Cannot change permission of default role');

    if (valid.roleId === loggedUserData.roleId)
      throw new ForbiddenException(
        'Cannot delete permission on your own account',
      );

    await this.prisma.adminPermission.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted permission ${valid.name} for role ${valid.role.name}`,
      type: 'role',
    });
  }
}
