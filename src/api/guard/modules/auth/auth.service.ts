import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { JwtService } from 'src/jwt/jwt.service';
import { loginGuardUserDto } from './dtos/login.dto';
import { JwtPayload, Panel, TokenType } from 'src/jwt/jwt.dto';
import { EnvService } from 'src/global/env/env.service';
import { decrypt } from 'src/common/utils/crypto';
import { logoutAdminUserInputDto } from 'src/api/admin/modules/auth/dtos/logout.dto';
import { CreateParams } from '../../common/interface';
import { AttendanceService } from 'src/global/attendance/attendance.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly envService: EnvService,
    private readonly attendance: AttendanceService,
  ) {}

  async login(data: loginGuardUserDto) {
    const { username, passcode, deviceId, fcmToken, deviceType } = data;

    const userExist = await this.prisma.guardUser.findUnique({
      where: {
        username,
        NOT: {
          archive: true,
        },
      },
      include: {
        attendance: {
          where: {
            date: this.attendance.createAttendanceDetails().date,
          },
          select: {
            events: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: {
                clockedInTime: true,
                clockedOutTime: true,
                clockedOut: true,
              },
            },
          },
        },
      },
    });

    if (!userExist) throw new NotFoundException('Invalid Credentials');

    const validPassCode = decrypt(userExist.passcode);

    if (passcode !== validPassCode)
      throw new NotFoundException('Invalid Credentials');

    const payload = { id: userExist.id };

    const accessToken = this.jwtService.generateToken(
      payload,
      Panel.GUARD,
      TokenType.ACCESS,
    );

    const refreshToken = this.jwtService.generateToken(
      payload,
      Panel.GUARD,
      TokenType.REFRESH,
    );

    const updatedToken = userExist.token;

    updatedToken.push(refreshToken);
    const tokenLength = updatedToken.length;

    if (tokenLength > this.envService.get('TOKEN_STORE_LIMIT')) {
      updatedToken.shift();
    }

    const existingDevice = await this.prisma.userDevices.findFirst({
      where: {
        guardUserId: userExist.id,
        deviceId,
      },
    });

    if (existingDevice) {
      await this.prisma.guardUser.update({
        where: {
          id: userExist.id,
        },
        data: {
          token: updatedToken,
          defaultSurveillanceId: userExist.surveillanceId,
          devices: {
            update: {
              where: {
                id: existingDevice.id,
              },
              data: {
                fcmToken,
              },
            },
          },
        },
        include: {
          devices: true,
        },
      });
    } else {
      await this.prisma.guardUser.update({
        where: {
          id: userExist.id,
        },
        data: {
          token: updatedToken,
          defaultSurveillanceId: userExist.surveillanceId,
          devices: {
            create: {
              deviceId,
              fcmToken,
              deviceType,
            },
          },
        },
        include: {
          devices: true,
        },
      });
    }

    await this.prisma.guardUser.update({
      where: {
        id: userExist.id,
      },
      data: {
        token: updatedToken,
        defaultSurveillanceId: userExist.surveillanceId,
      },
    });

    return {
      id: userExist.id,
      clockedOut: userExist.attendance[0]?.events[0]?.clockedOut || false,
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string | undefined) {
    if (!token) throw new BadRequestException('Token not found');

    const payload = this.jwtService.decodeToken(
      token,
      Panel.GUARD,
      TokenType.REFRESH,
    );

    if (!payload) throw new UnauthorizedException();

    const valid = await this.prisma.guardUser.findUnique({
      where: {
        id: payload.id,
        NOT: {
          archive: true,
        },
      },
    });

    if (!valid) throw new UnauthorizedException('Unauthorized');

    const authorizedToken = valid.token.find((i) => i === token);

    if (!authorizedToken) throw new UnauthorizedException('Unauthorized');

    const accessToken = this.jwtService.generateToken(
      { id: valid.id },
      Panel.GUARD,
      TokenType.ACCESS,
    );

    return {
      accessToken,
      refreshToken: token,
    };
  }
  async logout(data: CreateParams<logoutAdminUserInputDto>) {
    const { loggedUserData } = data;

    const { accessToken, refreshToken, deviceId } = data.postData;

    const payload = this.jwtService.decodeToken<JwtPayload>(
      refreshToken,
      Panel.GUARD,
      TokenType.REFRESH,
    );

    if (!payload || payload.id !== loggedUserData.id) {
      return;
    }

    const valid = await this.prisma.guardUser.findUnique({
      where: {
        id: payload.id,
      },
      include: {
        devices: true,
      },
    });
    if (!valid) {
      return;
    }

    const existToken = valid.token.find((i) => i === refreshToken);

    if (!existToken) {
      return;
    }

    await this.prisma.userDevices.deleteMany({
      where: {
        guardUserId: payload.id,
        deviceId,
      },
    });

    await this.prisma.guardUser.update({
      where: {
        id: payload.id,
      },
      data: {
        token: valid.token.filter((i) => i !== refreshToken),
        blockedToken: accessToken,
      },
    });
  }
}
