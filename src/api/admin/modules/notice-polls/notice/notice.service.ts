import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  GetParam,
  UpdateParams,
} from '../../../common/interface';
import { createNoticeDto, updateNoticeDto } from './dtos/index.dto';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { FileService } from 'src/global/file/file.service';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';
import { capitalize } from 'lodash';

@Injectable()
export class NoticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
    private readonly fileService: FileService,
    private readonly clientNotification: ClientNotificationService,
  ) {}

  async create(data: CreateParams<createNoticeDto>) {
    const { postData, loggedUserData } = data;

    const { title, message, category } = postData;

    const apartmentId = loggedUserData.apartmentId;

    const notice = await this.prisma.notice.create({
      data: {
        title,
        message,
        category,
        apartmentId,
        createdById: loggedUserData.id,
        updatedById: loggedUserData.id,
      },
      include: { apartment: { select: { name: true } } },
    });

    await this.activityService.create({
      message: `Created the notice`,
      type: 'notice',
      loggedUserData,
    });

    const apartmentClients = await this.prisma.flatCurrentClient.findMany({
      where: {
        apartmentId,
        offline: false,
      },
      select: {
        clientUserId: true,
        clientUser: {
          select: {
            devices: {
              select: {
                fcmToken: true,
              },
            },
          },
        },
        flatId: true,
      },
    });

    await Promise.all(
      apartmentClients.map(async (client) => {
        const tokens = client.clientUser.devices
          .map((d) => d.fcmToken)
          .filter((token) => token);

        await this.clientNotification.createNotification(
          {
            type: 'notice',
            title: `New Notice | ${notice.apartment.name}`,
            body: `${capitalize(notice.title)}`,
            path: ClientAppRouter.NOTICES,
            id: notice.id,
            clientUserId: client.clientUserId,
            flatId: client.flatId,
          },
          tokens,
        );
      }),
    );

    // ! Old code

    // const clients = await this.prisma.clientUser.findMany({
    //   where: {
    //     offline: false,
    //     archive: false,
    //     currentFlats: {
    //       some: {
    //         apartmentId,
    //       },
    //     },
    //   },
    //   select: {
    //     id: true,
    //     devices: {
    //       select: {
    //         fcmToken: true,
    //       },
    //     },
    //   },
    // });
    // const tokens: string[] = clients
    //   .map((client) => client.devices.map((d) => d.fcmToken))
    //   .flat()
    //   .filter((token) => token);

    // await this.clientNotification.createMultipleNotification(
    //   {
    //     type: 'notice',
    //     title: `New Notice | ${notice.apartment.name}`,
    //     body: `${notice.title}`,
    //     path: ClientAppRouter.NOTICES,
    //     id: notice.id,
    //   },
    //   tokens,
    //   clients.map((c) => c.id),
    // );

    return notice;
  }

  async getSingle(data: GetParam) {
    const { id, apartmentId } = data;

    const notice = await this.prisma.notice.exists(apartmentId, {
      where: { id },
    });

    if (!notice) throw new NotFoundException('Notice doesnot exist');

    return notice;
  }

  async getAll(data: GetAllParams) {
    const { apartmentId, archive } = data;

    const notices = await this.prisma.notice.existMany(apartmentId, {
      where: {
        archive,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        category: true,
        message: true,
        document: {
          select: {
            url: true,
          },
        },
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            role: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    return notices;
  }

  async update(data: UpdateParams<updateNoticeDto>) {
    const { id, postData, loggedUserData, apartmentId } = data;

    const { title, message, category } = postData;

    const valid = await this.prisma.notice.exists(apartmentId, {
      where: { id },
    });

    if (!valid) throw new NotFoundException('Notice doesnot exist');

    const notice = await this.prisma.notice.update({
      where: { id },
      data: {
        title,
        message,
        category,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Updated the notice`,
      type: 'notice',
      loggedUserData,
    });

    return notice;
  }

  async archiveOrRestore(data: UpdateParams<undefined>) {
    const { id, loggedUserData, apartmentId } = data;

    const valid = await this.prisma.notice.exists(apartmentId, {
      where: { id },
    });

    if (!valid) throw new NotFoundException('Notice doesnot exist');

    const notice = await this.prisma.notice.update({
      where: { id },
      data: {
        archive: !valid.archive,
        updatedById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `${valid.archive ? 'Restored' : 'Archived'} the notice`,
      type: 'notice',
      loggedUserData,
    });

    return notice;
  }

  async delete(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.notice.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Notice doesnot exist');

    const notice = await this.prisma.notice.delete({
      where: { id },
    });

    await this.activityService.create({
      message: `Deleted the notice`,
      type: 'notice',
      loggedUserData,
    });

    return notice;
  }

  async upload(data: UpdateParams<Array<Express.Multer.File>>) {
    const { id, apartmentId, loggedUserData, postData } = data;

    const valid = await this.prisma.notice.exists(apartmentId, {
      where: { id },
      select: { document: true },
    });

    if (!valid) throw new NotFoundException('Notice doesnot exist');

    await this.fileService.createMultiple({
      createdById: loggedUserData.id,
      files: postData,
      type: 'document',
      parentId: id,
      parentType: 'notice',
    });
  }
}
