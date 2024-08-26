import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createProblemDto } from './dtos/create-problem.dto';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from 'src/api/admin/common/interface';
import { updateProblemDto } from './dtos/update-problem.dto';
import { FileService } from 'src/global/file/file.service';
import { SuperAdminNotificationService } from 'src/global/notification/superadmin-notification.service';

@Injectable()
export class ProblemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly notification: SuperAdminNotificationService,
  ) {}

  async create(data: CreateParams<createProblemDto>) {
    const { postData, loggedUserData, apartmentId } = data;

    const { topic, message } = postData;

    const problem = await this.prisma.problem.create({
      data: {
        topic,
        message,
        apartmentId,
        createdById: loggedUserData.id,
      },
    });

    const apartment = await this.prisma.apartment.findFirst({
      where: { id: apartmentId },
      select: { name: true },
    });

    await this.notification.create({
      type: 'report_issued_apartment',
      name: apartment?.name || '',
    });

    return problem;
  }

  async getSingle(data: GetParam) {
    const { id, apartmentId } = data;

    const problem = await this.prisma.problem.exists(apartmentId, {
      where: { id },
      select: {
        id: true,
        topic: true,
        message: true,
        attachments: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
      },
    });

    if (!problem) throw new NotFoundException('Problem doesnot exist');

    return problem;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId } = data;

    const problems = await this.prisma.problem.existMany(apartmentId, {
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        topic: true,
        message: true,
        attachments: {
          select: {
            name: true,
            url: true,
          },
        },
        status: true,
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
    });

    return problems;
  }

  async update(data: UpdateParams<updateProblemDto>) {
    const { id, postData, apartmentId } = data;

    const { message, topic } = postData;

    const valid = await this.prisma.problem.exists(apartmentId, {
      where: { id, status: 'pending' },
    });

    if (!valid) throw new NotFoundException('Problem doesnot exist');

    const problem = await this.prisma.problem.update({
      where: { id },
      data: {
        topic,
        message,
      },
    });

    return problem;
  }

  async uploadMultipeAttachments(
    data: UpdateParams<Array<Express.Multer.File>>,
  ) {
    const { id, postData, loggedUserData, apartmentId } = data;

    const valid = await this.prisma.problem.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!valid) throw new NotFoundException('Problem does not exist');

    // uploading files to s3
    const file = await this.fileService.createMultiple({
      createdById: loggedUserData.id,
      files: postData,
      type: 'document',
      parentId: id,
      parentType: 'problem',
    });
    return file;
  }

  async deleteAttachment(data: DeleteParams) {
    const { id, apartmentId } = data;

    const file = await this.prisma.file.findUnique({
      where: {
        id,
        problem: {
          apartmentId,
        },
      },
    });

    if (!file) throw new NotFoundException('File does not exist');

    await this.fileService.delete(id);
  }

  async uploadAttachment(data: UpdateParams<Express.Multer.File>) {
    const { id, postData, loggedUserData, apartmentId } = data;

    const valid = await this.prisma.problem.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!valid) throw new NotFoundException('Problem does not exist');

    const file = await this.fileService.create({
      file: postData,
      createdById: loggedUserData.id,
      type: 'docs',
    });

    const feedback = await this.prisma.problem.update({
      where: {
        id,
      },
      data: {
        attachments: {
          connect: {
            id: file.id,
          },
        },
      },
    });

    return feedback;
  }
}
