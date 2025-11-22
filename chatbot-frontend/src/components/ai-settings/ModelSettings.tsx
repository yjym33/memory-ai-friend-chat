import React, { useState, useEffect, useCallback } from "react";
import { Brain, Key, Settings } from "lucide-react";
import { LLMProvider, LLMModel } from "../../types";

interface ModelSettingsProps {
  provider: LLMProvider;
  model: string;
  config: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
    [key: string]: any;
  };
  apiKeys?: {
    openai?: string;
    google?: string;
    anthropic?: string;
  };
  onProviderChange: (provider: LLMProvider) => void;
  onModelChange: (model: string) => void;
  onConfigChange: (config: Partial<ModelSettingsProps["config"]>) => void;
  onApiKeyChange: (provider: LLMProvider, apiKey: string) => void;
}

/**
 * 사용 가능한 모델 목록
 */
const AVAILABLE_MODELS: Record<LLMProvider, string[]> = {
  [LLMProvider.OPENAI]: [
    LLMModel.GPT_4,
    LLMModel.GPT_4O,
    LLMModel.GPT_4_TURBO,
    LLMModel.GPT_5_1,
  ],
  [LLMProvider.GOOGLE]: [
    LLMModel.GEMINI_PRO,
    LLMModel.GEMINI_ULTRA,
    LLMModel.GEMINI_1_5_PRO,
    LLMModel.GEMINI_1_5_FLASH,
  ],
  [LLMProvider.ANTHROPIC]: [
    // 확실히 작동하는 모델들 (우선 배치)
    LLMModel.CLAUDE_3_HAIKU, // Claude 3 Haiku (확실히 지원됨 - 정상 작동 확인)
    // 주의: claude-3-opus-20240229는 일부 API 환경에서 404 오류 발생 가능 (비활성화)
    // 실제 API에서 지원하는지 확인 후 주석 해제
    // LLMModel.CLAUDE_3_OPUS, // Claude 3 Opus (일부 환경에서 404 발생)
    // 주의: claude-3-5-sonnet-20241022는 일부 API 환경에서 404 오류 발생 가능
    // LLMModel.CLAUDE_3_5_SONNET, // Claude 3.5 Sonnet (일부 환경에서 404 발생)
    // 주의: claude-3-sonnet-20240229는 일부 Anthropic API 환경에서 지원되지 않을 수 있음
    // LLMModel.CLAUDE_3_SONNET, // 필요시 주석 해제
  ],
};

/**
 * Provider 이름
 */
const PROVIDER_NAMES: Record<LLMProvider, string> = {
  [LLMProvider.OPENAI]: "OpenAI (GPT)",
  [LLMProvider.GOOGLE]: "Google (Gemini)",
  [LLMProvider.ANTHROPIC]: "Anthropic (Claude)",
};

/**
 * 모델 이름
 */
const MODEL_NAMES: Record<string, string> = {
  [LLMModel.GPT_4]: "GPT-4",
  [LLMModel.GPT_4O]: "GPT-4o",
  [LLMModel.GPT_4_TURBO]: "GPT-4 Turbo",
  [LLMModel.GPT_5_1]: "GPT-5.1",
  [LLMModel.GEMINI_PRO]: "Gemini Pro",
  [LLMModel.GEMINI_ULTRA]: "Gemini Ultra",
  [LLMModel.GEMINI_1_5_PRO]: "Gemini 1.5 Pro",
  [LLMModel.GEMINI_1_5_FLASH]: "Gemini 1.5 Flash",
  [LLMModel.CLAUDE_3_OPUS]: "Claude 3 Opus",
  [LLMModel.CLAUDE_3_SONNET]: "Claude 3 Sonnet",
  [LLMModel.CLAUDE_3_HAIKU]: "Claude 3 Haiku",
  [LLMModel.CLAUDE_3_5_SONNET]: "Claude 3.5 Sonnet",
};

export default function ModelSettings({
  provider,
  model,
  config,
  apiKeys = {},
  onProviderChange,
  onModelChange,
  onConfigChange,
  onApiKeyChange,
}: ModelSettingsProps) {
  const [apiKeyInputs, setApiKeyInputs] = useState({
    openai: apiKeys?.openai || "",
    google: apiKeys?.google || "",
    anthropic: apiKeys?.anthropic || "",
  });
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Provider 변경 시 첫 번째 모델로 자동 선택
  useEffect(() => {
    const models = AVAILABLE_MODELS[provider];
    if (models && models.length > 0 && !models.includes(model)) {
      onModelChange(models[0]);
    }
  }, [provider, model, onModelChange]);

  // API 키 변경 핸들러
  const handleApiKeyChange = useCallback(
    (provider: LLMProvider, value: string) => {
      setApiKeyInputs((prev) => ({
        ...prev,
        [provider]: value,
      }));
      onApiKeyChange(provider, value);
    },
    [onApiKeyChange]
  );

  const models = AVAILABLE_MODELS[provider] || [];

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">
          🤖 AI 모델 설정
        </h3>
      </div>

      {/* Provider 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          AI Provider 선택
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.values(LLMProvider).map((p) => (
            <button
              key={p}
              onClick={() => onProviderChange(p)}
              className={`p-4 rounded-lg border-2 transition-all ${
                provider === p
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-medium">{PROVIDER_NAMES[p]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 모델 선택 */}
      <div className="space-y-2">
        <label htmlFor="llm-model" className="block text-sm font-medium text-gray-700">
          모델 선택
        </label>
        <select
          id="llm-model"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {MODEL_NAMES[m] || m}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          현재 선택된 모델: <span className="font-medium">{MODEL_NAMES[model] || model}</span>
        </p>
      </div>

      {/* API 키 설정 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
            <Key className="w-4 h-4" />
            API 키 설정 (선택사항)
          </label>
          <button
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            {showApiKeys ? "숨기기" : "설정하기"}
          </button>
        </div>
        {showApiKeys && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              💡 API 키를 입력하지 않으면 시스템 기본 키를 사용합니다. 사용자별 API 키를 사용하면 비용을 직접 관리할 수 있습니다.
            </p>
            
            {/* OpenAI API 키 */}
            <div>
              <label htmlFor="openai-key" className="block text-xs font-medium text-gray-700 mb-1">
                OpenAI API Key
              </label>
              <input
                id="openai-key"
                type="password"
                value={apiKeyInputs.openai}
                onChange={(e) => handleApiKeyChange(LLMProvider.OPENAI, e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Google API 키 */}
            <div>
              <label htmlFor="google-key" className="block text-xs font-medium text-gray-700 mb-1">
                Google API Key
              </label>
              <input
                id="google-key"
                type="password"
                value={apiKeyInputs.google}
                onChange={(e) => handleApiKeyChange(LLMProvider.GOOGLE, e.target.value)}
                placeholder="AIza..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Anthropic API 키 */}
            <div>
              <label htmlFor="anthropic-key" className="block text-xs font-medium text-gray-700 mb-1">
                Anthropic API Key
              </label>
              <input
                id="anthropic-key"
                type="password"
                value={apiKeyInputs.anthropic}
                onChange={(e) => handleApiKeyChange(LLMProvider.ANTHROPIC, e.target.value)}
                placeholder="sk-ant-..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* 고급 설정 */}
      <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-purple-600" />
          <h4 className="text-sm font-medium text-purple-800">고급 설정</h4>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <label htmlFor="temperature" className="block text-xs font-medium text-gray-700">
            Temperature: {config.temperature?.toFixed(1) || 0.7}
          </label>
          <input
            type="range"
            id="temperature"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature ?? 0.7}
            onChange={(e) => onConfigChange({ temperature: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <p className="text-xs text-gray-500">
            낮을수록 일관성 있는 답변, 높을수록 창의적인 답변
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <label htmlFor="max-tokens" className="block text-xs font-medium text-gray-700">
            Max Tokens: {config.maxTokens || 1000}
          </label>
          <input
            type="number"
            id="max-tokens"
            min="100"
            max="4000"
            step="100"
            value={config.maxTokens || 1000}
            onChange={(e) => onConfigChange({ maxTokens: parseInt(e.target.value) })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Top P (OpenAI, Anthropic) */}
        {(provider === LLMProvider.OPENAI || provider === LLMProvider.ANTHROPIC) && (
          <div className="space-y-2">
            <label htmlFor="top-p" className="block text-xs font-medium text-gray-700">
              Top P: {config.topP?.toFixed(2) || 0.9}
            </label>
            <input
              type="range"
              id="top-p"
              min="0"
              max="1"
              step="0.05"
              value={config.topP ?? 0.9}
              onChange={(e) => onConfigChange({ topP: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        )}

        {/* Top K (Google) */}
        {provider === LLMProvider.GOOGLE && (
          <div className="space-y-2">
            <label htmlFor="top-k" className="block text-xs font-medium text-gray-700">
              Top K: {config.topK || 40}
            </label>
            <input
              type="number"
              id="top-k"
              min="1"
              max="100"
              value={config.topK || 40}
              onChange={(e) => onConfigChange({ topK: parseInt(e.target.value) })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Reasoning Effort (GPT-5.1) */}
        {provider === LLMProvider.OPENAI && model.includes('gpt-5') && (
          <div className="space-y-2">
            <label htmlFor="reasoning-effort" className="block text-xs font-medium text-gray-700">
              Reasoning Effort
            </label>
            <select
              id="reasoning-effort"
              value={config.reasoningEffort || 'none'}
              onChange={(e) => onConfigChange({ reasoningEffort: e.target.value as any })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="none">None (빠른 응답)</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High (깊은 추론)</option>
            </select>
            <p className="text-xs text-gray-500">
              GPT-5.1 전용 설정. 깊은 추론은 더 정확하지만 느립니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

