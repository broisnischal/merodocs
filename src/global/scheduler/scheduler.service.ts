import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AWSStorageService } from '../aws/aws.service';
import { EnvService } from 'src/global/env/env.service';
import { SuperAdminNotificationService } from '../notification/superadmin-notification.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
    private readonly env: EnvService,
    private readonly notification: SuperAdminNotificationService,
  ) {}

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
  //   name: 'File Cleaner',
  //   timeZone: 'Asia/Kathmandu',
  // })
  // async cleanFile() {
  //   const initialDate = new Date();
  //   this.logger.log(`File Cleaner started at ${initialDate.toLocaleString()}`);
  //   const files = await this.prisma.file.findMany({
  //     where: {
  //       adminServiceId: null,
  //       adminUserId: null,
  //       amenityId: null,
  //       clientStaffId: null,
  //       clientUserId: null,
  //       documentClientStaffId: null,
  //       documentClientUser: null,
  //       folderId: null,
  //       guardUserId: null,
  //       maintenanceId: null,
  //       noticeId: null,
  //       petId: null,
  //       vehicleId: null,
  //       superAdminId: null,
  //       serviceProviderId: null,
  //       documentTypeId: null,
  //       problemId: null,
  //       feedbackId: null,
  //       clientProblemId: null,
  //       documentFileClientId: null,
  //       documentClientUserId: null,
  //       maintenanceCommentId: null,
  //       serviceTypeId: null,
  //       vehicleListId: null,
  //     },
  //     select: {
  //       id: true,
  //       url: true,
  //       _count: {
  //         select: {
  //           apartmentClientUsers: true,
  //         },
  //       },
  //     },
  //   });

  //   const cleanFiles = files.filter(
  //     (item) => item._count.apartmentClientUsers === 0,
  //   );
  //   await this.awsService.deleteMultipleFromS3(
  //     cleanFiles.map((item) => item.url),
  //   );
  //   await this.prisma.file.deleteMany({
  //     where: {
  //       id: {
  //         in: cleanFiles.map((item) => item.id),
  //       },
  //     },
  //   });
  //   const final = new Date();
  //   this.logger.log(`File cleaner finished at ${final.toLocaleString()}`);
  //   this.logger.log(
  //     `Time taken: ${(final.getTime() - initialDate.getTime()) / 10000} seconds`,
  //   );
  // }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'Move Out and Apartment Status',
    timeZone: 'Asia/Kathmandu',
  })
  async resolveMoveOutRequests() {
    const initialDate = new Date();

    this.logger.log(
      `MoveOut Request Resolver started at ${initialDate.toLocaleString()}`,
    );

    const scheduledRequestsForToday =
      await this.prisma.apartmentClientUser.findMany({
        where: {
          status: 'approved',
          type: {
            in: ['owner', 'tenant'],
          },
          movedOutOrNot: false,
          moveOut: {
            lte: initialDate,
          },
        },
      });

    await Promise.all(
      scheduledRequestsForToday.map(async (request) => {
        //? deleting flat client current state
        const flatCurrentFamilyMembers =
          await this.prisma.flatCurrentClient.findMany({
            where: {
              flatId: request.flatId,
              type: request.type === 'owner' ? 'owner_family' : 'tenant_family',
            },
          });

        await this.prisma.flatCurrentClient.deleteMany({
          where: {
            flatId: request.flatId,
            type: {
              in:
                request.type === 'owner'
                  ? ['owner', 'owner_family']
                  : ['tenant', 'tenant_family'],
            },
          },
        });

        const now = new Date();

        // creating movout log for the family_members
        await this.prisma.apartmentClientUser.createMany({
          data: flatCurrentFamilyMembers.map((flatCurrentClient) => {
            return {
              clientUserId: flatCurrentClient.clientUserId,
              apartmentId: flatCurrentClient.apartmentId,
              flatId: flatCurrentClient.flatId,
              type: flatCurrentClient.type,
              residing: flatCurrentClient.residing,
              acceptedById: request.updatedById,
              moveOut: now,
              status: 'approved',
              movedOutOrNot: true,
            };
          }),
        });

        if (request.type === 'owner') {
          await this.prisma.flatCurrentClient.updateMany({
            where: {
              flatId: request.flatId,
            },
            data: {
              hasOwner: false,
            },
          });
        }

        // updating movout for owner or tenant
        await this.prisma.apartmentClientUser.update({
          where: {
            id: request.id,
          },
          data: {
            moveOut: now,
            status: 'approved',
            residing: request.residing,
            movedOutOrNot: true,
          },
        });
      }),
    );

    const final = new Date();
    this.logger.log(
      `MoveOut Request Resolver finished at ${final.toLocaleString()}`,
    );
    this.logger.log(
      `Time taken: ${(final.getTime() - initialDate.getTime()) / 1000} seconds`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'Update Apartment Status',
    timeZone: 'Asia/Kathmandu',
  })
  async updateApartmentStatus() {
    const initialDate = new Date();

    this.logger.log(
      `Apartment status updater started at ${initialDate.toLocaleString()}`,
    );

    const inactiveThresholdDate = new Date();
    inactiveThresholdDate.setDate(
      inactiveThresholdDate.getDate() - this.env.get('APARTMENT_INACTIVE_DAYS'),
    );

    const apartmentsToDeactivate = await this.prisma.apartment.findMany({
      where: {
        lastUsed: {
          lte: inactiveThresholdDate,
        },
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        lastUsed: true,
      },
    });

    await Promise.all(
      apartmentsToDeactivate.map(async (apartment) => {
        await this.prisma.apartment.updateMany({
          where: {
            id: apartment.id,
          },
          data: {
            status: 'inactive',
          },
        });

        await this.notification.create({
          type: 'inactive_account',
          name: apartment?.name || '',
          date: apartment?.lastUsed ?? undefined,
        });
      }),
    );

    const finalDate = new Date();
    this.logger.log(
      `Apartment Status Resolver finished at ${finalDate.toLocaleString()}`,
    );
    this.logger.log(
      `Time taken: ${(finalDate.getTime() - initialDate.getTime()) / 1000} seconds`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'Update Apartment Subscription',
    timeZone: 'Asia/Kathmandu',
  })
  async updateApartmentSubscription() {
    const initialDate = new Date();

    this.logger.log(
      `Apartment subscription updater started at ${initialDate.toLocaleString()}`,
    );

    const currentDateTime = new Date();

    const [expiredSubscriptions, upcomingSubscriptions] = await Promise.all([
      this.prisma.subscription.findMany({
        where: {
          endAt: {
            lte: new Date(),
          },
          active: true,
          status: 'active',
        },
      }),
      this.prisma.subscription.findMany({
        where: {
          createdAt: {
            gt: currentDateTime,
          },
          active: false,
          status: 'active',
        },
      }),
    ]);

    await Promise.all([
      ...expiredSubscriptions.map(async (subscription) => {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'expired', active: false },
        });
        await this.prisma.apartment.update({
          where: { id: subscription.apartmentId },
          data: { status: 'expired' },
        });
      }),
      ...upcomingSubscriptions.map(async (subscription) => {
        if (subscription.remaining === 0) {
          await this.prisma.apartment.update({
            where: { id: subscription.apartmentId },
            data: { subscription: 'paid' },
          });
        } else {
          await this.prisma.apartment.update({
            where: { id: subscription.apartmentId },
            data: { subscription: 'due' },
          });
        }
        // Update subscription status to active
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { active: true },
        });
      }),
    ]);

    const finalDate = new Date();
    this.logger.log(
      `Subscription Resolver finished at ${finalDate.toLocaleString()}`,
    );
    this.logger.log(
      `Time taken: ${(finalDate.getTime() - initialDate.getTime()) / 1000} seconds`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'Expiring Soon Notification',
    timeZone: 'Asia/Kathmandu',
  })
  async sendExiringSoonNotification() {
    const initialDate = new Date();

    this.logger.log(
      `Apartment expiring soon notification started at ${initialDate.toLocaleString()}`,
    );

    const expireThresholdDate = new Date();
    expireThresholdDate.setDate(expireThresholdDate.getDate() + 15);

    const expiringApartments = await this.prisma.subscription.findMany({
      where: {
        endAt: {
          lte: expireThresholdDate,
        },
        status: 'active',
        active: true,
      },
      select: {
        id: true,
        apartmentId: true,
      },
    });

    await Promise.all(
      expiringApartments.map(async (apartment) => {
        const detail = await this.prisma.apartment.findFirst({
          where: { id: apartment.apartmentId },
          select: { name: true },
        });

        await this.notification.create({
          type: 'expiring_soon',
          name: detail?.name || '',
        });
      }),
    );

    const finalDate = new Date();
    this.logger.log(
      `Apartment Notification Sender finished at ${finalDate.toLocaleString()}`,
    );
    this.logger.log(
      `Time taken: ${(finalDate.getTime() - initialDate.getTime()) / 1000} seconds`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'Publish Blog',
    timeZone: 'Asia/Kathmandu',
  })
  async publishBlogHandler() {
    const initialDate = new Date();

    this.logger.log(
      `Apartment expiring soon notification started at ${initialDate.toLocaleString()}`,
    );

    const scheduledBlogs = await this.prisma.blog.findMany({
      where: {
        status: 'published',
        NOT: {
          publishDate: null,
        },
      },
      select: {
        id: true,
        publishDate: true,
        status: true,
      },
    });

    const publishBlogs = scheduledBlogs.filter((i) => {
      if (i.publishDate) {
        const publishDate = new Date(i.publishDate);

        if (+publishDate <= +initialDate) {
          return true;
        }
      }
      return false;
    });

    await Promise.all(
      publishBlogs.map(async (i) => {
        await this.prisma.blog.update({
          where: {
            id: i.id,
          },
          data: {
            status: 'published',
          },
        });
      }),
    );
  }
}
