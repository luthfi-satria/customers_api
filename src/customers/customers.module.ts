import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { AuthService } from 'src/utils/auth.service';
import { ImageValidationService } from 'src/utils/image-validation.service';
// import { HashModule } from 'src/hash/hash.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileDocument]), HttpModule],
  exports: [CustomersService],
  providers: [CustomersService, AuthService, ImageValidationService],
  controllers: [CustomersController],
})
export class CustomersModule {}
