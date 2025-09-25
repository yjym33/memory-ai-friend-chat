import { useState, useEffect, useRef, useCallback } from "react";
import { error as toastError, success as toastSuccess } from "../lib/toast";
import { logger } from "../lib/logger";

export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
}

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage<unknown>) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastMessage: WebSocketMessage<unknown> | null;
  connectionId: string | null;
}

/**
 * WebSocket 연결을 관리하는 커스텀 훅
 * 자동 재연결, 하트비트, 메시지 큐잉 기능 포함
 */
export function useWebSocket(config: WebSocketConfig) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
    lastMessage: null,
    connectionId: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<WebSocketMessage<unknown>[]>([]);
  const configRef = useRef(config);

  // 설정 업데이트
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  /**
   * WebSocket 연결 생성
   */
  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.CONNECTING ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }

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

      ws.onopen = (event) => {
        logger.info("WebSocket 연결 성공", { url: configRef.current.url });

        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0,
          connectionId: `ws_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        }));

        // 큐에 있던 메시지들 전송
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

      ws.onerror = (event) => {
        logger.error("WebSocket 오류", event);

        setState((prev) => ({
          ...prev,
          error: "WebSocket 연결 오류가 발생했습니다.",
        }));

        configRef.current.onError?.(event);
      };

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

        // 정상 종료가 아닌 경우 재연결 시도
        if (event.code !== 1000 && event.code !== 1001) {
          scheduleReconnect();
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
  }, []);

  /**
   * WebSocket 연결 종료
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0,
      connectionId: null,
    }));
  }, []);

  /**
   * 재연결 스케줄링
   */
  const scheduleReconnect = useCallback(() => {
    const maxAttempts = configRef.current.maxReconnectAttempts || 5;
    const interval = configRef.current.reconnectInterval || 3000;

    setState((prev) => {
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

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, interval * nextAttempt); // 지수 백오프

      return {
        ...prev,
        reconnectAttempts: nextAttempt,
      };
    });
  }, [connect]);

  /**
   * 하트비트 시작
   */
  const startHeartbeat = useCallback(() => {
    const interval = configRef.current.heartbeatInterval || 30000; // 30초

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: "heartbeat",
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
      }
    }, interval);
  }, []);

  /**
   * 하트비트 중지
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  /**
   * 메시지 전송
   */
  const sendMessage = useCallback((message: WebSocketMessage<unknown>) => {
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
   * 특정 타입의 메시지 전송 (편의 함수)
   */
  const sendTypedMessage = useCallback(
    <T = unknown>(type: string, data: T) => {
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
   */
  const getReadyState = useCallback(() => {
    return wsRef.current?.readyState || WebSocket.CLOSED;
  }, []);

  /**
   * 수동 재연결
   */
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // 컴포넌트 마운트 시 연결
  useEffect(() => {
    connect();

    // 클린업
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // 브라우저 가시성 변경 시 재연결 관리
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !state.isConnected) {
        logger.info("브라우저 활성화 - WebSocket 재연결 시도");
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [state.isConnected, connect]);

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
      // 채팅 메시지 특별 처리
      if (message.type === "chat_message") {
        logger.debug("새 채팅 메시지", message.data);
      } else if (message.type === "typing_indicator") {
        logger.debug("타이핑 표시", message.data);
      }
    },
  });
}
