import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  UpdateParams,
} from '../../common/interface';
import { createVechileDto, vehicleEntryDto } from './dtos';
import { AWSStorageService } from 'src/global/aws/aws.service';

@Injectable()
export class VehicleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async createVehicleType(data: CreateParams<createVechileDto>) {
    const { apartmentId, postData } = data;

    const { name } = postData;

    const unique = await this.prisma.vehicleList.findFirst({
      where: { name, apartmentId },
    });

    if (unique) throw new ConflictException('Name already exist');

    const vehicle = await this.prisma.vehicleList.create({
      data: {
        name,
        apartmentId,
      },
    });

    return vehicle;
  }

  async getVehicleType(data: GetAllParams) {
    const { apartmentId } = data;

    const vehicle = await this.prisma.vehicleList.findMany({
      where: {
        OR: [{ forAll: true }, { apartmentId }],
      },
      select: {
        id: true,
        name: true,
        image: { select: { url: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return vehicle;
  }

  async createVehicleEntry(
    data: CreateParams<vehicleEntryDto & { image: Express.Multer.File }>,
  ) {
    const { apartmentId, postData, loggedUserData } = data;

    const { name, contact, isFrequent, vehicleId, vehicleNo } = postData;

    console.log(isFrequent)

    const valid = await this.prisma.vehicleList.findUnique({
      where: { id: vehicleId, OR: [{ forAll: true }, { apartmentId }] },
    });

    if (!valid) throw new NotFoundException('Vehicle Type doesnot exist.');

    const image = await this.awsService.uploadToS3(postData.image);

    const vehicle = await this.prisma.vehicleEntry.create({
      data: {
        vehicleId,
        name,
        contact,
        apartmentId,
        isFrequent: !!isFrequent,
        vehicleNumber: vehicleNo,
        checkInOuts: {
          create: {
            apartmentId,
            type: 'checkin',
            requestType: 'vehicle',
            createdByType: 'guard',
            createdByGuardId: loggedUserData.id,
            surveillanceId: loggedUserData.defaultSurveillanceId
              ? loggedUserData.defaultSurveillanceId
              : loggedUserData.surveillanceId,
            image: image.url,
          },
        },
      },
    });

    return vehicle;
  }

  async createFrequentVehicleEntry(data: UpdateParams<undefined>) {
    const { apartmentId, id, loggedUserData } = data;

    const valid = await this.prisma.vehicleEntry.findUnique({
      where: { id, apartmentId },
      include: { checkInOuts: true },
    });

    if (!valid) throw new NotFoundException('Vehicle Type doesnot exist.');

    const vehicle = await this.prisma.checkInOut.create({
      data: {
        vehicleId: valid.id,
        apartmentId,
        type: 'checkin',
        requestType: 'vehicle',
        createdByType: 'guard',
        createdByGuardId: loggedUserData.id,
        surveillanceId: loggedUserData.defaultSurveillanceId
          ? loggedUserData.defaultSurveillanceId
          : loggedUserData.surveillanceId,
        image: valid.checkInOuts[0].image,
      },
    });

    return vehicle;
  }

  async getVehicleFrequent(data: GetAllParams) {
    const { apartmentId, q } = data;

    const vehicle = await this.prisma.vehicleEntry.findMany({
      where: {
        apartmentId,
        isFrequent: true,
        vehicleNumber: {
          contains: q || undefined,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        vehicle: {
          select: {
            image: { select: { url: true } },
            name: true,
          },
        },
        vehicleNumber: true,
        contact: true,
        checkInOuts: { select: { image: true }, take: 1 },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = vehicle.map((i) => {
      return { ...i,  checkInOuts: undefined, ...(i.checkInOuts[0] ? {
        image: i.checkInOuts[0].image
      } : {
        image: null
      }) };
    });

    return result;
  }

  async delete(data: DeleteParams) {
    const { apartmentId, id } = data;

    const vehicle = await this.prisma.vehicleEntry.findFirst({
      where: {
        id,
        apartmentId,
        isFrequent: true,
      },
    });

    if (!vehicle) throw new NotFoundException('Vehicle doesnot exist');

    const update = await this.prisma.vehicleEntry.update({
      where: { id: vehicle.id },
      data: { isFrequent: false },
    });

    return update;
  }
}
