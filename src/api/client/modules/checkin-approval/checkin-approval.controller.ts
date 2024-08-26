import { Body, Controller, Get, Put } from '@nestjs/common';
import { CheckInApprovalService } from './checkin-approval.service';
import { HttpResponse } from 'src/common/utils';
import { FlatClientUser } from '../../common/decorators';
import { ParamId } from 'src/common/decorators';
import { UpdateCheckInDto } from './dto/update-checkin.dto';

@Controller('checkin')
export class CheckInApprovalController {
  constructor(private readonly service: CheckInApprovalService) {}

  @Get(':id')
  async getCheckInRequest(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
  ): Promise<HttpResponse> {
    const data = await this.service.getCheckInRequest({ id, user });

    return new HttpResponse({
      message: 'Data listed successfully',
      data,
    });
  }

  @Put(':id')
  async updateCheckInStatus(
    @ParamId() id: string,
    @FlatClientUser() user: FlatClientUserAuth,
    @Body() body: UpdateCheckInDto,
  ): Promise<HttpResponse> {
    const data = await this.service.updateCheckInStatus({
      id,
      body,
      user,
    });
    return new HttpResponse({
      data,
    });
  }
}
