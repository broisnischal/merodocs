import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createRoleDto } from './dtos/create-role.dto';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from 'src/api/admin/common/interface/admin.interface';
import { updateRoleDto } from './dtos/update-role.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) { }

  async create(data: CreateParams<createRoleDto>) {
    const { postData, loggedUserData } = data;

    const apartmentId = loggedUserData.apartmentId;

    const { name } = postData;

    const alreadyExist = await this.prisma.adminRole.exists(apartmentId, {
      where: {
        name,
      },
    });

    console.log(alreadyExist);

    if (alreadyExist) throw new ConflictException('Role already exists');

    const role = await this.prisma.adminRole.create({
      data: {
        ...postData,
        apartmentId: apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted role ${role.name}`,
      type: 'role',
    });

    return role;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const roles = await this.prisma.adminRole.existMany(apartmentId, {
      where: {
        archive,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        archive: true,
        permissions: {
          select: {
            id: true,
            name: true,
            access: true,
          },
        },
      },
    });

    return roles.slice(0, roles.length - 1);
  }

  async getSingle(data: GetParam) {
    const role = await this.prisma.adminRole.exists(data.apartmentId, {
      where: {
        id: data.id,
      },
      select: {
        id: true,
        name: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!role) throw new NotFoundException('Role does not exist');

    return role;
  }

  async update(data: UpdateParams<updateRoleDto>) {
    const { id, postData, apartmentId, loggedUserData } = data;

    const valid = await this.prisma.adminRole.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Role does not exist');

    const apartment = await this.prisma.apartment.findUnique({
      where: {
        id: apartmentId,
      },
    });

    const firstRole = await this.prisma.adminRole.findFirst({
      where: {
        users: {
          some: {
            email: apartment!.mainUser,
          },
        },
      },
    });

    if (valid.id === firstRole?.id)
      throw new ForbiddenException('Cannot change permission of default role');

    const alreadyExist = await this.prisma.adminRole.findFirst({
      where: {
        name: postData.name,
        NOT: {
          id,
        },
      },
    });

    if (alreadyExist) throw new ConflictException('Same Role already exists');

    const role = await this.prisma.adminRole.update({
      where: {
        id,
      },
      data: {
        ...postData,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Updated role ${role.name}`,
      type: 'role',
    });

    return role;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, apartmentId, loggedUserData } = data;

    const validRole = await this.prisma.adminRole.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
        archive: true,
        users: true,
      },
    });

    if (!validRole) throw new NotFoundException('Role does not exists');

    const apartment = await this.prisma.apartment.findUnique({
      where: {
        id: apartmentId,
      },
    });

    const firstRole = await this.prisma.adminRole.findFirst({
      where: {
        users: {
          some: {
            email: apartment!.mainUser,
          },
        },
      },
    });
    if (validRole.id === firstRole?.id)
      throw new ForbiddenException('Cannot change permission of default role');

    const ownRole = validRole.users.find((i) => i.id === loggedUserData.id);

    if (ownRole) throw new ForbiddenException('Cannot archive your own role');

    const role = await this.prisma.adminRole.update({
      where: {
        id,
      },
      data: {
        archive: !validRole.archive,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `${role.archive ? 'Archived' : 'Restored'} role ${role.name}`,
      type: 'role',
    });

    return role;
  }

  async delete(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const validRole = await this.prisma.adminRole.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        archive: true,
        users: true,
      },
    });

    if (!validRole) throw new NotFoundException('Role does not exists');

    const apartment = await this.prisma.apartment.findUnique({
      where: {
        id: apartmentId,
      },
    });

    const firstRole = await this.prisma.adminRole.findFirst({
      where: {
        users: {
          some: {
            email: apartment!.mainUser,
          },
        },
      },
    });

    if (validRole.id === firstRole?.id)
      throw new ForbiddenException('Cannot change permission of default role');

    const ownRole = validRole.users.find((i) => i.id === loggedUserData.id);

    if (ownRole) throw new ForbiddenException('Cannot delete your own role');

    await this.prisma.adminRole.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted role ${validRole.name}`,
      type: 'role',
    });
  }
}
