import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { RouterModule } from '@nestjs/core';
import { DocumentModule } from './document/document.module';
import { ColorModule } from './color/color.module';

@Module({
  imports: [
    UserModule,
    RoleModule,
    DocumentModule,
    ColorModule,
    RouterModule.register([
      {
        path: 'superadmin/settings',
        children: [UserModule, RoleModule, DocumentModule, ColorModule],
      },
    ]),
  ],
})
export class SettingsModule {}
