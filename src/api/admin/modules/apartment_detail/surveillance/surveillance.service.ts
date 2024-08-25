import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  createSurveillanceDto,
  updateSurveillanceDto,
} from './dto/surveillance.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  UpdateParams,
} from 'src/api/admin/common/interface';

@Injectable()
export class SurveillanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) {}

  async create(data: CreateParams<createSurveillanceDto>) {
    const { postData, loggedUserData } = data;

    const { name } = postData;

    const apartmentId = loggedUserData.apartmentId;

    const conflict = await this.prisma.surveillance.exists(apartmentId, {
      where: { name: name.toLowerCase(), archive: false },
    });

    if (conflict)
      throw new ConflictException('Surveillance name already exists');

    const surveillance = await this.prisma.surveillance.create({
      data: {
        name,
        apartmentId: loggedUserData.apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Created surveillance ${surveillance.name}`,
      type: 'apartment',
      loggedUserData,
    });

    return surveillance.id;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const surveillance = await this.prisma.surveillance.findMany({
      where: { archive, apartmentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    return surveillance;
  }

  async update(data: UpdateParams<updateSurveillanceDto>) {
    const { id, postData, loggedUserData } = data;

    const { name } = postData;

    const apartmentId = loggedUserData.apartmentId;

    const valid = await this.prisma.surveillance.exists(apartmentId, {
      where: { id },
    });

    if (!valid) throw new NotFoundException('surveillance doesnot exist');

    const conflict = await this.prisma.surveillance.exists(apartmentId, {
      where: { name },
    });

    if (conflict) throw new ConflictException('surveillance already exists');

    const surveillance = await this.prisma.surveillance.update({
      where: { id },
      data: {
        name,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Updated the surveillance ${name}`,
      type: 'apartment',
      loggedUserData,
    });

    return surveillance.id;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, loggedUserData, apartmentId } = data;

    const valid = await this.prisma.surveillance.exists(apartmentId, {
      where: { id },
    });

    if (!valid) throw new NotFoundException('surveillance doesnot exist');

    const surveillance = await this.prisma.surveillance.update({
      where: { id },
      data: {
        archive: !valid.archive,
        updatedById: loggedUserData.id,
      },
      select: {
        id: true,
        archive: true,
      },
    });

    await this.activityService.create({
      message: `${valid.archive ? 'Restored' : 'Archived'} the surveillance`,
      type: 'apartment',
      loggedUserData,
    });

    return surveillance;
  }

  async delete(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const valid = await this.prisma.surveillance.exists(apartmentId, {
      where: { id },
    });

    if (!valid) throw new NotFoundException('Surveillance doesnot exist');

    await this.prisma.surveillance.delete({
      where: { id },
    });

    await this.activityService.create({
      message: `Deleted surveillance ${valid.name}`,
      type: 'apartment',
      loggedUserData,
    });

    return valid.id;
  }
}
