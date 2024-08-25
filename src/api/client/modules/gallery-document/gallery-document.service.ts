import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { AssignedUserParam } from '../../common/interfaces';
import { FolderTypeEnum } from '@prisma/client';

interface GetAllExtended extends AssignedUserParam.GetAll {
  type: FolderTypeEnum;
}

interface GetAllWithParamExtended extends AssignedUserParam.GetAll {
  type: FolderTypeEnum;
  id: string;
}

@Injectable()
export class GalleryDocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll({ page, limit, type, user: { apartmentId } }: GetAllExtended) {
    const result = await this.prisma.folder.getAllPaginatedById(
      {
        page,
        limit,
        apartmentId,
      },
      {
        where: {
          type,
          access: 'public',
          archive: false,
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              files: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      },
    );

    result.data = await Promise.all(
      result.data.map(async (item) => {
        const image = await this.prisma.file.findFirst({
          where: {
            folderId: item.id,
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            name: true,
            url: true,
          },
        });

        return { ...item, image };
      }),
    );

    return result;
  }

  async getAllFiles(data: GetAllWithParamExtended) {
    const {
      id,
      type,
      user: { apartmentId },
      page,
      limit,
    } = data;

    const valid = await this.prisma.folder.exists(apartmentId, {
      where: {
        id,
        access: 'public',
        archive: false,
      },
    });

    if (!valid) throw new NotFoundException(`${type} does not exists`);

    const result = await this.prisma.file.getAllPaginated(
      {
        page,
        limit,
      },
      {
        where: {
          folderId: id,
          folder: {
            apartmentId,
          },
        },
        select: {
          name: true,
          url: true,
          folder: {
            select: {
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      },
    );

    return result;
  }
}
