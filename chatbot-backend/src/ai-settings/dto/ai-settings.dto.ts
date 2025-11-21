import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { LLMProvider } from '../../llm/types/llm.types';

export class CreateAiSettingsDto {
  @IsString()
  personalityType: string;

  @IsString()
  speechStyle: string;

  @IsNumber()
  emojiUsage: number;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsNumber()
  empathyLevel: number;

  @IsNumber()
  memoryRetentionDays: number;

  @IsObject()
  memoryPriorities: {
    personal: number;
    hobby: number;
    work: number;
    emotion: number;
  };

  @IsObject()
  userProfile: {
    interests: string[];
    currentGoals: string[];
    importantDates: { name: string; date: string }[];
  };

  @IsArray()
  avoidTopics: string[];

  @IsOptional()
  @IsEnum(LLMProvider)
  llmProvider?: LLMProvider;

  @IsOptional()
  @IsString()
  llmModel?: string;

  @IsOptional()
  @IsObject()
  llmConfig?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
    [key: string]: any;
  };
}

export class UpdateAiSettingsDto extends CreateAiSettingsDto {}
