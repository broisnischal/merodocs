import { Injectable, Logger } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { JwtPayload, Panel, TokenType } from './jwt.dto';
import { EnvService } from 'src/global/env/env.service';

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);
  constructor(private readonly envService: EnvService) {}
  generateToken(payload: JwtPayload, panel: Panel, type: TokenType): string {
    if (panel === Panel.ADMIN)
      return jwt.sign(
        payload,
        type === TokenType.ACCESS
          ? this.envService.get('ADMIN_JWT_ACCESS_SECRET')
          : this.envService.get('ADMIN_JWT_REFRESH_SECRET'),
        {
          expiresIn: type === TokenType.ACCESS ? '15m' : '15d',
        },
      );
    else if (panel === Panel.SUPERADMIN)
      return jwt.sign(
        payload,
        type === TokenType.ACCESS
          ? this.envService.get('SUPERADMIN_JWT_ACCESS_SECRET')
          : this.envService.get('SUPERADMIN_JWT_REFRESH_SECRET'),
        {
          expiresIn: type === TokenType.ACCESS ? '15m' : '15d',
        },
      );
    else if (panel === Panel.USER)
      return jwt.sign(
        payload,
        type === TokenType.ACCESS
          ? this.envService.get('USER_JWT_ACCESS_SECRET')
          : this.envService.get('USER_JWT_REFRESH_SECRET'),
        {
          expiresIn: type === TokenType.ACCESS ? '30m' : '30d',
        },
      );
    else if (panel === Panel.GUARD)
      return jwt.sign(
        payload,
        type === TokenType.ACCESS
          ? this.envService.get('GUARD_JWT_ACCESS_SECRET')
          : this.envService.get('GUARD_JWT_REFRESH_SECRET'),
        {
          expiresIn: type === TokenType.ACCESS ? '30m' : '30d',
        },
      );

    return '';
  }

  decodeToken<T = any>(
    token: string,
    panel: Panel,
    type: TokenType,
  ): JwtPayload | false | T {
    let jwtSecret: string | undefined;

    if (panel === Panel.ADMIN) {
      jwtSecret =
        type === TokenType.ACCESS
          ? this.envService.get('ADMIN_JWT_ACCESS_SECRET')
          : this.envService.get('ADMIN_JWT_REFRESH_SECRET');
    } else if (panel === Panel.SUPERADMIN) {
      jwtSecret =
        type === TokenType.ACCESS
          ? this.envService.get('SUPERADMIN_JWT_ACCESS_SECRET')
          : this.envService.get('SUPERADMIN_JWT_REFRESH_SECRET');
    } else if (panel === Panel.USER) {
      jwtSecret =
        type === TokenType.ACCESS
          ? this.envService.get('USER_JWT_ACCESS_SECRET')
          : this.envService.get('USER_JWT_REFRESH_SECRET');
    } else if (panel === Panel.GUARD) {
      jwtSecret =
        type === TokenType.ACCESS
          ? this.envService.get('GUARD_JWT_ACCESS_SECRET')
          : this.envService.get('GUARD_JWT_REFRESH_SECRET');
    }

    if (!jwtSecret) return false;

    try {
      const decode = jwt.verify(token, jwtSecret) as
        | JwtPayload
        | jwt.JsonWebTokenError;

      if (decode instanceof jwt.JsonWebTokenError) throw decode;

      return decode;
    } catch (err) {
      this.logger.error(err);
      return false;
    }
  }

  generateResetToken<T extends object>(
    payload: T,
    panel: Panel,
    other: string,
  ): string {
    if (panel === Panel.ADMIN)
      return jwt.sign(
        payload,
        this.envService.get('ADMIN_RESET_SECRET') + other,
        {
          expiresIn: this.envService.get('RESET_TIME_LIMIT'),
        },
      );

    if (panel === Panel.SUPERADMIN) {
      return jwt.sign(
        payload,
        this.envService.get('SUPERADMIN_RESET_SECRET') + other,
        {
          expiresIn: this.envService.get('RESET_TIME_LIMIT'),
        },
      );
    }

    if (panel === Panel.USER) {
      return jwt.sign(payload, this.envService.get('OTP_SECRET') + other, {
        expiresIn: this.envService.get('RESET_TIME_LIMIT'),
      });
    }

    return '';
  }

  decodeResetToken<T = any>(
    token: string,
    panel: Panel,
    other: string,
  ): false | T {
    let resetSecret: string | undefined;

    if (panel === Panel.ADMIN) {
      resetSecret = this.envService.get('ADMIN_RESET_SECRET') + other;
    } else if (panel === Panel.SUPERADMIN) {
      resetSecret = this.envService.get('SUPERADMIN_RESET_SECRET') + other;
    } else if (panel === Panel.USER) {
      resetSecret = this.envService.get('OTP_SECRET') + other;
    }

    if (!resetSecret) return false;

    try {
      const decode = jwt.verify(token, resetSecret) as
        | T
        | jwt.JsonWebTokenError;

      if (decode instanceof jwt.JsonWebTokenError) throw decode;

      return decode;
    } catch (err) {
      return false;
    }
  }
}
