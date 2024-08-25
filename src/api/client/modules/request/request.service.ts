import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FileService } from 'src/global/file/file.service';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import {
  AssignedUserParam,
  UnAssignedUserParam,
} from '../../common/interfaces';
import {
  CreateRequestDto,
  DeclineRequestDto,
  UpdateRequestDto,
} from './dtos/request.dto';
import { FlatCurrentClient } from '@prisma/client';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import ClientAppRouter from 'src/common/routers/client-app.routers';
import { capitalize } from 'lodash';
import { generateGatePassId } from '../../common/utils/uuid.utils';
import { AdminNotificationService } from 'src/global/notification/admin-notification.service';

@Injectable()
export class ReqService {
  constructor(
    private readonly prisma: PrismaTransactionService,
    private readonly fileService: FileService,
    private readonly clientNotification: ClientNotificationService,
    private readonly adminNotification: AdminNotificationService,
  ) {}

  async getSingle({ id, user }: UnAssignedUserParam.Get) {
    const data = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        clientUserId: user.id,
      },
      include: {
        documents: {
          select: {
            id: true,
            url: true,
            name: true,
            documentType: {
              select: { name: true },
            },
          },
        },
        clientRequestLog: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!data) throw new NotFoundException('Request not found');

    if (data.requestType === 'moveOut') {
      const moveInRequest = await this.prisma.apartmentClientUser.findFirst({
        where: {
          flatId: data.flatId,
          requestType: {
            in: ['moveIn', 'addAccount'],
          },
          status: 'approved',
          createdAt: {
            lt: data.createdAt,
          },
        },
        select: {
          documents: {
            select: {
              id: true,
              url: true,
              name: true,
              documentType: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        ...data,
        otherDocuments: moveInRequest?.documents ? moveInRequest.documents : [],
      };
    }

    return {
      ...data,
      otherDocuments: [],
    };
  }

  async getDocumentType({ apartmentId }: { apartmentId: string }) {
    const data = await this.prisma.documentType.findMany({
      where: {
        apartmentId: apartmentId,
        NOT: {
          name: 'move-out',
          archive: false,
        },
        atSignUp: true,
        archive: false,
      },
      include: {},
    });

    return data;
  }

  async getAllApartmentRequestOwner({ user }: AssignedUserParam.GetAll) {
    if (
      user.currentState.type !== 'owner' &&
      user.currentState.type !== 'tenant'
    )
      return [];

    const data = await this.prisma.apartmentClientUser.findMany({
      where: {
        flatId: user.flatId,
        requestType: {
          in: ['addAccount', 'moveIn'],
        },
        verifiedByOwner: false,
        status: {
          notIn: ['cancelled', 'rejected'],
        },
        clientUserId: {
          not: user.id,
        },
        requestFor: user.currentState.type,
      },
      include: {
        documents: {
          select: {
            url: true,
            id: true,
            name: true,
            documentType: true,
          },
        },
        apartment: {
          select: {
            name: true,
            area: true,
            city: true,
          },
        },
        clientUser: {
          select: {
            name: true,
            id: true,
            email: true,
            contact: true,
          },
        },
        clientRequestLog: true,
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
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return data;
  }

  async getAllApartmentRequest({ user }: UnAssignedUserParam.GetAll) {
    const data = await this.prisma.apartmentClientUser.findMany({
      where: {
        clientUserId: user.id,
      },
      distinct: ['flatId'],
      include: {
        documents: {
          select: {
            url: true,
            id: true,
            name: true,
            documentType: true,
          },
        },
        apartment: {
          select: {
            name: true,
            area: true,
            city: true,
          },
        },
        clientUser: {
          select: {
            email: true,
            contact: true,
            name: true,
          },
        },
        clientRequestLog: {
          orderBy: {
            createdAt: 'desc',
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data.filter((i) => {
      if (i.requestType === 'moveOut') {
        if (i.movedOutOrNot) {
          return false;
        }
      }
      return true;
    });
  }

  async createApartmentRequest({
    body,
    user,
  }: UnAssignedUserParam.Create<CreateRequestDto>) {
    const existFlat = await this.prisma.flat.findUnique({
      where: {
        id: body.flatId,
      },
      include: {
        apartment: true,
        floor: {
          select: {
            name: true,
            block: true,
          },
        },
      },
    });

    if (!existFlat) {
      throw new NotFoundException('Flat not found');
    }

    const alreadyExistInFlat = await this.prisma.flatCurrentClient.findFirst({
      where: {
        flatId: body.flatId,
        clientUserId: user.id,
      },
    });

    if (alreadyExistInFlat)
      throw new BadRequestException('You are already in this flat!');

    const requestAlreadyCreated =
      await this.prisma.apartmentClientUser.findFirst({
        where: {
          flatId: body.flatId,
          clientUserId: user.id,
          status: {
            not: 'cancelled',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    if (
      requestAlreadyCreated &&
      requestAlreadyCreated.requestType !== 'moveOut'
    ) {
      if (requestAlreadyCreated.status === 'pending') {
        throw new BadRequestException(
          'Request already created and is in pending state. Please wait for approval!',
        );
      }

      if (requestAlreadyCreated.status === 'rejected')
        throw new BadRequestException(
          'Request already created and rejected. Please resubmit the request!',
        );

      throw new BadRequestException('Request already created');
    }

    // const timesUserHaveRequested = await this.prisma.apartmentClientUser.count({
    //   where: {
    //     flatId: body.flatId,
    //     clientUserId: user.id,
    //   },
    // });

    // if (timesUserHaveRequested > parseInt(process.env.FLAT_REQUEST_TIMES)) {
    //   throw new BadRequestException(
    //     `You have already requested for ${process.env.FLAT_REQUEST_TIMES} flats.`,
    //   );
    // }

    const userdatawithflat = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
      },
      include: {
        _count: {
          select: {
            flats: true,
          },
        },
      },
    });

    if (!userdatawithflat) {
      throw new NotFoundException('User not found');
    }

    switch (body.type) {
      case 'owner': {
        // check if owner already exists
        const existsOwner = await this.prisma.flatCurrentClient.findFirst({
          where: {
            flatId: body.flatId,
            type: 'owner',
          },
        });

        if (existsOwner) {
          throw new BadRequestException(
            'An account for an owner already exists. Please create your account as an owner family.',
          );
        }

        const newRequest = await this.prisma.apartmentClientUser.create({
          data: {
            type: 'owner',
            flatId: body.flatId,
            apartmentId: existFlat.apartmentId,
            clientUserId: user.id,
            residing: body.residing,
            requestType:
              userdatawithflat?._count.flats > 0 ? 'moveIn' : 'addAccount',
            requestFor: 'admin',
            clientRequestLog: {
              create: {
                title: 'Request for approval as an owner.',
                status: 'pending',
                clientUserId: user.id,
              },
            },
          },
        });

        await this.adminNotification.create({
          type:
            userdatawithflat?._count.flats > 0
              ? 'add_flat_request'
              : 'account_creation_request',
          apartmentId: existFlat.apartmentId,
        });

        return newRequest;
      }

      case 'tenant': {
        const existsTenant = await this.prisma.flatCurrentClient.findFirst({
          where: {
            flatId: body.flatId,
            type: 'tenant',
          },
        });

        if (existsTenant) {
          throw new BadRequestException(
            'An account for tenant already exists. Please create your account as an tenant family.',
          );
        }

        const owner = await this.prisma.flatCurrentClient.findFirst({
          where: {
            flatId: body.flatId,
            type: 'owner',
          },
          include: {
            clientUser: {
              select: {
                devices: true,
              },
            },
          },
        });

        if (!owner) {
          //? if no owner in flat
          const newRequest = await this.prisma.apartmentClientUser.create({
            data: {
              type: 'tenant',
              flatId: body.flatId,
              apartmentId: existFlat.apartmentId,
              clientUserId: user.id,
              residing: body.residing,
              requestType:
                userdatawithflat?._count.flats > 0 ? 'moveIn' : 'addAccount',
              requestFor: 'admin',
              clientRequestLog: {
                create: {
                  title: 'Request for approval as an tenant for management.',
                  status: 'pending',
                  clientUserId: user.id,
                },
              },
            },
          });

          await this.adminNotification.create({
            type:
              userdatawithflat?._count.flats > 0
                ? 'add_flat_request'
                : 'account_creation_request',
            apartmentId: existFlat.apartmentId,
          });

          return newRequest;
        } else {
          //? if owner exists in flat
          const newRequest = await this.prisma.apartmentClientUser.create({
            data: {
              type: 'tenant',
              flatId: body.flatId,
              apartmentId: existFlat.apartmentId,
              clientUserId: user.id,
              residing: body.residing,
              requestType:
                userdatawithflat?._count.flats > 0 ? 'moveIn' : 'addAccount',
              requestFor: 'owner',
              clientRequestLog: {
                create: {
                  title: 'Request for approval as an tenant for owner.',
                  status: 'pending',
                  clientUserId: user.id,
                },
              },
            },
          });

          await this.clientNotification.createRequestNotification({
            type: 'request',
            id: newRequest.id,
            clientUserId: owner.id,
            clickable: true,
            path: ClientAppRouter.DEFAULT,
            title: 'Move in request',
            flatId: newRequest.flatId,
            body: `${capitalize(user.name ? user.name : 'Someone')} has requested to move out from Block ${capitalize(existFlat.floor.block.name)} - ${existFlat.name} in ${capitalize(existFlat.apartment.name ? existFlat.apartment.name : '')} as tenant. Tap to initiate action.`,
          });

          return newRequest;
        }
      }

      case 'owner_family': {
        const owner = await this.prisma.flatCurrentClient.findFirst({
          where: {
            flatId: body.flatId,
            type: 'owner',
          },
          include: {
            clientUser: {
              select: {
                devices: true,
              },
            },
          },
        });

        if (!owner) {
          throw new BadRequestException('Owner does not exists in this flat!');
        }

        const newRequest = await this.prisma.apartmentClientUser.create({
          data: {
            type: 'owner_family',
            flatId: body.flatId,
            apartmentId: existFlat.apartmentId,
            clientUserId: user.id,
            residing: body.residing,
            requestType:
              userdatawithflat?._count.flats > 0 ? 'moveIn' : 'addAccount',
            requestFor: 'owner',
            clientRequestLog: {
              create: {
                title: 'Request for approval as an owner family for owner.',
                status: 'pending',
                clientUserId: user.id,
              },
            },
          },
        });

        await this.clientNotification.createRequestNotification({
          type: 'request',
          id: newRequest.id,
          clientUserId: owner.id,
          clickable: true,
          path: ClientAppRouter.DEFAULT,
          title: 'Move in request',
          flatId: newRequest.flatId,
          body: `${capitalize(user.name ? user.name : 'Someone')} has requested to move out from Block ${capitalize(existFlat.floor.block.name)} - ${existFlat.name} in ${capitalize(existFlat.apartment.name ? existFlat.apartment.name : '')} as owner family. Tap to initiate action.`,
        });

        return newRequest;
      }
      case 'tenant_family': {
        const tenant = await this.prisma.flatCurrentClient.findFirst({
          where: {
            flatId: body.flatId,
            type: 'tenant',
          },
          include: {
            clientUser: {
              select: {
                devices: true,
              },
            },
          },
        });

        if (!tenant)
          throw new BadRequestException('Tenant does not exists in this flat!');

        const owner = await this.prisma.flatCurrentClient.findFirst({
          where: {
            flatId: body.flatId,
            type: 'owner',
          },
          include: {
            clientUser: {
              select: {
                devices: true,
              },
            },
          },
        });

        if (!owner) {
          const newRequest = await this.prisma.apartmentClientUser.create({
            data: {
              type: 'tenant_family',
              flatId: body.flatId,
              apartmentId: existFlat.apartmentId,
              clientUserId: user.id,
              residing: body.residing,
              requestType:
                userdatawithflat?._count.flats > 0 ? 'moveIn' : 'addAccount',
              requestFor: 'tenant',
              clientRequestLog: {
                create: {
                  title: 'Request for approval as an tenant family for tenant.',
                  status: 'pending',
                  clientUserId: user.id,
                },
              },
            },
          });

          await this.clientNotification.createRequestNotification({
            type: 'request',
            id: newRequest.id,
            clientUserId: tenant.id,
            clickable: true,
            path: ClientAppRouter.DEFAULT,
            title: 'Move in request',
            flatId: newRequest.flatId,
            body: `${capitalize(user.name ? user.name : 'Someone')} has requested to move out from Block ${capitalize(existFlat.floor.block.name)} - ${existFlat.name} in ${capitalize(existFlat.apartment.name ? existFlat.apartment.name : '')} as tenant family. Tap to initiate action.`,
          });

          return newRequest;
        } else {
          const newRequest = await this.prisma.apartmentClientUser.create({
            data: {
              type: 'tenant_family',
              flatId: body.flatId,
              apartmentId: existFlat.apartmentId,
              clientUserId: user.id,
              residing: body.residing,
              requestType:
                userdatawithflat?._count.flats > 0 ? 'moveIn' : 'addAccount',
              requestFor: 'owner',
              clientRequestLog: {
                create: {
                  title: 'Request for approval as an tenant family for owner.',
                  status: 'pending',
                  clientUserId: user.id,
                },
              },
            },
          });

          await this.clientNotification.createRequestNotification({
            type: 'request',
            id: newRequest.id,
            clientUserId: owner.id,
            path: ClientAppRouter.DEFAULT,
            clickable: true,
            title: 'Move in request',
            flatId: newRequest.flatId,
            body: `${capitalize(user.name ? user.name : 'Someone')} has requested to move in from Block ${capitalize(existFlat.floor.block.name)} - ${existFlat.name} in ${capitalize(existFlat.apartment.name ? existFlat.apartment.name : '')} as tenant family. Tap to initiate action.`,
          });

          return newRequest;
        }
      }

      default:
        throw new BadRequestException('Invalid request type');
    }
  }

  async becomeOwnerCheck(data: FlatClientUserAuth) {
    const user = await this.prisma.clientUser.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.currentState.type !== 'tenant') {
      throw new BadRequestException('Only tenant can become owner');
    }

    const apartmentClientUser = await this.prisma.flatCurrentClient.findFirst({
      where: {
        apartmentId: data.apartmentId,
        clientUserId: data.id,
        flatId: data.flatId,
        type: 'tenant',
      },
    });

    if (!apartmentClientUser) {
      throw new BadRequestException('Tenant not found');
    }

    const alreadyAOwner = await this.prisma.flat.findFirst({
      where: {
        id: data.flatId,
        currentClients: {
          some: {
            type: 'owner',
          },
        },
      },
    });

    if (alreadyAOwner) {
      throw new BadRequestException(
        'An account for an owner already exists. Please create your account as an owner family.',
      );
    }
  }

  async becomeOwnerRequest(data: FlatClientUserAuth) {
    const user = await this.prisma.clientUser.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.currentState.type !== 'tenant') {
      throw new BadRequestException('Only tenant can become owner');
    }

    const apartmentClientUser = await this.prisma.flatCurrentClient.findFirst({
      where: {
        apartmentId: data.apartmentId,
        clientUserId: data.id,
        flatId: data.flatId,
        type: 'tenant',
      },
    });

    if (!apartmentClientUser) {
      throw new BadRequestException('Tenant not found');
    }

    const alreadyAOwner = await this.prisma.flat.findFirst({
      where: {
        id: data.flatId,
        currentClients: {
          some: {
            type: 'owner',
          },
        },
      },
    });

    if (alreadyAOwner) {
      throw new BadRequestException(
        'An account for an owner already exists. Please create your account as an owner family.',
      );
    }

    const alreadyRequest = await this.prisma.apartmentClientUser.findFirst({
      where: {
        clientUserId: data.id,
        flatId: data.flatId,
        status: {
          notIn: ['approved', 'cancelled'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (alreadyRequest) {
      if (alreadyRequest.requestType === 'moveOut') {
        throw new BadRequestException(
          'You have already requested to move out! Cannot request for becoming owner. Please cancel the move out request first.',
        );
      }

      if (alreadyRequest.requestType === 'becomeOwner') {
        throw new BadRequestException('Request already created');
      }
    }

    const newRequest = await this.prisma.apartmentClientUser.create({
      data: {
        type: 'owner',
        requestType: 'becomeOwner',
        flatId: data.flatId,
        apartmentId: data.apartmentId,
        clientUserId: user.id,
        residing: apartmentClientUser.residing,
        offline: false,
      },
    });

    return newRequest;
  }

  async updateRequest({
    body,
    user,
    id,
  }: UnAssignedUserParam.Update<UpdateRequestDto>) {
    const exists = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        clientUserId: user.id,
      },
    });

    if (!exists) {
      throw new BadRequestException('Request does not exist');
    }

    const update = await this.prisma.apartmentClientUser.update({
      where: {
        id: exists.id,
      },
      data: {
        moveIn: body.move_in,
        residing: body.residing,
      },
    });

    return update;
  }

  async resubmit({
    // body,
    id,
    user,
  }: UnAssignedUserParam.Update<UpdateRequestDto>) {
    const exists = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        clientUserId: user.id,
        status: {
          not: 'approved',
        },
        requestType: {
          not: 'moveOut',
        },
      },
      include: {
        clientRequestLog: true,
      },
    });

    if (!exists) {
      throw new BadRequestException('Request does not exist');
    }

    const flat = await this.prisma.flat.findUnique({
      where: {
        id: exists.flatId,
      },
      select: {
        apartment: {
          select: {
            name: true,
          },
        },
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
    });

    if (!flat) throw new NotFoundException('Flat not found');

    let main: FlatCurrentClient | undefined;

    if (exists.requestFor === 'owner') {
      const owner = await this.prisma.flatCurrentClient.findFirst({
        where: {
          flatId: exists.flatId,
          type: 'owner',
        },
      });

      if (!owner) {
        throw new NotFoundException('Owner not found');
      }

      main = owner;
    } else if (exists.requestFor === 'tenant') {
      const tenant = await this.prisma.flatCurrentClient.findFirst({
        where: {
          flatId: exists.flatId,
          type: 'tenant',
        },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }

      main = tenant;
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      await prisma.apartmentClientUser.update({
        where: {
          id: exists.id,
        },
        data: {
          status: 'pending',
          clientRequestLog: {
            create: {
              title: 'Document edited and request again for approval.',
              status: 'pending',
            },
          },
        },
      });
    });

    if (main) {
      if (
        exists.requestType === 'addAccount' ||
        exists.requestType === 'moveIn'
      )
        await this.clientNotification.createRequestNotification({
          type: 'request',
          title: `Move In request resubmitted`,
          body: `${capitalize(user.name ? user.name : 'Someone')} has resubmitted request to move in from Block ${capitalize(flat.floor.block.name)} - ${flat.name} in ${capitalize(flat.apartment.name ? flat.apartment.name : '')} as ${exists.type.split('_').join(' ')}. Tap to initiate action.`,
          clientUserId: main.clientUserId,
          id: exists.id,
          flatId: main.flatId,
          path: ClientAppRouter.MOVE_IN_REQUEST,
        });
    }

    return result;
  }

  async acceptRequest({ id, user }: AssignedUserParam.Update<undefined>) {
    if (
      user.currentState.type !== 'owner' &&
      user.currentState.type !== 'tenant'
    )
      throw new BadRequestException('Only owner or tenant can accept request');

    const currentType = user.currentState.type;

    const request = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        flatId: user.flatId,
        requestFor: user.currentState.type,
        status: {
          not: 'approved',
        },
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

    if (!request) throw new NotFoundException('Request not found');

    if (request.status === 'approved')
      throw new BadRequestException('Request already approved!');

    if (request.type === 'owner')
      throw new BadRequestException(
        'Owner request cannot be accepted by tenant or owner',
      );

    //! When request is for becoming tenant - Start
    if (request.type === 'tenant') {
      const tenant = await this.prisma.flatCurrentClient.findFirst({
        where: {
          flatId: request.flatId,
          type: 'tenant',
        },
      });

      if (tenant) {
        await this.prisma.apartmentClientUser.delete({
          where: {
            id,
          },
        });
        throw new BadRequestException(
          'An account for tenant already exists. Please create your account as an tenant family.',
        );
      }

      const req = await this.prisma.apartmentClientUser.update({
        where: {
          id,
        },
        data: {
          verifiedByOwner: true,
          verifiedByType: 'owner',
          requestFor: 'admin',
          status: 'pending',
          clientRequestLog: {
            create: {
              title: `Request approved by ${currentType}.`,
              status: 'approved',
            },
          },
          verifiedById: user.id,
        },
      });

      await this.clientNotification.createRequestNotification({
        type: 'request',
        title: `Request accepted by ${currentType}`,
        body: `Congratulations! Your request as the ${request.type} for Block ${request.flat.floor.block.name} - ${request.flat.name} in ${capitalize(request.apartment.name ? request.apartment.name : 'Apartment')} has been accepted. Once approved by management, you will be granted access for the designated flat.`,
        clientUserId: request.clientUserId,
        path: ClientAppRouter.DEFAULT,
        id: request.id,
        flatId: request.flatId,
      });

      await this.adminNotification.create({
        type: 'account_creation_request',
        apartmentId: user.apartmentId,
      });

      return req;
    }
    //! When request is for becoming tenant - End

    // ! When request is for becoming owner_family or tenant_family
    const verifiedByType = request.type === 'owner_family' ? 'owner' : 'tenant';

    //! When request is for becoming owner_family or tenant_family - Start
    const result = await this.prisma.$transaction(async (prisma) => {
      // family member approval
      const requestApproveByOwner = await prisma.apartmentClientUser.update({
        where: {
          id,
        },
        data: {
          verifiedByOwner: true,
          verifiedByType,
          requestFor: 'admin',
          status: 'approved',
          clientRequestLog: {
            create: {
              title: `Request approved by ${verifiedByType}.`,
              status: 'approved',
            },
          },
          verifiedById: request.verifiedById ? undefined : user.id,
        },
      });

      await prisma.flatCurrentClient.create({
        data: {
          type: request.type,
          flatId: request.flatId,
          apartmentId: request.apartmentId,
          clientUserId: request.clientUserId,
          hasOwner: currentType === 'owner' ? true : user.currentState.hasOwner,
          residing: request.residing,
          offline: false,
        },
      });

      await prisma.clientUser.update({
        where: {
          id: request.clientUserId,
        },
        data: {
          flats: {
            connect: {
              id: request.flatId,
            },
          },
          gatePass: {
            create: {
              code: generateGatePassId(),
              flatId: request.flatId,
              apartmentId: request.apartmentId,
            },
          },
        },
      });

      return requestApproveByOwner;
    });

    await this.clientNotification.createRequestNotification({
      type: 'request',
      title: `Request accepted by ${currentType}`,
      body: `Congratulations! Your request as the ${request.type} for Block ${request.flat.floor.block.name} - ${request.flat.name} in ${capitalize(request.apartment.name ? request.apartment.name : 'Apartment')} has been accepted.`,
      clientUserId: request.clientUserId,
      path: ClientAppRouter.DEFAULT,
      id: request.id,
      flatId: request.flatId,
    });
    //! When request is for becoming owner_family or tenant_family - End

    return result;
  }

  async declineRequestByOwner({
    id,
    body,
    user,
  }: AssignedUserParam.Update<DeclineRequestDto>) {
    if (
      user.currentState.type !== 'owner' &&
      user.currentState.type !== 'tenant'
    )
      throw new BadRequestException('Only owner or tenant can decline request');

    const currentType = user.currentState.type;

    const valid = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        requestType: {
          in: ['moveIn', 'addAccount'],
        },
        flatId: user.flatId,
        requestFor: currentType,
        status: {
          not: 'approved',
        },
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

    if (!valid) {
      throw new NotFoundException('Request not found');
    }

    const request = await this.prisma.apartmentClientUser.update({
      where: {
        id,
      },
      data: {
        verifiedByOwner: false,
        expired: true,
        messageByOwner: body.message,
        status: 'rejected',
        clientRequestLog: {
          create: {
            title: `Request rejected by ${currentType}.`,
            status: 'rejected',
            message: body.message,
          },
        },
      },
    });

    await this.clientNotification.createRequestNotification({
      type: 'request',
      title: `Request rejected by ${currentType}`,
      body: `Your request as the ${valid.type} for Block ${valid.flat.floor.block.name} - ${valid.flat.name} in ${capitalize(valid.apartment.name ? valid.apartment.name : 'Apartment')} has been rejected.`,
      clientUserId: request.clientUserId,
      id: valid.id,
      path: ClientAppRouter.MOVE_IN_REQUEST,
      flatId: request.flatId,
    });

    return request;
  }

  async deleteSingleImage({
    id,
    extend,
  }: UnAssignedUserParam.Delete<{ imageId: string }>) {
    const request = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
      },
      include: {
        documents: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (!request.documents) {
      throw new NotFoundException('No documents found');
    }

    if (!extend?.imageId) throw new BadRequestException('Image id is required');

    const imageId = extend.imageId;

    const image = request.documents.find((doc) => doc.id === imageId);

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.fileService.delete(image.id);

    return request;
  }

  async cancelRequest({ id, user }: UnAssignedUserParam.Delete) {
    const exists = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        status: {
          not: 'approved',
        },
        clientUserId: user.id,
      },
    });

    if (!exists) {
      throw new NotFoundException('Request not found');
    }

    const update = await this.prisma.apartmentClientUser.update({
      where: {
        id,
      },
      data: {
        status: 'cancelled',
        clientRequestLog: {
          create: {
            title: 'Request cancelled.',
            status: 'cancelled',
            clientUserId: user.id,
          },
        },
      },
    });

    return update;
  }

  async updateRequestDocument({
    id,
    body: { files, documentId },
    user,
  }: UnAssignedUserParam.Update<{
    files?: Array<Express.Multer.File>;
    documentId: string;
  }>) {
    const valid = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        clientUserId: user.id,
      },
      include: {
        documents: true,
        clientUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!valid) {
      throw new NotFoundException('Request not found');
    }

    const documentType = await this.prisma.documentType.findUnique({
      where: {
        id: documentId,
        archive: false,
      },
    });

    if (!documentType) {
      throw new NotFoundException('Document type not found');
    }

    const deletion = await this.prisma.file.findMany({
      where: {
        documentFileClient: {
          clientRequestId: valid.id,
          documentTypeId: documentType.id,
        },
      },
    });

    if (files) {
      await this.fileService.deleteMultiple(deletion);

      await this.prisma.documentFileClient.deleteMany({
        where: {
          clientRequestId: valid.id,
          documentTypeId: documentType.id,
        },
      });

      await Promise.all(
        files.map(async (file, i) => {
          await this.fileService.createRequestClientDocument({
            requestId: id,
            file: {
              ...file,
              originalname: `${documentType.name}_${i + 1}.${file.originalname.split('.').pop()}`,
            },
            clientUserId: user.id,
            documentTypeId: documentType.id,
            apartmentId: valid.apartmentId,
          });
        }),
      );
    }

    return valid;
  }

  async getDocumentRequestAllList({ user, id }: UnAssignedUserParam.Get) {
    const userDetail = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        clientUserId: user.id,
      },
      select: {
        residing: true,
        type: true,
        id: true,
        documents: true,
        apartmentId: true,
      },
    });

    if (!userDetail) throw new NotFoundException('Request not found');

    const data = await this.prisma.documentType.findMany({
      where: {
        archive: false,
        name: {
          not: 'move-out',
        },
        apartmentId: userDetail?.apartmentId,
      },
      select: {
        id: true,
        name: true,
        atSignUp: true,
        updatedAt: true,
        documentFileClient: {
          where: {
            uploadedForId: user.id,
            clientRequestId: userDetail?.id,
          },
          select: {
            id: true,
            url: true,
            name: true,
          },
        },
      },
    });

    const response = data.map((item) => {
      return {
        ...item,
        totalFiles: item.documentFileClient.length,
      };
    });

    return response;
  }

  async getTenantMembers({ user }: AssignedUserParam.GetAll) {
    const tenantWithMembers = await this.prisma.flatCurrentClient.findMany({
      where: {
        flatId: user.flatId,
        type: {
          in: ['tenant', 'tenant_family'],
        },
      },
      select: {
        type: true,
        clientUser: {
          select: {
            id: true,
            name: true,
            email: true,
            contact: true,
            image: {
              select: {
                url: true,
              },
            },
          },
        },
      },
    });

    const members = tenantWithMembers.map((i) => ({
      type: i.type,
      ...i.clientUser,
    }));

    const tenant = members.find((i) => i.type === 'tenant');
    const family = members.filter((i) => i.type === 'tenant_family');

    if (tenant) {
      family.push(tenant);
    }

    return family;
  }

  async removeTenant({ user }: AssignedUserParam.GetAll) {
    if (user.currentState.type !== 'owner')
      throw new BadRequestException('Only owner can remove tenant');

    const tenantWithMembers = await this.prisma.flatCurrentClient.findMany({
      where: {
        flatId: user.flatId,
        type: {
          in: ['tenant', 'tenant_family'],
        },
      },
    });

    const tenant = tenantWithMembers.find((item) => item.type === 'tenant');

    if (!tenant) throw new BadRequestException('Tenant does not exists');

    const moveInReq = await this.prisma.apartmentClientUser.findFirst({
      where: {
        flatId: user.flatId,
        clientUserId: tenant.clientUserId,
        type: 'tenant',
        status: 'approved',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!moveInReq) throw new BadRequestException('Tenant request not found');

    await this.prisma.$transaction(async (prisma) => {
      // moving-out request
      await prisma.apartmentClientUser.createMany({
        data: tenantWithMembers.map((i) => ({
          type: i.type,
          flatId: i.flatId,
          apartmentId: i.apartmentId,
          residing: i.residing,
          offline: i.offline,
          clientUserId: i.clientUserId,
          moveIn: moveInReq.moveIn,
          requestType: 'moveOut',
          verifiedByType: 'owner',
          verifiedById: user.id,
          moveOut: new Date(),
          verifiedByOwner: true,
          status: 'approved',
          requestFor: 'admin',
        })),
      });

      // delete tenant and family members session
      await prisma.flatCurrentClient.deleteMany({
        where: {
          flatId: user.flatId,
          type: {
            in: ['tenant', 'tenant_family'],
          },
        },
      });
    });
  }

  async getCurrentFlatLogs({ id, flatId }: FlatOrUserId) {
    if (!flatId) return [];

    const data = await this.prisma.apartmentClientRequestLog.findMany({
      where: {
        ApartmentClientUser: {
          flatId,
          clientUserId: id,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data;
  }

  async getOtherRequests({ user }: { user: FlatOrUserId }) {
    const data = await this.prisma.apartmentClientUser.findMany({
      where: {
        clientUserId: user.id,
        flatId: {
          not: user.flatId,
        },
        status: {
          not: 'cancelled',
        },
      },
      distinct: ['flatId'],
      include: {
        documents: {
          select: {
            url: true,
            id: true,
            name: true,
            documentType: true,
          },
        },

        clientUser: {
          select: {
            email: true,
            contact: true,
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
                    apartment: {
                      select: {
                        name: true,
                        area: true,
                        city: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data.filter((i) => {
      if (
        i.requestType === 'moveOut' &&
        i.status === 'approved' &&
        i.moveOut &&
        i.moveOut <= new Date()
      )
        return false;

      return true;
    });
  }

  async getRequestLogs({ id }: UnAssignedUserParam.Get) {
    const data = await this.prisma.apartmentClientRequestLog.findMany({
      where: {
        apartmentClientUserId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return data;
  }
}
