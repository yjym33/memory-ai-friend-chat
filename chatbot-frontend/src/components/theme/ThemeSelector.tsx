import React, { useState, useEffect } from "react";
import {
  ChatTheme,
  getAllThemePresets,
  saveCustomTheme,
  deleteCustomTheme,
  clearCustomThemes,
  getCustomThemes,
} from "../../types/theme";

interface ThemeSelectorProps {
  currentTheme: ChatTheme;
  onThemeChange: (theme: ChatTheme) => void;
}

export default function ThemeSelector({
  currentTheme,
  onThemeChange,
}: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"presets" | "custom" | "preview">(
    "presets"
  );
  const [themePresets, setThemePresets] = useState(getAllThemePresets());

  // 테마 프리셋 업데이트
  useEffect(() => {
    setThemePresets(getAllThemePresets());
  }, []);

  return (
    <div className="relative">
      {/* 테마 선택 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
      >
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: currentTheme.colors.primary }}
        />
        <span className="text-sm font-medium">{currentTheme.name}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 테마 선택 모달 */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* 탭 네비게이션 */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-1 py-3 px-4 text-center text-sm ${
                activeTab === "presets"
                  ? "text-purple-600 border-b-2 border-purple-500"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              테마 프리셋
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`flex-1 py-3 px-4 text-center text-sm ${
                activeTab === "custom"
                  ? "text-purple-600 border-b-2 border-purple-500"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              커스텀
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 py-3 px-4 text-center text-sm ${
                activeTab === "preview"
                  ? "text-purple-600 border-b-2 border-purple-500"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              미리보기
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {activeTab === "presets" && (
              <div>
                {/* 커스텀 테마가 있을 때만 초기화 버튼 표시 */}
                {getCustomThemes().length > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        커스텀 테마: {getCustomThemes().length}개
                      </span>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "모든 커스텀 테마를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
                            )
                          ) {
                            clearCustomThemes();
                            setThemePresets(getAllThemePresets());
                          }
                        }}
                        className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                        title="모든 커스텀 테마 삭제"
                      >
                        모든 커스텀 테마 삭제
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {themePresets.map((preset) => (
                    <div key={preset.id} className="relative">
                      <button
                        onClick={() => {
                          onThemeChange(preset.theme);
                          setIsOpen(false);
                        }}
                        className="w-full p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition text-left"
                      >
                        <div
                          className="w-full h-20 rounded mb-2"
                          style={{
                            background: preset.theme.background.value,
                            border: `2px solid ${preset.theme.colors.primary}20`,
                          }}
                        />
                        <div className="text-sm font-medium">{preset.name}</div>
                        <div className="text-xs text-gray-500">
                          {preset.theme.description}
                        </div>
                      </button>
                      {/* 커스텀 테마만 삭제 버튼 표시 */}
                      {preset.category === "custom" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("이 커스텀 테마를 삭제하시겠습니까?")) {
                              deleteCustomTheme(preset.id);
                              setThemePresets(getAllThemePresets());
                            }
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition"
                          title="테마 삭제"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "custom" && (
              <CustomThemeEditor
                currentTheme={currentTheme}
                onThemeChange={onThemeChange}
                onThemeSaved={() => setThemePresets(getAllThemePresets())}
              />
            )}

            {activeTab === "preview" && <ThemePreview theme={currentTheme} />}
          </div>
        </div>
      )}
    </div>
  );
}

// 커스텀 테마 에디터 컴포넌트
function CustomThemeEditor({
  currentTheme,
  onThemeChange,
  onThemeSaved,
}: {
  currentTheme: ChatTheme;
  onThemeChange: (theme: ChatTheme) => void;
  onThemeSaved: () => void;
}) {
  const [editingTheme, setEditingTheme] = useState<ChatTheme>(currentTheme);

  // 색상 초기화 함수
  const resetColors = () => {
    const defaultTheme = {
      ...editingTheme,
      colors: {
        primary: "#8B5CF6",
        secondary: "#EC4899",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        text: {
          primary: "#1F2937",
          secondary: "#6B7280",
          accent: "#8B5CF6",
        },
        userBubble: {
          background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
          text: "#FFFFFF",
          border: "none",
        },
        aiBubble: {
          background: "#FFFFFF",
          text: "#1F2937",
          border: "1px solid #E5E7EB",
        },
      },
    };
    setEditingTheme(defaultTheme);
  };

  const handleColorChange = (path: string, value: string) => {
    const newTheme = { ...editingTheme };
    const pathArray = path.split(".");
    let current: Record<string, unknown> = newTheme as Record<string, unknown>;

    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]] as Record<string, unknown>;
    }
    current[pathArray[pathArray.length - 1]] = value;

    setEditingTheme(newTheme);
  };

  const handleSave = () => {
    const savedTheme = {
      ...editingTheme,
      id: `custom-${Date.now()}`,
      name: "커스텀 테마",
      isCustom: true,
    };

    // 커스텀 테마를 로컬 스토리지에 저장
    saveCustomTheme(savedTheme);

    // 테마 프리셋 목록 업데이트
    onThemeSaved();

    // 테마 적용
    onThemeChange(savedTheme);
  };

  return (
    <div className="space-y-4">
      {/* 색상 설정 */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-medium">색상 설정</h4>
          <button
            onClick={resetColors}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
            title="색상을 기본값으로 초기화"
          >
            색상 초기화
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              메인 색상
            </label>
            <input
              type="color"
              value={editingTheme.colors.primary}
              onChange={(e) =>
                handleColorChange("colors.primary", e.target.value)
              }
              className="w-full h-8 rounded border"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              보조 색상
            </label>
            <input
              type="color"
              value={editingTheme.colors.secondary}
              onChange={(e) =>
                handleColorChange("colors.secondary", e.target.value)
              }
              className="w-full h-8 rounded border"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              배경 색상
            </label>
            <input
              type="color"
              value={editingTheme.colors.background}
              onChange={(e) =>
                handleColorChange("colors.background", e.target.value)
              }
              className="w-full h-8 rounded border"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              표면 색상
            </label>
            <input
              type="color"
              value={editingTheme.colors.surface}
              onChange={(e) =>
                handleColorChange("colors.surface", e.target.value)
              }
              className="w-full h-8 rounded border"
            />
          </div>
        </div>
      </div>

      {/* 채팅 버블 설정 */}
      <div>
        <h4 className="text-sm font-medium mb-3">채팅 버블</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              내 메시지 배경
            </label>
            <input
              type="color"
              value={editingTheme.colors.userBubble.background}
              onChange={(e) =>
                handleColorChange(
                  "colors.userBubble.background",
                  e.target.value
                )
              }
              className="w-full h-8 rounded border"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              AI 메시지 배경
            </label>
            <input
              type="color"
              value={editingTheme.colors.aiBubble.background}
              onChange={(e) =>
                handleColorChange("colors.aiBubble.background", e.target.value)
              }
              className="w-full h-8 rounded border"
            />
          </div>
        </div>
      </div>

      {/* 폰트 설정 */}
      <div>
        <h4 className="text-sm font-medium mb-3">폰트 설정</h4>
        <select
          value={editingTheme.typography.fontFamily}
          onChange={(e) =>
            handleColorChange("typography.fontFamily", e.target.value)
          }
          className="w-full p-2 border border-gray-300 rounded text-sm"
        >
          <option value="Inter, sans-serif">Inter</option>
          <option value="Noto Sans KR, sans-serif">Noto Sans KR</option>
          <option value="Pretendard, sans-serif">Pretendard</option>
          <option value="system-ui, sans-serif">시스템 폰트</option>
        </select>
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
      >
        테마 저장
      </button>
    </div>
  );
}

// 테마 미리보기 컴포넌트
function ThemePreview({ theme }: { theme: ChatTheme }) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">테마 미리보기</h4>
      <div
        className="p-4 rounded-lg border"
        style={{
          background: theme.background.value,
          fontFamily: theme.typography.fontFamily,
        }}
      >
        <div className="space-y-3">
          {/* 사용자 메시지 미리보기 */}
          <div className="flex justify-end">
            <div
              className="max-w-xs p-3 rounded-lg"
              style={{
                background: theme.colors.userBubble.background,
                color: theme.colors.userBubble.text,
                borderRadius: theme.layout.borderRadius,
                boxShadow: theme.layout.shadow,
              }}
            >
              <div className="text-sm">안녕하세요! 👋</div>
            </div>
          </div>

          {/* AI 메시지 미리보기 */}
          <div className="flex justify-start">
            <div
              className="max-w-xs p-3 rounded-lg"
              style={{
                background: theme.colors.aiBubble.background,
                color: theme.colors.aiBubble.text,
                border: theme.colors.aiBubble.border,
                borderRadius: theme.layout.borderRadius,
                boxShadow: theme.layout.shadow,
              }}
            >
              <div className="text-sm">
                안녕하세요! 루나입니다. 무엇을 도와드릴까요? 😊
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 색상 팔레트 미리보기 */}
      <div>
        <h5 className="text-xs font-medium mb-2">색상 팔레트</h5>
        <div className="flex gap-2">
          <div
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: theme.colors.primary }}
            title="Primary"
          />
          <div
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: theme.colors.secondary }}
            title="Secondary"
          />
          <div
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: theme.colors.background }}
            title="Background"
          />
          <div
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: theme.colors.surface }}
            title="Surface"
          />
        </div>
      </div>
    </div>
  );
}
