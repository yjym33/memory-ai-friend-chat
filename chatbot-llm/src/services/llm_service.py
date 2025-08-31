"""
LLM 핵심 서비스
OpenAI API 호출과 메모리 관리를 담당합니다.
"""

import time
from typing import List, Optional, Dict, Any
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage
from ..config.settings import settings
from ..config.logging import get_logger, performance_logger
from ..models.chat_models import Message, AiSettings, ChatRequest, ChatResponse, Choice, Usage
from ..services.memory_service import memory_manager
from ..utils.prompt_builder import prompt_builder

logger = get_logger(__name__)


class LLMService:
    """LLM 서비스 클래스"""
    
    def __init__(self):
        self.chat_model = ChatOpenAI(
            openai_api_key=settings.openai_api_key,
            model_name=settings.openai_model,
            temperature=settings.openai_temperature,
            max_tokens=settings.openai_max_tokens,
        )
        self.logger = get_logger(__name__)
    
    async def generate_response(
        self,
        request: ChatRequest,
        user_id: Optional[str] = None
    ) -> ChatResponse:
        """
        LLM 응답 생성
        
        Args:
            request: 채팅 요청
            user_id: 사용자 ID (선택사항)
        
        Returns:
            생성된 응답
        """
        
        start_time = time.time()
        
        try:
            # 사용자 메모리 가져오기
            user_memory = None
            if user_id:
                user_memory = memory_manager.get_user_memory(user_id)
            
            # 대화 컨텍스트 업데이트
            conversation_context = self._prepare_conversation_context(request, user_memory)
            
            # 개인화된 시스템 프롬프트 생성
            system_prompt = self._create_system_prompt(request, user_memory, conversation_context)
            
            # LangChain 메시지로 변환
            messages = self._convert_to_langchain_messages(system_prompt, request.messages)
            
            # LLM 호출
            response = await self._call_llm(messages, request)
            
            # 메모리 업데이트
            memory_updated = self._update_memory(request, response, user_memory)
            
            # 성능 로깅
            execution_time = time.time() - start_time
            performance_logger.info(
                f"LLM 응답 생성 완료 - "
                f"사용자: {user_id}, "
                f"모델: {request.model}, "
                f"실행시간: {execution_time:.2f}초"
            )
            
            return ChatResponse(
                choices=[
                    Choice(
                        message=Message(
                            role="assistant",
                            content=response.content
                        )
                    )
                ],
                model=request.model,
                usage=Usage(
                    prompt_tokens=getattr(response, 'prompt_tokens', 0),
                    completion_tokens=getattr(response, 'completion_tokens', 0),
                    total_tokens=getattr(response, 'total_tokens', 0)
                ),
                conversation_id=request.conversation_id,
                memory_updated=memory_updated
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            self.logger.error(
                f"LLM 응답 생성 실패 - "
                f"사용자: {user_id}, "
                f"실행시간: {execution_time:.2f}초, "
                f"에러: {str(e)}"
            )
            raise
    
    def _prepare_conversation_context(
        self,
        request: ChatRequest,
        user_memory: Optional[Any] = None
    ) -> List[Message]:
        """대화 컨텍스트 준비"""
        
        if not user_memory or not request.conversation_id:
            return request.messages
        
        # 기존 컨텍스트 가져오기
        existing_context = user_memory.get_conversation_context(request.conversation_id)
        
        # 새로운 메시지와 결합
        all_messages = existing_context + request.messages
        
        # 컨텍스트 업데이트
        user_memory.update_conversation_context(request.conversation_id, all_messages)
        
        return all_messages
    
    def _create_system_prompt(
        self,
        request: ChatRequest,
        user_memory: Optional[Any] = None,
        conversation_context: Optional[List[Message]] = None
    ) -> str:
        """시스템 프롬프트 생성"""
        
        if request.aiSettings:
            self.logger.debug(f"AI 설정 기반 프롬프트 생성: {request.aiSettings.personalityType}")
            return prompt_builder.create_personalized_system_prompt(
                request.aiSettings,
                user_memory,
                conversation_context
            )
        else:
            self.logger.debug("기본 프롬프트 사용")
            return "당신은 도움이 되는 AI 친구 루나입니다."
    
    def _convert_to_langchain_messages(
        self,
        system_prompt: str,
        messages: List[Message]
    ) -> List:
        """LangChain 메시지로 변환"""
        
        langchain_messages = [SystemMessage(content=system_prompt)]
        
        for msg in messages:
            if msg.role == "system":
                continue
            elif msg.role == "user":
                langchain_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                langchain_messages.append(AIMessage(content=msg.content))
        
        self.logger.debug(f"LangChain 메시지 변환 완료 - 총 {len(langchain_messages)}개")
        return langchain_messages
    
    async def _call_llm(self, messages: List, request: ChatRequest):
        """LLM 호출"""
        
        try:
            # 모델 설정 업데이트
            self.chat_model.temperature = request.temperature
            self.chat_model.max_tokens = request.max_tokens
            
            # LLM 호출
            response = self.chat_model.invoke(messages)
            
            self.logger.debug(f"LLM 응답 생성 완료: {response.content[:100]}...")
            return response
            
        except Exception as e:
            self.logger.error(f"LLM 호출 실패: {str(e)}")
            raise
    
    def _update_memory(
        self,
        request: ChatRequest,
        response: Any,
        user_memory: Optional[Any] = None
    ) -> bool:
        """메모리 업데이트"""
        
        if not user_memory:
            return False
        
        try:
            # 사용자 메시지를 단기 메모리에 추가
            for msg in request.messages:
                if msg.role == "user":
                    # 메시지 중요도 평가 (간단한 구현)
                    importance = self._evaluate_message_importance(msg.content)
                    user_memory.add_short_term_memory(msg, importance)
            
            # AI 응답을 단기 메모리에 추가
            ai_message = Message(
                role="assistant",
                content=response.content
            )
            user_memory.add_short_term_memory(ai_message, importance=2)
            
            # 중요한 정보를 장기 메모리에 추가
            important_info = self._extract_important_info(request.messages, response.content)
            if important_info:
                user_memory.add_long_term_memory(
                    important_info,
                    importance=7,
                    memory_type="conversation"
                )
            
            self.logger.debug("메모리 업데이트 완료")
            return True
            
        except Exception as e:
            self.logger.error(f"메모리 업데이트 실패: {str(e)}")
            return False
    
    def _evaluate_message_importance(self, content: str) -> int:
        """메시지 중요도 평가 (1-10)"""
        
        # 간단한 키워드 기반 중요도 평가
        important_keywords = [
            "사랑", "결혼", "이별", "죽음", "병", "취업", "면접", "시험", "합격", "실패",
            "목표", "꿈", "희망", "절망", "스트레스", "우울", "기쁨", "행복", "가족",
            "친구", "관계", "갈등", "화해", "용서", "감사", "미안", "축하"
        ]
        
        content_lower = content.lower()
        importance = 1
        
        for keyword in important_keywords:
            if keyword in content_lower:
                importance += 2
        
        # 길이 기반 보정
        if len(content) > 100:
            importance += 1
        
        return min(importance, 10)
    
    def _extract_important_info(self, messages: List[Message], ai_response: str) -> Optional[str]:
        """중요한 정보 추출"""
        
        # 간단한 구현: 사용자가 언급한 개인적 정보나 감정 상태를 추출
        important_patterns = [
            "내 이름은", "저는", "제가", "나는", "저희", "우리",
            "좋아하는", "싫어하는", "관심있는", "하고 싶은",
            "힘들어", "기뻐", "슬퍼", "화나", "걱정", "스트레스"
        ]
        
        for msg in messages:
            if msg.role == "user":
                for pattern in important_patterns:
                    if pattern in msg.content:
                        return f"사용자 정보: {msg.content}"
        
        return None
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """메모리 통계 반환"""
        return memory_manager.get_memory_stats()
    
    def cleanup_memories(self) -> None:
        """오래된 메모리 정리"""
        memory_manager.cleanup_all_memories()


# 전역 LLM 서비스 인스턴스
llm_service = LLMService()
