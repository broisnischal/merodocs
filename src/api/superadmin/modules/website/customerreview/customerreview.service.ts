import { Injectable } from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  UpdateParams,
} from 'src/api/superadmin/common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createCustomerReviewDto } from './dtos/create-customerreview.dto';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { updateCustomerReviewDto } from './dtos/update-customerreview.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

@Injectable()
export class CustomerReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async create(
    data: CreateParams<
      createCustomerReviewDto & {
        file?: Express.Multer.File;
      }
    >,
  ) {
    const { file, ...rest } = data.postData;

    let image: string | undefined;

    if (file) {
      const uploaded = await this.awsService.uploadToS3WithSameFormat(file);

      image = uploaded.url;
    }

    await this.prisma.homeCustomerReview.create({
      data: {
        ...rest,
        image,
      },
    });
  }

  async getAll(data: GetAllParams) {
    const reviews = await this.prisma.homeCustomerReview.findMany({
      where:
        data.filter === 'archive'
          ? { archive: true }
          : data.filter === 'featured'
            ? {
                featured: true,
              }
            : {
                archive: false,
              },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return reviews;
  }

  async update(
    data: UpdateParams<
      updateCustomerReviewDto & {
        file?: Express.Multer.File;
      }
    >,
  ) {
    const valid = await this.prisma.homeCustomerReview.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!valid) throw new NotFoundException('Review does not exist');

    const { file, ...rest } = data.postData;

    let image: string | undefined;
    if (file) {
      const uploaded = await this.awsService.uploadToS3WithSameFormat(file);

      image = uploaded.url;
    }

    await this.prisma.homeCustomerReview.update({
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
  }

  async featureOrUnfeatured(data: UpdateParams<undefined>) {
    const valid = await this.prisma.homeCustomerReview.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!valid) throw new NotFoundException('Review does not exist');

    if (valid.archive)
      throw new ConflictException('Cannot feature archived reviews');

    if (!valid.featured) {
      const featuredCount = await this.prisma.homeCustomerReview.count({
        where: {
          featured: true,
        },
      });

      if (featuredCount >= 3)
        throw new ConflictException('Cannot feature more than 3 reviews');
    }

    const updated = await this.prisma.homeCustomerReview.update({
      where: {
        id: data.id,
      },
      data: {
        featured: !valid.featured,
      },
    });

    return updated;
  }

  async archiveOrUnarchive(data: UpdateParams<undefined>) {
    const valid = await this.prisma.homeCustomerReview.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!valid) throw new NotFoundException('Review does not exist');

    const updated = await this.prisma.homeCustomerReview.update({
      where: {
        id: data.id,
      },
      data: {
        featured: false,
        archive: !valid.archive,
      },
    });

    return updated;
  }

  async delete(data: DeleteParams) {
    const valid = await this.prisma.homeCustomerReview.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!valid) throw new NotFoundException('Review does not exist');

    await this.prisma.homeCustomerReview.delete({
      where: {
        id: data.id,
      },
    });

    if (valid.image) {
      await this.awsService.deleteFromS3(valid.image);
    }
  }
}
