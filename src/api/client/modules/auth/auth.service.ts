import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EnvService } from 'src/global/env/env.service';
import { OTPService } from 'src/global/otp/otp.service';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { JwtPayload, Panel, TokenType } from 'src/jwt/jwt.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { SwitchDto, signUpClientUserDto } from './dtos/auth.dto';
import { MailService } from 'src/global/mail/mail.service';
import {
  CreateParams,
  UpdateParamsReset,
  UpdateParamsVerify,
} from '../../common/interfaces';
import generateVerifyEmailUsingOtpTemplate from 'src/templates/client/verify-email.template';
import { generateRandomCode } from 'src/common/utils/code';
import { verifyChangeNumberDto } from './dtos/change-number.dto';
import { decrypt, encrypt } from 'src/common/utils/crypto';
import { logoutAdminUserInputDto } from 'src/api/admin/modules/auth/dtos/logout.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly envService: EnvService,
    private readonly otpService: OTPService,
    private readonly mailService: MailService,
  ) {}

  async signup(data: signUpClientUserDto) {
    const otp = await this.otpService.createOtp(data.contact);
    return otp;
  }

  async refresh(token: string | undefined) {
    if (!token) throw new BadRequestException('Token not found');

    const payload = this.jwtService.decodeToken<{
      id: string;
      currentFlat?: string;
      currentApartment?: string;
    }>(token, Panel.USER, TokenType.REFRESH);

    if (!payload) throw new UnauthorizedException();

    const valid = await this.prisma.clientUser.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!valid) throw new UnauthorizedException();

    const authorizedToken = valid.token.find((i) => i === token);

    if (!authorizedToken) throw new UnauthorizedException();

    const accessToken = this.jwtService.generateToken(
      {
        id: payload.id,
        currentFlat: payload.currentFlat,
        currentApartment: payload.currentApartment,
      },
      Panel.USER,
      TokenType.ACCESS,
    );

    return {
      accessToken,
      refreshToken: token,
    };
  }

  async switch(user: FlatOrUserId, data: SwitchDto) {
    const exist = await this.prisma.clientUser.findUnique({
      where: {
        id: user.id,
        clientApartments: {
          some: {
            flatId: data.flatId,
            status: {
              not: 'cancelled',
            },
          },
        },
      },
      include: {
        currentFlats: {
          select: {
            flatId: true,
          },
        },
      },
    });

    if (!exist)
      throw new BadRequestException(
        'User is not assigned/approved to this flat.',
      );

    const flattoupdate = await this.prisma.flat.findUnique({
      where: {
        id: data.flatId,
        archive: false,
      },
      include: {
        floor: {
          include: {
            block: {
              include: {
                apartment: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!flattoupdate) throw new BadRequestException('Flat not found');

    const newPayload = {
      id: exist.id,
      currentApartment: flattoupdate.floor.block.apartment.id,
      currentFlat: flattoupdate.id,
    };

    const accessToken = this.jwtService.generateToken(
      newPayload,
      Panel.USER,
      TokenType.ACCESS,
    );

    const refreshToken = this.jwtService.generateToken(
      newPayload,
      Panel.USER,
      TokenType.REFRESH,
    );

    const updatedToken = exist.token;
    updatedToken.push(refreshToken);
    const tokenLength = updatedToken.length;

    if (tokenLength > this.envService.get('TOKEN_STORE_LIMIT')) {
      updatedToken.shift();
    }

    await this.prisma.clientUser.update({
      where: { id: exist.id },
      data: {
        token: updatedToken,
      },
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(data: CreateParams<logoutAdminUserInputDto>) {
    const { loggedUserData, postData } = data;

    const { accessToken, refreshToken, deviceId } = postData;

    const payload = this.jwtService.decodeToken<JwtPayload>(
      refreshToken,
      Panel.USER,
      TokenType.REFRESH,
    );

    if (!payload || payload.id !== loggedUserData.id) {
      return;
    }

    const valid = await this.prisma.clientUser.findUnique({
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
        clientUserId: payload.id,
        deviceId,
      },
    });

    await this.prisma.clientUser.update({
      where: {
        id: payload.id,
      },
      data: {
        token: valid.token.filter((i) => i !== refreshToken),
        blockedToken: accessToken,
      },
    });
  }

  async requestChangeNumber(data: signUpClientUserDto) {
    const { contact } = data;

    const exist = await this.prisma.clientUser.findFirst({
      where: { contact },
      select: {
        id: true,
        email: true,
        contact: true,
      },
    });

    if (!exist)
      throw new NotFoundException(
        'Sorry, there is no account associated with the number provided. Please check your number and try again.',
      );

    if (!exist.email)
      throw new NotFoundException('User donot have email associated with it');

    const code = generateRandomCode(6);

    const resetCode = this.jwtService.generateResetToken(
      { code },
      Panel.USER,
      exist.contact,
    );

    await this.prisma.clientUser.update({
      where: { id: exist.id },
      data: { verifyCode: resetCode },
    });

    await this.mailService.sendMail({
      to: exist.email,
      template: generateVerifyEmailUsingOtpTemplate({
        code,
      }),
      type: 'email-verify',
    });

    return {
      code,
      user: exist,
    };
  }

  async verifyChangeNumberWithEmail(data: UpdateParamsReset) {
    const { code, id } = data;

    const existingUser = await this.prisma.clientUser.findUnique({
      where: { id },
    });

    if (!existingUser) throw new NotFoundException('User doesnot exist');

    if (!existingUser.verifyCode)
      throw new NotFoundException('Token not found');

    const decode = await this.jwtService.decodeResetToken(
      existingUser.verifyCode,
      Panel.USER,
      existingUser.contact,
    );

    if (!decode || decode?.code !== code)
      throw new NotFoundException('Token not valid');

    return encrypt(decode.code);
  }

  async changeNumber(data: UpdateParamsVerify<verifyChangeNumberDto>) {
    const { id, postData } = data;

    const { contact } = postData;

    const code = decrypt(postData.code);

    const validUser = await this.prisma.clientUser.findUnique({
      where: { id },
    });

    if (!validUser) throw new NotFoundException('User doesnot exist');

    const exist = await this.prisma.clientUser.findUnique({
      where: { contact },
    });

    if (exist)
      throw new ConflictException(
        'The provided number already exists. Please check your number and try again.',
      );

    if (!validUser.verifyCode) throw new BadRequestException('Token not found');

    const decode = await this.jwtService.decodeResetToken(
      validUser.verifyCode,
      Panel.USER,
      validUser.contact,
    );

    if (!decode || decode.code !== code)
      throw new NotFoundException('Token not valid');

    const user = await this.prisma.clientUser.update({
      where: { id },
      data: { newContact: contact },
    });

    if (!user) throw new BadRequestException('Error updating user contact');

    const otp = await this.otpService.createOtp(contact);

    return otp;
  }

  async verifyAndUpdateNumber(userId: string, otp: string, hash: string) {
    const user = await this.prisma.clientUser.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User doesnot exist');

    if (!user.newContact) throw new BadRequestException('New number not found');

    const isValidOtp = await this.otpService.verifyOtp({
      phone: user.newContact,
      otp,
      hash,
    });

    if (!isValidOtp) throw new BadRequestException('Invalid OTP');

    if (!user.newContact) throw new BadRequestException('New number not found');

    const exist = await this.prisma.clientUser.findUnique({
      where: { contact: user.newContact },
    });

    if (exist)
      throw new ConflictException(
        'The provided number already exists. Please check your number and try again.',
      );

    const updatedUser = await this.prisma.clientUser.update({
      where: { id: userId },
      data: { contact: user.newContact, token: [], newContact: null },
    });

    return updatedUser;
  }
}
