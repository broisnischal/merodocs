import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createPopupDto } from './dtos/create-popup.dto';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  UpdateParams,
} from '../../common/interface';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { updatePopupDto } from './dtos/update-popup.dto';

@Injectable()
export class PopUpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
    private readonly awsService: AWSStorageService,
  ) {}

  async create(
    data: CreateParams<createPopupDto & { image: Express.Multer.File }>,
  ) {
    const { postData, loggedUserData } = data;

    const { link, name } = postData;

    const apartmentId = loggedUserData.apartmentId;

    const image = await this.awsService.uploadToS3(postData.image);

    const popup = await this.prisma.clientPopUpBanner.create({
      data: {
        link,
        name,
        apartmentId,
        mobImage: image.url,
        createdById: loggedUserData.id,
      },
    });

    await this.activityService.create({
      message: `Created the popup`,
      type: 'popup',
      loggedUserData,
    });

    return popup;
  }

  async getOwnPopupBanner(data: GetAllParams) {
    const { apartmentId } = data;
    const response = await this.prisma.apartmentPopUpBanner.findFirst({
      where: {
        apartmentId,
        banner: {
          enabled: true,
          activated: true,
        },
      },
      select: {
        banner: {
          select: {
            id: true,
            redirectLink: true,
            mobImage: true,
            webImage: true,
          },
        },
      },
    });

    return response;
  }

  async getAllPopupBanner(data: GetAllParams) {
    const isEnabled = await this.prisma.clientPopUpBanner.findFirst({
      where: {
        enabled: true,
        apartmentId: data.apartmentId,
      },
    });

    const banners = await this.prisma.clientPopUpBanner.findMany({
      where: {
        apartmentId: data.apartmentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        link: true,
        mobImage: true,
        enabled: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            image: {
              select: {
                url: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    return { isEnabled: !!isEnabled, banners };
  }

  async getActivatedPopupBanner(data: GetAllParams) {
    const response = await this.prisma.clientPopUpBanner.findFirst({
      where: {
        activated: true,
        apartmentId: data.apartmentId,
      },
      select: {
        id: true,
        name: true,
        link: true,
        mobImage: true,
      },
    });

    if (!response) throw new NotFoundException('Banner doesnot exist');

    return response;
  }

  async updatePopupBanner(
    data: UpdateParams<updatePopupDto & { image?: Express.Multer.File }>,
  ) {
    const { id, postData, loggedUserData, apartmentId } = data;

    const { image, ...rest } = postData;

    const valid = await this.prisma.clientPopUpBanner.findUnique({
      where: { id, apartmentId },
    });

    if (!valid) throw new NotFoundException('Banner doesnot exist');

    let mobUploaded: { name: string; url: string } | undefined;

    if (image) {
      mobUploaded = await this.awsService.uploadToS3(image);
    }

    const response = await this.prisma.clientPopUpBanner.update({
      where: { id },
      data: {
        ...rest,
        mobImage: mobUploaded?.url,
      },
    });

    await this.activityService.create({
      message: `Updated the popup`,
      type: 'popup',
      loggedUserData,
    });

    return response;
  }

  async activatePopupBanner(data: UpdateParams<undefined>) {
    const { id, loggedUserData, apartmentId } = data;

    const valid = await this.prisma.clientPopUpBanner.findUnique({
      where: { id, apartmentId },
    });

    if (!valid) throw new NotFoundException('Banner doesnot exist');

    await this.prisma.clientPopUpBanner.updateMany({
      where: {
        activated: true,
      },
      data: {
        activated: false,
      },
    });

    const response = await this.prisma.clientPopUpBanner.update({
      where: { id },
      data: {
        activated: !valid.activated,
      },
    });

    await this.activityService.create({
      message: `Updated the popup`,
      type: 'popup',
      loggedUserData,
    });

    return response;
  }

  async enablePopupBanner(data: UpdateParams<undefined>) {
    const { loggedUserData, apartmentId } = data;

    const valid = await this.prisma.clientPopUpBanner.findFirst({
      where: { activated: true, apartmentId },
    });

    if (!valid) throw new NotFoundException('Banner doesnot exist');

    if (!valid.activated)
      throw new ConflictException('Banner is not activated');

    const response = await this.prisma.clientPopUpBanner.update({
      where: { id: valid.id },
      data: {
        enabled: !valid.enabled,
      },
    });

    await this.activityService.create({
      message: `Updated the popup`,
      type: 'popup',
      loggedUserData,
    });

    return response;
  }

  async deletePopupBanner(data: DeleteParams) {
    const { id, apartmentId, loggedUserData } = data;

    const valid = await this.prisma.clientPopUpBanner.findUnique({
      where: { id, apartmentId },
    });

    if (!valid) throw new NotFoundException('Banner doesnot exist');

    const response = await this.prisma.clientPopUpBanner.delete({
      where: { id },
    });

    await this.awsService.deleteFromS3(response.mobImage!);

    await this.activityService.create({
      message: `Deleted the popup`,
      type: 'popup',
      loggedUserData,
    });

    return response;
  }
}
