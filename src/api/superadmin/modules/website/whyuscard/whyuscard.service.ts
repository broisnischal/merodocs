import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  UpdateParams,
} from '../../../common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createWhyUsCardDto } from './dtos/create-whyuscard.dto';
import { updateWhyUsCardDto } from './dtos/update-whyuscard.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';

@Injectable()
export class WhyUsCardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async create(
    data: CreateParams<createWhyUsCardDto & { file: Express.Multer.File }>,
  ) {
    const { postData, id } = data;

    const { title, description, file } = postData;

    const valid = await this.prisma.whyUsSection.findFirst({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid section id');

    const count = await this.prisma.whyUsCard.count({
      where: {
        section: {
          type: valid.type,
        },
      },
    });

    if (count >= 3) throw new BadRequestException('Maximum limit reached');

    const image = (await this.awsService.uploadToS3WithSameFormat(file)).url;

    const response = await this.prisma.whyUsCard.create({
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
    data: UpdateParams<updateWhyUsCardDto & { file: Express.Multer.File }>,
  ) {
    const { postData, id } = data;

    const { title, description, file } = postData;
    let image: string | undefined;

    const valid = await this.prisma.whyUsCard.findFirst({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid card id');

    if (file) {
      await this.awsService.deleteFromS3(valid.image!);
      image = (await this.awsService.uploadToS3WithSameFormat(file)).url;
    }

    const response = await this.prisma.whyUsCard.update({
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

    const valid = await this.prisma.whyUsCard.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Card doesnot exist');

    if (valid.image) await this.awsService.deleteFromS3(valid.image);

    const response = await this.prisma.whyUsCard.delete({
      where: { id },
    });

    return response;
  }
}
