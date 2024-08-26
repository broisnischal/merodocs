import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createServiceRoleDto } from './dtos/create-role.dto';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from 'src/api/admin/common/interface/admin.interface';
import { updateServiceRoleDto } from './dtos/update-role.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Injectable()
export class ServiceRoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) {}

  async create(data: CreateParams<createServiceRoleDto>) {
    const { postData, loggedUserData } = data;

    const apartmentId = loggedUserData.apartmentId;

    const { name } = postData;

    const alreadyExist = await this.prisma.adminServiceRole.exists(
      apartmentId,
      {
        where: {
          name,
        },
      },
    );

    if (alreadyExist) throw new ConflictException('Role already exists');

    const role = await this.prisma.adminServiceRole.create({
      data: {
        ...postData,
        apartmentId: apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted service role ${role.name}`,
      type: 'serviceuser',
    });

    return role;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const roles = await this.prisma.adminServiceRole.existMany(apartmentId, {
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return roles;
  }

  async getSingle(data: GetParam) {
    const role = await this.prisma.adminServiceRole.exists(data.apartmentId, {
      where: {
        id: data.id,
      },
      select: {
        id: true,
        name: true,
        archive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!role) throw new NotFoundException('Role does not exist');

    return role;
  }

  async update(data: UpdateParams<updateServiceRoleDto>) {
    const { id, postData, apartmentId, loggedUserData } = data;

    const valid = await this.prisma.adminServiceRole.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Role does not exist');

    const alreadyExist = await this.prisma.adminServiceRole.findFirst({
      where: {
        name: postData.name,
        NOT: {
          id,
        },
      },
    });

    if (alreadyExist) throw new ConflictException('Same Role already exists');

    const role = await this.prisma.adminServiceRole.update({
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
      type: 'serviceuser',
    });

    return role;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, apartmentId, loggedUserData } = data;

    const validRole = await this.prisma.adminServiceRole.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
        archive: true,
      },
    });

    if (!validRole) throw new NotFoundException('Role does not exists');

    const role = await this.prisma.adminServiceRole.update({
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
      type: 'serviceuser',
    });

    return role;
  }

  async delete(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const validRole = await this.prisma.adminServiceRole.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        archive: true,
      },
    });

    if (!validRole) throw new NotFoundException('Role does not exists');

    await this.prisma.adminServiceRole.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted role ${validRole.name}`,
      type: 'serviceuser',
    });
  }
}
