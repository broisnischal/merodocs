import { Injectable } from '@nestjs/common';
import { createProblemDto } from './dtos/create-problem.dto';
import { FileService } from 'src/global/file/file.service';
import { generateTicketId } from '../../common/utils/uuid.utils';
import { AssignedUserParam } from '../../common/interfaces';
import { Prisma } from '@prisma/client';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { SuperAdminNotificationService } from 'src/global/notification/superadmin-notification.service';

@Injectable()
export class ProblemService {
  constructor(
    private readonly prisma: PrismaTransactionService,
    private readonly fileService: FileService,
    private readonly notification: SuperAdminNotificationService,
  ) {}

  async create({
    body,
    user,
  }: AssignedUserParam.Create<
    createProblemDto & { files: Express.Multer.File[] }
  >) {
    const { message } = body;

    const problemId = generateTicketId();

    const problem = await this.prisma.$transaction(async (prisma) => {
      const problem = await prisma.clientProblem.create({
        data: {
          problemId,
          message,
          apartmentId: user.apartmentId,
          createdById: user.id,
        },
      });

      if (body.files) {
        await Promise.all(
          body.files.map(async (file) => {
            const item = await this.fileService.create({
              file,
              type: 'image',
            });

            if (!item.id) {
              throw new Prisma.PrismaClientKnownRequestError(
                'File upload failed',
                {
                  clientVersion: '5.13.0',
                  code: 'C409',
                },
              );
            }

            await prisma.clientProblem.update({
              where: { id: problem.id },
              data: {
                attachments: {
                  connect: {
                    id: item.id,
                  },
                },
              },
            });
          }),
        );
      }

      await this.notification.create({
        type: 'report_issued_client',
        name: user.name,
      });

      return problem;
    });

    return problem;
  }
}
