import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AdminUser } from '@prisma/client';
import { FileService } from 'src/global/file/file.service';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';
import {
  CreateOfflineUserDto,
  UpdateClientUserDto,
} from './dto/create-user.dto';
import generateVerifyEmailUsingOtpTemplate from 'src/templates/client/verify-email.template';
import { MailService } from 'src/global/mail/mail.service';
import { generateRandomCode } from 'src/common/utils/code';
import { JwtService } from 'src/jwt/jwt.service';
import { Panel } from 'src/jwt/jwt.dto';
import { requestEmailChangeDto } from './dto/change-email.dto';
import {
  AssignedUserParam,
  UnAssignedUserParam,
} from '../../common/interfaces';
import { generateGatePassId } from '../../common/utils/uuid.utils';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaTransactionService,
    private readonly fileService: FileService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async getUser(user: FlatOrUserId) {
    const res = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
      },
      omit: {
        token: true,
        archive: true,
        verifyCode: true,
        newContact: true,
        newEmail: true,
      },
      include: {
        currentFlats: {
          where: {
            flatId: user.flatId || '',
          },
          select: {
            type: true,
            residing: true,
            offline: true,
          },
          take: 1,
        },
        image: {
          select: {
            id: true,
            url: true,
          },
        },
        _count: {
          select: {
            currentFlats: true,
          },
        },
        gatePass: {
          where: {
            flatId: user.flatId || '',
            apartmentId: user.apartmentId || '',
          },
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

    if (!res) throw new NotFoundException('User does not exists');

    const requests = await this.prisma.apartmentClientUser.findMany({
      where: {
        clientUserId: user.id,
      },
      distinct: ['flatId'],
      select: {
        id: true,
      },
    });

    if (res.currentFlats.length === 1) {
      return {
        ...res,
        type: res.currentFlats[0]?.type,
        residing: res.currentFlats[0]?.residing,
        code: res.gatePass.length === 1 ? res.gatePass[0]?.code : null,
        otherFlatCounts: requests.length - 1,
      };
    }

    return {
      ...res,
      type: null,
      residing: null,
      otherFlatCounts: requests.length - 1,
    };
  }

  async generatePassCode({ user }: AssignedUserParam.GetAll) {
    const exist = await this.prisma.gatePass.findFirst({
      where: {
        flatId: user.flatId,
        apartmentId: user.apartmentId,
        clientUserId: user.id,
      },
    });

    if (exist) return exist;

    await this.prisma.gatePass.create({
      data: {
        code: generateGatePassId(),
        clientUserId: user.id,
        flatId: user.flatId,
        apartmentId: user.apartmentId,
      },
    });
  }

  async getCurrentFlatDetails({ user }: AssignedUserParam.GetAll) {
    const res = await this.prisma.flat.findUnique({
      where: {
        id: user.flatId,
      },
      select: {
        name: true,
        id: true,
        floor: {
          select: {
            id: true,
            name: true,
            block: {
              select: {
                id: true,

                name: true,
                apartment: {
                  select: {
                    id: true,

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
    });

    if (!res) throw new NotFoundException('User does not exists');

    return res;
  }

  async getCurrentFlatDetailsWithStatus({ user }: AssignedUserParam.GetAll) {
    const res = await this.prisma.flat.findUnique({
      where: {
        id: user.flatId,
      },
      select: {
        name: true,
        id: true,
        floor: {
          select: {
            id: true,
            name: true,
            block: {
              select: {
                id: true,
                name: true,
                apartment: {
                  select: {
                    id: true,
                    name: true,
                    area: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!res) throw new NotFoundException('User does not exists');
    const request = await this.prisma.apartmentClientUser.findFirst({
      where: {
        clientUserId: user.id,
        apartmentId: res.floor.block.apartment.id,
        flatId: user.flatId,
        status: {
          not: 'cancelled',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const moveInRequest = await this.prisma.apartmentClientUser.findFirst({
      where: {
        clientUserId: user.id,
        apartmentId: res.floor.block.apartment.id,
        flatId: user.flatId,
        status: 'approved',
        requestType: {
          in: ['moveIn', 'addAccount'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      ...res,
      userRequest: {
        id:
          request?.requestType === 'moveOut' ? moveInRequest?.id : request?.id,
        ...user.currentState,
      },
      isMoveOut: request?.requestType === 'moveOut' ? true : false,
      moveoutRequest: request?.requestType === 'moveOut' ? request : null,
      isBecomeOwner: request?.requestType === 'becomeOwner' ? true : false,
      becomeOwnerRequest:
        request?.requestType === 'becomeOwner' ? request : null,
    };
  }

  async getOtherFlats(user: FlatOrUserId) {
    const response = await this.prisma.apartmentClientUser.findMany({
      where: {
        clientUserId: user.id,
        flatId: {
          not: user.flatId,
        },
      },
      distinct: ['flatId'],
      select: {
        requestType: true,
        id: true,
        flat: {
          select: {
            name: true,
            id: true,
            floor: {
              select: {
                id: true,
                name: true,
                block: {
                  select: {
                    id: true,
                    name: true,
                    apartment: {
                      select: {
                        id: true,
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
        apartmentId: true,
        type: true,
        expired: true,
        status: true,
        residing: true,
        moveOut: true,
        movedOutOrNot: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return response;
  }

  async getSettings(user: FlatClientUserAuth) {
    const result = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
      },
      include: {
        image: {
          select: {
            id: true,
            url: true,
          },
        },
      },
      omit: {
        token: true,
        archive: true,
        offline: true,
      },
    });

    if (!result) throw new NotFoundException('User does not exists');

    const currentFlat = await this.prisma.flat.findUnique({
      where: {
        id: user.flatId,
      },
      select: {
        name: true,
        id: true,
        floor: {
          select: {
            id: true,
            name: true,
            block: {
              select: {
                id: true,
                name: true,
                apartment: {
                  select: {
                    id: true,
                    name: true,
                    area: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const userTotalFlat = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
      },
      select: {
        _count: { select: { currentFlats: true } },
      },
    });

    return {
      ...result,
      currentFlat,
      _count: {
        flats: userTotalFlat?._count.currentFlats || 0,
      },
    };
  }

  async updateUser({
    body,
    user,
    extend,
  }: UnAssignedUserParam.Create<
    UpdateClientUserDto,
    {
      file: Express.Multer.File;
    }
  >) {
    const { email, ...rest } = body;

    const exists = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!exists) throw new NotFoundException('User does not exists');

    if (email) {
      const checkEmail = await this.prisma.clientUser.findFirst({
        where: {
          email,
        },
      });

      if (checkEmail && checkEmail.id !== user.id && checkEmail.emailVerified)
        throw new BadRequestException('Email already exists');
    }

    const updatedUser = await this.prisma.clientUser.update({
      where: {
        id: user.id,
      },
      data: {
        ...rest,
        email,
      },
      omit: {
        token: true,
        archive: true,
        offline: true,
      },
    });

    if (extend?.file) {
      const image = await this.fileService.create({
        file: extend.file,
        type: 'image',
      });

      await this.prisma.clientUser.update({
        where: {
          id: user.id,
        },
        data: {
          image: {
            connect: {
              id: image.id,
            },
          },
        },
      });
    }

    return updatedUser;
  }

  async getStatus({ user }: { user: FlatOrUserId }) {
    const flat = await this.prisma.flat.findUnique({
      where: {
        id: user.flatId,
        archive: false,
        apartmentClientUsers: {
          some: {
            apartmentId: user.apartmentId,
            clientUserId: user.id,
            status: 'approved',
          },
        },
      },
    });

    if (!flat) new NotFoundException('Flat not found');
  }

  async changeToNonResidingOwner({ user }: AssignedUserParam.GetAll) {
    if (user.currentState.type !== 'owner')
      throw new BadRequestException('Only owner can change to non residing');

    if (user.currentState.residing === false)
      throw new BadRequestException('User is already a non residing owner');

    const flatCurrentClient = await this.prisma.flatCurrentClient.findFirst({
      where: {
        clientUserId: user.id,
        flatId: user.flatId,
      },
    });

    if (!flatCurrentClient) throw new NotFoundException('User not found');

    const res = await this.prisma.apartmentClientUser.findFirst({
      where: {
        clientUserId: user.id,
        flatId: user.flatId,
        status: 'approved',
        residing: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!res) throw new NotFoundException('User does not exists');

    await this.prisma.$transaction(async (prisma) => {
      await prisma.apartmentClientUser.update({
        where: {
          id: res.id,
        },
        data: {
          residing: false,
        },
      });

      await prisma.flatCurrentClient.update({
        where: {
          id: flatCurrentClient.id,
        },
        data: {
          residing: false,
        },
      });
    });
  }

  async createOfflineUser({
    loggedUserData,
    body,
    file,
  }: {
    loggedUserData: AdminUser;
    body: CreateOfflineUserDto;
    file: MainFile;
  }) {
    const uploadedFile = await this.fileService.create({
      file: file,
      type: 'image',
    });

    const apartment = await this.prisma.apartment.findFirst({
      where: {
        blocks: {
          some: {
            floors: {
              some: {
                flats: {
                  some: {
                    id: body.flatId,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!apartment) throw new NotFoundException('Apartment/flat not found');

    if (body.email) {
      const exist = await this.prisma.clientUser.findFirst({
        where: {
          email: body.email,
          emailVerified: true,
        },
      });

      if (exist) throw new BadRequestException('Email already exist');
    }

    const user = this.prisma.$transaction(async (prisma) => {
      const user = await prisma.clientUser.create({
        data: {
          contact: body.contact,
          name: body.name,
          email: body.email,
          offline: true,
          image: {
            connect: {
              id: uploadedFile.id,
            },
          },
        },
      });

      await prisma.apartmentClientUser.create({
        data: {
          type: body.type,
          flatId: body.flatId,
          apartmentId: apartment.id,
          clientUserId: user.id,
          requestType: 'addAccount',
          verifiedByOwner: true,
          status: 'approved',
          moveIn: body.move_in,
          verifiedById: loggedUserData.id,
          offline: true,
          residing: true,
        },
      });

      await prisma.flatCurrentClient.create({
        data: {
          type: body.type,
          flatId: body.flatId,
          apartmentId: apartment.id,
          clientUserId: user.id,
          residing: true,
          offline: true,
        },
      });

      return user;
    });

    return user;
  }

  async requestVerifyEmail({ user }: UnAssignedUserParam.GetAll) {
    const exist = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!exist) throw new NotFoundException('User not found');

    if (!exist.email) throw new BadRequestException('Email not found');

    if (exist.emailVerified)
      throw new BadRequestException('Email already verified');

    const code = generateRandomCode(6);

    const verifyCode = this.jwtService.generateResetToken(
      { code },
      Panel.USER,
      '',
    );

    await this.prisma.clientUser.update({
      where: {
        id: user.id,
      },
      data: {
        verifyCode,
      },
    });

    const template = generateVerifyEmailUsingOtpTemplate({
      code,
    });

    await this.mailService.sendMail({
      template,
      to: exist.email,
      type: 'email-verify',
    });
  }

  async verifyEmail({
    user,
    body,
  }: UnAssignedUserParam.Create<{ code: string }>) {
    const exist = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!exist) throw new NotFoundException('User not found');

    if (!exist.verifyCode)
      throw new BadRequestException('No Verification token found');

    const decode = await this.jwtService.decodeResetToken(
      exist.verifyCode,
      Panel.USER,
      '',
    );

    if (decode.code !== body.code)
      throw new BadRequestException('Invalid code');

    await this.prisma.clientUser.update({
      where: {
        id: user.id,
      },
      data: {
        verifyCode: null,
        emailVerified: true,
      },
    });
  }

  async requestEmailChange({
    user,
    body,
  }: UnAssignedUserParam.Create<requestEmailChangeDto>) {
    const exist = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!exist) throw new NotFoundException('User not found');

    if (exist.email === body.email && exist.emailVerified)
      throw new ConflictException('Email already verified');

    const alreadyExist = await this.prisma.clientUser.findFirst({
      where: {
        email: body.email,
        id: {
          not: user.id,
        },
      },
    });

    if (alreadyExist) {
      throw new BadRequestException('Email already exist');
    }
    const code = generateRandomCode(6);

    const verifyCode = this.jwtService.generateResetToken(
      { code },
      Panel.USER,
      exist?.email ? exist.email : '',
    );

    await this.prisma.clientUser.update({
      where: {
        id: user.id,
      },
      data: {
        verifyCode,
        newEmail: body.email,
      },
    });

    const template = generateVerifyEmailUsingOtpTemplate({
      code,
    });

    await this.mailService.sendMail({
      template,
      to: body.email,
      type: 'email-verify',
    });
  }

  async verifyChangeEmail({
    user,
    body,
  }: UnAssignedUserParam.Create<{ code: string }>) {
    const exist = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
      },
    });

    if (!exist) throw new NotFoundException('User not found');

    if (!exist.verifyCode)
      throw new BadRequestException('No Verification token found');

    const decode = await this.jwtService.decodeResetToken(
      exist.verifyCode,
      Panel.USER,
      user?.email ? user.email : '',
    );

    if (decode.code !== body.code)
      throw new BadRequestException('Invalid code');

    if (!exist.newEmail) throw new BadRequestException('No new email found');

    const alreadyExist = await this.prisma.clientUser.findFirst({
      where: {
        email: exist.newEmail,
        id: {
          not: user.id,
        },
      },
    });

    if (alreadyExist) throw new ConflictException('Email already exist');

    await this.prisma.clientUser.update({
      where: {
        id: user.id,
      },
      data: {
        email: exist.newEmail,
        newEmail: null,
        emailVerified: true,
      },
    });
  }
}
