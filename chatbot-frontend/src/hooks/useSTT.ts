import { useState, useCallback, useEffect, useRef } from "react";

/**
 * STT 옵션 인터페이스
 */
interface STTOptions {
  language?: string;
  continuous?: boolean; // 연속 인식
  interimResults?: boolean; // 중간 결과 표시
  maxAlternatives?: number;
}

/**
 * STT 상태 인터페이스
 */
interface STTState {
  isListening: boolean;
  transcript: string; // 최종 인식 결과
  interimTranscript: string; // 중간 인식 결과
  isSupported: boolean;
  error: string | null;
}

/**
 * Web Speech API를 사용한 STT 커스텀 훅
 * @param options - STT 옵션
 * @returns STT 제어 함수들과 상태
 */
export function useSTT(options?: STTOptions) {
  const [state, setState] = useState<STTState>({
    isListening: false,
    transcript: "",
    interimTranscript: "",
    isSupported: false,
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  /**
   * 브라우저 지원 확인 및 초기화
   */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();

      // 기본 설정
      recognition.lang = options?.language || "ko-KR";
      recognition.continuous = options?.continuous ?? true;
      recognition.interimResults = options?.interimResults ?? true;
      recognition.maxAlternatives = options?.maxAlternatives || 1;

      // 이벤트 핸들러
      recognition.onstart = () => {
        console.log("🎤 STT: 음성 인식 시작");
        setState((prev) => ({
          ...prev,
          isListening: true,
          error: null,
        }));
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setState((prev) => ({
          ...prev,
          transcript: prev.transcript + finalTranscript,
          interimTranscript,
        }));
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("STT Error:", event.error);
        
        let errorMessage = "음성 인식 오류가 발생했습니다.";
        
        switch (event.error) {
          case "no-speech":
            errorMessage = "음성이 감지되지 않았습니다.";
            break;
          case "audio-capture":
            errorMessage = "마이크에 접근할 수 없습니다.";
            break;
          case "not-allowed":
            errorMessage = "마이크 권한이 거부되었습니다.";
            break;
          case "network":
            errorMessage = "네트워크 오류가 발생했습니다.";
            break;
        }

        setState((prev) => ({
          ...prev,
          isListening: false,
          error: errorMessage,
        }));
      };

      recognition.onend = () => {
        console.log("🎤 STT: 음성 인식 종료");
        setState((prev) => ({
          ...prev,
          isListening: false,
          interimTranscript: "",
        }));
      };

      recognitionRef.current = recognition;
      setState((prev) => ({ ...prev, isSupported: true }));
      
      console.log("✅ STT: Web Speech API 초기화 완료");
    } else {
      console.warn("⚠️ STT: Web Speech API를 지원하지 않는 브라우저입니다.");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // 이미 중지된 경우 무시
        }
      }
    };
  }, [
    options?.language,
    options?.continuous,
    options?.interimResults,
    options?.maxAlternatives,
  ]);

  /**
   * 음성 인식 시작
   */
  const start = useCallback(() => {
    if (recognitionRef.current && !state.isListening) {
      try {
        setState((prev) => ({
          ...prev,
          transcript: "",
          interimTranscript: "",
          error: null,
        }));
        recognitionRef.current.start();
      } catch (error) {
        console.error("STT start error:", error);
        setState((prev) => ({
          ...prev,
          error: "음성 인식을 시작할 수 없습니다.",
        }));
      }
    }
  }, [state.isListening]);

  /**
   * 음성 인식 중지
   */
  const stop = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("STT stop error:", error);
      }
    }
  }, [state.isListening]);

  /**
   * 트랜스크립트 초기화
   */
  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      transcript: "",
      interimTranscript: "",
      error: null,
    }));
  }, []);

  return {
    // 제어 함수
    start,
    stop,
    reset,

    // 상태
    isListening: state.isListening,
    transcript: state.transcript,
    interimTranscript: state.interimTranscript,
    isSupported: state.isSupported,
    error: state.error,
  };
}

