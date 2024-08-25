import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  DeleteParams,
  UpdateParams,
} from '../../../common/interface';
import { createVideoSectionDto, updateVideoSectionDto } from './dtos/index.dto';

import { AWSStorageService } from 'src/global/aws/aws.service';

@Injectable()
export class VideoSectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async create(
    data: CreateParams<createVideoSectionDto & { file: Express.Multer.File }>,
  ) {
    const { postData } = data;

    const { title, type, file } = postData;

    const alreadyExist = await this.prisma.videoSection.findUnique({
      where: {
        type,
      },
    });

    if (alreadyExist)
      throw new ConflictException('Video already exists for this type.');

    const video = (await this.awsService.uploadToS3(file)).url;

    const response = await this.prisma.videoSection.create({
      data: {
        title,
        type,
        video,
        fileName: file.originalname,
      },
    });

    return response;
  }

  async update(
    data: UpdateParams<updateVideoSectionDto & { file: Express.Multer.File }>,
  ) {
    const { postData, id } = data;

    const { title, file } = postData;

    let video: string | undefined;

    const valid = await this.prisma.videoSection.findUnique({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Invalid Video Id');

    if (file) {
      await this.awsService.deleteFromS3(valid.video!);
      video = (await this.awsService.uploadToS3(file)).url;
    }

    const response = await this.prisma.videoSection.update({
      where: { id },
      data: {
        title,
        video,
        fileName: file && file.originalname,
      },
    });

    return response;
  }

  async getAll() {
    const response = await this.prisma.videoSection.findMany({
      select: {
        id: true,
        title: true,
        type: true,
        video: true,
        fileName: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return response;
  }

  async delete(data: DeleteParams) {
    const { id } = data;

    const valid = await this.prisma.videoSection.findUnique({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Invalid video id');

    await this.awsService.deleteFromS3(valid.video!);

    const response = await this.prisma.videoSection.delete({
      where: { id },
    });

    return response;
  }
}
