import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { Emotion } from './entities/emotion.entity';
import { Goal } from './entities/goal.entity';
import { AiSettings } from '../ai-settings/entity/ai-settings.entity';
import { Conversation } from '../chat/entity/conversation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Emotion, Goal, AiSettings, Conversation]),
  ],
  providers: [AgentService],
  controllers: [AgentController],
  exports: [AgentService],
})
export class AgentModule {}
