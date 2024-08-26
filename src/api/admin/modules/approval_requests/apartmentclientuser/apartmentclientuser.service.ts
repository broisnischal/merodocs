import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApartmentClientUserStatusEnum,
  ClientUserType,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { GetAllParams, UpdateParams } from 'src/api/admin/common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { updateRequestDto } from './dto/update-request.dto';
import { generateGatePassId } from 'src/api/client/common/utils/uuid.utils';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { capitalize } from 'lodash';
import moment from 'moment';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import {
  DefaultArgs,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';

interface GetAllExtended extends GetAllParams {
  status: ApartmentClientUserStatusEnum;
  type?: 'account' | 'flat';
}

@Injectable()
export class ApartmentClientUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
    private readonly prismaTransaction: PrismaTransactionService,
    private readonly clientNotification: ClientNotificationService,
  ) {}

  async getAnalysisData(data: GetAllParams) {
    const [accountCreation, addFlat, moveOut, becomeOwner, staffAccount] =
      await Promise.all([
        this.prisma.apartmentClientUser.count({
          where: {
            apartmentId: data.apartmentId,
            status: 'pending',
            requestFor: 'admin',
            requestType: 'addAccount',
          },
        }),
        this.prisma.apartmentClientUser.count({
          where: {
            apartmentId: data.apartmentId,
            status: 'pending',
            requestFor: 'admin',
            requestType: 'moveIn',
          },
        }),
        this.prisma.apartmentClientUser.count({
          where: {
            apartmentId: data.apartmentId,
            status: 'pending',
            requestFor: 'admin',
            requestType: 'moveOut',
          },
        }),
        this.prisma.apartmentClientUser.count({
          where: {
            apartmentId: data.apartmentId,
            status: 'pending',
            requestFor: 'admin',
            requestType: 'becomeOwner',
          },
        }),
        this.prisma.clientStaff.count({
          where: {
            apartmentId: data.apartmentId,
            status: 'pending',
            approvedByAdmin: false,
          },
        }),
      ]);

    return {
      accountCreation,
      addFlat,
      moveOut,
      becomeOwner,
      staffAccount,
    };
  }

  async getAllAccountRequests(data: GetAllExtended) {
    const { apartmentId, status, type } = data;

    let requests = await this.prisma.apartmentClientUser.existMany(
      apartmentId,
      {
        where: {
          status,
          requestFor: 'admin',
          requestType: type === 'account' ? 'addAccount' : 'moveIn',
        },
        select: {
          id: true,
          flatId: true,
          type: true,
          residing: true,
          clientUser: {
            select: {
              id: true,
              name: true,
              email: true,
              contact: true,
              _count: {
                select: {
                  flats: true,
                },
              },
              image: {
                select: {
                  url: true,
                },
              },
            },
          },
          documents: {
            select: {
              name: true,
              url: true,
            },
          },
          flat: {
            select: {
              name: true,
              floor: {
                select: {
                  name: true,
                  block: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          verifiedByOwner: true,
          // only show the rejected message when it is rejected
          message: status === 'rejected' ? true : false,
          moveIn: true,
          status: true,
          createdAt: true,
          updatedBy:
            status !== 'pending'
              ? {
                  select: {
                    name: true,
                    image: {
                      select: {
                        url: true,
                      },
                    },
                    role: {
                      select: {
                        name: true,
                      },
                    },
                  },
                }
              : undefined,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      },
    );

    // if (type === 'flat') {
    //   requests = requests.filter(
    //     (request) => request.clientUser._count.flats > 0,
    //   );
    // } else {
    //   requests = requests.filter(
    //     (request) => request.clientUser._count.flats === 0,
    //   );
    // }

    const updatedRequests = await Promise.all(
      requests.map(async (request) => {
        let owner: undefined | any;

        if (request.type !== 'owner') {
          owner = await this.prisma.clientUser.findFirst({
            where: {
              flats: {
                some: {
                  id: request.flatId,
                },
              },
            },
            orderBy: {
              moveIn: 'desc',
            },
            select: {
              name: true,
              offline: true,
              residing: true,
              image: {
                select: {
                  url: true,
                },
              },
            },
          });
        }

        let previousFlats: any | undefined;

        if (type === 'flat') {
          previousFlats = await this.prisma.apartmentClientUser.findMany({
            where: {
              clientUserId: request.clientUser.id,
              requestType: {
                in: ['addAccount', 'moveIn'],
              },
              status: 'approved',
              apartmentId,
            },
            select: {
              type: true,
              flat: {
                select: {
                  name: true,
                  floor: {
                    select: {
                      name: true,
                      block: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          });
        }
        return {
          ...request,
          owner,
          previousFlats,
        };
      }),
    );

    return updatedRequests;
  }

  async getAllMoveOutRequest(data: GetAllExtended) {
    const { apartmentId, status } = data;

    const requests = await this.prisma.apartmentClientUser.existMany(
      apartmentId,
      {
        where: {
          requestType: 'moveOut',
          requestFor: 'admin',
          status,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          requestType: true,
          type: true,
          clientUserId: true,
          clientUser: {
            select: {
              contact: true,
              email: true,
              name: true,
              image: {
                select: {
                  url: true,
                },
              },
            },
          },
          message: true,
          status: true,
          flatId: true,
          flat: {
            select: {
              name: true,
              floor: {
                select: {
                  name: true,
                  block: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          apartment: {
            select: {
              name: true,
            },
          },
          moveOut: true,
          documents: {
            select: {
              name: true,
              url: true,
            },
          },
          createdAt: true,
          updatedBy: {
            select: {
              name: true,
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

    // fetching current state of the user in the flat
    const updatedRequests = await Promise.all(
      requests.map(async (item) => {
        const currentState = await this.prisma.flatCurrentClient.findFirst({
          where: {
            flatId: item.flatId,
            clientUserId: item.clientUserId,
          },
          select: {
            type: true,
            hasOwner: true,
            residing: true,
          },
        });

        if (!currentState) return item;

        let owner: any | undefined;
        if (
          currentState?.type === 'tenant' &&
          currentState?.hasOwner === true
        ) {
          owner = await this.prisma.clientUser.findFirst({
            where: {
              currentFlats: {
                some: {
                  flatId: item.flatId,
                  type: 'owner',
                },
              },
            },
            select: {
              name: true,
              offline: true,
              contact: true,
              image: {
                select: {
                  url: true,
                },
              },
            },
          });
        }

        return {
          ...item,
          type: currentState.type,
          owner,
          hasOwner: currentState.hasOwner,
        };
      }),
    );

    return updatedRequests;
  }

  async getAllStaffAccountRequest(data: GetAllExtended) {
    const { apartmentId, status } = data;

    if (status === 'cancelled') throw new BadRequestException('Invalid Status');

    const requests = await this.prisma.clientStaff.existMany(apartmentId, {
      where: {
        approvedByAdmin: false,
        status,
      },
      select: {
        id: true,
        name: true,
        gender: true,
        personalStaffRole: {
          select: {
            name: true,
          },
        },
        flats: {
          select: {
            name: true,
            floor: {
              select: {
                name: true,
                block: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        dob: true,
        message: true,
        contact: true,
        bloodgroup: true,
        emergency_contact: true,
        status: true,
        citizenshipFront: true,
        citizenshipBack: true,
        document: {
          select: {
            name: true,
            url: true,
          },
        },
        image: {
          select: {
            url: true,
          },
        },
        createdByType: true,
        createdBy: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        approvedBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    return requests.map((i) => ({
      ...i,
      flats: i.flats[0],
    }));
  }

  async getAllBecomeOwnerRequest(data: GetAllExtended) {
    const { apartmentId, status } = data;
    const requests = await this.prisma.apartmentClientUser.existMany(
      apartmentId,
      {
        where: {
          requestType: 'becomeOwner',
          requestFor: 'admin',
          status,
        },
        select: {
          id: true,
          clientUser: {
            select: {
              name: true,
              contact: true,
              email: true,
              image: {
                select: {
                  url: true,
                },
              },
            },
          },
          flat: {
            select: {
              name: true,
              floor: {
                select: {
                  name: true,
                  block: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          type: true,
          residing: true,
          documents: {
            select: {
              name: true,
              url: true,
            },
          },
          createdAt: true,
          updatedBy: {
            select: {
              name: true,
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

    return requests;
  }

  async updateStaffAccountRequest(data: UpdateParams<updateRequestDto>) {
    const { id, apartmentId, postData, loggedUserData } = data;

    const valid = await this.prisma.clientStaff.exists(apartmentId, {
      where: {
        approvedByAdmin: false,
        id,
      },
      include: {
        flats: {
          select: {
            id: true,
            name: true,
            floor: {
              select: {
                name: true,
                block: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        apartment: {
          select: {
            name: true,
          },
        },
        createdBy: {
          select: {
            devices: {
              select: {
                fcmToken: true,
              },
            },
          },
        },
      },
    });

    if (!valid) throw new BadRequestException('Request not found');

    if (postData.status !== 'approved' && !postData.message) {
      throw new BadRequestException('Message is required');
    }

    if (valid.status === 'approved') {
      throw new BadRequestException('Request already approved');
    }

    if (!valid.createdById) throw new BadRequestException('Invalid request');

    const res = await this.prismaTransaction.$transaction(async (prisma) => {
      const request = await prisma.clientStaff.update({
        where: {
          id,
        },
        data: {
          status: postData.status,
          // if it is rejected then set the message
          message:
            postData.status === 'approved' ? undefined : postData.message,
          approvedByAdmin: postData.status === 'approved' ? true : undefined,
          approvedById: loggedUserData.id,
          approvedAt: postData.status === 'approved' ? new Date() : undefined,
          gatePass:
            postData.status === 'approved'
              ? {
                  create: {
                    code: generateGatePassId(),
                    apartmentId,
                    flatId: valid.flats[0].id,
                  },
                }
              : undefined,
        },
      });

      if (!valid.createdById)
        throw new PrismaClientKnownRequestError('Something went wrong', {
          clientVersion: '5.13.0',
          code: 'C409',
        });

      const title =
        postData.status === 'approved'
          ? `Personal Staff: Request accepted`
          : `Personal Staff: Request rejected`;

      const body =
        postData.status === 'approved'
          ? `Your request to add ${valid.name} as staff for Block ${valid.flats[0].floor.block.name} - ${valid.flats[0].name} at ${valid.apartment.name} has been accepted.`
          : `Your request to add ${valid.name} as staff for Block ${valid.flats[0].floor.block.name} - ${valid.flats[0].name} at ${valid.apartment.name} has been declined. Tap to view the reason for rejection.`;

      if (postData.status === 'approved') {
        await prisma.clientStaffLog.create({
          data: {
            clientUserType: valid.createdByType,
            clientUserId: valid.createdById,
            clientStaffId: valid.id,
            apartmentId: valid.apartmentId,
            flatId: valid.flats[0].id,
          },
        });
      }

      await this.activityService.create({
        type: 'staffAccount',
        loggedUserData,
        message: `Staff Account of ${valid.name} request ${postData.status} by ${loggedUserData.name}`,
      });

      await this.clientNotification.createRequestNotification({
        type: 'clientstaff',
        title,
        body,
        clientUserId: valid.createdById,
        path: ClientAppRouter.PERSONAL_STAFF,
        id: valid.id,
        flatId: valid.flats[0].id,
      });

      return request;
    });

    return res;
  }

  async update(data: UpdateParams<updateRequestDto>) {
    const { id, apartmentId, postData, loggedUserData } = data;

    if (postData.status === 'rejected' && !postData.message) {
      throw new BadRequestException('Message is required');
    }

    const valid = await this.prisma.apartmentClientUser.exists(apartmentId, {
      where: {
        id,
        status: 'pending',
      },
      include: {
        clientUser: {
          select: {
            name: true,
          },
        },
        apartment: {
          select: {
            name: true,
          },
        },
        flat: {
          select: {
            name: true,
            floor: {
              select: {
                name: true,
                block: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!valid) throw new NotFoundException('Request not found');

    // if the status of the request is approved then it cannot be rejected
    if (valid.status === 'approved') {
      throw new BadRequestException(
        'Request already approved cannot be updated again',
      );
    }

    // if the request is for addAccount and moveIn and it is approved then update the flat and user
    if (valid.requestType === 'addAccount' || valid.requestType === 'moveIn') {
      if (postData.status === 'approved') {
        await this.prismaTransaction.$transaction(async (prisma) => {
          await this.updateFlatAndUserRequest(
            {
              id,
              apartmentId,
              type: valid.type,
              clientUserId: valid.clientUserId,
              flatId: valid.flatId,
              residing: valid.residing,
              adminId: loggedUserData.id,
              offline: valid.offline,
            },
            prisma,
          );
        });

        await this.clientNotification.createRequestNotification({
          title: `Request accepted by management`,
          body: `Congratulations! Your request as the ${capitalize(valid.type)} for Block ${valid.flat.floor.block.name} - ${valid.flat.name} in ${capitalize(valid.apartment.name ? valid.apartment.name : 'Apartment')} has been accepted.`,
          clientUserId: valid.clientUserId,
          type: 'request',
          path: ClientAppRouter.DEFAULT,
          id: valid.id,
          flatId: valid.flatId,
        });
      } else {
        await this.clientNotification.createRequestNotification({
          title: `Request rejected by management`,
          body: `Your request as the ${capitalize(valid.type)} for Block ${valid.flat.floor.block.name} - ${valid.flat.name} in ${capitalize(valid.apartment.name ? valid.apartment.name : 'Apartment')} has been rejected. Tap to view reason for rejection.`,
          clientUserId: valid.clientUserId,
          type: 'request',
          path: ClientAppRouter.INITIAL_CURRENT_FLAT, ///Changed
          id: valid.id,
          // flatId: valid.flatId,
        });
      }
    } else if (valid.requestType === 'becomeOwner' && valid.type === 'owner') {
      const type = valid.type;
      if (postData.status === 'approved') {
        await this.prismaTransaction.$transaction(async (prisma) => {
          await this.updateBecomeOwnerRequest(
            {
              id,
              apartmentId,
              type,
              clientUserId: valid.clientUserId,
              adminId: loggedUserData.id,
              flatId: valid.flatId,
              residing: valid.residing,
            },
            prisma,
          );
        });
        await this.clientNotification.createRequestNotification({
          title: `Ownership from tenant to owner accepted`,
          body: `Congratulations! Your request to change ownership of Block ${valid.flat.floor.block.name} - ${valid.flat.name} in ${capitalize(valid.apartment.name ? valid.apartment.name : 'Apartment')} has been accepted.`,
          clientUserId: valid.clientUserId,
          type: 'request',
          path: ClientAppRouter.CURRENT_FLAT_SCREEN,
          id: valid.id,
          flatId: valid.flatId,
        });
      } else {
        await this.clientNotification.createRequestNotification({
          title: `Ownership from tenant to owner rejected`,
          body: `Your request to change ownership of Block ${valid.flat.floor.block.name} - ${valid.flat.name} in ${capitalize(valid.apartment.name ? valid.apartment.name : 'Apartment')} has been rejected. Tap to view reason for rejection.`,
          clientUserId: valid.clientUserId,
          type: 'request',
          path: ClientAppRouter.CURRENT_FLAT_SCREEN,
          id: valid.id,
          flatId: valid.flatId,
        });
      }
    } else if (
      valid.requestType === 'moveOut' &&
      (valid.type === 'owner' || valid.type === 'tenant')
    ) {
      if (postData.status === 'approved') {
        const moveOut = valid.moveOut;

        // if the request is for moveOut and it is approved then update the flat and user and it is today
        if (
          moveOut &&
          (moment().isSame(moment(moveOut), 'date') ||
            moment().isBefore(moment(moveOut), 'date'))
        ) {
          const type = valid.type;
          await this.prismaTransaction.$transaction(async (prisma) => {
            await this.updateMoveOutRequest(
              {
                apartmentId,
                type,
                clientUserId: valid.clientUserId,
                adminId: loggedUserData.id,
                flatId: valid.flatId,
                residing: valid.residing,
                id,
              },
              prisma,
            );
          });
        }

        await this.clientNotification.createRequestNotification({
          title: `Move out request accepted by management`,
          body: `Your move out request for Block ${valid.flat.floor.block.name} - ${valid.flat.name} in ${capitalize(valid.apartment.name ? valid.apartment.name : 'Apartment')} has been accepted.`,
          clientUserId: valid.clientUserId,
          type: 'request',
          path: ClientAppRouter.CURRENT_FLAT_SCREEN,
          id: valid.id,
          //flatId: valid.flatId,
        });
      } else {
        await this.clientNotification.createRequestNotification({
          title: `Move out request rejected by management`,
          body: `Your move out request for Block ${valid.flat.floor.block.name} - ${valid.flat.name} in ${capitalize(valid.apartment.name ? valid.apartment.name : 'Apartment')} has been rejected. Tap to view reason for rejection.`,
          clientUserId: valid.clientUserId,
          type: 'request',
          path: ClientAppRouter.CURRENT_FLAT_SCREEN,
          id: valid.id,
          flatId: valid.flatId,
        });
      }
    }
    // updating request
    const request = await this.prisma.apartmentClientUser.update({
      where: {
        id,
      },
      data: {
        status: postData.status,
        // if it is rejected then set the message
        message: postData.status === 'approved' ? undefined : postData.message,
        moveIn: postData.status === 'approved' ? new Date() : undefined,
        updatedById: loggedUserData.id,
        clientRequestLog: {
          create: {
            title: `${valid.requestType === 'moveIn' ? 'Move in' : valid.requestType === 'addAccount' ? 'Add account' : valid.requestType === 'becomeOwner' ? 'Become owner' : 'Move out'} request ${postData.status === 'approved' ? 'accepted' : 'rejected'} by management`,
            status: postData.status,
            message: postData.message,
            clientUserId: valid.clientUserId,
          },
        },
      },
    });

    await this.activityService.create({
      type: valid.requestType,
      loggedUserData: loggedUserData,
      message: `${valid.requestType.toUpperCase()} request ${valid?.clientUser?.name && `of ${capitalize(valid?.clientUser?.name)}`} ${postData.status} by ${loggedUserData.name}`,
    });

    return request;
  }

  private async updateFlatAndUserRequest(
    data: {
      id: string;
      clientUserId: string;
      apartmentId: string;
      flatId: string;
      type: ClientUserType;
      residing: boolean;
      adminId: string;
      offline?: boolean;
    },
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$extends' | '$transaction' | '$disconnect' | '$connect' | '$on' | '$use'
    >,
  ) {
    const { type, apartmentId, clientUserId, flatId, residing, adminId } = data;

    if (type === 'owner' || type === 'tenant') {
      const alreadyExistFlatUser = await prisma.flatCurrentClient.findFirst({
        where: {
          flatId,
          apartmentId,
          type,
        },
      });

      if (alreadyExistFlatUser) {
        await prisma.apartmentClientUser.delete({
          where: {
            id: data.id,
          },
        });
        throw new BadRequestException('Flat is already assigned to the user');
      }
    }

    let hasOwner: boolean = false;

    if (type !== 'owner') {
      const ownerExist = await prisma.flatCurrentClient.findFirst({
        where: {
          flatId,
          type: 'owner',
          apartmentId,
        },
      });

      if (ownerExist) hasOwner = true;
    }

    if (type === 'owner') {
      await prisma.flatCurrentClient.updateMany({
        where: {
          flatId,
        },
        data: {
          hasOwner: true,
        },
      });
      hasOwner = true;
    }

    // creating current state for the flat and user
    const currentState = await prisma.flatCurrentClient.create({
      data: {
        type,
        apartmentId,
        clientUserId,
        flatId,
        hasOwner,
        residing,
        offline: data.offline,
        acceptedById: adminId,
      },
    });

    if (!currentState)
      throw new ConflictException('Could not create current State');

    // when it is approved should verify the user and connect it to the apartment and flat
    await prisma.clientUser.update({
      where: {
        id: clientUserId,
      },
      data: {
        verified: true,
        flats: {
          connect: {
            id: flatId,
          },
        },
        offline: data.offline,
        acceptedById: adminId,
        gatePass: {
          create: {
            code: generateGatePassId(),
            apartmentId,
            flatId,
          },
        },
        apartments: {
          connect: {
            id: apartmentId,
          },
        },
      },
    });
  }

  private async updateBecomeOwnerRequest(
    data: {
      id: string;
      clientUserId: string;
      apartmentId: string;
      flatId: string;
      type: 'owner';
      residing: boolean;
      adminId: string;
    },
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$extends' | '$transaction' | '$disconnect' | '$connect' | '$on' | '$use'
    >,
  ) {
    const { type, apartmentId, clientUserId, flatId, residing, adminId } = data;

    const alreadyExistFlatUser = await prisma.flatCurrentClient.findFirst({
      where: {
        apartmentId,
        flatId,
        type: type,
      },
    });

    if (alreadyExistFlatUser) {
      await this.prisma.apartmentClientUser.delete({
        where: {
          id: data.id,
        },
      });
      throw new BadRequestException('Flat is already assigned to the owner');
    }

    const flatCurrentClient = await prisma.flatCurrentClient.findFirst({
      where: {
        apartmentId,
        flatId,
        type: 'tenant',
        clientUserId,
      },
    });

    if (!flatCurrentClient)
      throw new BadRequestException('Client User not found in the flat');

    await prisma.flatCurrentClient.updateMany({
      where: {
        apartmentId,
        flatId,
        type: 'tenant_family',
      },
      data: {
        type: 'owner_family',
      },
    });

    await prisma.flatCurrentClient.updateMany({
      where: {
        apartmentId,
        flatId,
      },
      data: {
        hasOwner: true,
      },
    });

    await prisma.flatCurrentClient.update({
      where: {
        id: flatCurrentClient.id,
      },
      data: {
        type: 'owner',
        acceptedById: adminId,
        residing,
        hasOwner: true,
      },
    });
  }

  /**
   * Update move out request for a client user in an apartment.
   *
   * @param {Object} data - Object containing clientUserId, apartmentId, flatId, type, residing, and adminId
   * @return {Promise<void>} Promise that resolves when the move out request is updated
   */
  private async updateMoveOutRequest(
    data: {
      clientUserId: string;
      apartmentId: string;
      flatId: string;
      type: 'owner' | 'tenant';
      residing: boolean;
      adminId: string;
      id: string;
    },
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$extends' | '$transaction' | '$disconnect' | '$connect' | '$on' | '$use'
    >,
  ) {
    const { apartmentId, flatId, residing, adminId, type, id } = data;
    const flatCurrentFamilyMembers = await prisma.flatCurrentClient.findMany({
      where: {
        apartmentId,
        flatId,
        type: type === 'owner' ? 'owner_family' : 'tenant_family',
      },
    });

    await prisma.flatCurrentClient.deleteMany({
      where: {
        flatId,
        type: {
          in:
            type === 'owner'
              ? ['owner', 'owner_family']
              : ['tenant', 'tenant_family'],
        },
      },
    });

    const now = new Date();

    // creating movout log for the family_members
    await prisma.apartmentClientUser.createMany({
      data: flatCurrentFamilyMembers.map((flatCurrentClient) => ({
        clientUserId: flatCurrentClient.clientUserId,
        apartmentId,
        flatId,
        type: flatCurrentClient.type,
        residing,
        updatedById: adminId,
        moveOut: now,
        status: 'approved',
        movedOutOrNot: true,
      })),
    });

    if (type === 'owner') {
      await prisma.flatCurrentClient.updateMany({
        where: {
          flatId,
        },
        data: {
          hasOwner: false,
        },
      });
    }

    // updating movout for owner or tenant
    await prisma.apartmentClientUser.update({
      where: {
        id,
      },
      data: {
        moveOut: now,
        status: 'approved',
        residing,
        movedOutOrNot: true,
      },
    });

    await prisma.gatePass.deleteMany({
      where: {
        flatId: data.flatId,
        clientUserId: {
          in: [
            data.clientUserId,
            ...flatCurrentFamilyMembers.map((i) => i.clientUserId),
          ],
        },
      },
    });
  }
}
