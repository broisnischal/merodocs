import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { CreateParams } from '../../common/interface/website.interface';
import { createContactUsDto } from './dto/create-contactus.dto';

@Injectable()
export class ContactUsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateParams<createContactUsDto>) {
    const { postData } = data;
    const { email, fullName, message, number, role, societyName } = postData;

    const response = await this.prisma.contactUs.create({
      data: {
        email,
        fullName,
        message,
        number,
        role,
        societyName,
      },
    });

    return response;
  }
}
