import { ClientModule } from './api/client/client.module';
import { SuperadminModule } from './api/superadmin/superadmin.module';
import { ConsoleLogger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './api/admin/admin.module';
import { JwtModule } from './jwt/jwt.module';
import { SocketGateway } from './socket/socket.gateway';
import { GlobalModule } from './global/global.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, RoleGuard } from './common/guards';
import { GuardModule } from './api/guard/guard.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './global/scheduler/scheduler.service';
import { WebsiteModule } from './api/website/website.module';

@Module({
  imports: [
    SuperadminModule,
    GlobalModule,
    AdminModule,
    JwtModule,
    ClientModule,
    GuardModule,
    WebsiteModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SchedulerService,
    ConsoleLogger,
    SocketGateway,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}
