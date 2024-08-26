import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  UpdateParams,
} from '../../../common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createResidentFeatureDto } from './dtos/create-residentfeature.dto';
import { updateResidentFeatureDto } from './dtos/update-residentfeature.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';

@Injectable()
export class ResidentFeatureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async create(
    data: CreateParams<
      createResidentFeatureDto & { file: Express.Multer.File }
    >,
  ) {
    const { postData, id } = data;

    const { title, description, file } = postData;

    const valid = await this.prisma.residentFeatureSection.findFirst({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid section id');

    const count = await this.prisma.residentFeature.count();

    if (count >= 8) throw new BadRequestException('Maximum limit reached');

    const image = (await this.awsService.uploadToS3WithSameFormat(file)).url;

    const response = await this.prisma.residentFeature.create({
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
    data: UpdateParams<
      updateResidentFeatureDto & { file: Express.Multer.File }
    >,
  ) {
    const { postData, id } = data;

    const { title, description, file } = postData;
    let image: string | undefined;

    const valid = await this.prisma.residentFeature.findFirst({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid feature id');

    if (file) {
      await this.awsService.deleteFromS3(valid.image!);
      image = (await this.awsService.uploadToS3WithSameFormat(file)).url;
    }

    const response = await this.prisma.residentFeature.update({
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

    const valid = await this.prisma.residentFeature.findFirst({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid feature id');

    if (valid.image) await this.awsService.deleteFromS3(valid.image);

    const response = await this.prisma.residentFeature.delete({
      where: { id },
    });

    return response;
  }
}
