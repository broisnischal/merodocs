import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { NPCEnum, SocietyEnum } from '@prisma/client';

@Injectable()
export class NPCSectionService {
  constructor(private readonly prisma: PrismaService) {}

  async get(data: { for: SocietyEnum; type: NPCEnum }) {
    const notice = await this.prisma.nPCSection.findUnique({
      where: {
        type_for: {
          type: data.type,
          for: data.for,
        },
      },
      include: {
        features: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return notice;
  }
}
