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
  UpdateParams,
} from 'src/api/superadmin/common/interface';
import { createDocumentDto, updateDocumentDto } from './dtos/index.dto';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: SuperAdminActivityService,
  ) {}

  async create(data: CreateParams<createDocumentDto>) {
    const { postData, loggedUserData } = data;

    const { name } = postData;

    const alreadyExist = await this.prisma.documentSetting.findFirst({
      where: {
        name,
      },
    });

    if (alreadyExist) throw new ConflictException('Document already exists');

    const document = await this.prisma.documentSetting.create({
      data: {
        name,
        createdById: loggedUserData.id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: 'Created document settings',
      type: 'setting',
    });

    return document;
  }

  async getAll(data: GetAllParams) {
    const { archive } = data;

    const document = await this.prisma.documentSetting.findMany({
      where: {
        archive,
      },
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
    });

    return document;
  }

  async update(data: UpdateParams<updateDocumentDto>) {
    const { id, postData, loggedUserData } = data;

    const { name } = postData;

    const valid = await this.prisma.documentSetting.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Document doesnot exist');

    const alreadyExist = await this.prisma.documentSetting.findFirst({
      where: {
        name,
      },
    });

    if (alreadyExist) throw new ConflictException('Document already exists');

    const document = await this.prisma.documentSetting.update({
      where: { id },
      data: {
        name,
        updatedById: loggedUserData.id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: 'Updated document settings',
      type: 'setting',
    });

    return document;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.documentSetting.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Document setting doesnot exist');

    const document = await this.prisma.documentSetting.update({
      where: { id },
      data: {
        archive: !valid.archive,
        updatedById: loggedUserData.id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `${valid.archive ? 'Restored' : 'Archived'} document setting`,
      type: 'setting',
    });

    return document;
  }

  async delete(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.documentSetting.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Document doesnot exist');

    const document = await this.prisma.documentSetting.delete({
      where: { id },
    });

    await this.activity.create({
      loggedUserData,
      message: 'Deleted document settings',
      type: 'setting',
    });
    return document;
  }
}
