import {
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
import { createBlockDto, updateBlockDto } from './dtos';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Injectable()
export class BlockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) {}

  async create(data: CreateParams<createBlockDto>) {
    const { postData, loggedUserData } = data;

    const { name } = postData;

    const apartmentId = loggedUserData.apartmentId;

    const conflict = await this.prisma.block.exists(apartmentId, {
      where: { name },
    });

    if (conflict) throw new ConflictException('Block name already exists');

    const block = await this.prisma.block.create({
      data: {
        name,
        apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Created the block ${name}`,
      type: 'apartment',
      loggedUserData,
    });

    return block;
  }

  async update(data: UpdateParams<updateBlockDto>) {
    const { id, postData, loggedUserData } = data;

    const { name } = postData;

    const apartmentId = loggedUserData.apartmentId;

    const valid = await this.prisma.block.exists(apartmentId, {
      where: { id },
    });

    if (!valid) throw new NotFoundException('Block doesnot exist');

    const conflict = await this.prisma.block.exists(apartmentId, {
      where: { name },
    });

    if (conflict) throw new ConflictException('Block already exists');

    const block = await this.prisma.block.update({
      where: { id },
      data: {
        name,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Updated the block ${name}`,
      type: 'apartment',
      loggedUserData,
    });

    return block;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, loggedUserData, apartmentId } = data;

    const block = await this.prisma.block.findUnique({
      where: { id, apartmentId },
      include: { floors: { include: { flats: true } } },
    });

    if (!block) throw new NotFoundException('Block does not exist');

    // Archive the block
    const blockUpdatePromise = this.prisma.block.update({
      where: { id },
      data: {
        archive: !block.archive,
        updatedById: loggedUserData.id,
      },
    });

    // Update floors and flats
    const floorsUpdatePromise = Promise.all(
      block.floors.map(async (floor) => {
        await this.prisma.floor.update({
          where: { id: floor.id },
          data: {
            archive: !block.archive,
            updatedById: loggedUserData.id,
          },
        });
        await Promise.all(
          floor.flats.map(async (flat) => {
            await this.prisma.flat.update({
              where: { id: flat.id },
              data: {
                archive: !block.archive,
                updatedById: loggedUserData.id,
              },
            });
          }),
        );
      }),
    );

    // Await for both promises
    await Promise.all([blockUpdatePromise, floorsUpdatePromise]);

    await this.activityService.create({
      message: `${block.archive ? 'Restored' : 'Archived'} the block ${block.name}`,
      type: 'apartment',
      loggedUserData,
    });

    return block;
  }

  async delete(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const valid = await this.prisma.block.exists(apartmentId, {
      where: { id },
    });

    if (!valid) throw new NotFoundException('Block doesnot exist');

    const block = await this.prisma.block.delete({
      where: { id },
    });

    await this.activityService.create({
      message: `Deleted the block ${valid.name}`,
      type: 'apartment',
      loggedUserData,
    });

    return block;
  }

  async getSingle(data: GetParam) {
    const { id, apartmentId } = data;

    const block = await this.prisma.block.exists(apartmentId, {
      where: { id, archive: false },
      select: {
        id: true,
        name: true,
        floors: {
          select: { id: true, name: true },
          where: { archive: false },
        },
      },
    });

    if (!block) throw new NotFoundException('Block doesnot exist');

    return block;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const blockArray = await this.prisma.block.findMany({
      where: { archive, apartmentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        floors: {
          select: {
            id: true,
            flats: {
              select: {
                id: true,
                clientUsers: {
                  select: {
                    id: true,
                  },
                  where: {
                    archive: false,
                  },
                },
              },
              where: {
                archive: false,
              },
            },
          },
          where: {
            archive: false,
          },
        },
        updatedAt: true,
      },
    });

    const blocks = blockArray.map((block) => ({
      id: block.id,
      name: block.name,
      floorCount: block.floors.length,
      flatCount: block.floors.reduce(
        (acc, floor) => acc + floor.flats.length,
        0,
      ),
      clientCount: block.floors.reduce((acc, floor) => {
        const flatUserCount = floor.flats.reduce(
          (acc, flat) => acc + flat.clientUsers.length,
          0,
        );
        return acc + flatUserCount;
      }, 0),
      updatedAt: block.updatedAt,
    }));

    return blocks;
  }

  async getMultiple(data: GetAllParams) {
    const { apartmentId, ids } = data;

    const withIds = ids ? ids.split(',') : [];

    const floors = await this.prisma.floor.findMany({
      where: {
        archive: false,
        apartmentId,
        blockId: { in: withIds },
        block: { archive: false },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
      },
    });

    return floors;
  }
}
