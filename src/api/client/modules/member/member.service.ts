import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { AssignedUserParam } from '../../common/interfaces';
import {
  createMemberOnlineDto,
  createMemberOfflineDto,
  updateMemberOfflineDto,
  verifyMemberOnlineDto,
} from './dtos/member.dto';
import {
  generateClientNumberId,
  generateGatePassId,
} from '../../common/utils/uuid.utils';
import { FileService } from 'src/global/file/file.service';
import { OTPService } from 'src/global/otp/otp.service';
import { signUpClientUserDto } from '../auth/dtos/auth.dto';
import { PrismaTransactionService } from 'src/global/prisma/prisma-transaction.service';

@Injectable()
export class MemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly otpService: OTPService,
    private readonly prismaTransaction: PrismaTransactionService,
  ) {}

  async createContactOnline({
    body: { contact },
    user,
  }: AssignedUserParam.Create<signUpClientUserDto>) {
    if (
      user.currentState.type === 'owner_family' ||
      user.currentState.type === 'tenant_family'
    )
      throw new BadRequestException('Only owner and tenant can update member');

    const exist = await this.prisma.clientUser.findFirst({
      where: {
        contact,
        currentFlats: { some: {} },
      },
    });

    if (exist) throw new BadRequestException('User already exist');

    const otp = await this.otpService.createOtp(contact);

    return otp;
  }

  async verifyContactOnline({
    body: { hash, otp, phone },
  }: AssignedUserParam.Create<verifyMemberOnlineDto>) {
    const isValidOtp = await this.otpService.verifyOtp({
      phone,
      otp,
      hash,
    });

    if (!isValidOtp) throw new BadRequestException('Invalid OTP');

    return isValidOtp;
  }

  async createOnlineMember({
    body: { contact, name, email },
    user,
  }: AssignedUserParam.Create<createMemberOnlineDto>) {
    if (
      user.currentState.type === 'owner_family' ||
      user.currentState.type === 'tenant_family'
    )
      throw new BadRequestException('Only owner and tenant can update member');

    const exist = await this.prisma.clientUser.findFirst({
      where: {
        contact,
      },
    });

    if (exist)
      throw new BadRequestException(
        'User is already associated with this contact',
      );

    if (email) {
      const exist = await this.prisma.clientUser.findFirst({
        where: {
          email,
          id: {
            not: user.id,
          },
          emailVerified: true,
        },
      });

      if (exist) throw new BadRequestException('Email already exist');
    }

    const memberType =
      user.currentState.type === 'owner' ? 'owner_family' : 'tenant_family';

    const requestFor =
      user.currentState.type === 'tenant' && user.currentState.hasOwner
        ? 'owner'
        : 'admin';

    const status = requestFor === 'admin' ? 'approved' : 'pending';

    const member = await this.prisma.clientUser.create({
      data: {
        contact,
        name,
        email,
        family: true,
        moveIn: new Date(),
        clientApartments: {
          create: {
            apartmentId: user.apartmentId,
            status,
            type: memberType,
            flatId: user.flatId,
            verifiedByOwner: requestFor === 'admin',
            requestFor,
            requestType: 'addAccount',
            verifiedByType: user.currentState.type,
            verifiedById: user.id,
            moveIn: new Date(),
          },
        },
        currentFlats:
          requestFor === 'admin'
            ? {
                create: {
                  flatId: user.flatId,
                  type: memberType,
                  hasOwner: user.currentState.hasOwner,
                  apartmentId: user.apartmentId,
                  offline: false,
                },
              }
            : undefined,
        flats: {
          connect: {
            id: user.flatId,
          },
        },
        gatePass:
          requestFor === 'admin'
            ? {
                create: {
                  code: generateGatePassId(),
                  flatId: user.flatId,
                  apartmentId: user.apartmentId,
                },
              }
            : undefined,
      },
    });

    return member;
  }

  async createOffline({
    user,
    body,
  }: AssignedUserParam.Create<
    createMemberOfflineDto & { file: Express.Multer.File }
  >) {
    if (
      user.currentState.type === 'owner_family' ||
      user.currentState.type === 'tenant_family'
    )
      throw new BadRequestException('Only owner and tenant can create member');

    const { name, email, contact, file } = body;

    if (contact) {
      const exist = await this.prisma.clientUser.findFirst({
        where: {
          OR: [{ contact }, { contact: `Offline-${contact}` }],
        },
      });

      if (exist) throw new BadRequestException('User already exist');
    }

    if (email) {
      const exist = await this.prisma.clientUser.findFirst({
        where: {
          email,
          id: {
            not: user.id,
          },
          emailVerified: true,
        },
      });

      if (exist) throw new BadRequestException('Email already exist');
    }

    const memberType =
      user.currentState.type === 'owner' ? 'owner_family' : 'tenant_family';

    const requestFor =
      user.currentState.type === 'tenant' && user.currentState.hasOwner
        ? 'owner'
        : 'admin';

    const status = requestFor === 'admin' ? 'approved' : 'pending';

    const member = await this.prisma.clientUser.create({
      data: {
        contact: contact ? `Offline-${contact}` : generateClientNumberId(),
        name,
        email,
        family: true,
        moveIn: new Date(),
        clientApartments: {
          create: {
            apartmentId: user.apartmentId,
            status,
            type: memberType,
            offline: true,
            flatId: user.flatId,
            verifiedByOwner: requestFor === 'admin',
            requestFor,
            requestType: 'addAccount',
            verifiedByType: user.currentState.type,
            verifiedById: user.id,
            moveIn: new Date(),
          },
        },
        currentFlats:
          requestFor === 'admin'
            ? {
                create: {
                  flatId: user.flatId,
                  type: memberType,
                  hasOwner: user.currentState.hasOwner,
                  apartmentId: user.apartmentId,
                  offline: true,
                },
              }
            : undefined,
        flats: {
          connect: {
            id: user.flatId,
          },
        },
        gatePass:
          requestFor === 'admin'
            ? {
                create: {
                  code: generateGatePassId(),
                  flatId: user.flatId,
                  apartmentId: user.apartmentId,
                },
              }
            : undefined,
      },
    });

    if (file) {
      const uploaded = await this.fileService.create({
        file,
        type: 'docs',
      });

      const promise = await this.prisma.clientUser.update({
        where: {
          id: member.id,
        },
        data: {
          image: {
            create: {
              url: uploaded.url,
            },
          },
        },
      });

      return promise;
    }

    const newMember = await this.prisma.clientUser.findUnique({
      where: {
        id: member.id,
      },
      include: {
        image: {
          select: {
            id: true,
            url: true,
            name: true,
          },
        },
      },
    });

    if (!newMember) throw new BadRequestException('Member not created');

    return newMember;
  }

  async updateOffline({
    body,
    id,
    user,
  }: AssignedUserParam.Update<
    updateMemberOfflineDto & { file: Express.Multer.File }
  >) {
    if (
      user.currentState.type === 'owner_family' ||
      user.currentState.type === 'tenant_family'
    )
      throw new BadRequestException('Only owner and tenant can update member');

    const { name, email, contact, file } = body;

    const valid = await this.prisma.clientUser.findUnique({
      where: {
        id,
        currentFlats: {
          some: {
            flatId: user.flatId,
            type:
              user.currentState.type === 'owner'
                ? 'owner_family'
                : 'tenant_family',
            offline: true,
          },
        },
      },
    });

    if (!valid) throw new NotFoundException('Member does not exist');

    if (contact && contact !== valid.contact) {
      const exist = await this.prisma.clientUser.findFirst({
        where: {
          contact,
        },
      });

      if (exist) throw new BadRequestException('Contact is already exist');
    }

    if (email) {
      const exist = await this.prisma.clientUser.findFirst({
        where: {
          email,
          id: {
            not: user.id,
          },
          emailVerified: true,
        },
      });

      if (exist) throw new BadRequestException('Email already exist');
    }

    const member = await this.prisma.clientUser.update({
      where: {
        id,
      },
      data: {
        name,
        contact: contact ? contact : generateClientNumberId(),
        email: email ? email : null,
        family: true,
        moveIn: new Date(),
        offline: true,
      },
    });

    if (file) {
      const uploaded = await this.fileService.create({
        file,
        type: 'docs',
      });

      const promise = await this.prisma.clientUser.update({
        where: {
          id: member.id,
        },
        data: {
          image: {
            create: {
              url: uploaded.url,
            },
          },
        },
      });

      return promise;
    }

    return member;
  }

  async getOnline({ user }: AssignedUserParam.GetAll) {
    const member = await this.prisma.clientUser.findMany({
      where: {
        currentFlats: {
          some: {
            flatId: user.flatId,
            offline: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: {
          select: {
            url: true,
          },
        },
        contact: true,
        email: true,
        currentFlats: {
          where: {
            flatId: user.flatId,
          },
          select: {
            type: true,
            offline: true,
          },
          take: 1,
        },
      },
    });

    return member.map((m) => ({
      ...m,
      type: m.currentFlats[0].type,
      currentFlats: undefined,
      offline: m.currentFlats[0].offline,
    }));
  }

  async getOffline({ user }: AssignedUserParam.GetAll) {
    const member = await this.prisma.clientUser.findMany({
      where: {
        currentFlats: {
          some: {
            flatId: user.flatId,
            offline: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        image: {
          select: {
            url: true,
            name: true,
            id: true,
          },
        },
        contact: true,
        email: true,
        gatePass: {
          where: {
            apartmentId: user.apartmentId,
          },
          select: {
            code: true,
          },
        },
        currentFlats: {
          where: {
            flatId: user.flatId,
          },
          select: {
            type: true,
          },
          take: 1,
        },
      },
    });

    return member.map((m) => ({
      ...m,
      type: m.currentFlats[0].type,
      currentFlats: undefined,
      pass: m.gatePass.length > 0 ? m.gatePass[0].code : '',
    }));
  }

  async getById({ id, user }: AssignedUserParam.Get) {
    const member = await this.prisma.clientUser.findFirst({
      where: {
        id,
        currentFlats: {
          some: {
            flatId: user.flatId,
          },
        },
      },
      select: {
        name: true,
        gatePass: {
          select: {
            code: true,
          },
        },
        image: {
          select: {
            url: true,
          },
        },
        contact: true,
        email: true,
        currentFlats: {
          where: {
            flatId: user.flatId,
          },
          select: {
            type: true,
          },
          take: 1,
        },
      },
    });

    if (!member) throw new NotFoundException('Member doesnot exist');

    // Check if contact starts with "Offline-" followed by 7 characters
    const offlineRegex = /^Offline-\w{7}$/i;
    if (member.contact && offlineRegex.test(member.contact)) {
      member.contact = '';
    } else if (
      member.contact &&
      member.contact.toLowerCase().startsWith('offline-')
    ) {
      // If contact starts with "Offline-" but doesn't match the pattern for 7 characters, remove "Offline-" part
      member.contact = member.contact.substring(8);
    }

    return {
      ...member,
      type: member.currentFlats[0].type,
      currentFlats: undefined,
    };
  }

  async delete({ id, user }: AssignedUserParam.Delete) {
    if (
      user.currentState.type === 'owner_family' ||
      user.currentState.type === 'tenant_family'
    )
      throw new BadRequestException('Only owner and tenant can update member');

    const valid = await this.prisma.clientUser.findFirst({
      where: {
        id,
        currentFlats: {
          some: {
            flatId: user.flatId,
            type: {
              in: ['owner_family', 'tenant_family'],
            },
          },
        },
      },
      include: {
        currentFlats: {
          where: {
            flatId: user.flatId,
          },
        },
      },
    });

    if (!valid) throw new NotFoundException('Member doesnot exist');

    const request = await this.prisma.apartmentClientUser.findFirst({
      where: {
        clientUserId: id,
        apartmentId: user.apartmentId,
        flatId: user.flatId,
        status: 'approved',
        type:
          user.currentState.type === 'owner' ? 'owner_family' : 'tenant_family',
        requestType: {
          in: ['addAccount', 'moveIn'],
        },
      },
      omit: {
        id: true,
      },
    });

    if (!request) throw new NotFoundException('Member doesnot exist');

    const userType = user.currentState.type;

    await this.prismaTransaction.$transaction(async (prisma) => {
      await prisma.apartmentClientUser.create({
        data: {
          ...request,
          requestType: 'moveOut',
          status: 'approved',
          moveOut: new Date(),
          moveIn: request.moveIn,
          verifiedByType: userType,
          verifiedById: user.id,
        },
      });

      await prisma.flatCurrentClient.delete({
        where: {
          id: valid.currentFlats[0]?.id,
        },
      });
    });
  }
}
