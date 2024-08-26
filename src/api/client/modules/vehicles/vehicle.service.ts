import { Injectable, NotFoundException } from '@nestjs/common';
import { FileService } from 'src/global/file/file.service';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { AssignedUserParam } from '../../common/interfaces';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehicleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async getAllVehicles({ user }: AssignedUserParam.GetAll) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        flatId: user.flatId,
        clientUser: {
          currentFlats: {
            some: {
              flatId: user.flatId,
            },
          },
        },
      },
      include: {
        image: {
          select: {
            url: true,
            name: true,
            id: true,
          },
        },
      },
    });

    return vehicles;
  }

  async createVehicle({
    body,
    user,
  }: AssignedUserParam.Create<
    CreateVehicleDto & {
      file?: Express.Multer.File;
    }
  >) {
    const newVehicle = await this.prisma.vehicle.create({
      data: {
        noplate: body.noplate,
        type: body.type,
        name: body.name,
        clientUserId: user.id,
        flatId: user.flatId,
      },
    });

    if (!body.file) return newVehicle;

    const ress = await this.fileService.create({
      file: body.file,
      type: 'image',
    });

    await this.prisma.vehicle.update({
      where: {
        id: newVehicle.id,
      },
      data: {
        image: {
          connect: {
            id: ress.id,
          },
        },
      },
    });

    return newVehicle;
  }

  async updateVehicle({
    body,
    id,
    user,
  }: AssignedUserParam.Update<
    UpdateVehicleDto & {
      file?: Express.Multer.File;
    }
  >) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        id,
        flatId: user.flatId,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.clientUserId !== user.id)
      throw new NotFoundException('Not allowed to update this vehicle.');

    const newVehicle = await this.prisma.vehicle.update({
      where: {
        id,
      },
      data: {
        name: body.name,
        noplate: body.noplate,
        type: body.type,
      },
    });

    if (body.file) {
      const file = await this.fileService.createOrUpdate({
        file: body.file,
        type: 'image',
      });

      await this.prisma.vehicle.update({
        where: {
          id: newVehicle.id,
        },
        data: {
          image: {
            connect: {
              id: file.id,
            },
          },
        },
      });
    }

    return newVehicle;
  }

  async upload({
    id,
    body,
    user,
  }: AssignedUserParam.Update<Express.Multer.File>) {
    const newVehicle = await this.prisma.vehicle.findUnique({
      where: {
        id,
        clientUserId: user.id,
        flatId: user.flatId,
      },
    });

    if (!newVehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (newVehicle.clientUserId !== user.id)
      throw new NotFoundException('Not allowed to upload this vehicle.');

    const upload = await this.fileService.createOrUpdate({
      type: 'image',
      file: body,
    });

    await this.prisma.vehicle.update({
      where: {
        id: newVehicle.id,
      },
      data: {
        image: {
          connect: {
            id: upload.id,
          },
        },
      },
    });

    return newVehicle;
  }

  async deleteVehicle({ id, user }: AssignedUserParam.Delete) {
    const existsVehicle = await this.prisma.vehicle.findUnique({
      where: {
        id,
        flatId: user.flatId,
      },
    });

    if (!existsVehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (existsVehicle.clientUserId !== user.id)
      throw new NotFoundException('Not allowed to delete this vehicle.');

    await this.prisma.vehicle.delete({
      where: {
        id,
      },
    });
  }
}
