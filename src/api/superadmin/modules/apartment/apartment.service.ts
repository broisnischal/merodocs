import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { UpdateParams } from '../../common/interface';
import { updateApartmentDto } from 'src/api/admin/modules/apartment_detail/apartment/dtos/update-apartment.dto';

@Injectable()
export class ApartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async update(data: UpdateParams<updateApartmentDto>) {
    const { id, postData } = data;

    const { name, area, city, country, postalcode, province } = postData;

    const exist = await this.prisma.apartment.findUnique({
      where: { id },
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
        id,
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

    return apartment;
  }

  async getAll() {
    const apartments = await this.prisma.apartment.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return apartments;
  }
}
