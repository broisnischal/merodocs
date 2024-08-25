import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { updateApartmentDto } from './dtos/update-apartment.dto';
import { CreateParams, GetParam } from 'src/api/admin/common/interface';
import { AdminActivityService } from 'src/global/activity/admin-activity.service';

@Injectable()
export class ApartmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityService: AdminActivityService,
  ) {}

  async update(data: CreateParams<updateApartmentDto>) {
    const { postData, apartmentId, loggedUserData } = data;

    const { name, area, city, country, postalcode, province } = postData;
    const exist = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!exist) throw new NotFoundException('Apartment doesnot exist');

    if (name && name !== exist.name) {
      const conflictingApartment = await this.prisma.apartment.findUnique({
        where: { name },
      });

      if (conflictingApartment) {
        throw new ConflictException('Name already exists');
      }
    }

    const apartment = await this.prisma.apartment.update({
      where: {
        id: apartmentId,
      },
      data: {
        name,
        area,
        city,
        country,
        postalcode,
        province,
      },
    });

    await this.activityService.create({
      message: `Updated the apartment ${apartment.name}`,
      type: 'apartment',
      loggedUserData,
    });

    return apartment;
  }

  async get(data: GetParam) {
    const { id } = data;
    const apartment = await this.prisma.apartment.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        country: true,
        province: true,
        city: true,
        area: true,
        postalcode: true,
        createdAt: true,
      },
    });

    if (!apartment) throw new NotFoundException('Apartment does not exist');

    return apartment;
  }

  async getAllList(data: GetParam) {
    const { apartmentId } = data;

    const result = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
      include: {
        blocks: {
          include: {
            floors: {
              include: {
                flats: true,
              },
            },
          },
        },
      },
    });

    if (!result) throw new NotFoundException('Apartment does not exist');

    return result;
  }
}
