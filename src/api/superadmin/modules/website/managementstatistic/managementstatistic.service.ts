import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateParams,
  UpdateParams,
  DeleteParams,
} from 'src/api/superadmin/common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createManagementStatisticSectionDto } from './dtos/create-managementstatistic.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import {
  createManagementStatFeatureDto,
  updateManagementStatFeatureDto,
} from './dtos/create-managementstatsectionfeat.dto';

@Injectable()
export class ManagementStatisticService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async upsert(data: CreateParams<createManagementStatisticSectionDto>) {
    const { postData } = data;

    const exist = await this.prisma.managementStatisticSection.findFirst();

    if (!exist) {
      await this.prisma.managementStatisticSection.create({
        data: postData,
      });

      return;
    }

    await this.prisma.managementStatisticSection.update({
      where: {
        id: exist.id,
      },
      data: postData,
    });

    return;
  }

  async get() {
    const notice = await this.prisma.managementStatisticSection.findFirst({
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

  async addFeature(
    data: CreateParams<
      createManagementStatFeatureDto & { file: Express.Multer.File }
    >,
  ) {
    const postData = data.postData;

    const section = await this.prisma.managementStatisticSection.findFirst({
      select: {
        id: true,
        _count: {
          select: {
            features: true,
          },
        },
      },
    });

    if (!section) throw new BadRequestException('Invalid Section Id');

    if (section._count.features > 2)
      throw new BadRequestException('You can add only 3 cards.');

    const { file, ...rest } = postData;

    let image: string | undefined;

    if (file) {
      const uploaded = await this.awsService.uploadToS3WithSameFormat(file);

      image = uploaded.url;
    }

    const feature = await this.prisma.managementStatisticFeature.create({
      data: {
        ...rest,
        image,
        sectionId: section.id,
      },
    });

    return feature;
  }

  async updateFeature(
    data: UpdateParams<
      updateManagementStatFeatureDto & {
        file?: Express.Multer.File;
      }
    >,
  ) {
    const postData = data.postData;

    const valid = await this.prisma.managementStatisticFeature.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!valid) throw new NotFoundException('Feature does not exists');

    const { file, ...rest } = postData;

    let image: string | undefined;

    if (file) {
      const uploaded = await this.awsService.uploadToS3WithSameFormat(file);

      image = uploaded.url;
    }

    const feature = await this.prisma.managementStatisticFeature.update({
      where: {
        id: data.id,
      },
      data: {
        ...rest,
        image,
      },
    });

    if (valid.image) {
      await this.awsService.deleteFromS3(valid.image);
    }

    return feature;
  }

  async removeFeature(data: DeleteParams) {
    const { id } = data;

    const valid = await this.prisma.managementStatisticFeature.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Feature not found.');

    await this.prisma.managementStatisticFeature.delete({
      where: {
        id,
      },
    });

    if (valid.image) {
      await this.awsService.deleteFromS3(valid.image);
    }
  }
}
