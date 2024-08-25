import { Injectable, NotFoundException } from '@nestjs/common';
import { FileService } from 'src/global/file/file.service';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { AssignedUserParam } from '../../common/interfaces';
import { CreatePetDto, UpdatePetDto } from './dto/pets.dto';

@Injectable()
export class PetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async getAll({ user }: AssignedUserParam.GetAll) {
    const pets = await this.prisma.pet.findMany({
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
          },
        },
      },
    });

    return pets;
  }

  async create({
    user,
    body,
    extend,
  }: AssignedUserParam.Create<
    CreatePetDto,
    {
      file?: Express.Multer.File;
    }
  >) {
    const newPet = await this.prisma.pet.create({
      data: {
        name: body.name,
        flatId: user.flatId,
        clientUserId: user.id,
        age: body.age,
        typee: body.type,
        gender: body.gender,
        breed: body.breed,
      },
    });

    if (extend?.file) {
      const file = await this.fileService.create({
        file: extend.file,
        type: 'image',
      });

      await this.prisma.pet.update({
        where: {
          id: newPet.id,
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

    return newPet;
  }

  async update({
    id,
    body,
    user,
    extend,
  }: AssignedUserParam.Update<
    UpdatePetDto,
    {
      file?: Express.Multer.File;
    }
  >) {
    const exist = await this.prisma.pet.findFirst({
      where: {
        id,
        flatId: user.flatId,
      },
    });

    if (!exist) throw new NotFoundException('Pet not found');

    if (exist.clientUserId !== user.id)
      throw new NotFoundException('Not allowed to update this pet.');

    const newPet = await this.prisma.pet.update({
      where: {
        id,
        flatId: user.flatId,
      },
      data: {
        name: body.name,
        gender: body.gender,
        age: body.age,
        breed: body.breed,
        typee: body.type,
      },
    });

    if (extend?.file) {
      const file = await this.fileService.createOrUpdate({
        file: extend.file,
        type: 'image',
      });

      await this.prisma.vehicle.update({
        where: {
          id: newPet.id,
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

    return newPet;
  }

  async delete({ id, user }: AssignedUserParam.Delete) {
    const existPet = await this.prisma.pet.findUnique({
      where: {
        id,
        flatId: user.flatId,
      },
    });

    if (!existPet) {
      throw new NotFoundException('Pet not found.');
    }

    if (existPet.clientUserId !== user.id)
      throw new NotFoundException('Not allowed to delete this pet.');

    await this.prisma.pet.delete({
      where: {
        id,
      },
    });
  }
}
