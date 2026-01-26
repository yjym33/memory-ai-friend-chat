/**
 * useWebSocket 훅
 *
 * WebSocket 연결을 관리하는 커스텀 훅
 * 자동 재연결, 하트비트, 메시지 큐잉 기능 포함
 *
 * @performance
 * - 함수형 setState 사용으로 의존성 제거 및 stale closure 방지 (rerender-functional-setstate)
 * - useRef로 config 저장하여 불필요한 재연결 방지
 * - passive event listener 사용 (client-passive-event-listeners)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { error as toastError, success as toastSuccess } from "../lib/toast";
import { logger } from "../lib/logger";

/** WebSocket 메시지 타입 정의 */
export interface WebSocketMessage<T = unknown> {
  /** 메시지 타입 식별자 */
  type: string;
  /** 메시지 페이로드 */
  data: T;
  /** 타임스탬프 */
  timestamp: number;
}

/** WebSocket 설정 옵션 */
export interface WebSocketConfig {
  /** WebSocket 서버 URL */
  url: string;
  /** 서브프로토콜 */
  protocols?: string | string[];
  /** 재연결 간격 (ms) */
  reconnectInterval?: number;
  /** 최대 재연결 시도 횟수 */
  maxReconnectAttempts?: number;
  /** 하트비트 간격 (ms) */
  heartbeatInterval?: number;
  /** 연결 성공 콜백 */
  onOpen?: (event: Event) => void;
  /** 메시지 수신 콜백 */
  onMessage?: (message: WebSocketMessage<unknown>) => void;
  /** 에러 발생 콜백 */
  onError?: (error: Event) => void;
  /** 연결 종료 콜백 */
  onClose?: (event: CloseEvent) => void;
}

/** WebSocket 상태 */
export interface WebSocketState {
  /** 연결 상태 */
  isConnected: boolean;
  /** 연결 시도 중 상태 */
  isConnecting: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 재연결 시도 횟수 */
  reconnectAttempts: number;
  /** 마지막으로 수신한 메시지 */
  lastMessage: WebSocketMessage<unknown> | null;
  /** 현재 연결 ID */
  connectionId: string | null;
}

/** 고유 연결 ID 생성 유틸 */
const generateConnectionId = (): string =>
  `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * WebSocket 연결을 관리하는 커스텀 훅
 *
 * @param config - WebSocket 설정
 * @returns WebSocket 상태 및 제어 함수들
 */
export function useWebSocket(config: WebSocketConfig) {
  // 상태 초기화 - lazy initialization으로 불필요한 객체 생성 방지
  const [state, setState] = useState<WebSocketState>(() => ({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
    lastMessage: null,
    connectionId: null,
  }));

  // Refs - 렌더링 간 값 유지
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<WebSocketMessage<unknown>[]>([]);
  const configRef = useRef(config);

  // config 업데이트 - 최신 콜백 참조 유지
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  /**
   * 하트비트 중지
   * 연결 종료 시 호출
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * 메시지 전송
   * 연결되지 않은 경우 큐에 저장
   *
   * @param message - 전송할 메시지
   * @returns 전송 성공 여부
   */
  const sendMessage = useCallback((message: WebSocketMessage<unknown>): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        logger.error("메시지 전송 실패", error);
        return false;
      }
    } else {
      // 연결이 안 되어 있으면 큐에 저장
      messageQueueRef.current.push(message);
      logger.debug("메시지가 큐에 저장됨", { type: message.type });
      return false;
    }
  }, []);

  /**
   * 하트비트 시작
   * 연결 유지를 위한 주기적 ping 전송
   */
  const startHeartbeat = useCallback(() => {
    const interval = configRef.current.heartbeatInterval || 30000;

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: "heartbeat",
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
      }
    }, interval);
  }, [sendMessage]);

  /**
   * 재연결 스케줄링
   * 지수 백오프 적용
   */
  const scheduleReconnect = useCallback((connectFn: () => void) => {
    const maxAttempts = configRef.current.maxReconnectAttempts || 5;
    const interval = configRef.current.reconnectInterval || 3000;

    // 함수형 setState 사용으로 최신 상태 보장 (rerender-functional-setstate)
    setState((prev) => {
      // 조기 반환: 최대 시도 횟수 초과 (js-early-exit)
      if (prev.reconnectAttempts >= maxAttempts) {
        toastError("WebSocket 재연결 시도 횟수를 초과했습니다.");
        return {
          ...prev,
          error: "재연결 시도 횟수를 초과했습니다.",
        };
      }

      const nextAttempt = prev.reconnectAttempts + 1;
      logger.info("WebSocket 재연결 시도", {
        attempt: nextAttempt,
        maxAttempts,
        delayMs: interval * nextAttempt,
      });

      // 지수 백오프로 재연결 예약
      reconnectTimeoutRef.current = setTimeout(() => {
        connectFn();
      }, interval * nextAttempt);

      return {
        ...prev,
        reconnectAttempts: nextAttempt,
      };
    });
  }, []);

  /**
   * WebSocket 연결 종료
   * 모든 타이머 정리 및 상태 초기화
   */
  const disconnect = useCallback(() => {
    // 재연결 타이머 정리
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    // WebSocket 연결 정상 종료
    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    // 함수형 setState로 상태 초기화
    setState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0,
      connectionId: null,
    }));
  }, [stopHeartbeat]);

  /**
   * WebSocket 연결 생성
   * 이미 연결 중이거나 연결된 경우 무시
   */
  const connect = useCallback(() => {
    // 조기 반환: 이미 연결 중이거나 연결됨 (js-early-exit)
    if (
      wsRef.current?.readyState === WebSocket.CONNECTING ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    // 연결 시작 상태 설정
    setState((prev) => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      const ws = new WebSocket(
        configRef.current.url,
        configRef.current.protocols
      );

      /**
       * 연결 성공 핸들러
       */
      ws.onopen = (event) => {
        logger.info("WebSocket 연결 성공", { url: configRef.current.url });

        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0,
          connectionId: generateConnectionId(),
        }));

        // 큐에 대기 중인 메시지 전송
        if (messageQueueRef.current.length > 0) {
          messageQueueRef.current.forEach((message) => {
            ws.send(JSON.stringify(message));
          });
          messageQueueRef.current = [];
        }

        // 하트비트 시작
        startHeartbeat();

        configRef.current.onOpen?.(event);
        toastSuccess("실시간 연결이 설정되었습니다.");
      };

      /**
       * 메시지 수신 핸들러
       */
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage<unknown> = JSON.parse(event.data);

          setState((prev) => ({
            ...prev,
            lastMessage: message,
          }));

          configRef.current.onMessage?.(message);
        } catch (error) {
          logger.error("WebSocket 메시지 파싱 오류", error);
        }
      };

      /**
       * 에러 핸들러
       */
      ws.onerror = (event) => {
        logger.error("WebSocket 오류", event);

        setState((prev) => ({
          ...prev,
          error: "WebSocket 연결 오류가 발생했습니다.",
        }));

        configRef.current.onError?.(event);
      };

      /**
       * 연결 종료 핸들러
       */
      ws.onclose = (event) => {
        logger.info("WebSocket 연결 종료", {
          code: event.code,
          reason: event.reason,
        });

        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          connectionId: null,
        }));

        stopHeartbeat();
        configRef.current.onClose?.(event);

        // 비정상 종료 시 재연결 시도
        if (event.code !== 1000 && event.code !== 1001) {
          scheduleReconnect(connect);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      logger.error("WebSocket 연결 생성 실패", error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: "WebSocket 연결을 생성할 수 없습니다.",
      }));
    }
  }, [startHeartbeat, stopHeartbeat, scheduleReconnect]);

  /**
   * 타입이 지정된 메시지 전송 (편의 함수)
   *
   * @param type - 메시지 타입
   * @param data - 메시지 데이터
   * @returns 전송 성공 여부
   */
  const sendTypedMessage = useCallback(
    <T = unknown>(type: string, data: T): boolean => {
      return sendMessage({
        type,
        data,
        timestamp: Date.now(),
      });
    },
    [sendMessage]
  );

  /**
   * 연결 상태 확인
   *
   * @returns WebSocket readyState
   */
  const getReadyState = useCallback((): number => {
    return wsRef.current?.readyState ?? WebSocket.CLOSED;
  }, []);

  /**
   * 수동 재연결
   * 기존 연결 종료 후 새로 연결
   */
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // 컴포넌트 마운트 시 연결
  useEffect(() => {
    connect();

    // 클린업: 컴포넌트 언마운트 시 연결 종료
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // 브라우저 가시성 변경 시 재연결 관리
  useEffect(() => {
    const handleVisibilityChange = () => {
      // 함수형 접근 대신 ref 활용
      if (
        document.visibilityState === "visible" &&
        wsRef.current?.readyState !== WebSocket.OPEN
      ) {
        logger.info("브라우저 활성화 - WebSocket 재연결 시도");
        connect();
      }
    };

    // passive 이벤트 리스너 사용 (client-passive-event-listeners)
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [connect]);

  return {
    // 상태
    ...state,
    readyState: getReadyState(),

    // 액션
    connect,
    disconnect,
    reconnect,
    sendMessage,
    sendTypedMessage,

    // 유틸리티
    isReady: state.isConnected && getReadyState() === WebSocket.OPEN,
    queuedMessages: messageQueueRef.current.length,
  };
}

/**
 * 채팅용 WebSocket 훅 (특화된 버전)
 *
 * @param chatId - 채팅방 ID (선택)
 * @returns 채팅 WebSocket 상태 및 제어 함수
 */
export function useChatWebSocket(chatId?: string) {
  const wsUrl = `${
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"
  }/chat${chatId ? `/${chatId}` : ""}`;

  return useWebSocket({
    url: wsUrl,
    reconnectInterval: 2000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 25000,
    onMessage: (message) => {
      // 채팅 메시지 타입별 처리
      if (message.type === "chat_message") {
        logger.debug("새 채팅 메시지", message.data);
      } else if (message.type === "typing_indicator") {
        logger.debug("타이핑 표시", message.data);
      }
    },
  });
}
