import { loginAdminUserDto } from './dtos/login.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { JwtService } from 'src/jwt/jwt.service';
import { JwtPayload, Panel, TokenType } from 'src/jwt/jwt.dto';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { CreateParams } from '../../common/interface';
import { logoutAdminUserInputDto } from './dtos/logout.dto';
import generatePasswordResetTemplate from 'src/templates/reset-password.template';
import { EnvService } from 'src/global/env/env.service';
import { MailService } from 'src/global/mail/mail.service';
import { RequestResetUserDto } from './dtos/request-reset.dto';

@Injectable()
export class AuthService {
  private readonly loginLimit = 5;
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly envService: EnvService,
    private readonly mailService: MailService,
  ) {}

  async login(data: loginAdminUserDto) {
    const userExist = await this.prisma.adminUser.findUnique({
      where: {
        email: data.email,
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
          include: {
            permissions: {
              select: {
                name: true,
                access: true,
              },
            },
          },
        },
        apartment: {
          select: {
            color: {
              select: {
                name: true,
              },
            },
            createdAt: true,
          },
        },
      },
    });

    if (!userExist) throw new NotFoundException('Invalid Credentials');

    const passwordComparision = await bcrypt.compare(
      data.password,
      userExist.password,
    );

    if (!passwordComparision)
      throw new NotFoundException('Invalid Credentials');

    const payload = { id: userExist.id };

    const accessToken = this.jwtService.generateToken(
      payload,
      Panel.ADMIN,
      TokenType.ACCESS,
    );

    const refreshToken = this.jwtService.generateToken(
      payload,
      Panel.ADMIN,
      TokenType.REFRESH,
    );

    let updatedToken = userExist.token;

    updatedToken.push(refreshToken);
    const tokenLength = updatedToken.length;

    if (tokenLength > this.loginLimit) {
      updatedToken = updatedToken.slice(tokenLength - this.loginLimit);
    }

    await this.prisma.adminUser.update({
      where: {
        id: userExist.id,
      },
      data: {
        token: updatedToken,
        hasLoggedIn: true,
      },
    });

    await this.prisma.apartment.update({
      where: {
        id: userExist.apartmentId,
      },
      data: {
        lastUsed: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken,
      role: userExist.role.name,
      permissions: userExist.role.permissions,
      firstLoggedIn: userExist.firstLoggedIn,
      color: userExist.apartment.color,
      createdAt: userExist.apartment.createdAt,
    };
  }

  async refresh(token: string | undefined) {
    if (!token) throw new BadRequestException('Token not found');

    const payload = this.jwtService.decodeToken(
      token,
      Panel.ADMIN,
      TokenType.REFRESH,
    );

    if (!payload) throw new UnauthorizedException();

    const valid = await this.prisma.adminUser.findUnique({
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
        role: true,
      },
    });

    if (!valid) throw new UnauthorizedException();

    const authorizedToken = valid.token.find((i) => i === token);

    if (!authorizedToken) throw new UnauthorizedException();

    const accessToken = this.jwtService.generateToken(
      { id: valid.id },
      Panel.ADMIN,
      TokenType.ACCESS,
    );

    await this.prisma.apartment.update({
      where: {
        id: valid.apartmentId,
      },
      data: {
        lastUsed: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken: token,
      role: valid.role.name,
    };
  }

  async logout(data: CreateParams<logoutAdminUserInputDto>) {
    const { loggedUserData } = data;

    const { accessToken, refreshToken } = data.postData;

    const payload = this.jwtService.decodeToken<JwtPayload>(
      refreshToken,
      Panel.ADMIN,
      TokenType.REFRESH,
    );

    if (!payload || payload.id !== loggedUserData.id)
      throw new BadRequestException('Invalid Refresh token sent');

    const valid = await this.prisma.adminUser.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!valid) throw new BadRequestException('Invalid Refresh Token');

    const existToken = valid.token.find((i) => i === refreshToken);

    if (!existToken) throw new BadRequestException('Invalid Refresh Token');

    await this.prisma.adminUser.update({
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

    const valid = await this.prisma.adminUser.findUnique({
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
      Panel.ADMIN,
      valid.password,
    );

    const template = generatePasswordResetTemplate({
      name: valid.name,
      main_url: this.envService.get('CLIENT_ADMIN_PANEL_URL'),
      url: `reset-password/${valid.id}?token=${token}`,
    });

    await this.mailService.sendMail({
      to: valid.email,
      template,
      type: 'password-reset',
    });
  }

  async verifyResetPasswordToken({ token, id }: { token: string; id: string }) {
    const valid = await this.prisma.adminUser.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('User does not exists');

    const verified = this.jwtService.decodeResetToken<{
      id: string;
      email: string;
    }>(token, Panel.ADMIN, valid.password);

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
    const valid = await this.prisma.adminUser.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('User does not exists');

    const verified = this.jwtService.decodeResetToken<{
      id: string;
      email: string;
    }>(token, Panel.ADMIN, valid.password);

    if (!verified) throw new BadRequestException('Invalid Token');

    if (verified.email !== valid.email || valid.id !== verified.id)
      throw new BadRequestException('Invalid Token');

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.adminUser.update({
      where: {
        id,
      },
      data: {
        password: hashedPassword,
      },
    });
  }
}
