import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { ProfileDocument } from 'src/database/entities/profile.entity';
import { AuthService } from 'src/utils/auth.service';
// import { HashModule } from 'src/hash/hash.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileDocument]), HttpModule],
  exports: [CustomersService],
  providers: [CustomersService, AuthService],
  controllers: [CustomersController],
})
export class CustomersModule {}
