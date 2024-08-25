import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { OTPVerifyDto } from './dto/otp.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { Panel, TokenType } from 'src/jwt/jwt.dto';
import { EnvService } from 'src/global/env/env.service';
import { OTPService } from 'src/global/otp/otp.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
    private readonly otpService: OTPService,
  ) {}

  async verifyOtp({ data }: { data: OTPVerifyDto }) {
    const { hash, otp, phone, deviceId, fcmToken, deviceType } = data;

    const result = await this.otpService.verifyOtp({
      hash,
      otp,
      phone,
    });

    if (!result) {
      throw new NotFoundException('Invalid OTP');
    }

    const user = await this.prisma.clientUser.upsert({
      where: {
        contact: phone,
      },
      create: {
        contact: phone,
      },
      update: {
        contact: phone,
      },
      include: {
        apartments: true,
        currentFlats: {
          select: {
            flatId: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const flats = user.currentFlats;

    const defaultFlat = flats.length > 0 ? flats[0].flatId : null;

    const apartmentIdOfFlat = defaultFlat
      ? await this.prisma.flat.findFirst({
          where: { id: defaultFlat, archive: false },
          select: {
            floor: {
              select: {
                block: { select: { apartment: { select: { id: true } } } },
              },
            },
          },
        })
      : null;

    const payload = {
      id: user.id,
      currentApartment: apartmentIdOfFlat?.floor.block.apartment.id || null,
      currentFlat: defaultFlat || null,
    };

    const accessToken = this.jwtService.generateToken(
      payload,
      Panel.USER,
      TokenType.ACCESS,
    );
    const refreshToken = this.jwtService.generateToken(
      payload,
      Panel.USER,
      TokenType.REFRESH,
    );

    const updatedToken = [...user.token, refreshToken];
    if (updatedToken.length > this.envService.get('TOKEN_STORE_LIMIT'))
      updatedToken.shift();

    const existingDevice = await this.prisma.userDevices.findFirst({
      where: {
        clientUserId: user.id,
        OR: [
          {
            deviceId,
          },
          {
            fcmToken,
          },
        ],
      },
    });

    if (existingDevice) {
      await this.prisma.clientUser.update({
        where: {
          id: user.id,
        },
        data: {
          offline: false,
          token: updatedToken,
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
      await this.prisma.clientUser.update({
        where: {
          id: user.id,
        },
        data: {
          offline: false,
          token: updatedToken,
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

    return {
      accessToken,
      refreshToken,
    };
  }
}
