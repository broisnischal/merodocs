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
import { createGuardShiftDto } from './dto/create-guardshift.dto';
import { updateGuardShiftDto } from './dto/update-guardshift.dto';

@Injectable()
export class GuardShiftService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) {}

  async create(data: CreateParams<createGuardShiftDto>) {
    const { name, start, end, ...postData } = data.postData;
    const { loggedUserData, apartmentId } = data;

    const alreadyExist = await this.prisma.guardShift.exists(apartmentId, {
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
    });

    if (alreadyExist) throw new BadRequestException('Shift already exist');

    const shift = await this.prisma.guardShift.create({
      data: {
        ...postData,
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
      message: `Created guard shift ${shift.name}`,
      type: 'guarduser',
    });

    return shift;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const shifts = await this.prisma.guardShift.existMany(apartmentId, {
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

    const shift = await this.prisma.guardShift.exists(apartmentId, {
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

  async update(data: UpdateParams<updateGuardShiftDto>) {
    const { id, apartmentId, postData, loggedUserData } = data;

    const valid = await this.prisma.guardShift.exists(apartmentId, {
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
        const alreadyExist = await this.prisma.guardShift.findFirst({
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
      const alreadyExist = await this.prisma.guardShift.findFirst({
        where: {
          name: postData.name,
          NOT: {
            id,
          },
        },
      });

      if (alreadyExist) throw new BadRequestException('Shift already exists');
    }

    const shift = await this.prisma.guardShift.update({
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
      message: `Updated guard shift ${shift.name}`,
      type: 'guarduser',
    });

    return shift;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, apartmentId, loggedUserData } = data;

    const valid = await this.prisma.guardShift.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Shift does not exists');

    const shift = await this.prisma.guardShift.update({
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
      message: `${shift.archive ? 'Archived' : 'Restored'} guard shift ${shift.name}`,
      type: 'guarduser',
    });

    return shift;
  }

  async delete(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const validUser = await this.prisma.guardShift.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('Shift does not exists');

    await this.prisma.guardShift.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted guard shift ${validUser.name}`,
      type: 'guarduser',
    });
  }
}
