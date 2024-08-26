import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from '../../common/interface';
import { createAmenityDto, updateAmenityDto } from './dtos/index.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { FileService } from 'src/global/file/file.service';

@Injectable()
export class AmenityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
    private readonly fileService: FileService,
  ) {}

  async create(data: CreateParams<createAmenityDto>) {
    const { postData, apartmentId, loggedUserData } = data;
    const { name, location, always, openTime, closeTime } = postData;

    if (always && (openTime || closeTime)) {
      throw new BadRequestException(
        "If 'always' is true, 'openTime' and 'closedTime' should not be provided.",
      );
    }

    if (!always && (!openTime || !closeTime)) {
      throw new BadRequestException(
        "If 'always' is false, both 'openTime' and 'closedTime' must be provided.",
      );
    }

    if (openTime && closeTime) {
      if (openTime === closeTime) {
        throw new BadRequestException(
          'Open time and close time cannot be the same.',
        );
      }
    }

    const conflict = await this.prisma.amenity.exists(apartmentId, {
      where: { name },
    });

    if (conflict) throw new ConflictException('Amenity name already exists');

    const amenity = await this.prisma.amenity.create({
      data: {
        name,
        location,
        apartmentId,
        always,
        openTime: always ? null : openTime,
        closeTime: always ? null : closeTime,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Created the amenity`,
      type: 'amenity',
      loggedUserData,
    });

    return amenity;
  }

  async getSingle(data: GetParam) {
    const { id, apartmentId } = data;

    const amenity = await this.prisma.amenity.exists(apartmentId, {
      where: { id },
    });

    if (!amenity) throw new NotFoundException('Amenity doesnot exist');

    return amenity;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const amenities = await this.prisma.amenity.existMany(apartmentId, {
      where: {
        archive,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        location: true,
        openTime: true,
        closeTime: true,
        always: true,
        image: {
          select: { url: true },
        },
        createdAt: true,
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    return amenities;
  }

  async update(data: UpdateParams<updateAmenityDto>) {
    const { id, postData, apartmentId, loggedUserData } = data;

    const { name, location, always, openTime, closeTime } = postData;

    const valid = await this.prisma.amenity.findUnique({
      where: { id, apartmentId },
    });

    if (!valid) throw new NotFoundException('Amenity not found');

    const updatedAlways =
      openTime !== undefined || closeTime !== undefined ? false : always;

    if (updatedAlways && (openTime || closeTime)) {
      throw new BadRequestException(
        "If 'always' is true, 'openTime' and 'closedTime' should not be provided.",
      );
    }

    if (openTime && closeTime && openTime === closeTime) {
      throw new BadRequestException(
        'openTime and closeTime cannot be the same',
      );
    }

    if (name && name !== valid.name) {
      const conflict = await this.prisma.amenity.findFirst({
        where: { name, apartmentId },
      });

      if (conflict) throw new ConflictException('Amenity already exists');
    }

    const poll = await this.prisma.amenity.update({
      where: { id },
      data: {
        name,
        location,
        always: updatedAlways,
        openTime: updatedAlways ? null : openTime,
        closeTime: updatedAlways ? null : closeTime,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Updated the amenity`,
      type: 'amenity',
      loggedUserData,
    });

    return poll;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, loggedUserData, apartmentId } = data;

    const valid = await this.prisma.amenity.exists(apartmentId, {
      where: { id },
    });

    if (!valid) throw new NotFoundException('Amenity doesnot exist');

    const amenity = await this.prisma.amenity.update({
      where: { id },
      data: {
        archive: !valid.archive,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `${valid.archive ? 'Restored' : 'Archived'} the amenity`,
      type: 'amenity',
      loggedUserData,
    });

    return amenity;
  }

  async delete(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.amenity.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Amenity doesnot exist');

    const amenity = await this.prisma.amenity.delete({
      where: { id },
    });

    await this.activityService.create({
      message: `Deleted the amenity`,
      type: 'amenity',
      loggedUserData,
    });

    return amenity;
  }

  async upload(data: UpdateParams<Express.Multer.File>) {
    const { id, apartmentId, postData } = data;

    const valid = await this.prisma.amenity.exists(apartmentId, {
      where: { id },
      select: { image: true },
    });

    if (!valid) throw new NotFoundException('Amenity doesnot exist');

    const file = await this.fileService.createOrUpdate({
      file: postData,
      type: 'image',
      existedFile: valid.image ? valid.image : undefined,
    });

    const amenity = await this.prisma.amenity.update({
      where: { id },
      data: {
        image: {
          connect: file,
        },
      },
      select: {
        image: {
          select: {
            url: true,
          },
        },
      },
    });

    return amenity;
  }
}
