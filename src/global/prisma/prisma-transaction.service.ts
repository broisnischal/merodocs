import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Provider only where $transaction API
 */
@Injectable()
export class PrismaTransactionService
  extends PrismaClient
  implements OnModuleInit
{
  async onModuleInit() {
    await this.$connect();
  }
}
