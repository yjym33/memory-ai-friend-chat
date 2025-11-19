/**
 * Web Speech API - Speech Synthesis 타입 정의
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
 */

interface SpeechSynthesisErrorEvent extends SpeechSynthesisEvent {
  error:
    | "network"
    | "synthesis"
    | "synthesis-unavailable"
    | "audio-busy"
    | "not-allowed"
    | "interrupted"
    | "audio-hardware";
  charIndex?: number;
  elapsedTime?: number;
  name?: string;
}

interface Window {
  speechSynthesis: SpeechSynthesis;
}

