import React from "react";
import { Mic, Play } from "lucide-react";
import { useSTT } from "../../hooks/useSTT";

interface STTSettingsProps {
  settings: {
    sttEnabled: boolean;
    sttLanguage: string;
    sttContinuous: boolean;
    sttAutoSend: boolean;
  };
  onSettingsChange: (settings: Partial<STTSettingsProps["settings"]>) => void;
}

/**
 * STT 설정 컴포넌트
 */
export default function STTSettings({
  settings,
  onSettingsChange,
}: STTSettingsProps) {
  const { isSupported, isListening, start, stop } = useSTT({
    language: settings.sttLanguage,
    continuous: settings.sttContinuous,
  });

  /**
   * 테스트 음성 인식
   */
  const handleTestSTT = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  // 브라우저 지원 확인
  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          ⚠️ 현재 브라우저는 음성 인식 기능을 지원하지 않습니다.
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
        <Mic className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          🎙️ 음성 입력 설정
        </h3>
      </div>

      {/* STT 활성화 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            음성 입력 기능 사용
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            마이크로 메시지를 입력할 수 있습니다
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.sttEnabled}
            onChange={(e) =>
              onSettingsChange({ sttEnabled: e.target.checked })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {settings.sttEnabled && (
        <>
          {/* 언어 선택 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              인식 언어
            </label>
            <select
              value={settings.sttLanguage}
              onChange={(e) =>
                onSettingsChange({ sttLanguage: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ko-KR">한국어</option>
              <option value="en-US">English (US)</option>
              <option value="ja-JP">日本語</option>
              <option value="zh-CN">中文</option>
              <option value="es-ES">Español</option>
              <option value="fr-FR">Français</option>
            </select>
          </div>

          {/* 연속 인식 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                연속 인식
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                말을 멈춰도 계속 인식합니다
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sttContinuous}
                onChange={(e) =>
                  onSettingsChange({ sttContinuous: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 자동 전송 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                인식 완료 시 자동 전송
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                음성 인식이 끝나면 자동으로 메시지 전송
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sttAutoSend}
                onChange={(e) =>
                  onSettingsChange({ sttAutoSend: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 테스트 버튼 */}
          <button
            onClick={handleTestSTT}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 
              rounded-lg transition-colors duration-200 font-medium
              ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }
            `}
          >
            {isListening ? (
              <>
                <Mic className="w-5 h-5 animate-pulse" />
                음성 인식 중지
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                음성 인식 테스트
              </>
            )}
          </button>

          {/* 도움말 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              💡 <strong>팁:</strong> 채팅 입력창 옆의 마이크 아이콘을 클릭하여
              음성으로 메시지를 입력할 수 있습니다. 빨간색으로 표시되면 인식
              중입니다.
            </p>
          </div>

          {/* 권한 안내 */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              ⚠️ <strong>주의:</strong> 음성 인식 기능을 사용하려면 브라우저에서
              마이크 권한을 허용해야 합니다. 권한 요청이 나타나면 &quot;허용&quot;을
              클릭해주세요.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

