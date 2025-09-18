import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../auth/entity/user.entity';
import { Organization } from '../auth/entity/organization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
