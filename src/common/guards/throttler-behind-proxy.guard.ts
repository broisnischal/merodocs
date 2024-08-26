import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected errorMessage = 'Too many attempts. Please try again later.';

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip = req.ips.length ? req.ips[0] : req.ip;
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `${ip}-${userAgent}`;
  }
}
