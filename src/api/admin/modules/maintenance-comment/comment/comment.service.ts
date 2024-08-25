import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateParams } from 'src/api/admin/common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createCommentDto } from './dtos/comment.dto';
import { CommentTypeEnum } from '@prisma/client';
import { AWSStorageService } from 'src/global/aws/aws.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async create(
    data: CreateParams<createCommentDto & { image?: Express.Multer.File }>,
  ) {
    const { postData, loggedUserData, apartmentId } = data;

    const { maintenanceId, message } = postData;

    const adminUserId = loggedUserData.id;

    const type = CommentTypeEnum.admin;

    if (type === CommentTypeEnum.admin && !adminUserId)
      throw new BadRequestException('In case of admin adminUserId is required');

    const valid = await this.prisma.maintenance.findFirst({
      where: {
        id: maintenanceId,
        NOT: { status: 'closed' },
        flat: {
          apartmentId,
        },
      },
    });

    if (!valid) throw new NotFoundException('Maintenance doesnot exist');
    let image;
    if (postData.image) {
      image = await this.awsService.uploadToS3(postData.image);
    }

    const comment = await this.prisma.maintenanceComment.create({
      data: {
        message,
        maintenanceId,
        type,
        adminUserId,
        image: image ? { create: { url: image.url } } : undefined,
      },
    });

    return comment;
  }
}
