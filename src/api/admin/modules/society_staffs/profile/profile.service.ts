import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { UpdateParams } from 'src/api/admin/common/interface';
import { FileService } from 'src/global/file/file.service';
import { updateProfileDto } from './dto/update-profile.dto';
import { AdminUser } from '@prisma/client';
import { updateEmailDto } from './dto/update-email.dto';
import generateVerifyEmailTemplate from 'src/templates/verify-email.template';
import { EnvService } from 'src/global/env/env.service';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/global/mail/mail.service';
import { Panel } from 'src/jwt/jwt.dto';
import { verifyEmailUpdateDto } from './dto/verify-email.dto';
import bcrypt from 'bcryptjs';
import { updatePasswordDto } from 'src/api/superadmin/modules/profile/dto/update-password.dto';
import { timeDifference } from 'src/common/utils/time-difference';

type EmailResetPayload = {
  id: string;
  email: string;
};

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
    private readonly envService: EnvService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async get(data: AdminUser) {
    const { id, apartmentId } = data;

    const profile = await this.prisma.adminUser.exists(apartmentId, {
      where: {
        id,
        NOT: {
          archive: true,
        },
      },
      select: {
        id: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        shift: {
          select: {
            name: true,
            start: true,
            end: true,
          },
        },
        name: true,
        dob: true,
        gender: true,
        contact: true,
        email: true,
        bloodgroup: true,
        image: {
          select: {
            url: true,
          },
        },
        createdAt: true,
      },
    });

    const documents = await this.prisma.documentSetting.findMany({
      where: {
        archive: false,
      },
      select: {
        id: true,
        name: true,
        files: {
          where: {
            uploadedForId: id,
          },
          select: {
            id: true,
            url: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const subscription = await this.prisma.apartment.findFirst({
      where: { id: apartmentId },
      select: {
        subscriptions: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            endAt: true,
            type: true,
            time: true,
            pattern: true,
            expireReason: true,
            history: {
              select: {
                id: true,
                paid: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    const subscriptions = subscription?.subscriptions.map((subscription) => {
      const timeDiff = timeDifference(new Date(), subscription.endAt);
      return { ...subscription, timeDifference: timeDiff };
    });

    if (!profile) throw new NotFoundException('Profile not found');

    return { ...profile, documents, subscriptions };
  }

  async update(data: UpdateParams<updateProfileDto>) {
    const { id, apartmentId, postData } = data;

    const validUser = await this.prisma.adminUser.exists(apartmentId, {
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const user = await this.prisma.adminUser.update({
      where: {
        id,
      },
      data: postData,
      select: {
        id: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        name: true,
        gender: true,
        contact: true,
        email: true,
        dob: true,
        bloodgroup: true,
        image: {
          select: {
            url: true,
          },
        },
      },
    });

    return user;
  }

  async upload(data: UpdateParams<Express.Multer.File>) {
    const { id, apartmentId, postData } = data;

    const validUser = await this.prisma.adminUser.exists(apartmentId, {
      where: {
        id,
      },
      select: {
        image: true,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const file = await this.fileService.createOrUpdate({
      file: postData,
      type: 'image',
      existedFile: validUser.image ? validUser.image : undefined,
    });

    const profile = await this.prisma.adminUser.update({
      where: {
        id,
      },
      data: {
        image: {
          connect: file,
        },
      },
      select: {
        image: {
          select: {
            url: true,
          },
        },
      },
    });

    return profile;
  }

  async updatePassword(data: UpdateParams<updatePasswordDto>) {
    const { id, postData } = data;

    const validUser = await this.prisma.adminUser.findUnique({
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const compare = await bcrypt.compare(postData.password, validUser.password);

    if (compare)
      throw new BadRequestException('Password cannot be same as old password');

    const hashed = await bcrypt.hash(postData.password, 10);

    const user = await this.prisma.adminUser.update({
      where: {
        id,
      },
      data: {
        password: hashed,
        token: [],
      },
    });

    return user;
  }

  async requestEmailUpdate(data: UpdateParams<updateEmailDto>) {
    const { apartmentId, postData, loggedUserData } = data;
    const alreadyExist = await this.prisma.adminUser.exists(apartmentId, {
      where: {
        email: postData.email,
      },
      select: {
        id: true,
      },
    });

    if (alreadyExist) throw new BadRequestException('Email already exists');

    const secret =
      this.envService.get('ADMIN_RESET_SECRET') + loggedUserData.email;

    const token = this.jwt.generateResetToken<EmailResetPayload>(
      {
        id: loggedUserData.id,
        email: postData.email,
      },
      Panel.ADMIN,
      secret,
    );

    const template = generateVerifyEmailTemplate({
      name: loggedUserData.name,
      url: `verify-email-change?token=${token}&id=${loggedUserData.id}`,
    });

    await this.mail.sendMail({
      to: postData.email,
      template,
      type: 'email-verify',
    });
  }

  async verifyEmailUpdateRequest(data: verifyEmailUpdateDto) {
    const { token, id } = data;

    const valid = await this.prisma.adminUser.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new BadRequestException('User does not exists');

    const secret = this.envService.get('ADMIN_RESET_SECRET') + valid.email;

    const payload = this.jwt.decodeResetToken<EmailResetPayload>(
      token,
      Panel.ADMIN,
      secret,
    );

    if (!payload || payload.id !== id)
      throw new BadRequestException('Token expired or Invalid');

    await this.prisma.adminUser.update({
      where: {
        id: payload.id,
      },
      data: {
        email: payload.email,
        token: [],
      },
    });
  }
}
