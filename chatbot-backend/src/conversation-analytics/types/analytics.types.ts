export interface ConversationInsight {
  date: string;
  emotion: 'positive' | 'negative' | 'neutral';
  topics: string[];
  keyWords: string[];
  messageCount: number;
  userInitiated: boolean;
}

export interface RelationshipMilestone {
  date: string;
  type:
    | 'first_conversation'
    | 'personal_share'
    | 'goal_achievement'
    | 'emotional_support';
  title: string;
  description: string;
  conversationId: number;
}

export interface AnalyticsResult {
  insights: ConversationInsight[];
  milestones: RelationshipMilestone[];
  emotionTimeline: { date: string; score: number }[];
  topicEvolution: { [topic: string]: { dates: string[]; frequency: number } };
  totalConversations: number;
  relationshipDuration: number;
  favoriteTopics: { topic: string; count: number }[];
  emotionalJourney: string;
}
