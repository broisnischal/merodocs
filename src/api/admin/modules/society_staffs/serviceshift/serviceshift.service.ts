import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from 'src/api/admin/common/interface/admin.interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { createAdminServiceShiftDto, updateAdminServiceShiftDto } from './dtos';

@Injectable()
export class ServiceShiftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) {}

  async create(data: CreateParams<createAdminServiceShiftDto>) {
    const { name, start, end } = data.postData;
    const { loggedUserData, apartmentId } = data;

    const alreadyExist = await this.prisma.adminServiceShift.exists(
      apartmentId,
      {
        where: {
          OR: [
            {
              start,
              end,
            },
            {
              name,
            },
          ],
        },
      },
    );

    if (alreadyExist) throw new BadRequestException('Shift already exist');

    const shift = await this.prisma.adminServiceShift.create({
      data: {
        name,
        start,
        end,
        apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Created service shift ${shift.name}`,
      type: 'serviceuser',
    });

    return shift;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const shifts = await this.prisma.adminServiceShift.existMany(apartmentId, {
      where: {
        archive,
      },
      orderBy: {
        createdById: 'desc',
      },
      select: {
        id: true,
        name: true,
        start: true,
        end: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return shifts;
  }

  async getSingle(data: GetParam) {
    const { apartmentId, id } = data;

    const shift = await this.prisma.adminServiceShift.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        start: true,
        end: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!shift) throw new NotFoundException('Shift not found');

    return shift;
  }

  async update(data: UpdateParams<updateAdminServiceShiftDto>) {
    const { id, apartmentId, postData, loggedUserData } = data;

    const valid = await this.prisma.adminServiceShift.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Shift does not exists');

    const { start, end } = postData;

    if (start || end) {
      if (
        start !== valid.start.toISOString() ||
        end !== valid.end.toISOString()
      ) {
        const alreadyExist = await this.prisma.adminServiceShift.findFirst({
          where: {
            start,
            end,
            NOT: {
              id,
            },
          },
        });

        if (alreadyExist) throw new BadRequestException('Shift already exists');
      }
    }

    if (postData.name && postData.name !== valid.name) {
      const alreadyExist = await this.prisma.adminServiceShift.findFirst({
        where: {
          name: postData.name,
          NOT: {
            id,
          },
        },
      });

      if (alreadyExist) throw new BadRequestException('Shift already exists');
    }

    const shift = await this.prisma.adminServiceShift.update({
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
      message: `Updated service shift ${shift.name}`,
      type: 'serviceuser',
    });

    return shift;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, apartmentId, loggedUserData } = data;

    const valid = await this.prisma.adminServiceShift.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Shift does not exists');

    const shift = await this.prisma.adminServiceShift.update({
      where: {
        id,
      },
      data: {
        archive: !valid.archive,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `${shift.archive ? 'Archived' : 'Restored'} service shift ${shift.name}`,
      type: 'serviceuser',
    });

    return shift;
  }

  async delete(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const validUser = await this.prisma.adminServiceShift.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('Shift does not exists');

    await this.prisma.adminServiceShift.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted service shift ${validUser.name}`,
      type: 'serviceuser',
    });
  }
}
