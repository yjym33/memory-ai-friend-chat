"""
프롬프트 빌더 유틸리티
AI 설정과 메모리를 기반으로 개인화된 프롬프트를 생성합니다.
"""

from typing import List, Optional
from ..models.chat_models import AiSettings, Message
from ..services.memory_service import ConversationMemory
from ..config.logging import get_logger

logger = get_logger(__name__)


class PromptBuilder:
    """개인화된 프롬프트 생성 클래스"""
    
    def __init__(self):
        self.logger = get_logger(__name__)
    
    def create_personalized_system_prompt(
        self,
        ai_settings: AiSettings,
        user_memory: Optional[ConversationMemory] = None,
        conversation_context: Optional[List[Message]] = None
    ) -> str:
        """
        개인화된 시스템 프롬프트 생성
        
        Args:
            ai_settings: AI 설정
            user_memory: 사용자 메모리 (선택사항)
            conversation_context: 대화 컨텍스트 (선택사항)
        
        Returns:
            개인화된 시스템 프롬프트
        """
        
        # 기본 성격 및 말투 설정
        base_prompt = self._create_base_personality_prompt(ai_settings)
        
        # 사용자 정보 추가
        if user_memory:
            user_info_prompt = self._create_user_info_prompt(user_memory)
            base_prompt += f"\n\n{user_info_prompt}"
        
        # 관련 메모리 추가
        if user_memory and conversation_context:
            memory_prompt = self._create_memory_prompt(user_memory, conversation_context)
            if memory_prompt:
                base_prompt += f"\n\n{memory_prompt}"
        
        # 대화 컨텍스트 추가
        if conversation_context:
            context_prompt = self._create_context_prompt(conversation_context)
            base_prompt += f"\n\n{context_prompt}"
        
        self.logger.debug(f"개인화된 프롬프트 생성 완료 (길이: {len(base_prompt)} 문자)")
        return base_prompt
    
    def _create_base_personality_prompt(self, ai_settings: AiSettings) -> str:
        """기본 성격 및 말투 프롬프트 생성"""
        
        personality = ai_settings.personalityType
        speech_style = ai_settings.speechStyle
        emoji_usage = ai_settings.emojiUsage
        empathy_level = ai_settings.empathyLevel
        nickname = ai_settings.nickname or "친구"
        
        # 말투 강제 적용을 위한 명확한 지시
        speech_instruction = self._get_speech_instruction(speech_style)
        
        # 성격별 구체적 지시
        personality_instruction = self._get_personality_instruction(personality)
        
        # 이모티콘 지시
        emoji_instruction = self._get_emoji_instruction(emoji_usage)
        
        # 공감 수준 지시
        empathy_instruction = self._get_empathy_instruction(empathy_level)
        
        # 피해야 할 주제
        avoid_topics_instruction = ""
        if ai_settings.avoidTopics:
            avoid_topics_instruction = f"\n\n🚫 피해야 할 주제: {', '.join(ai_settings.avoidTopics)}"
        
        system_prompt = f"""
당신은 '{nickname}'의 AI 친구 '루나'입니다.

{speech_instruction}

🎭 성격: {personality_instruction} 대화하세요.

😊 이모티콘: {emoji_instruction}

💕 공감: {empathy_instruction}

{avoid_topics_instruction}

💬 대화 예시:
사용자: "오늘 힘든 일이 있었어"
{speech_style} 응답: "{self._get_example_response(speech_style, personality)}"

⚠️ 절대 지켜야 할 규칙:
1. {speech_style}을 절대 바꾸지 마세요
2. {personality} 성격을 일관되게 유지하세요  
3. 진짜 친구처럼 개인적이고 따뜻하게 대화하세요
4. 단답형보다는 관심을 보이며 대화를 이어가세요
5. 사용자의 감정에 공감하고 적절한 위로를 제공하세요

지금부터 {nickname}와 {speech_style}로 {personality} 성격으로 대화를 시작합니다!
"""
        
        return system_prompt
    
    def _get_speech_instruction(self, speech_style: str) -> str:
        """말투 지시사항 생성"""
        if speech_style == "반말":
            return """
⚠️ 중요: 반드시 반말로만 대화하세요!
- "안녕하세요" ❌ → "안녕!" ✅
- "어떻게 지내시나요?" ❌ → "어떻게 지내?" ✅  
- "도움이 되었기를 바랍니다" ❌ → "도움이 됐으면 좋겠어" ✅
- "감사합니다" ❌ → "고마워" ✅
"""
        else:
            return """
⚠️ 중요: 반드시 격식체(존댓말)로만 대화하세요!
- "안녕!" ❌ → "안녕하세요" ✅
- "어떻게 지내?" ❌ → "어떻게 지내시나요?" ✅
"""
    
    def _get_personality_instruction(self, personality: str) -> str:
        """성격별 지시사항 생성"""
        personality_instructions = {
            "친근함": "매우 친근하고 편안한 톤으로, 마치 오랜 친구와 대화하듯이",
            "차분함": "차분하고 안정적인 톤으로, 신중하게",
            "활발함": "밝고 에너지 넘치는 톤으로, 긍정적이고 활기차게",
            "따뜻함": "따뜻하고 포근한 톤으로, 위로가 되도록"
        }
        return personality_instructions.get(personality, "친근하고 따뜻하게")
    
    def _get_emoji_instruction(self, emoji_usage: int) -> str:
        """이모티콘 사용 지시사항 생성"""
        if emoji_usage >= 4:
            return "이모티콘을 자주 사용해서 감정을 풍부하게 표현하세요. (예: 😊, 😢, 🎉, 💕, 👍 등)"
        elif emoji_usage >= 3:
            return "이모티콘을 적당히 사용해서 감정을 표현하세요."
        else:
            return "이모티콘 사용을 최소화하세요."
    
    def _get_empathy_instruction(self, empathy_level: int) -> str:
        """공감 수준 지시사항 생성"""
        empathy_instructions = {
            1: "기본적인 공감을 표현하세요.",
            2: "적당한 공감과 관심을 보이세요.",
            3: "따뜻한 공감과 위로를 제공하세요.",
            4: "깊은 공감과 정서적 지지를 제공하세요.",
            5: "매우 깊은 공감과 치유적인 대화를 제공하세요."
        }
        return empathy_instructions.get(empathy_level, "적당한 공감과 관심을 보이세요.")
    
    def _get_example_response(self, speech_style: str, personality: str) -> str:
        """예시 응답 생성"""
        if speech_style == "반말":
            return "어떤 일이었어? 힘들었구나 😢 이야기 들어줄게"
        else:
            return "어떤 일이 있으셨나요? 힘드셨겠어요 😢 이야기 들어드릴게요"
    
    def _create_user_info_prompt(self, user_memory: ConversationMemory) -> str:
        """사용자 정보 프롬프트 생성"""
        user_preferences = user_memory.get_user_preferences()
        
        if not user_preferences:
            return ""
        
        user_info = []
        
        # 관심사
        if "interests" in user_preferences:
            interests = user_preferences["interests"]
            if interests:
                user_info.append(f"관심사: {', '.join(interests)}")
        
        # 현재 목표
        if "current_goals" in user_preferences:
            goals = user_preferences["current_goals"]
            if goals:
                user_info.append(f"현재 목표: {', '.join(goals)}")
        
        # 선호하는 대화 주제
        if "preferred_topics" in user_preferences:
            topics = user_preferences["preferred_topics"]
            if topics:
                user_info.append(f"선호 주제: {', '.join(topics)}")
        
        if user_info:
            return f"📋 사용자 정보:\n" + "\n".join(f"- {info}" for info in user_info)
        
        return ""
    
    def _create_memory_prompt(
        self,
        user_memory: ConversationMemory,
        conversation_context: List[Message]
    ) -> str:
        """메모리 기반 프롬프트 생성"""
        if not conversation_context:
            return ""
        
        # 현재 대화의 마지막 메시지를 컨텍스트로 사용
        current_context = conversation_context[-1].content if conversation_context else ""
        
        # 관련 메모리 검색
        relevant_memories = user_memory.retrieve_relevant_memories(
            current_context,
            limit=3,
            memory_types=["conversation", "user_info", "preference"]
        )
        
        if not relevant_memories:
            return ""
        
        memory_prompt = "🧠 관련 기억:\n"
        for i, memory in enumerate(relevant_memories, 1):
            memory_prompt += f"{i}. {memory.content}\n"
        
        memory_prompt += "\n위 기억들을 참고하여 일관성 있는 대화를 이어가세요."
        
        return memory_prompt
    
    def _create_context_prompt(self, conversation_context: List[Message]) -> str:
        """대화 컨텍스트 프롬프트 생성"""
        if not conversation_context:
            return ""
        
        # 최근 3개 메시지만 포함
        recent_messages = conversation_context[-3:] if len(conversation_context) > 3 else conversation_context
        
        context_prompt = "💬 최근 대화 맥락:\n"
        for msg in recent_messages:
            role_emoji = "👤" if msg.role == "user" else "🤖"
            context_prompt += f"{role_emoji} {msg.content}\n"
        
        context_prompt += "\n위 맥락을 고려하여 자연스럽게 대화를 이어가세요."
        
        return context_prompt


# 전역 프롬프트 빌더 인스턴스
prompt_builder = PromptBuilder()
