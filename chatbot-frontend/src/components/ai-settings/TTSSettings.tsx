import React, { useState, useEffect } from "react";
import { Volume2, Play, Pause } from "lucide-react";
import { useTTS } from "../../hooks/useTTS";

interface TTSSettingsProps {
  settings: {
    ttsEnabled: boolean;
    ttsAutoPlay: boolean;
    ttsRate: number;
    ttsPitch: number;
    ttsVolume: number;
    ttsVoice: string | null;
  };
  onSettingsChange: (settings: Partial<TTSSettingsProps["settings"]>) => void;
}

/**
 * TTS 설정 컴포넌트
 */
export default function TTSSettings({
  settings,
  onSettingsChange,
}: TTSSettingsProps) {
  const { speak, stop, isSpeaking, isSupported, availableVoices, setVoice } =
    useTTS();
  const [testText] = useState("안녕하세요! 이것은 음성 테스트입니다.");

  /**
   * 테스트 음성 재생
   */
  const handleTestVoice = () => {
    if (isSpeaking) {
      stop();
    } else {
      const selectedVoice = availableVoices.find(
        (v) => v.name === settings.ttsVoice
      );
      speak(testText, {
        voice: selectedVoice,
        rate: settings.ttsRate,
        pitch: settings.ttsPitch,
        volume: settings.ttsVolume,
      });
    }
  };

  /**
   * 음성 변경 핸들러
   */
  const handleVoiceChange = (voiceName: string) => {
    const selectedVoice = availableVoices.find((v) => v.name === voiceName);
    if (selectedVoice) {
      setVoice(selectedVoice);
      onSettingsChange({ ttsVoice: voiceName });
    }
  };

  // 브라우저 지원 확인
  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          ⚠️ 현재 브라우저는 음성 읽기 기능을 지원하지 않습니다.
        </p>
        <p className="text-yellow-700 text-xs mt-1">
          Chrome, Edge, Safari 등의 최신 브라우저를 사용해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Volume2 className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          🎤 음성 설정
        </h3>
      </div>

      {/* TTS 활성화 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            음성 읽기 기능 사용
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            AI 응답을 음성으로 들을 수 있습니다
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.ttsEnabled}
            onChange={(e) =>
              onSettingsChange({ ttsEnabled: e.target.checked })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {settings.ttsEnabled && (
        <>
          {/* 자동 재생 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI 응답 자동 읽기
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                AI가 답변하면 자동으로 음성 재생
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.ttsAutoPlay}
                onChange={(e) =>
                  onSettingsChange({ ttsAutoPlay: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 음성 선택 */}
          {availableVoices.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                음성 선택
              </label>
              <select
                value={settings.ttsVoice || ""}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                    {voice.default ? " (기본)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 재생 속도 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                재생 속도
              </label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {settings.ttsRate.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.ttsRate}
              onChange={(e) =>
                onSettingsChange({ ttsRate: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700
                       accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>느림 (0.5x)</span>
              <span>보통 (1.0x)</span>
              <span>빠름 (2.0x)</span>
            </div>
          </div>

          {/* 음높이 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                음높이
              </label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {settings.ttsPitch.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.ttsPitch}
              onChange={(e) =>
                onSettingsChange({ ttsPitch: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700
                       accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>낮음 (0.5)</span>
              <span>보통 (1.0)</span>
              <span>높음 (2.0)</span>
            </div>
          </div>

          {/* 볼륨 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                볼륨
              </label>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(settings.ttsVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.ttsVolume}
              onChange={(e) =>
                onSettingsChange({ ttsVolume: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700
                       accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 테스트 버튼 */}
          <button
            onClick={handleTestVoice}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 
                     bg-blue-500 hover:bg-blue-600 text-white rounded-lg
                     transition-colors duration-200 font-medium"
          >
            {isSpeaking ? (
              <>
                <Pause className="w-5 h-5" />
                음성 중지
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                음성 테스트
              </>
            )}
          </button>

          {/* 도움말 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              💡 <strong>팁:</strong> 각 AI 메시지 옆의 스피커 아이콘을 클릭하여
              음성으로 들을 수 있습니다.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

