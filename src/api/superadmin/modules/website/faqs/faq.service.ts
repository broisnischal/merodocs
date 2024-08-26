import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateParams,
  DeleteParams,
  GetAllParams,
  UpdateParams,
} from '../../../common/interface';
import { PrismaService } from 'src/global/prisma/prisma.service';
import { createFAQDto } from './dtos/create-faq.dto';
import { updateFAQDto } from './dtos/update-faq.dto';
import { FAQTypeEnum } from '@prisma/client';

@Injectable()
export class FAQService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateParams<createFAQDto>) {
    const { postData } = data;

    const { question, answer, for: faqFor } = postData;

    const count = await this.prisma.fAQ.count({
      where: {
        for: faqFor,
      },
    });

    if (count >= 6) throw new BadRequestException('Maximum limit reached');

    const response = await this.prisma.fAQ.create({
      data: {
        for: faqFor,
        question,
        answer,
      },
    });

    return response;
  }

  async get(
    data: GetAllParams & {
      forType: FAQTypeEnum;
    },
  ) {
    const { forType } = data;

    const faqs = await this.prisma.fAQ.findMany({
      where: {
        for: forType,
      },
    });

    return faqs;
  }

  async update(data: UpdateParams<updateFAQDto>) {
    const { postData, id } = data;

    const { question, answer } = postData;

    const valid = await this.prisma.fAQ.findFirst({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid faq id');

    const response = await this.prisma.fAQ.update({
      where: { id },
      data: {
        question,
        answer,
      },
    });

    return response;
  }

  async delete(data: DeleteParams) {
    const { id } = data;

    const valid = await this.prisma.fAQ.findFirst({
      where: { id },
    });

    if (!valid) throw new BadRequestException('Invalid faq id');

    const response = await this.prisma.fAQ.delete({
      where: { id },
    });

    return response;
  }
}
