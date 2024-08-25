import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryType } from 'src/common/validator/query.validator';
import { FileService } from 'src/global/file/file.service';
import { AssignedUserParam } from '../../common/interfaces';
import { MoveOutRequestDto, MoveOutUpdateRequestDto } from './dtos/moveout.dto';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ClientNotificationService } from 'src/global/notification/client-notification.service';
import { capitalize } from 'lodash';
import ClientAppRouter from 'src/common/routers/client-app.routers';
import { FlatCurrentClient } from '@prisma/client';
import { AdminNotificationService } from 'src/global/notification/admin-notification.service';

@Injectable()
export class MoveOutService {
  constructor(
    private readonly prisma: PrismaTransactionService,
    private readonly fileService: FileService,
    private readonly clientNotification: ClientNotificationService,
    private readonly adminNotification: AdminNotificationService,
  ) {}

  async getAllApartmentRequestOwner({ user }: AssignedUserParam.GetAll) {
    if (user.currentState.type !== 'owner') {
      throw new NotFoundException('You are not owner');
    }

    const data = await this.prisma.apartmentClientUser.findMany({
      where: {
        requestType: 'moveOut',
        verifiedByOwner: false,
        requestFor: 'owner',
        flatId: user.flatId,
        status: 'pending',
        clientUserId: {
          not: user.id,
        },
      },
      include: {
        clientUser: {
          select: {
            name: true,
            id: true,
            email: true,
            contact: true,
          },
        },
        documents: {
          select: {
            id: true,
            url: true,
            name: true,
            _count: true,
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
    });
    return data;
  }

  async getMoveoutWithID({ id, user }: AssignedUserParam.Get) {
    const data = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        clientUserId: user.id,
        flatId: user.flatId,
      },
      include: {
        clientUser: {
          select: {
            name: true,
            id: true,
            email: true,
            contact: true,
          },
        },
        documents: {
          select: {
            id: true,
            url: true,
            name: true,
            _count: true,
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
    });

    if (!data) throw new NotFoundException('Request not found');

    return data;
  }

  async getAllApartmentRequest({ user }: AssignedUserParam.GetAll) {
    const data = await this.prisma.apartmentClientUser.findMany({
      where: {
        clientUserId: user.id,
        requestType: 'moveOut',
        flatId: user.flatId,
      },
      include: {
        documents: {
          select: {
            url: true,
            id: true,
            name: true,
            _count: true,
          },
        },
        apartment: {
          select: {
            name: true,
            area: true,
            city: true,
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
    });
    return data;
  }

  async resubmit({
    id,
    body,
    user,
  }: AssignedUserParam.Update<
    MoveOutUpdateRequestDto & {
      files: Express.Multer.File[];
    }
  >) {
    const apartmentMoveoutDocumentType =
      await this.prisma.documentType.findFirst({
        where: {
          name: 'move-out',
          apartmentId: user.apartmentId,
        },
      });

    const exists = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        clientUserId: user.id,
        flatId: user.flatId,
        requestType: 'moveOut',
      },
      include: {
        clientRequestLog: true,
        documents: {
          select: {
            url: true,
            id: true,
          },
        },
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

    const deletions = await this.prisma.file.findMany({
      where: {
        documentFileClient: {
          clientRequestId: exists.id,
          documentTypeId: apartmentMoveoutDocumentType?.id,
        },
      },
    });

    const fileClients = await this.prisma.documentFileClient.findMany({
      where: {
        clientRequestId: exists.id,
        documentTypeId: apartmentMoveoutDocumentType?.id,
      },
    });

    const transaction = await this.prisma.$transaction(async (prisma) => {
      if (body.files) {
        await Promise.all(
          body.files.map(async (file) => {
            const uploaded = await this.fileService.create({
              file,
              type: 'docs',
              name: `move-out-documents${body.files.findIndex((i) => i === file) + 1}.${file.originalname.split('.').pop()}`,
              documentTypeId: apartmentMoveoutDocumentType?.id,
            });

            if (!uploaded)
              throw new PrismaClientKnownRequestError('File upload failed', {
                clientVersion: '2.24.0',
                code: 'C409',
              });

            await prisma.apartmentClientUser.update({
              where: {
                id,
              },
              data: {
                documents: {
                  connect: {
                    id: uploaded.id,
                  },
                },
              },
            });

            await prisma.documentFileClient.create({
              data: {
                documentTypeId: apartmentMoveoutDocumentType?.id,
                url: uploaded.url,
                clientRequestId: exists.id,
                apartmentId: user.apartmentId,
                uploadedForId: user.id,
                files: {
                  connect: {
                    id: uploaded.id,
                  },
                },
              },
            });
          }),
        );
      }

      //? Cleaning up old files
      if (body.files) {
        await this.fileService.deleteMultiple(deletions);

        await this.prisma.documentFileClient.deleteMany({
          where: {
            id: {
              in: fileClients.map((i) => i.id),
            },
          },
        });
      }

      const update = await prisma.apartmentClientUser.update({
        where: {
          id: exists.id,
        },
        data: {
          moveOut: body.move_out,
          status: 'pending',
          verifiedByOwner: false,
          clientRequestLog: {
            create: {
              title: `Document edited and moveout request again to ${exists.requestFor === 'admin' ? 'management' : 'owner'}.`,
              status: 'pending',
              clientUserId: user.id,
            },
          },
        },
      });

      return update;
    });

    if (main) {
      await this.clientNotification.createRequestNotification({
        type: 'request',
        title: `Move out request resubmitted`,
        body: `${capitalize(user.name ? user.name : 'Someone')} has resubmitted request to move out from Block ${capitalize(flat.floor.block.name)} - ${flat.name} in ${capitalize(flat.apartment.name ? flat.apartment.name : '')} as ${exists.type.split('_').join(' ')}. Tap to initiate action.`,
        clientUserId: main.clientUserId,
        id: exists.id,
        path: ClientAppRouter.MOVE_OUT_REQUEST,
        flatId: main.flatId,
      });
    }

    return transaction;
  }

  async moveout({
    user,
    body,
  }: AssignedUserParam.Create<
    MoveOutRequestDto & { files: Express.Multer.File[] }
  >) {
    const flat = await this.prisma.flat.findUnique({
      where: {
        id: user.currentState.flatId,
      },
      select: {
        name: true,
        apartment: {
          select: {
            name: true,
          },
        },
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

    const apartmentMoveoutDocumentType =
      await this.prisma.documentType.findFirst({
        where: {
          name: 'move-out',
          apartmentId: user.apartmentId,
        },
      });

    if (
      user.currentState.type === 'owner_family' ||
      user.currentState.type === 'tenant_family'
    ) {
      throw new BadRequestException('Invalid moveout request!');
    }

    const alredyMoveOutRequest =
      await this.prisma.apartmentClientUser.findFirst({
        where: {
          flatId: user.flatId,
          clientUserId: user.id,
          status: {
            notIn: ['approved', 'cancelled'],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    if (alredyMoveOutRequest) {
      if (alredyMoveOutRequest.requestType === 'becomeOwner') {
        throw new BadRequestException(
          'You have already requested to become owner! Cannot request for move out.',
        );
      }

      if (
        alredyMoveOutRequest.requestType === 'moveOut' &&
        alredyMoveOutRequest.status === 'pending'
      )
        throw new BadRequestException('Request is already in progress!');
    }

    const transaction = await this.prisma.$transaction(async (prisma) => {
      const request = await prisma.apartmentClientUser.create({
        data: {
          requestType: 'moveOut',
          flatId: user.flatId,
          requestFor:
            user.currentState.type === 'owner'
              ? 'admin'
              : user.currentState.hasOwner
                ? 'owner'
                : 'admin',
          residing: user.currentState.residing,
          offline: user.currentState.offline,
          moveOut: body.move_out,
          apartmentId: user.apartmentId,
          clientUserId: user.id,
          type: user.currentState.type,
          clientRequestLog: {
            create: {
              title: 'Move out request to owner.',
              status: 'pending',
              clientUserId: user.id,
            },
          },
        },
      });

      if (body.files) {
        await Promise.all(
          body.files.map(async (file) => {
            const uploadedFile = await this.fileService.create({
              file,
              type: 'docs',
              name: `move-out-documents${body.files.findIndex((i) => i === file) + 1}.${file.originalname.split('.').pop()}`,
            });

            if (!uploadedFile)
              throw new PrismaClientKnownRequestError('File upload failed', {
                clientVersion: '2.24.0',
                code: 'C409',
              });

            await prisma.apartmentClientUser.update({
              where: {
                id: request.id,
              },
              data: {
                documents: {
                  connect: {
                    id: uploadedFile.id,
                  },
                },
              },
            });

            await prisma.documentFileClient.create({
              data: {
                documentTypeId: apartmentMoveoutDocumentType?.id,
                url: uploadedFile.url,
                clientRequestId: request.id,
                apartmentId: user.apartmentId,
                uploadedForId: user.id,
                files: {
                  connect: {
                    id: uploadedFile.id,
                  },
                },
              },
            });
          }),
        );
      }

      return request;
    });

    if (transaction && transaction.requestFor === 'owner') {
      const main = await this.prisma.flatCurrentClient.findFirst({
        where: {
          type: 'owner',
          flatId: transaction.flatId,
        },
        select: {
          flatId: true,
          clientUser: {
            select: {
              id: true,
              devices: true,
            },
          },
        },
      });

      if (main) {
        await this.clientNotification.createRequestNotification({
          type: 'request',
          id: transaction.id,
          clientUserId: main.clientUser.id,
          path: ClientAppRouter.DEFAULT,
          clickable: true,
          title: 'Move out request',
          flatId: main.flatId,
          body: `Your tenant ${capitalize(user.name)} has requested to move out from Block ${capitalize(flat.floor.block.name)} - ${flat.name} in ${capitalize(flat.apartment.name ? flat.apartment.name : '')}. Tap to initiate action.`,
        });
      }
    } else {
      await this.adminNotification.create({
        type: 'move_out_request',
        apartmentId: transaction.apartmentId,
      });
    }

    return transaction;
  }

  async getmembersMoving({ user }: AssignedUserParam.GetAll) {
    if (
      user.currentState.type === 'owner_family' ||
      user.currentState.type === 'tenant_family'
    ) {
      throw new BadRequestException('Could not perform this action!');
    }

    const values = await this.prisma.flatCurrentClient.findMany({
      where: {
        type:
          user.currentState.type === 'owner'
            ? {
                in: ['owner_family', 'tenant_family', 'tenant'],
              }
            : 'tenant_family',
        flatId: user.flatId,
      },
      select: {
        type: true,
        offline: true,
        residing: true,
        clientUser: {
          select: {
            id: true,
            name: true,
            contact: true,
            image: {
              select: {
                id: true,
                url: true,
              },
            },
            currentFlats: {
              select: {
                flatId: true,
              },
            },
          },
        },
      },
    });

    return values.map((i) => ({
      clientUser: {
        ...i.clientUser,
        type: i.type,
        offline: i.offline,
        residing: i.residing,
      },
    }));
  }

  async cancelRequest({ id, user }: AssignedUserParam.Delete) {
    if (
      user.currentState.type === 'owner_family' ||
      user.currentState.type === 'tenant_family'
    )
      throw new BadRequestException('Could not perform this action!');

    const exists = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        requestType: 'moveOut',
        flatId: user.flatId,
        clientUserId: user.id,
        status: {
          not: 'approved',
        },
      },
    });

    if (!exists) {
      throw new NotFoundException('Request does not exists!');
    }

    const update = await this.prisma.apartmentClientUser.update({
      where: {
        id,
      },
      data: {
        status: 'cancelled',
        clientRequestLog: {
          create: {
            title: 'Request cancelled for moveout.',
            status: 'cancelled',
            clientUserId: user.id,
          },
        },
      },
    });

    return update;
  }

  async deleteSingleImage({
    id,
    body: { requestId },
    user,
  }: AssignedUserParam.Update<{
    requestId: string;
  }>) {
    if (
      user.currentState.type === 'owner_family' ||
      user.currentState.type === 'tenant_family'
    )
      throw new BadRequestException('Could not perform this action!');

    const request = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id: requestId,
        flatId: user.flatId,
        requestType: 'moveOut',
        status: {
          not: 'approved',
        },
        clientUserId: user.id,
      },
      include: {
        documents: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const image = request.documents.find((doc) => doc.id === id);

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    const data = this.fileService.delete(image.id);

    return data;
  }

  /**
   * A function to handle status change requests.
   *
   * @param {string} requestId - The ID of the request.
   * @param {FlatClientUserAuth} user - The user initiating the request.
   * @param {string} [message] - Optional message related to the request.
   * @param {QueryType['requestType']} status - The status of the request.
   * @return {Promise} The updated request after status change.
   */
  async changeStatusRequest({
    id,
    body,
    user,
  }: AssignedUserParam.Update<{
    message?: string;
    status: QueryType['requestType'];
  }>) {
    if (user.currentState.type !== 'owner')
      throw new BadRequestException('Could not perform this action!');

    const request = await this.prisma.apartmentClientUser.findUnique({
      where: {
        id,
        requestType: 'moveOut',
        flatId: user.flatId,
        status: 'pending',
        requestFor: 'owner',
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.type !== 'tenant') {
      throw new BadRequestException('Invalid request type');
    }

    const flat = await this.prisma.flat.findUnique({
      where: {
        id: request.flatId,
      },
      select: {
        name: true,
        apartment: {
          select: {
            name: true,
          },
        },
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

    switch (body.status) {
      case 'accept': {
        const transaction = await this.prisma.$transaction(async (prisma) => {
          const approved = await prisma.apartmentClientUser.update({
            where: {
              id,
            },
            data: {
              status: 'pending',
              verifiedByOwner: true,
              verifiedByType: 'owner',
              clientRequestLog: {
                createMany: {
                  data: [
                    {
                      title: 'Move out request accepted by owner.',
                      status: 'approved',
                    },
                    {
                      title: 'Move out requested to admin.',
                      status: 'pending',
                    },
                  ],
                },
              },
              verifiedById: user.id,
              requestFor: 'admin',
            },
          });

          // const moveout = moment(request.moveOut);
          // const today = moment();

          // if (moveout.isSameOrBefore(today, 'day')) {
          //   const family = await prisma.flatCurrentClient.findMany({
          //     where: {
          //       flatId: user.flatId,
          //       type: 'tenant_family',
          //     },
          //   });

          //   if (family.length > 0) {
          //     await prisma.apartmentClientUser.createMany({
          //       data: family.map((i) => ({
          //         requestType: 'moveOut',
          //         flatId: user.flatId,
          //         requestFor: 'owner',
          //         residing: i.residing,
          //         offline: i.offline,
          //         moveOut: request.moveOut,
          //         apartmentId: user.apartmentId,
          //         clientUserId: i.clientUserId,
          //         type: 'tenant_family',
          //         status: 'approved',
          //         verifiedByOwner: true,
          //         verifiedByType: 'owner',
          //         verifiedById: user.id,
          //       })),
          //     });
          //   }

          //   await prisma.flatCurrentClient.deleteMany({
          //     where: {
          //       flatId: user.flatId,
          //       type: {
          //         in: ['tenant', 'tenant_family'],
          //       },
          //     },
          //   });

          //   await prisma.gatePass.deleteMany({
          //     where: {
          //       flatId: user.flatId,
          //       clientUserId: {
          //         in: [
          //           request.clientUserId,
          //           ...family.map((i) => i.clientUserId),
          //         ],
          //       },
          //     },
          //   });
          // }

          return approved;
        });

        return transaction;
      }
      case 'decline': {
        if (!body.message) {
          throw new BadRequestException('Message is required');
        }

        const rejected = await this.prisma.apartmentClientUser.update({
          where: {
            id,
          },
          data: {
            verifiedByOwner: false,
            message: body.message,
            expired: true,
            status: 'rejected',
            clientRequestLog: {
              create: {
                title: 'Move out request declined by owner.',
                status: 'rejected',
                message: body.message,
              },
            },
          },
        });

        await this.clientNotification.createRequestNotification({
          type: 'request',
          id: id,
          clientUserId: request.clientUserId,
          path: ClientAppRouter.DEFAULT,
          clickable: true,
          title: 'Move out request declined',
          flatId: request.flatId,
          body: `Your move out request for Block ${capitalize(flat.floor.block.name)} - ${capitalize(flat.name)} in ${flat.apartment.name} has been declined by the owner. Tap to view reasons.`,
        });

        return rejected;
      }

      default: {
        throw new BadRequestException('Invalid request type');
      }
    }
  }
}
