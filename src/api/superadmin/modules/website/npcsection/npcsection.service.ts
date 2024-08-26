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
import { createNPCSectionDto } from './dtos/create-npc.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { NPCEnum, SocietyEnum } from '@prisma/client';
import {
  createNPCFeatureDto,
  updateNPCFeatureDto,
} from './dtos/create-npcfeature.dto';

@Injectable()
export class NPCSectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async upsert(
    data: CreateParams<
      createNPCSectionDto & {
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

    const valid = await this.prisma.nPCSection.findUnique({
      where: {
        type_for: {
          type: postData.type,
          for: postData.for,
        },
      },
    });

    const section = await this.prisma.nPCSection.upsert({
      where: {
        type_for: {
          type: postData.type,
          for: postData.for,
        },
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

    if (valid?.image) {
      await this.awsService.deleteFromS3(valid.image);
    }

    return section;
  }

  async get(
    data: GetAllParams & {
      for: SocietyEnum;
      type: NPCEnum;
    },
  ) {
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

  async addFeature(data: CreateParams<createNPCFeatureDto>) {
    const postData = data.postData;

    const section = await this.prisma.nPCSection.findUnique({
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

    if (section._count.features >= 4)
      throw new BadRequestException('Cannot add more than 4 features');

    const feature = await this.prisma.nPCFeature.create({
      data: postData,
    });

    return feature;
  }

  async updateFeature(data: UpdateParams<updateNPCFeatureDto>) {
    const postData = data.postData;

    const valid = await this.prisma.nPCFeature.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!valid) throw new NotFoundException('Feature does not exists');

    const feature = await this.prisma.nPCFeature.update({
      where: {
        id: data.id,
      },
      data: postData,
    });

    return feature;
  }

  async removeFeature(data: DeleteParams) {
    const { id } = data;

    const valid = await this.prisma.nPCFeature.findUnique({
      where: {
        id,
      },
    });

    if (!valid) throw new NotFoundException('Feature not found.');

    await this.prisma.nPCFeature.delete({
      where: {
        id,
      },
    });
  }
}
