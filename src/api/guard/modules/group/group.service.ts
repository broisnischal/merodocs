import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';

import { AWSStorageService } from 'src/global/aws/aws.service';
import { CreateParams, DeleteParams, GetParam } from '../../common/interface';
import { CreateGroupDto } from './dtos';
import { createMultipleGroupDto } from './dtos/multiplegroup.dto';

@Injectable()
export class GroupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async createGroup(
    data: CreateParams<CreateGroupDto & { image: Express.Multer.File }>,
  ) {
    const { apartmentId, loggedUserData, postData } = data;

    const { contact, name, vehicleType, vehicleNo, description, groupId } =
      postData;

    let image;
    if (postData.image) {
      image = await this.awsService.uploadToS3(postData.image);
    }

    const group = await this.prisma.groupEntry.create({
      data: {
        name,
        contact,
        vehicleType,
        description,
        apartmentId,
        groupId,
        checkInOuts: {
          create: {
            apartmentId,
            type: 'checkin',
            requestType: 'group',
            createdByType: 'guard',
            createdByGuardId: loggedUserData.id,
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            image: image ? image.url : undefined,
            vehicleType,
            vehicleNo,
          },
        },
      },
    });

    return group;
  }

  async createMultipleGroup(data: CreateParams<createMultipleGroupDto>) {
    const { postData } = data;

    const groups = await this.prisma.groupEntry.findMany({
      where: {
        id: { in: postData.ids },
      },
    });

    if (groups.length === 0) {
      throw new NotFoundException('No valid group found');
    }

    const group = await this.prisma.groupEntry.updateMany({
      where: {
        id: { in: postData.ids },
      },
      data: {
        isCreated: true,
      },
    });

    return group;
  }
  async getPending(data: GetParam) {
    const { apartmentId, id } = data;

    const group = await this.prisma.groupEntry.findMany({
      where: {
        apartmentId,
        isCreated: false,
        groupId: id,
      },
      select: {
        id: true,
        name: true,
        contact: true,
        checkInOuts: {
          select: { image: true, vehicleNo: true, vehicleType: true },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const transformedGroup = group.map((group) => {
      const { checkInOuts, ...guestData } = group;
      const { image, vehicleNo, vehicleType } = checkInOuts[0] || {};
      return { ...guestData, image, vehicleNo, vehicleType };
    });

    return transformedGroup;
  }

  async deleteGroup(data: DeleteParams) {
    const { apartmentId, id } = data;
    const exists = await this.prisma.groupEntry.findUnique({
      where: {
        id,
        apartmentId,
        isCreated: false,
      },
    });

    if (!exists) {
      throw new NotFoundException('Guest not found');
    }

    const group = await this.prisma.groupEntry.delete({
      where: { id },
    });

    await this.prisma.checkInOut.deleteMany({
      where: {
        groupEntryId: id,
      },
    });

    return group.id;
  }

  // async uploadMultiple(
  //   data: UpdateParams<
  //     updateMultipleGuestDto & { images: Array<Express.Multer.File> }
  //   >,
  // ) {
  //   const { apartmentId, postData } = data;
  //   let { id, images } = postData;

  //   const ids = id.split(',');

  //   if (!images || images.length === 0) {
  //     throw new BadRequestException('No images provided.');
  //   }

  //   if (ids.length !== images.length) {
  //     throw new BadRequestException(
  //       'Number of IDs must match the number of images.',
  //     );
  //   }

  //   const valid = await this.prisma.checkInOut.findMany({
  //     where: {
  //       groupEntryId: {
  //         in: ids,
  //       },
  //       apartmentId: apartmentId,
  //     },
  //   });

  //   const invalidIds = ids.filter(
  //     (id) => !valid.some((entry) => entry.id === id),
  //   );

  //   if (invalidIds.length > 0) {
  //     throw new BadRequestException(`Invalid IDs: ${invalidIds.join(', ')}`);
  //   }

  //   // Upload all images concurrently and associate them with corresponding IDs
  //   const uploadTasks = images.map(async (image, index) => {
  //     const uploadedImage = await this.awsService.uploadToS3(image);

  //     await this.prisma.checkInOut.update({
  //       where: { id: ids[index] },
  //       data: { image: uploadedImage.url },
  //     });

  //     return { id: ids[index], image: uploadedImage };
  //   });

  //   const uploadedImagesWithIds = await Promise.all(uploadTasks);

  //   return uploadedImagesWithIds;
  // }
}
