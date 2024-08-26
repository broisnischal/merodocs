import { Injectable } from '@nestjs/common';
import { PrismaService } from './global/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealthCheck() {
    let databaseStatus: 'active' | 'down';

    try {
      await this.prisma.$connect();
      databaseStatus = 'active';
    } catch (_err: unknown) {
      databaseStatus = 'down';
    }

    return {
      server: {
        status: 'active',
        runtime: 'up',
      },
      database: {
        status: databaseStatus,
      },
    };
  }
}
//
