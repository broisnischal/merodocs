import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignedUserParam } from 'src/api/client/common/interfaces';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createCommentDto } from './dtos/index.dto';
import { CommentTypeEnum, Prisma } from '@prisma/client';
import { FileService } from 'src/global/file/file.service';
import { AdminNotificationService } from 'src/global/notification/admin-notification.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly notification: AdminNotificationService,
  ) {}

  async create({
    body,
    user,
  }: AssignedUserParam.Create<
    createCommentDto & { file?: Express.Multer.File }
  >) {
    const { maintenanceId, message } = body;

    const clientUserId = user.id;

    const type = CommentTypeEnum.client;

    if (type === CommentTypeEnum.client && !clientUserId)
      throw new BadRequestException(
        'In case of client clientUserId is required',
      );

    const valid = await this.prisma.maintenance.findFirst({
      where: {
        id: maintenanceId,
        flatId: user.flatId,
        status: {
          not: 'closed',
        },
      },
    });

    if (!valid) throw new NotFoundException('Maintenance doesnot exist');

    if (valid.type === 'public' || valid.clientUserId === clientUserId) {
      const comment = await this.prisma.maintenanceComment.create({
        data: {
          message,
          maintenanceId,
          type,
          clientUserId,
        },
      });

      if (body.file) {
        const file = await this.fileService.create({
          file: body.file,
          type: 'image',
        });

        if (!file.id) {
          throw new Prisma.PrismaClientKnownRequestError('File upload failed', {
            clientVersion: '5.13.0',
            code: 'C409',
          });
        }

        await this.prisma.maintenanceComment.update({
          where: { id: comment.id },
          data: {
            image: {
              connect: file,
            },
          },
        });
      }

      await this.notification.create({
        type: 'maintenance_ticket',
        apartmentId: user.apartmentId,
        newTicket: false,
      });

      return comment;
    }

    throw new BadRequestException('You are not allowed to comment here');
  }
}
