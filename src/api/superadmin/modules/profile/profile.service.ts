import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { UpdateParams } from 'src/api/superadmin/common/interface';
import { FileService } from 'src/global/file/file.service';
import { updateProfileDto } from './dto/update-profile.dto';
import { EnvService } from 'src/global/env/env.service';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/global/mail/mail.service';
import { SuperAdmin } from '@prisma/client';
import { updatePasswordDto } from './dto/update-password.dto';
import bcrypt from 'bcryptjs';
import { updateEmailDto } from './dto/update-email.dto';
import generateVerifyEmailTemplate from 'src/templates/verify-email.template';
import { Panel } from 'src/jwt/jwt.dto';
import { verifyEmailUpdateDto } from './dto/verify-email.dto';

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

  async get(data: SuperAdmin) {
    const { id } = data;

    const profile = await this.prisma.superAdmin.findUnique({
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
        name: true,
        dob: true,
        gender: true,
        contact: true,
        email: true,
        image: {
          select: {
            url: true,
          },
        },
        createdAt: true,
      },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    return profile;
  }

  async update(data: UpdateParams<updateProfileDto>) {
    const { id, postData } = data;

    const validUser = await this.prisma.superAdmin.findUnique({
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const user = await this.prisma.superAdmin.update({
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
    const { id, postData } = data;

    const validUser = await this.prisma.superAdmin.findUnique({
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

    const profile = await this.prisma.superAdmin.update({
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

    const validUser = await this.prisma.superAdmin.findUnique({
      where: {
        id,
      },
    });

    if (!validUser) throw new NotFoundException('User does not exists');

    const compare = await bcrypt.compare(postData.password, validUser.password);

    if (compare)
      throw new BadRequestException('Password cannot be same as old password');

    const hashed = await bcrypt.hash(postData.password, 10);

    const user = await this.prisma.superAdmin.update({
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
    const { postData, loggedUserData } = data;
    const alreadyExist = await this.prisma.superAdmin.findUnique({
      where: {
        email: postData.email,
      },
      select: {
        id: true,
      },
    });

    if (alreadyExist) throw new BadRequestException('Email already exists');

    const secret =
      this.envService.get('SUPERADMIN_RESET_SECRET') + loggedUserData.email;

    const token = this.jwt.generateResetToken<EmailResetPayload>(
      {
        id: loggedUserData.id,
        email: postData.email,
      },
      Panel.SUPERADMIN,
      secret,
    );

    const template = generateVerifyEmailTemplate({
      name: loggedUserData.name,
      url: `verify-email-change?token=${token}&id=${loggedUserData.id}`,
      main_url: this.envService.get('CLIENT_SUPERADMIN_PANEL_URL'),
    });

    await this.mail.sendMail({
      to: postData.email,
      template,
      type: 'email-verify',
    });
  }

  async verifyEmailUpdateRequest(data: verifyEmailUpdateDto) {
    const { token, id } = data;

    const valid = await this.prisma.superAdmin.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new BadRequestException('User does not exists');

    const secret = this.envService.get('SUPERADMIN_RESET_SECRET') + valid.email;

    const payload = this.jwt.decodeResetToken<EmailResetPayload>(
      token,
      Panel.SUPERADMIN,
      secret,
    );

    if (!payload || payload.id !== id)
      throw new BadRequestException('Token expired or Invalid');

    await this.prisma.superAdmin.update({
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
