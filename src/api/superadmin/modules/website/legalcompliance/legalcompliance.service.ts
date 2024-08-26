import { Injectable } from '@nestjs/common';
import {
  CreateParams,
  GetAllParams,
} from 'src/api/superadmin/common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createLegalComplianceDto } from './dtos/create-legalcompliance.dto';
import { LegalComplianceTypeEnum } from '@prisma/client';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';

@Injectable()
export class LegalComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: SuperAdminActivityService,
  ) {}

  async upsert(data: CreateParams<createLegalComplianceDto>) {
    const { postData } = data;

    const valid = await this.prisma.legalCompliance.findUnique({
      where: {
        type: postData.type,
      },
    });

    const section = await this.prisma.legalCompliance.upsert({
      where: {
        type: postData.type,
      },
      create: {
        ...postData,
        createdById: data.loggedUserData.id,
        updatedById: data.loggedUserData.id,
      },
      update: {
        ...postData,
        updatedById: data.loggedUserData.id,
      },
    });

    if (valid) {
      await this.activityService.create({
        message: `updated the legal compliance (${postData.type.split('_').join(' ')}).`,
        type: 'legalcompliance',
        loggedUserData: data.loggedUserData,
      });
    } else {
      await this.activityService.create({
        message: `created the legal compliance (${postData.type.split('_').join(' ')}).`,
        type: 'legalcompliance',
        loggedUserData: data.loggedUserData,
      });
    }

    return section;
  }

  async get(
    data: GetAllParams & {
      type: LegalComplianceTypeEnum;
    },
  ) {
    const notice = await this.prisma.legalCompliance.findUnique({
      where: {
        type: data.type,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        updatedBy: {
          select: {
            name: true,
            image: {
              select: {
                url: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return notice;
  }
}
