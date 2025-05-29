import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationAnalyticsController } from './conversation-analytics.controller';
import { ConversationAnalyticsService } from './conversation-analytics.service';
import { Conversation } from '../chat/entity/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation])],
  controllers: [ConversationAnalyticsController],
  providers: [ConversationAnalyticsService],
  exports: [ConversationAnalyticsService],
})
export class ConversationAnalyticsModule {}
