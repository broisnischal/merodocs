import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { getVideoSectionDto } from './dtos/get-videosection.dto';

@Injectable()
export class VideoSectionService {
  constructor(private readonly prisma: PrismaService) {}

  async getByType(data: getVideoSectionDto) {
    const response = await this.prisma.videoSection.findUnique({
      where: {
        type: data.type,
      },
      select: {
        video: true,
      },
    });
    return response;
  }
}
