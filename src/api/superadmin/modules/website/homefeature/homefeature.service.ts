import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  UpdateParams,
} from '../../../common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createHomeFeatureDto } from './dtos/create-homefeature.dto';
import { updateHomeFeatureDto } from './dtos/update-homefeature.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';

@Injectable()
export class HomeFeatureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async create(
    data: CreateParams<createHomeFeatureDto & { file: Express.Multer.File }>,
  ) {
    const { postData, id } = data;

    const { title, description, file } = postData;

    const valid = await this.prisma.homeSection.findUnique({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid section id');

    const count = await this.prisma.homeFeature.count({
      where: {
        section: {
          for: valid.for,
        },
      },
    });

    if (count >= 6) throw new BadRequestException('Maximum limit reached');

    const image = (await this.awsService.uploadToS3WithSameFormat(file)).url;

    const response = await this.prisma.homeFeature.create({
      data: {
        sectionId: valid.id,
        title,
        description,
        image,
      },
    });

    return response;
  }

  async update(
    data: UpdateParams<updateHomeFeatureDto & { file: Express.Multer.File }>,
  ) {
    const { postData, id } = data;

    const { title, description, file } = postData;
    let image: string | undefined;

    const valid = await this.prisma.homeFeature.findUnique({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid feature id');

    if (file) {
      await this.awsService.deleteFromS3(valid.image!);
      image = (await this.awsService.uploadToS3WithSameFormat(file)).url;
    }

    const response = await this.prisma.homeFeature.update({
      where: { id },
      data: {
        title,
        description,
        image,
      },
    });

    return response;
  }

  async delete(data: DeleteParams) {
    const { id } = data;

    const valid = await this.prisma.homeFeature.findUnique({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid feature id');

    if (valid.image) await this.awsService.deleteFromS3(valid.image);

    const response = await this.prisma.homeFeature.delete({
      where: { id },
    });

    return response;
  }
}
