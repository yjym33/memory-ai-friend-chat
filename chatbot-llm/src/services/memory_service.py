"""
메모리 관리 서비스
대화 기억, 사용자 정보, 컨텍스트를 관리합니다.
"""

import json
import time
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import deque
import hashlib
from ..config.logging import get_logger
from ..config.settings import settings
from ..models.chat_models import Message, AiSettings

logger = get_logger(__name__)


class MemoryItem:
    """메모리 아이템 클래스"""
    
    def __init__(
        self,
        content: str,
        importance: int = 1,
        memory_type: str = "conversation",
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.content = content
        self.importance = importance  # 1-10 중요도
        self.memory_type = memory_type  # conversation, user_info, preference, etc.
        self.metadata = metadata or {}
        self.created_at = datetime.now()
        self.last_accessed = datetime.now()
        self.access_count = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            "content": self.content,
            "importance": self.importance,
            "memory_type": self.memory_type,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "last_accessed": self.last_accessed.isoformat(),
            "access_count": self.access_count
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MemoryItem':
        """딕셔너리에서 생성"""
        item = cls(
            content=data["content"],
            importance=data["importance"],
            memory_type=data["memory_type"],
            metadata=data.get("metadata", {})
        )
        item.created_at = datetime.fromisoformat(data["created_at"])
        item.last_accessed = datetime.fromisoformat(data["last_accessed"])
        item.access_count = data["access_count"]
        return item


class ConversationMemory:
    """대화 메모리 관리 클래스"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.short_term_memory = deque(maxlen=settings.short_term_memory_size)
        self.long_term_memory: Dict[str, MemoryItem] = {}
        self.user_preferences: Dict[str, Any] = {}
        self.conversation_contexts: Dict[str, List[Message]] = {}
        
        logger.info(f"메모리 시스템 초기화 완료 - 사용자: {user_id}")
    
    def add_short_term_memory(self, message: Message, importance: int = 1) -> None:
        """단기 메모리에 메시지 추가"""
        memory_item = MemoryItem(
            content=message.content,
            importance=importance,
            memory_type="conversation",
            metadata={
                "role": message.role,
                "timestamp": message.timestamp.isoformat() if message.timestamp else None
            }
        )
        
        self.short_term_memory.append(memory_item)
        logger.debug(f"단기 메모리 추가: {message.content[:50]}...")
    
    def add_long_term_memory(
        self,
        content: str,
        importance: int = 5,
        memory_type: str = "conversation",
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """장기 메모리에 정보 추가"""
        memory_id = self._generate_memory_id(content, memory_type)
        
        memory_item = MemoryItem(
            content=content,
            importance=importance,
            memory_type=memory_type,
            metadata=metadata or {}
        )
        
        self.long_term_memory[memory_id] = memory_item
        logger.info(f"장기 메모리 추가 (ID: {memory_id}): {content[:50]}...")
        
        return memory_id
    
    def retrieve_relevant_memories(
        self,
        current_context: str,
        limit: int = 5,
        memory_types: Optional[List[str]] = None
    ) -> List[MemoryItem]:
        """현재 맥락과 관련된 메모리 검색"""
        if memory_types is None:
            memory_types = ["conversation", "user_info", "preference"]
        
        relevant_memories = []
        
        # 단기 메모리에서 검색
        for memory in self.short_term_memory:
            if memory.memory_type in memory_types:
                relevance_score = self._calculate_relevance(current_context, memory.content)
                if relevance_score > 0.3:  # 임계값
                    memory.access_count += 1
                    memory.last_accessed = datetime.now()
                    relevant_memories.append((memory, relevance_score))
        
        # 장기 메모리에서 검색
        for memory_id, memory in self.long_term_memory.items():
            if memory.memory_type in memory_types:
                relevance_score = self._calculate_relevance(current_context, memory.content)
                if relevance_score > 0.3:  # 임계값
                    memory.access_count += 1
                    memory.last_accessed = datetime.now()
                    relevant_memories.append((memory, relevance_score))
        
        # 관련성 점수로 정렬하고 제한
        relevant_memories.sort(key=lambda x: x[1], reverse=True)
        relevant_memories = relevant_memories[:limit]
        
        logger.debug(f"관련 메모리 {len(relevant_memories)}개 검색됨")
        return [memory for memory, _ in relevant_memories]
    
    def get_conversation_context(self, conversation_id: str) -> List[Message]:
        """대화 컨텍스트 가져오기"""
        return self.conversation_contexts.get(conversation_id, [])
    
    def update_conversation_context(
        self,
        conversation_id: str,
        messages: List[Message]
    ) -> None:
        """대화 컨텍스트 업데이트"""
        # 최대 메시지 수 제한
        max_messages = settings.max_conversation_history
        if len(messages) > max_messages:
            messages = messages[-max_messages:]
        
        self.conversation_contexts[conversation_id] = messages
        logger.debug(f"대화 컨텍스트 업데이트 - 대화 ID: {conversation_id}, 메시지 수: {len(messages)}")
    
    def add_user_preference(self, key: str, value: Any) -> None:
        """사용자 선호도 추가"""
        self.user_preferences[key] = value
        logger.info(f"사용자 선호도 추가: {key} = {value}")
    
    def get_user_preferences(self) -> Dict[str, Any]:
        """사용자 선호도 가져오기"""
        return self.user_preferences.copy()
    
    def cleanup_old_memories(self) -> None:
        """오래된 메모리 정리"""
        cutoff_date = datetime.now() - timedelta(days=settings.memory_retention_days)
        
        # 장기 메모리에서 오래된 항목 제거
        old_memories = []
        for memory_id, memory in self.long_term_memory.items():
            if memory.created_at < cutoff_date and memory.importance < 7:
                old_memories.append(memory_id)
        
        for memory_id in old_memories:
            del self.long_term_memory[memory_id]
        
        if old_memories:
            logger.info(f"오래된 메모리 {len(old_memories)}개 정리됨")
    
    def _generate_memory_id(self, content: str, memory_type: str) -> str:
        """메모리 ID 생성"""
        unique_string = f"{content}:{memory_type}:{self.user_id}:{time.time()}"
        return hashlib.md5(unique_string.encode()).hexdigest()
    
    def _calculate_relevance(self, context: str, memory_content: str) -> float:
        """관련성 점수 계산 (간단한 키워드 매칭)"""
        context_words = set(context.lower().split())
        memory_words = set(memory_content.lower().split())
        
        if not context_words or not memory_words:
            return 0.0
        
        intersection = context_words.intersection(memory_words)
        union = context_words.union(memory_words)
        
        return len(intersection) / len(union) if union else 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        """메모리 상태를 딕셔너리로 변환"""
        return {
            "user_id": self.user_id,
            "short_term_memory": [memory.to_dict() for memory in self.short_term_memory],
            "long_term_memory": {
                memory_id: memory.to_dict()
                for memory_id, memory in self.long_term_memory.items()
            },
            "user_preferences": self.user_preferences,
            "conversation_contexts": {
                conv_id: [msg.dict() for msg in messages]
                for conv_id, messages in self.conversation_contexts.items()
            }
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConversationMemory':
        """딕셔너리에서 메모리 객체 생성"""
        memory = cls(data["user_id"])
        
        # 단기 메모리 복원
        for memory_data in data.get("short_term_memory", []):
            memory.short_term_memory.append(MemoryItem.from_dict(memory_data))
        
        # 장기 메모리 복원
        for memory_id, memory_data in data.get("long_term_memory", {}).items():
            memory.long_term_memory[memory_id] = MemoryItem.from_dict(memory_data)
        
        # 사용자 선호도 복원
        memory.user_preferences = data.get("user_preferences", {})
        
        # 대화 컨텍스트 복원
        for conv_id, messages_data in data.get("conversation_contexts", {}).items():
            memory.conversation_contexts[conv_id] = [
                Message(**msg_data) for msg_data in messages_data
            ]
        
        return memory


class MemoryManager:
    """전역 메모리 관리자"""
    
    def __init__(self):
        self.user_memories: Dict[str, ConversationMemory] = {}
        self.logger = get_logger(__name__)
    
    def get_user_memory(self, user_id: str) -> ConversationMemory:
        """사용자 메모리 가져오기 (없으면 생성)"""
        if user_id not in self.user_memories:
            self.user_memories[user_id] = ConversationMemory(user_id)
            self.logger.info(f"새로운 사용자 메모리 생성: {user_id}")
        
        return self.user_memories[user_id]
    
    def cleanup_all_memories(self) -> None:
        """모든 사용자의 오래된 메모리 정리"""
        for user_id, memory in self.user_memories.items():
            memory.cleanup_old_memories()
            self.logger.info(f"사용자 {user_id}의 메모리 정리 완료")
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """메모리 통계 정보"""
        stats = {
            "total_users": len(self.user_memories),
            "total_long_term_memories": 0,
            "total_short_term_memories": 0
        }
        
        for user_id, memory in self.user_memories.items():
            stats["total_long_term_memories"] += len(memory.long_term_memory)
            stats["total_short_term_memories"] += len(memory.short_term_memory)
        
        return stats


# 전역 메모리 관리자 인스턴스
memory_manager = MemoryManager()
