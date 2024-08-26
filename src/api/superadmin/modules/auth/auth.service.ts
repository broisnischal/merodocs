import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import bcrypt from 'bcryptjs';
import { JwtPayload, Panel, TokenType } from 'src/jwt/jwt.dto';
import { EnvService } from 'src/global/env/env.service';
import { CreateParams } from '../../common/interface';
import { LogoutUserInputDto } from './dtos/logout.dto';
import { loginSuperAdminDto } from './dtos/login.dto';
import { RequestResetUserDto } from 'src/api/admin/modules/auth/dtos/request-reset.dto';
import generatePasswordResetTemplate from 'src/templates/reset-password.template';
import { MailService } from 'src/global/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly envService: EnvService,
    private readonly mailService: MailService,
  ) {}

  async login(data: loginSuperAdminDto) {
    const exist = await this.prisma.superAdmin.findUnique({
      where: {
        email: data.email,
        archive: false,
        role: {
          archive: false,
        },
      },
      include: {
        role: {
          select: {
            permissions: {
              select: {
                name: true,
                access: true,
                children: true,
              },
            },
          },
        },
      },
    });

    if (!exist) throw new NotFoundException('Invalid Credentials');

    const validPassword = await bcrypt.compare(data.password, exist.password);

    if (!validPassword) throw new NotFoundException('Invalid Credentials');

    const payload = { id: exist.id };

    const accessToken = this.jwtService.generateToken(
      payload,
      Panel.SUPERADMIN,
      TokenType.ACCESS,
    );

    const refreshToken = this.jwtService.generateToken(
      payload,
      Panel.SUPERADMIN,
      TokenType.REFRESH,
    );

    const updatedToken = exist.token;
    updatedToken.push(refreshToken);
    const tokenLength = updatedToken.length;

    if (tokenLength > this.envService.get('TOKEN_STORE_LIMIT')) {
      updatedToken.shift();
    }

    await this.prisma.superAdmin.update({
      where: { id: exist.id },
      data: {
        token: updatedToken,
      },
    });

    return {
      accessToken,
      refreshToken,
      permissions: exist.role.permissions,
    };
  }

  async refresh(token: string | undefined) {
    if (!token) throw new BadRequestException('Token not found');

    const payload = this.jwtService.decodeToken(
      token,
      Panel.SUPERADMIN,
      TokenType.REFRESH,
    );

    if (!payload) throw new UnauthorizedException();

    const valid = await this.prisma.superAdmin.findUnique({
      where: {
        id: payload.id,
        NOT: {
          archive: true,
        },
        role: {
          NOT: {
            archive: true,
          },
        },
      },
      include: {
        role: {
          select: {
            permissions: {
              select: {
                name: true,
                access: true,
                children: true,
              },
            },
          },
        },
      },
    });

    if (!valid) throw new UnauthorizedException();

    const authorizedToken = valid.token.find((i) => i === token);

    if (!authorizedToken) throw new UnauthorizedException();

    const accessToken = this.jwtService.generateToken(
      { id: valid.id },
      Panel.SUPERADMIN,
      TokenType.ACCESS,
    );

    return {
      accessToken,
      refreshToken: token,
      permissions: valid.role.permissions,
    };
  }

  async logout(data: CreateParams<LogoutUserInputDto>) {
    const { loggedUserData } = data;

    const { accessToken, refreshToken } = data.postData;

    const payload = this.jwtService.decodeToken<JwtPayload>(
      refreshToken,
      Panel.SUPERADMIN,
      TokenType.REFRESH,
    );

    if (!payload || payload.id !== loggedUserData.id)
      throw new BadRequestException('Invalid Refresh token sent');

    const valid = await this.prisma.superAdmin.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!valid) throw new BadRequestException('Invalid Refresh Token');

    const existToken = valid.token.find((i) => i === refreshToken);

    if (!existToken) throw new BadRequestException('Invalid Refresh Token');

    await this.prisma.superAdmin.update({
      where: {
        id: payload.id,
      },
      data: {
        token: valid.token.filter((i) => i !== refreshToken),
        blockedToken: accessToken,
      },
    });
  }

  async requestResetPassword(data: RequestResetUserDto) {
    const { email } = data;

    const valid = await this.prisma.superAdmin.findUnique({
      where: {
        email,
      },
    });

    if (!valid) throw new NotFoundException('User does not exists');

    const token = this.jwtService.generateResetToken(
      {
        id: valid.id,
        email: valid.email,
      },
      Panel.SUPERADMIN,
      valid.password,
    );

    const template = generatePasswordResetTemplate({
      name: valid.name,
      main_url: this.envService.get('CLIENT_SUPERADMIN_PANEL_URL'),
      url: `reset-password/${valid.id}?token=${token}`,
    });

    await this.mailService.sendMail({
      to: valid.email,
      template,
      type: 'password-reset',
    });
  }

  async verifyResetPasswordToken({ token, id }: { token: string; id: string }) {
    const valid = await this.prisma.superAdmin.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('User does not exists');

    const verified = this.jwtService.decodeResetToken<{
      id: string;
      email: string;
    }>(token, Panel.SUPERADMIN, valid.password);

    if (!verified) throw new BadRequestException('Invalid Token');

    if (verified.email !== valid.email || valid.id !== verified.id)
      throw new BadRequestException('Invalid Token');
  }

  async resetPassword({
    token,
    password,
    id,
  }: {
    token: string;
    password: string;
    id: string;
  }) {
    const valid = await this.prisma.superAdmin.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('User does not exists');

    const verified = this.jwtService.decodeResetToken<{
      id: string;
      email: string;
    }>(token, Panel.SUPERADMIN, valid.password);

    if (!verified) throw new BadRequestException('Invalid Token');

    if (verified.email !== valid.email || valid.id !== verified.id)
      throw new BadRequestException('Invalid Token');

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.superAdmin.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });
  }
}
