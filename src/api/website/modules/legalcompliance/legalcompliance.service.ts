import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/global/prisma/prisma.service';
import { LegalComplianceTypeEnum } from '@prisma/client';

@Injectable()
export class LegalComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async get(data: { type: LegalComplianceTypeEnum }) {
    const legal = await this.prisma.legalCompliance.findUnique({
      where: {
        type: data.type,
      },
      select: {
        content: true,
      },
    });

    return legal;
  }
}
