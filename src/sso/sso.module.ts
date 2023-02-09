import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { SettingDocument } from 'src/database/entities/settings.entity';
import { SettingsService } from 'src/settings/settings.service';
import { SsoService } from './sso.service';
import { SsoController } from './sso.controller';
import { HttpModule } from '@nestjs/axios';
import { MessageService } from 'src/message/message.service';
import { ResponseService } from 'src/response/response.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileDocument, SettingDocument]),
    ScheduleModule.forRoot(),
    ConfigModule,
    HttpModule,
  ],

  providers: [SettingsService, SsoService, MessageService, ResponseService],

  controllers: [SsoController],
})
export class SsoModule {}
