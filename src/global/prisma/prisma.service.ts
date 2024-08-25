import { Injectable, OnModuleInit } from '@nestjs/common';
import { extendedClient, prisma } from './extended-prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends extendedClient() implements OnModuleInit {
  async onModuleInit() {
    // Uncomment this to establish a connection on startup, this is generally not necessary
    // https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/connection-management#connect
    await Prisma.getExtensionContext(prisma).$connect();
  }
}
