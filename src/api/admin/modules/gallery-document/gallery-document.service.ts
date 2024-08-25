import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createFolderDto } from './dtos/create-folder.dto';
import {
  CreateParamsForFolder,
  DeleteParamsForFolder,
  GetAllParamsForFolder,
  GetParamForFolder,
  MultipleDeleteParams,
  UpdateParamsForFolder,
} from '../../common/interface/admin.interface';
import { updateFolderDto } from './dtos/update-folder.dto';
import { FileService } from 'src/global/file/file.service';
import { File, FolderTypeEnum } from '@prisma/client';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Injectable()
export class GalleryDocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly activityService: AdminActivityService,
  ) {}

  async create(data: CreateParamsForFolder<createFolderDto>) {
    const { postData, loggedUserData, type } = data;

    const apartmentId = loggedUserData.apartmentId;

    const { name } = postData;

    const alreadyExist = await this.prisma.folder.exists(apartmentId, {
      where: {
        name,
        type,
      },
    });

    if (alreadyExist) throw new ConflictException('Folder already exists');

    const folder = await this.prisma.folder.create({
      data: {
        ...postData,
        type,
        apartmentId: apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Created ${type} folder ${folder.name}`,
      type,
    });

    return folder;
  }

  async getAll(data: GetAllParamsForFolder) {
    const { apartmentId, archive, access, type } = data;

    const folders = await this.prisma.folder.existMany(apartmentId, {
      where: {
        archive,
        type,
        access,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        access: true,
        _count: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            role: {
              select: {
                name: true,
              },
            },
            image: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    return folders;
  }

  async getSingle(data: GetParamForFolder) {
    const folder = await this.prisma.folder.exists(data.apartmentId, {
      where: {
        id: data.id,
        type: data.type,
      },
      select: {
        id: true,
        name: true,
        createdBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
        files: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            createdAt: true,
            updatedAt: true,
            createdBy: {
              select: {
                name: true,
                role: {
                  select: {
                    name: true,
                  },
                },
                image: {
                  select: {
                    url: true,
                  },
                },
              },
            },
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!folder) throw new NotFoundException('Folder does not exist');

    return folder;
  }

  async update(data: UpdateParamsForFolder<updateFolderDto>) {
    const { id, postData, apartmentId, type, loggedUserData } = data;

    const valid = await this.prisma.folder.exists(apartmentId, {
      where: {
        id,
        type,
      },
    });

    if (!valid) throw new NotFoundException('Folder does not exist');

    if (postData.name && valid.name !== postData.name) {
      const alreadyExist = await this.prisma.folder.exists(apartmentId, {
        where: {
          name: postData.name,
          type,
          NOT: {
            id,
          },
        },
      });

      if (alreadyExist)
        throw new ConflictException('Same Folder already exists');
    }

    const folder = await this.prisma.folder.update({
      where: {
        id,
      },
      data: postData,
    });

    await this.activityService.create({
      loggedUserData,
      message: `Updated ${type} folder ${folder.name}`,
      type,
    });

    return folder;
  }

  async archiveOrRestore(data: UpdateParamsForFolder<undefined>) {
    const { id, apartmentId, loggedUserData, type } = data;

    const validFolder = await this.prisma.folder.exists(apartmentId, {
      where: {
        id,
        type,
      },
      select: {
        id: true,
        archive: true,
        name: true,
      },
    });

    if (!validFolder) throw new NotFoundException('Folder does not exists');

    const folder = await this.prisma.folder.update({
      where: {
        id,
      },
      data: {
        archive: !validFolder.archive,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `${folder.archive ? 'Archived' : 'Restored'} ${type} folder ${folder.name}`,
      type,
    });

    return folder;
  }

  async delete(data: DeleteParamsForFolder) {
    const { id, apartmentId, type, loggedUserData } = data;

    const validFolder = await this.prisma.folder.exists(apartmentId, {
      where: {
        id,
        type,
      },
      select: {
        id: true,
        archive: true,
        name: true,
      },
    });

    if (!validFolder) throw new NotFoundException('Folder does not exists');

    await this.prisma.folder.delete({
      where: {
        id,
      },
    });

    await this.activityService.create({
      loggedUserData,
      message: `Deleted ${type} folder ${validFolder.name}`,
      type,
    });
  }
  async uploadMultiple(data: UpdateParamsForFolder<Express.Multer.File[]>) {
    const { id, apartmentId, postData, type, loggedUserData } = data;

    const folder = await this.prisma.folder.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!folder) throw new NotFoundException('Folder does not exists');

    const uploads = await this.fileService.createMultiple({
      files: postData,
      type,
      parentType: 'folder',
      parentId: folder.id,
      createdById: loggedUserData.id,
    });

    await this.activityService.create({
      loggedUserData,
      message: `Uploaded ${uploads.count} files in ${type} folder ${folder.name}`,
      type,
    });

    return uploads;
  }

  async upload(data: UpdateParamsForFolder<Express.Multer.File>) {
    const { id, apartmentId, postData, type, withId, loggedUserData } = data;

    const name = postData.originalname.toLowerCase();

    const folder = await this.prisma.folder.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!folder) throw new NotFoundException('Folder does not exists');

    // when there is withId : we assume that it is requesting for the
    // update of the image rather than creating
    let validFile: File | undefined;

    if (withId) {
      const exists = await this.prisma.file.findUnique({
        where: {
          id: withId,
          folder: {
            apartmentId,
          },
        },
      });

      if (!exists) throw new BadRequestException('File does not exists');

      validFile = exists;
    }

    const alreadyExist = await this.prisma.file.findFirst({
      where: {
        name,
        folder: {
          id,
          type,
          apartmentId,
        },
        NOT: {
          id: withId,
        },
      },
    });

    if (alreadyExist) throw new BadRequestException('File already exists');

    const file = await this.fileService.createOrUpdate({
      file: postData,
      type: type === FolderTypeEnum.gallery ? 'image' : 'docs',
      name,
      existedFile: validFile,
      folderId: id,
      createdById: loggedUserData.id,
    });

    if (validFile) {
      await this.activityService.create({
        loggedUserData,
        message: `Replaced  file ${file.name} in ${type} folder ${folder.name}`,
        type,
      });
    }

    await this.activityService.create({
      loggedUserData,
      message: `Created file ${file.name} in ${type} folder ${folder.name}`,
      type,
    });

    return folder;
  }

  async deleteFile(data: DeleteParamsForFolder) {
    const { id, apartmentId, loggedUserData, type } = data;

    const valid = await this.prisma.file.findUnique({
      where: {
        id,
        folder: {
          apartmentId,
          type,
        },
      },
      include: {
        folder: true,
      },
    });

    if (!valid) throw new NotFoundException('File does not exists');

    await this.fileService.delete(id);

    await this.activityService.create({
      loggedUserData,
      message: `Deleted file ${valid.name} in ${type} ${valid?.folder?.name && `folder ${valid.folder.name}`}`,
      type,
    });
  }

  async deleteMultipleFile(data: MultipleDeleteParams) {
    const { ids, apartmentId, loggedUserData, type, id } = data;

    const files = await this.prisma.file.findMany({
      where: {
        id: {
          in: ids,
        },
        folder: {
          apartmentId,
          type,
          id,
        },
      },
    });

    if (ids.length !== files.length)
      throw new NotFoundException(
        'Invalid Files. Some file ids does not exists',
      );

    await this.fileService.deleteMultiple(files);

    await this.activityService.create({
      loggedUserData,
      message: `Deleted ${ids.length} files in ${type}`,
      type,
    });

    return files;
  }
}
