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
} from 'src/api/admin/common/interface';
import {
  createFloorDto,
  updateFloorDto,
  checkFloorDto,
} from './dtos/index.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Injectable()
export class FloorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) {}

  async checkUnique(data: CreateParams<checkFloorDto>) {
    const { postData } = data;

    const { name, blockId } = postData;

    const valid = await this.prisma.block.findUnique({
      where: { id: blockId },
    });

    if (!valid) throw new NotFoundException('Block doesnot exist');

    const conflict = await this.prisma.floor.findFirst({
      where: { name, blockId: valid.id },
    });

    if (conflict) throw new ConflictException(`Floor name  already exists`);
  }

  async create(data: CreateParams<createFloorDto>) {
    const { postData, loggedUserData, apartmentId } = data;

    const { name, blockId } = postData;

    const valid = await this.prisma.block.findUnique({
      where: { id: blockId },
    });

    if (!valid) throw new NotFoundException('Block doesnot exist');

    const response = await Promise.all(
      name.map(async (item) => {
        const conflict = await this.prisma.floor.findFirst({
          where: { name: item, blockId: valid.id },
        });

        if (conflict)
          throw new ConflictException(`Floor name '${item}' already exists`);

        const floor = await this.prisma.floor.create({
          data: {
            name: item,
            blockId,
            apartmentId,
            createdById: loggedUserData.id,
            updatedById: loggedUserData.id,
          },
        });

        return floor;
      }),
    );

    await this.activityService.create({
      message: `Created multiple floor for block ${valid.name}`,
      type: 'floorandflat',
      loggedUserData,
      blockId: valid.id,
    });

    return response;
  }

  async update(data: UpdateParams<updateFloorDto>) {
    const { id, postData, loggedUserData } = data;

    const { name } = postData;

    const valid = await this.prisma.floor.findUnique({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Floor doesnot exist');

    const conflict = await this.prisma.floor.findFirst({
      where: { name, blockId: valid.blockId },
    });

    if (conflict) throw new ConflictException('Floor name already exists');

    const floor = await this.prisma.floor.update({
      where: { id },
      data: {
        name,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Updated floor ${name}`,
      type: 'floorandflat',
      loggedUserData,
      blockId: valid.blockId,
    });

    return floor;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, loggedUserData } = data;

    const floor = await this.prisma.floor.findUnique({
      where: { id, block: { archive: false } },
      include: { flats: true, block: true },
    });

    if (!floor) throw new NotFoundException('Floor does not exist');

    if (floor.block.archive && floor.archive)
      throw new BadRequestException(
        'Cannot restore the floor because its associated block is archived.',
      );

    const updatedFloor = await this.prisma.floor.update({
      where: { id },
      data: {
        archive: !floor.archive,
        updatedById: loggedUserData.id,
      },
    });

    await Promise.all(
      floor.flats.map(async (flat) => {
        await this.prisma.flat.update({
          where: { id: flat.id },
          data: {
            archive: !floor.archive,
            updatedById: loggedUserData.id,
          },
        });
      }),
    );

    await this.activityService.create({
      message: `${floor.archive ? 'Restored' : 'Archived'} ${floor.name} floor`,
      type: 'floorandflat',
      loggedUserData,
      blockId: floor.blockId,
    });

    return updatedFloor;
  }

  async delete(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.floor.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Floor doesnot exist');

    const floor = await this.prisma.floor.delete({
      where: { id },
    });

    await this.activityService.create({
      message: `Deleted floor ${valid.name}`,
      type: 'floorandflat',
      loggedUserData,
      blockId: valid.blockId,
    });

    return floor;
  }

  async getMultiple(data: GetAllParams) {
    const { apartmentId, ids } = data;

    const withIds = ids ? ids.split(',') : [];

    const flats = await this.prisma.flat.findMany({
      where: {
        archive: false,
        apartmentId,
        floor: {
          id: { in: withIds },
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
      },
    });

    return flats;
  }

  async getSingle(data: GetParam) {
    const { id } = data;

    const floor = await this.prisma.floor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        flats: {
          select: {
            id: true,
            type: true,
            clientUsers: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!floor) throw new NotFoundException('Floor doesnot exist');

    return floor;
  }

  async getAll(data: GetAllParams) {
    const { withId, archive } = data;

    const valid = await this.prisma.block.findUnique({
      where: { id: withId },
    });

    if (!valid) throw new NotFoundException('Block doesnot exist');

    const floors = await this.prisma.floor.findMany({
      where: {
        archive,
        blockId: withId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            flats: true,
          },
        },
      },
    });

    return { name: valid.name, floors };
  }
}
