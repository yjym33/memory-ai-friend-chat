import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule],
})
export class UsersModule {
  private readonly logger = new Logger(UsersModule.name);

  constructor() {
    this.logger.debug('[UsersModule] Constructor 실행');
  }
}
