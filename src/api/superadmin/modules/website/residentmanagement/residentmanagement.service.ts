import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateParams,
  GetAllParams,
  UpdateParams,
  DeleteParams,
} from 'src/api/superadmin/common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createResidentManagementSectionDto } from './dtos/create-residentmanagement.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { ManagementPlatformTypeEnum } from '@prisma/client';
import {
  createResidentManagementFeatureDto,
  updateResidentManagementFeatureDto,
} from './dtos/create-residentmanagementfeature.dto';

@Injectable()
export class ResidentManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async upsert(
    data: CreateParams<
      createResidentManagementSectionDto & {
        file?: Express.Multer.File;
      }
    >,
  ) {
    const { postData } = data;

    const { file, ...rest } = postData;

    let image: string | undefined;

    if (file) {
      const uploaded = await this.awsService.uploadToS3WithSameFormat(file);

      image = uploaded.url;
    }

    const section = await this.prisma.residentManagementSection.upsert({
      where: {
        type: postData.type,
      },
      create: {
        ...rest,
        image,
      },
      update: {
        ...rest,
        image,
      },
    });

    return section;
  }

  async get(
    data: GetAllParams & {
      type: ManagementPlatformTypeEnum;
    },
  ) {
    const notice = await this.prisma.residentManagementSection.findUnique({
      where: {
        type: data.type,
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

  async addFeature(data: CreateParams<createResidentManagementFeatureDto>) {
    const postData = data.postData;

    const section = await this.prisma.residentManagementSection.findUnique({
      where: {
        id: postData.sectionId,
      },
      select: {
        _count: {
          select: {
            features: true,
          },
        },
      },
    });

    if (!section) throw new BadRequestException('Invalid Section Id');

    if (section._count.features > 3)
      throw new BadRequestException('Cannot add more than 4 features');

    const feature = await this.prisma.residentManagementFeature.create({
      data: postData,
    });

    return feature;
  }

  async updateFeature(data: UpdateParams<updateResidentManagementFeatureDto>) {
    const postData = data.postData;

    const valid = await this.prisma.residentManagementFeature.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!valid) throw new NotFoundException('Feature does not exists');

    const feature = await this.prisma.residentManagementFeature.update({
      where: {
        id: data.id,
      },
      data: postData,
    });

    return feature;
  }

  async removeFeature(data: DeleteParams) {
    const { id } = data;

    const valid = await this.prisma.residentManagementFeature.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Feature not found.');

    await this.prisma.residentManagementFeature.delete({
      where: {
        id,
      },
    });
  }
}
