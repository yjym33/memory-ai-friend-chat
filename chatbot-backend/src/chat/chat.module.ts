import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Conversation } from './entity/conversation.entity';
import { AuthModule } from '../auth/auth.module';
import { AiSettingsModule } from '../ai-settings/ai-settings.module';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation]),
    AuthModule,
    AiSettingsModule,
    AgentModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
