import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  DeleteParams,
  UpdateParams,
} from 'src/api/superadmin/common/interface';
import { createColorDto, updateColorDto } from './dtos/index.dto';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';

@Injectable()
export class ColorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: SuperAdminActivityService,
  ) {}

  async create(data: CreateParams<createColorDto>) {
    const { postData, loggedUserData } = data;

    const { name } = postData;

    const alreadyExist = await this.prisma.color.findFirst({
      where: {
        name,
      },
    });

    if (alreadyExist) throw new ConflictException('Color already exists');

    const color = await this.prisma.color.create({
      data: {
        name,
        createdById: loggedUserData.id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `Created new color ${color.name}`,
      type: 'setting',
    });

    return color.id;
  }

  async getAll() {
    const color = await this.prisma.color.findMany({
      select: {
        id: true,
        name: true,
        createdBy: {
          select: {
            name: true,
            image: {
              select: { url: true },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        updatedBy: {
          select: {
            name: true,
            image: {
              select: { url: true },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return color;
  }

  async update(data: UpdateParams<updateColorDto>) {
    const { id, postData, loggedUserData } = data;

    const { name } = postData;

    const valid = await this.prisma.color.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Color doesnot exist');

    const alreadyExist = await this.prisma.color.findFirst({
      where: {
        name,
      },
    });

    if (alreadyExist) throw new ConflictException('Color already exists');

    const color = await this.prisma.color.update({
      where: { id },
      data: {
        name,
        updatedById: loggedUserData.id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `Updated color ${valid.name}`,
      type: 'setting',
    });

    return color.id;
  }

  async delete(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.color.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Color doesnot exist');

    const color = await this.prisma.color.delete({
      where: { id },
    });

    await this.activity.create({
      loggedUserData,
      message: 'Deleted color settings',
      type: 'setting',
    });
    return color.id;
  }
}
