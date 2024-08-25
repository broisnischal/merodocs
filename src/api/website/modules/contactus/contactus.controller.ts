import { Body, Controller, Post } from '@nestjs/common';
import { createContactUsDto } from './dto/create-contactus.dto';
import { ContactUsService } from './contactus.service';
import { HttpResponse } from 'src/common/utils';
// import { ThrottlerBehindProxyGuard } from 'src/common/guards';

// @UseGuards(ThrottlerBehindProxyGuard)
@Controller('contactus')
export class ContactUsController {
  constructor(private readonly service: ContactUsService) {}

  @Post()
  async create(@Body() postData: createContactUsDto): Promise<HttpResponse> {
    const data = await this.service.create({ postData });

    return new HttpResponse({
      message: 'Contact us created successfully',
      data,
    });
  }
}
