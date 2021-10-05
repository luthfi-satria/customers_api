import { DriverType, StorageModule } from '@codebrew/nestjs-storage';
import { Global, HttpModule, Module } from '@nestjs/common';
import { HttpModule as HttpModuleAxios } from '@nestjs/axios';
import { CommonService } from './common.service';
import { NotificationService } from './notification/notification.service';
import { CommonStorageService } from './storage/storage.service';

@Global()
@Module({
  imports: [
    StorageModule.forRoot({
      default: process.env.STORAGE_S3_STORAGE || 'local',
      disks: {
        local: {
          driver: DriverType.LOCAL,
          config: {
            root: process.cwd(),
          },
        },
        s3: {
          driver: DriverType.S3,
          config: {
            key: process.env.STORAGE_S3_KEY || '',
            secret: process.env.STORAGE_S3_SECRET || '',
            bucket: process.env.STORAGE_S3_BUCKET || '',
            region: process.env.STORAGE_S3_REGION || '',
          },
        },
      },
    }),
    HttpModule,
    HttpModuleAxios,
  ],
  providers: [CommonStorageService, CommonService,NotificationService],
  exports: [CommonStorageService, HttpModule],
})
export class CommonModule {}
