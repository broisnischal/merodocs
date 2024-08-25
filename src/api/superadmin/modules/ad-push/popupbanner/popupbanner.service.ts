import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  UpdateParams,
} from 'src/api/superadmin/common/interface';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createBannerDto } from './dtos/create-banner.dto';
import { updateBannerDto } from './dtos/update-banner.dto';
import { SuperAdminActivityService } from 'src/global/activity/superadmin-activity.service';
import { assignBannerDto } from './dtos/assign-banner.dto';
import { unassignBannerDto } from './dtos/unassign-banner.dto';

@Injectable()
export class PopupbannerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
    private readonly activity: SuperAdminActivityService,
  ) {}

  async createPopupBanner(
    data: CreateParams<
      createBannerDto & {
        web: Express.Multer.File;
        mob: Express.Multer.File;
      }
    >,
  ) {
    const { loggedUserData } = data;

    const { web, mob, ...rest } = data.postData;

    const webUploaded = await this.awsService.uploadToS3(web);
    const mobUploaded = await this.awsService.uploadToS3(mob);

    const response = await this.prisma.adminPopUpBanner.create({
      data: {
        ...rest,
        webImage: webUploaded.url,
        mobImage: mobUploaded.url,
        createdById: loggedUserData.id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `Created popup banner named ${response?.title}`,
      type: 'popupbanner',
    });

    return response;
  }

  async getAllPopupBanner() {
    const response = await this.prisma.adminPopUpBanner.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
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
        updatedBy: {
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
      },
    });

    return response;
  }

  async getActivatedPopupBanner() {
    const response = await this.prisma.adminPopUpBanner.findFirst({
      where: {
        activated: true,
      },
      include: {
        apartments: {
          select: {
            apartment: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return response;
  }

  async updatePopupBanner(
    data: UpdateParams<
      updateBannerDto & {
        web?: Express.Multer.File;
        mob?: Express.Multer.File;
      }
    >,
  ) {
    const { id, loggedUserData, postData } = data;

    const { web, mob, ...rest } = postData;

    const valid = await this.prisma.adminPopUpBanner.findUnique({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Banner doesnot exist');

    let webUploaded: { name: string; url: string } | undefined;
    let mobUploaded: { name: string; url: string } | undefined;

    if (web) {
      webUploaded = await this.awsService.uploadToS3(web);

      if (valid.webImage) await this.awsService.deleteFromS3(valid.webImage);
    }

    if (mob) {
      mobUploaded = await this.awsService.uploadToS3(mob);

      if (valid.mobImage) await this.awsService.deleteFromS3(valid.mobImage);
    }

    const response = await this.prisma.adminPopUpBanner.update({
      where: { id },
      data: {
        ...rest,
        updatedById: loggedUserData.id,
        webImage: webUploaded?.url,
        mobImage: mobUploaded?.url,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `Edit popup banner named ${response?.title}`,
      type: 'popupbanner',
    });

    return response;
  }

  async enablePopupBanner(data: UpdateParams<undefined>) {
    const { loggedUserData } = data;

    const valid = await this.prisma.adminPopUpBanner.findFirst({
      where: { activated: true },
    });

    if (!valid) throw new NotFoundException('Banner doesnot exist');

    if (!valid.activated)
      throw new ConflictException('Banner is not activated');

    const response = await this.prisma.adminPopUpBanner.update({
      where: { id: valid.id },
      data: {
        enabled: !valid.enabled,
        updatedById: loggedUserData.id,
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `Enabled popup banner named ${response?.title}`,
      type: 'popupbanner',
    });

    return response;
  }

  async deletePopupBanner(data: DeleteParams) {
    const { id, loggedUserData } = data;

    const valid = await this.prisma.adminPopUpBanner.findUnique({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Banner doesnot exist');

    if (valid.mobImage) await this.awsService.deleteFromS3(valid.mobImage);
    if (valid.webImage) await this.awsService.deleteFromS3(valid.webImage);

    const response = await this.prisma.adminPopUpBanner.delete({
      where: { id },
    });

    await this.activity.create({
      loggedUserData,
      message: `Deleted popup banner named ${response?.title}`,
      type: 'popupbanner',
    });

    return response;
  }

  async assignBannerToApartment(data: UpdateParams<assignBannerDto>) {
    const { loggedUserData, postData, id } = data;
    const { apartmentIds } = postData;

    const banner = await this.prisma.adminPopUpBanner.findUnique({
      where: { id },
    });

    if (!banner) throw new NotFoundException('Banner not found');

    await this.prisma.apartmentPopUpBanner.deleteMany({
      where: {
        bannerId: id,
      },
    });

    await this.prisma.adminPopUpBanner.update({
      where: { id },
      data: {
        activated: true,
        updatedById: loggedUserData.id,
      },
    });

    const existingRecords = await this.prisma.apartmentPopUpBanner.findMany({
      where: {
        apartmentId: {
          in: apartmentIds,
        },
        bannerId: id,
      },
    });

    const existingApartmentIds = existingRecords.map(
      (record) => record.apartmentId,
    );

    const apartmentsToAssign = apartmentIds.filter(
      (id) => !existingApartmentIds.includes(id),
    );

    const records = await Promise.all(
      apartmentsToAssign.map(async (apartmentId) => {
        const apartment = await this.prisma.apartment.findUnique({
          where: { id: apartmentId },
        });

        if (!apartment)
          throw new NotFoundException(`Apartment ${apartmentId} not found`);

        const record = await this.prisma.apartmentPopUpBanner.create({
          data: {
            apartmentId,
            bannerId: id,
          },
        });

        await this.activity.create({
          loggedUserData,
          message: `Assigned popup banner to apartment ${apartment.name}`,
          type: 'popupbanner',
        });

        return record;
      }),
    );

    return records;
  }

  async assignBannerToAllApartments(data: UpdateParams<undefined>) {
    const { loggedUserData, id } = data;

    const banner = await this.prisma.adminPopUpBanner.findUnique({
      where: { id },
    });

    if (!banner) throw new NotFoundException('Banner not found');

    const apartments = await this.prisma.apartment.findMany();

    await this.prisma.apartmentPopUpBanner.deleteMany({
      where: {
        apartmentId: { in: apartments.map((apartment) => apartment.id) },
      },
    });

    await this.prisma.adminPopUpBanner.update({
      where: { id },
      data: {
        activated: true,
        updatedById: loggedUserData.id,
      },
    });

    const records = await Promise.all(
      apartments.map(async (apartment) => {
        const existingRecord =
          await this.prisma.apartmentPopUpBanner.findUnique({
            where: {
              apartmentId_bannerId: {
                apartmentId: apartment.id,
                bannerId: id,
              },
            },
          });

        if (existingRecord) return existingRecord;

        const record = await this.prisma.apartmentPopUpBanner.create({
          data: {
            apartmentId: apartment.id,
            bannerId: id,
          },
        });

        await this.activity.create({
          loggedUserData,
          message: `Assigned popup banner ${banner.title} to apartment ${apartment.name}`,
          type: 'popupbanner',
        });

        return record;
      }),
    );

    return records;
  }

  async unassignBannerFromApartment(data: UpdateParams<unassignBannerDto>) {
    const { id, loggedUserData, postData } = data;
    const { apartmentId } = postData;

    const banner = await this.prisma.adminPopUpBanner.findUnique({
      where: { id },
    });

    if (!banner) throw new NotFoundException('Banner not found');

    const apartment = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!apartment) throw new NotFoundException('Apartment not found');

    const existingRecord = await this.prisma.apartmentPopUpBanner.findUnique({
      where: {
        apartmentId_bannerId: {
          apartmentId,
          bannerId: id,
        },
      },
    });

    if (!existingRecord)
      throw new NotFoundException('Banner not assigned to this apartment');

    await this.prisma.adminPopUpBanner.update({
      where: { id },
      data: {
        activated: !banner.activated,
        updatedById: loggedUserData.id,
      },
    });

    const response = await this.prisma.apartmentPopUpBanner.delete({
      where: {
        apartmentId_bannerId: {
          apartmentId,
          bannerId: id,
        },
      },
    });

    await this.activity.create({
      loggedUserData,
      message: `Unassigned popup banner from apartment ${apartment.name}`,
      type: 'popupbanner',
    });

    return response;
  }
}
