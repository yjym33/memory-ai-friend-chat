import { useState, useCallback, useEffect, useRef } from "react";

/**
 * TTS 옵션 인터페이스
 */
interface TTSOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number; // 재생 속도 (0.1 ~ 10)
  pitch?: number; // 음높이 (0 ~ 2)
  volume?: number; // 볼륨 (0 ~ 1)
}

/**
 * TTS 상태 인터페이스
 */
interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
}

/**
 * Web Speech API를 사용한 TTS 커스텀 훅
 * @returns TTS 제어 함수들과 상태
 */
export function useTTS() {
  const [state, setState] = useState<TTSState>({
    isSpeaking: false,
    isPaused: false,
    isSupported: false,
    availableVoices: [],
    currentVoice: null,
  });

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /**
   * 브라우저 지원 확인 및 초기화
   */
  useEffect(() => {
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
      setState((prev) => ({ ...prev, isSupported: true }));

      // 음성 목록 로드
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        // 한국어 음성 우선 정렬
        const sortedVoices = voices.sort((a, b) => {
          if (a.lang.includes("ko") && !b.lang.includes("ko")) return -1;
          if (!a.lang.includes("ko") && b.lang.includes("ko")) return 1;
          return 0;
        });

        setState((prev) => ({
          ...prev,
          availableVoices: sortedVoices,
          currentVoice: sortedVoices.find((v) => v.lang.includes("ko")) || sortedVoices[0] || null,
        }));
      };

      // 음성 목록이 로드되면 호출
      if (synthRef.current.getVoices().length > 0) {
        loadVoices();
      }

      // 일부 브라우저는 비동기로 로드
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  /**
   * 텍스트를 음성으로 변환하여 재생
   * @param text - 읽을 텍스트
   * @param options - TTS 옵션
   * @param onEnd - 재생 완료 시 호출될 콜백 (선택사항)
   */
  const speak = useCallback(
    (text: string, options?: TTSOptions, onEnd?: () => void) => {
      if (!synthRef.current || !text.trim()) {
        console.warn("TTS: 텍스트가 비어있거나 브라우저가 지원하지 않습니다.");
        return;
      }

      // 이전 재생 중지
      synthRef.current.cancel();

      // 마크다운 및 특수 문자 제거
      const cleanText = text
        .replace(/[#*`_~]/g, "") // 마크다운 기호 제거
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // 링크 제거
        .replace(/```[\s\S]*?```/g, "") // 코드 블록 제거
        .replace(/`[^`]+`/g, "") // 인라인 코드 제거
        .trim();

      if (!cleanText) {
        console.warn("TTS: 정리된 텍스트가 비어있습니다.");
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // 음성 설정
      utterance.lang = "ko-KR";
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 1.0;

      // 음성 선택
      if (options?.voice) {
        utterance.voice = options.voice;
      } else if (state.currentVoice) {
        utterance.voice = state.currentVoice;
      }

      // 이벤트 핸들러
      utterance.onstart = () => {
        setState((prev) => ({ ...prev, isSpeaking: true, isPaused: false }));
      };

      utterance.onend = () => {
        setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false }));
        if (onEnd) {
          onEnd();
        }
      };

      utterance.onpause = () => {
        setState((prev) => ({ ...prev, isPaused: true }));
      };

      utterance.onresume = () => {
        setState((prev) => ({ ...prev, isPaused: false }));
      };

      utterance.onerror = (event) => {
        console.error("TTS Error:", event);
        setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false }));
        if (onEnd) {
          onEnd();
        }
      };

      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    [state.currentVoice]
  );

  /**
   * 재생 중지
   */
  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false }));
    }
  }, []);

  /**
   * 일시정지
   */
  const pause = useCallback(() => {
    if (synthRef.current && state.isSpeaking && !state.isPaused) {
      synthRef.current.pause();
    }
  }, [state.isSpeaking, state.isPaused]);

  /**
   * 재개
   */
  const resume = useCallback(() => {
    if (synthRef.current && state.isSpeaking && state.isPaused) {
      synthRef.current.resume();
    }
  }, [state.isSpeaking, state.isPaused]);

  /**
   * 음성 변경
   * @param voice - 선택할 음성
   */
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setState((prev) => ({ ...prev, currentVoice: voice }));
  }, []);

  return {
    // 제어 함수
    speak,
    stop,
    pause,
    resume,
    setVoice,

    // 상태
    isSpeaking: state.isSpeaking,
    isPaused: state.isPaused,
    isSupported: state.isSupported,
    availableVoices: state.availableVoices,
    currentVoice: state.currentVoice,
  };
}

