import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  UpdateParams,
} from 'src/api/superadmin/common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { AWSStorageService } from 'src/global/aws/aws.service';
import { NotFoundException } from '@nestjs/common';
import { createTeamMemberDto, updateTeamMemberDto } from './dtos/index.dto';

@Injectable()
export class TeamMemberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AWSStorageService,
  ) {}

  async create(
    data: CreateParams<
      createTeamMemberDto & {
        file: Express.Multer.File;
      }
    >,
  ) {
    const { postData } = data;

    const { name, designation, file } = postData;

    const image = (await this.awsService.uploadToS3WithSameFormat(file)).url;

    await this.prisma.teamMember.create({
      data: {
        name,
        designation,
        image,
      },
    });
  }

  async getAll(data: GetAllParams) {
    const reviews = await this.prisma.teamMember.findMany({
      where:
        data.filter === 'archive'
          ? { archive: true }
          : data.filter === 'featured'
            ? {
                featured: true,
              }
            : {},
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reviews;
  }

  async update(
    data: UpdateParams<
      updateTeamMemberDto & {
        file: Express.Multer.File;
      }
    >,
  ) {
    const { postData, id } = data;

    const { name, designation, file } = postData;
    let image: string | undefined;

    const valid = await this.prisma.teamMember.findUnique({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Member does not exist');

    if (file) {
      await this.awsService.deleteFromS3(valid.image!);
      image = (await this.awsService.uploadToS3WithSameFormat(file)).url;
    }

    await this.prisma.teamMember.update({
      where: { id },
      data: {
        name,
        designation,
        image,
      },
    });
  }

  async featureOrUnfeature(data: UpdateParams<undefined>) {
    const { id } = data;

    const valid = await this.prisma.teamMember.findUnique({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Member does not exist');

    if (valid.archive)
      throw new BadRequestException('Cannot feature archived members');

    const updated = await this.prisma.teamMember.update({
      where: { id },
      data: {
        featured: !valid.featured,
      },
    });

    return updated;
  }

  async archiveOrUnarchive(data: UpdateParams<undefined>) {
    const { id } = data;

    const valid = await this.prisma.teamMember.findUnique({
      where: { id },
    });

    if (!valid) throw new NotFoundException('Member does not exist');

    const updated = await this.prisma.teamMember.update({
      where: { id },
      data: {
        featured: false,
        archive: !valid.archive,
      },
    });

    return updated;
  }

  async delete(data: DeleteParams) {
    const { id } = data;

    const valid = await this.prisma.teamMember.findUnique({
      where: { id, archive: true },
    });

    if (!valid) throw new NotFoundException('Member does not exist');

    if (valid.image) await this.awsService.deleteFromS3(valid.image);

    await this.prisma.teamMember.delete({
      where: { id },
    });
  }
}
