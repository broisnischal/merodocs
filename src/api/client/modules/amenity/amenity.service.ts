import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { AssignedUserParam } from '../../common/interfaces';

@Injectable()
export class AmenityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll({ user: { apartmentId } }: AssignedUserParam.GetAll) {
    const amenityArray = await this.prisma.amenity.existMany(apartmentId, {
      where: {
        archive: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        location: true,
        openTime: true,
        closeTime: true,
        always: true,
        image: {
          select: { url: true },
        },
      },
    });

    const amenities = amenityArray.map((item) => ({
      ...item,
      openTime: !item.always ? item.openTime : undefined,
      closeTime: !item.always ? item.closeTime : undefined,
    }));

    return amenities;
  }
}
