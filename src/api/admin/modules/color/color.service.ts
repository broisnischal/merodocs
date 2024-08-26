import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { UpdateParams } from 'src/api/admin/common/interface';

@Injectable()
export class ColorService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const color = await this.prisma.color.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return color;
  }

  async update(data: UpdateParams<undefined>) {
    const { id, apartmentId } = data;

    const valid = await this.prisma.color.findFirst({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Color doesnot exist');

    const color = await this.prisma.apartment.update({
      where: { id: apartmentId },
      data: {
        colorId: id,
      },
    });

    return color.id;
  }

  async restore(data: UpdateParams<undefined>) {
    const { apartmentId } = data;

    const color = await this.prisma.apartment.update({
      where: { id: apartmentId },
      data: {
        colorId: null,
      },
    });

    return color.id;
  }
}
