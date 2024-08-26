import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  DeleteParams,
  UpdateParams,
} from '../../../common/interface';
import {
  createAboutUsServiceDto,
  createAboutUsStoryDto,
  updateAboutUsServiceDto,
} from './dtos/index.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';

@Injectable()
export class AboutUsSectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async createStory(data: CreateParams<createAboutUsStoryDto>) {
    const { postData } = data;

    const { title, description } = postData;

    const alreadyExist = await this.prisma.aboutUsStory.findFirst();

    if (!alreadyExist && (!title || !description))
      throw new BadRequestException(
        'Title and description is required for creating a new about us story.',
      );

    const response = alreadyExist
      ? await this.prisma.aboutUsStory.update({
          where: {
            id: alreadyExist.id,
          },
          data: {
            title,
            description,
          },
        })
      : await this.prisma.aboutUsStory.create({
          data: {
            title: title!,
            description: description!,
          },
        });

    return response;
  }

  async getAllStory() {
    const response = await this.prisma.aboutUsStory.findFirst({
      select: {
        id: true,
        title: true,
        description: true,
      },
    });

    return response;
  }

  async createService(
    data: CreateParams<createAboutUsServiceDto & { file: Express.Multer.File }>,
  ) {
    const { postData } = data;

    const { title, description, file } = postData;

    const count = await this.prisma.aboutUsService.count();

    if (count >= 3) throw new BadRequestException('Maximum limit reached');

    const image = (await this.awsService.uploadToS3WithSameFormat(file)).url;

    const response = await this.prisma.aboutUsService.create({
      data: {
        title,
        description,
        image,
      },
    });

    return response;
  }

  async getAllService() {
    const response = await this.prisma.aboutUsService.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        image: true,
      },
    });

    return response;
  }

  async updateService(
    data: UpdateParams<updateAboutUsServiceDto & { file: Express.Multer.File }>,
  ) {
    const { postData, id } = data;

    const { title, description, file } = postData;
    let image: string | undefined;

    const valid = await this.prisma.aboutUsService.findUnique({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid service id');

    if (file) {
      await this.awsService.deleteFromS3(valid.image!);
      image = (await this.awsService.uploadToS3WithSameFormat(file)).url;
    }

    const response = await this.prisma.aboutUsService.update({
      where: { id },
      data: {
        title,
        description,
        image,
      },
    });

    return response;
  }

  async deleteService(data: DeleteParams) {
    const { id } = data;

    const valid = await this.prisma.aboutUsService.findUnique({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid service id');

    if (valid.image) await this.awsService.deleteFromS3(valid.image);

    const response = await this.prisma.aboutUsService.delete({
      where: { id },
    });

    return response;
  }
}
