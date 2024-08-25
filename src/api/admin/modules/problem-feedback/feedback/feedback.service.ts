import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from 'src/api/admin/common/interface';
import { createFeedbackDto } from './dtos/create-feedback.dto';
import { updateFeedbackDto } from './dtos/update-feedback.dto';
import { FileService } from 'src/global/file/file.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async create(data: CreateParams<createFeedbackDto>) {
    const { postData, loggedUserData, apartmentId } = data;

    const { message } = postData;

    const feedback = await this.prisma.feedback.create({
      data: {
        message,
        apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
    });

    return feedback;
  }

  async getSingle(data: GetParam) {
    const { id, apartmentId } = data;

    const feedback = await this.prisma.feedback.exists(apartmentId, {
      where: { id },
      select: {
        id: true,
        message: true,
        attachments: {
          select: {
            id: true,
            name: true,
            url: true,
          },
        },
        updatedAt: true,
        createdBy: {
          select: {
            name: true,
            role: {
              select: { name: true },
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

    if (!feedback) throw new NotFoundException('Feedback does not exist');

    return feedback;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId } = data;

    const feedbacks = await this.prisma.feedback.existMany(apartmentId, {
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        message: true,
        attachments: {
          select: {
            name: true,
            url: true,
          },
        },
        updatedAt: true,
        createdBy: {
          select: {
            name: true,
            role: {
              select: { name: true },
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

    return feedbacks;
  }

  async update(data: UpdateParams<updateFeedbackDto>) {
    const { id, postData, loggedUserData, apartmentId } = data;

    const { message } = postData;

    const valid = await this.prisma.feedback.exists(apartmentId, {
      where: { id },
    });

    if (!valid) throw new NotFoundException('Feedback does not exist');

    const feedback = await this.prisma.feedback.update({
      where: { id },
      data: {
        message,
        updatedById: loggedUserData.id,
      },
    });

    return feedback;
  }

  async uploadMultipeAttachments(
    data: UpdateParams<Array<Express.Multer.File>>,
  ) {
    const { id, postData, loggedUserData, apartmentId } = data;

    const valid = await this.prisma.feedback.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!valid) throw new NotFoundException('Feedback does not exist');

    // uploading files to s3
    await this.fileService.createMultiple({
      createdById: loggedUserData.id,
      files: postData,
      type: 'document',
      parentId: id,
      parentType: 'feedback',
    });
  }

  async deleteAttachment(data: DeleteParams) {
    const { id, apartmentId } = data;

    const file = await this.prisma.file.findUnique({
      where: {
        id,
        feedback: {
          apartmentId,
        },
      },
    });

    if (!file) throw new NotFoundException('File does not exist');

    await this.fileService.delete(id);
  }

  async uploadAttachment(data: UpdateParams<Express.Multer.File>) {
    const { id, postData, loggedUserData, apartmentId } = data;

    const valid = await this.prisma.feedback.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!valid) throw new NotFoundException('Feedback does not exist');

    const file = await this.fileService.create({
      file: postData,
      createdById: loggedUserData.id,
      type: 'docs',
    });

    const feedback = await this.prisma.feedback.update({
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
