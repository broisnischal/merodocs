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
} from '../../common/interface';
import { createDocumentTypeDto } from './dtos/create-type.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import {
  updateDocumentTypeDto,
  updateMoveOutDocumentDto,
  updateMultipleDocumentTypeDto,
} from './dtos/update-type.dto';
import { addDocumentTypeDto } from './dtos/add-type.dto';

@Injectable()
export class DocumentTypeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) {}

  async create(data: CreateParams<createDocumentTypeDto>) {
    const { postData, loggedUserData, apartmentId } = data;

    const { name } = postData;

    const conflict = await this.prisma.documentType.exists(apartmentId, {
      where: { name },
    });

    if (conflict) throw new ConflictException('Document Type already exists');

    const documentType = await this.prisma.documentType.create({
      data: {
        name,
        apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Created the document type`,
      type: 'documentType',
      loggedUserData,
    });

    return documentType;
  }

  async add(data: UpdateParams<addDocumentTypeDto>) {
    const { postData, loggedUserData, apartmentId } = data;

    const { id } = postData;

    const response = await Promise.all(
      id.map(async (item) => {
        const valid = await this.prisma.documentType.findFirst({
          where: { id: item, apartmentId },
        });

        if (!valid) throw new ConflictException('Invalid document type');

        const documentType = await this.prisma.documentType.update({
          where: { id: item },
          data: { atSignUp: true },
        });

        return documentType;
      }),
    );

    await this.activityService.create({
      message: `Added the document type for sign up`,
      type: 'documentType',
      loggedUserData,
    });

    return response;
  }

  async update(data: UpdateParams<updateDocumentTypeDto>) {
    const { id, postData, loggedUserData, apartmentId } = data;

    const { name, atSignUp } = postData;

    const valid = await this.prisma.documentType.exists(apartmentId, {
      where: { id },
    });

    if (!valid) throw new NotFoundException('Document Type doesnot exist');

    if (name && name !== valid.name) {
      const conflict = await this.prisma.documentType.exists(apartmentId, {
        where: { name },
      });

      if (conflict) throw new ConflictException('Document Type already exists');
    }

    const documentType = await this.prisma.documentType.update({
      where: { id },
      data: {
        name,
        atSignUp,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Updated the document type`,
      type: 'documentType',
      loggedUserData,
    });

    return documentType;
  }

  async updateMultiple(data: UpdateParams<updateMultipleDocumentTypeDto>) {
    const { postData, loggedUserData, apartmentId } = data;

    const { ids } = postData;

    const response = await Promise.all(
      ids.map(async (item) => {
        const valid = await this.prisma.documentType.findUnique({
          where: { id: item, apartmentId },
        });

        if (!valid) throw new NotFoundException('Type doesnot exist');

        const type = await this.prisma.documentType.updateMany({
          where: { id: item },
          data: {
            atSignUp: false,
            updatedById: loggedUserData.id,
          },
        });

        return type;
      }),
    );

    await this.activityService.create({
      message: `Updated the document type`,
      type: 'documentType',
      loggedUserData,
    });

    return response;
  }

  async updateMoveOut(data: UpdateParams<updateMoveOutDocumentDto>) {
    const { postData, loggedUserData, apartmentId } = data;

    const { moveOut } = postData;

    const valid = await this.prisma.documentType.findFirst({
      where: { name: 'move-out', apartmentId },
    });

    if (!valid)
      throw new NotFoundException('Moved Out document is missing while seeded');

    const documentType = await this.prisma.documentType.update({
      where: { id: valid.id },
      data: {
        atSignUp: moveOut,
        apartmentId,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Updated the document type move out settings`,
      type: 'documentType',
      loggedUserData,
    });

    return documentType;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive, atSignUp } = data;

    let whereCondition = {
      archive,
      apartmentId,
      NOT: {
        name: 'move-out',
      },
    };

    if (atSignUp) {
      whereCondition['atSignUp'] = atSignUp;
    }

    const documentTypes = await this.prisma.documentType.existMany(
      apartmentId,
      {
        where: whereCondition,
        select: {
          id: true,
          name: true,
          createdAt: true,
          atSignUp: true,
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
    );

    return documentTypes;
  }

  async getAtNoSignUp(data: GetAllParams) {
    const { apartmentId } = data;

    const documentTypes = await this.prisma.documentType.existMany(
      apartmentId,
      {
        where: {
          archive: data.archive,
          atSignUp: false,
          apartmentId,
          NOT: {
            name: 'move-out',
          },
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          atSignUp: true,
          createdBy: {
            select: {
              name: true,
              role: {
                select: { name: true },
              },
              image: {
                select: { url: true },
              },
            },
          },
        },
      },
    );

    return documentTypes;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, loggedUserData, apartmentId } = data;

    const valid = await this.prisma.documentType.findUnique({
      where: { id, apartmentId },
    });

    if (!valid) throw new NotFoundException('Document Type does not exist');

    const document = this.prisma.documentType.update({
      where: { id },
      data: {
        archive: !valid.archive,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `${valid.archive ? 'Restored' : 'Archived'} the document ${valid.name}`,
      type: 'documentType',
      loggedUserData,
    });

    return document;
  }

  async delete(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.documentType.findFirst({
      where: {
        id,
        NOT: {
          name: 'move-out',
        },
      },
    });

    if (!valid) throw new NotFoundException('Document type doesnot exist');

    const document = await this.prisma.documentType.delete({
      where: { id },
    });

    await this.activityService.create({
      message: `Deleted the document type ${valid.name}`,
      type: 'documentType',
      loggedUserData,
    });

    return document;
  }
}
