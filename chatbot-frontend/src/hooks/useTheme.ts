/**
 * useTheme 훅
 *
 * 대화별 테마를 관리하는 커스텀 훅
 * 테마 로드, 저장, CSS 변수 적용 기능 제공
 *
 * @performance
 * - useCallback으로 함수 참조 안정화 (rerender-functional-setstate)
 * - 조기 반환 패턴으로 불필요한 처리 방지 (js-early-exit)
 * - CSS 변수 배치 업데이트로 리플로우 최소화
 */
import { useState, useEffect, useCallback } from "react";
import { ChatTheme, getDefaultTheme } from "../types/theme";
import { ChatService } from "../services/chatService";

/**
 * 테마 훅의 반환 타입
 */
interface UseThemeReturn {
  /** 현재 테마 */
  currentTheme: ChatTheme | null;
  /** 로딩 상태 */
  loading: boolean;
  /** 테마 저장 함수 */
  saveTheme: (theme: ChatTheme) => Promise<void>;
  /** 테마 CSS 적용 함수 */
  applyTheme: (theme: ChatTheme) => void;
  /** 테마 다시 로드 함수 */
  loadTheme: () => Promise<void>;
}

/**
 * 대화별 테마 관리 훅
 *
 * @param conversationId - 대화 ID
 * @returns 테마 상태 및 제어 함수
 */
export function useTheme(conversationId: number): UseThemeReturn {
  const [currentTheme, setCurrentTheme] = useState<ChatTheme | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * CSS 변수로 테마 적용
   * 모든 테마 관련 CSS 변수를 document에 설정
   */
  const applyTheme = useCallback((theme: ChatTheme) => {
    const root = document.documentElement;

    // 색상 변수 설정
    root.style.setProperty("--color-primary", theme.colors.primary);
    root.style.setProperty("--color-secondary", theme.colors.secondary);
    root.style.setProperty("--color-background", theme.colors.background);
    root.style.setProperty("--color-surface", theme.colors.surface);
    root.style.setProperty("--color-text-primary", theme.colors.text.primary);
    root.style.setProperty("--color-text-secondary", theme.colors.text.secondary);
    root.style.setProperty("--color-text-accent", theme.colors.text.accent);

    // 사용자 버블 스타일
    root.style.setProperty("--user-bubble-bg", theme.colors.userBubble.background);
    root.style.setProperty("--user-bubble-text", theme.colors.userBubble.text);
    root.style.setProperty("--user-bubble-border", theme.colors.userBubble.border);

    // AI 버블 스타일
    root.style.setProperty("--ai-bubble-bg", theme.colors.aiBubble.background);
    root.style.setProperty("--ai-bubble-text", theme.colors.aiBubble.text);
    root.style.setProperty("--ai-bubble-border", theme.colors.aiBubble.border);

    // 타이포그래피
    root.style.setProperty("--font-family", theme.typography.fontFamily);
    root.style.setProperty("--font-size-small", theme.typography.fontSize.small);
    root.style.setProperty("--font-size-medium", theme.typography.fontSize.medium);
    root.style.setProperty("--font-size-large", theme.typography.fontSize.large);

    // 레이아웃
    root.style.setProperty("--border-radius", theme.layout.borderRadius);
    root.style.setProperty("--spacing", theme.layout.spacing);
    root.style.setProperty("--shadow", theme.layout.shadow);

    // 배경 타입별 처리
    const backgroundValue =
      theme.background.type === "image"
        ? `url(${theme.background.value})`
        : theme.background.value;
    root.style.setProperty("--background", backgroundValue);
  }, []);

  /**
   * 서버에서 테마 불러오기
   * 실패 시 기본 테마 적용
   */
  const loadTheme = useCallback(async () => {
    // 조기 반환: conversationId가 없으면 기본 테마 적용 (js-early-exit)
    if (!conversationId) {
      setCurrentTheme(getDefaultTheme());
      setLoading(false);
      return;
    }

    try {
      const response = await ChatService.getConversationTheme(conversationId);

      // 조기 반환: 테마가 없거나 빈 객체인 경우 (js-early-exit)
      if (!response.theme || Object.keys(response.theme).length === 0) {
        setCurrentTheme(getDefaultTheme());
        return;
      }

      // 백엔드 테마를 프론트엔드 형식으로 변환
      const convertedTheme = convertBackendThemeToFrontend(
        response.theme,
        response.themeName
      );
      setCurrentTheme(convertedTheme);
    } catch (error) {
      console.error("테마 불러오기 실패:", error);
      setCurrentTheme(getDefaultTheme());
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  /**
   * 테마 서버에 저장
   *
   * @param theme - 저장할 테마
   */
  const saveTheme = useCallback(
    async (theme: ChatTheme) => {
      try {
        const backendTheme = convertFrontendThemeToBackend(theme);
        await ChatService.updateConversationTheme(
          conversationId,
          backendTheme,
          theme.name
        );
        setCurrentTheme(theme);
      } catch (error) {
        console.error("테마 저장 실패:", error);
      }
    },
    [conversationId]
  );

  // 대화 ID 변경 시 테마 로드
  useEffect(() => {
    if (conversationId) {
      loadTheme();
    }
  }, [conversationId, loadTheme]);

  // 테마 변경 시 CSS 적용
  useEffect(() => {
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentTheme, applyTheme]);

  return {
    currentTheme,
    loading,
    saveTheme,
    applyTheme,
    loadTheme,
  };
}

/**
 * 백엔드 테마를 프론트엔드 형식으로 변환
 *
 * @param backendTheme - 백엔드 테마 객체
 * @param themeName - 테마 이름
 * @returns 프론트엔드 ChatTheme 객체
 */
function convertBackendThemeToFrontend(
  backendTheme: Record<string, unknown>,
  themeName: string
): ChatTheme {
  // 버블 스타일 추출 헬퍼
  const getUserBubbleStyle = (key: string, defaultValue: string): string => {
    const bubbleStyle = backendTheme.userBubbleStyle as Record<string, unknown> | undefined;
    return (bubbleStyle?.[key] as string) || defaultValue;
  };

  const getAiBubbleStyle = (key: string, defaultValue: string): string => {
    const bubbleStyle = backendTheme.aiBubbleStyle as Record<string, unknown> | undefined;
    return (bubbleStyle?.[key] as string) || defaultValue;
  };

  const getAnimation = (key: string, defaultValue: boolean): boolean => {
    const animations = backendTheme.animations as Record<string, unknown> | undefined;
    return (animations?.[key] as boolean) ?? defaultValue;
  };

  return {
    id: (backendTheme.id as string) || "converted",
    name: themeName || "변환된 테마",
    description: "백엔드에서 변환된 테마",
    isCustom: true,
    isDefault: false,
    colors: {
      primary: (backendTheme.primaryColor as string) || "#8B5CF6",
      secondary: (backendTheme.secondaryColor as string) || "#EC4899",
      background: (backendTheme.backgroundColor as string) || "#F8FAFC",
      surface: "#FFFFFF",
      text: {
        primary: (backendTheme.textColor as string) || "#1F2937",
        secondary: "#6B7280",
        accent: (backendTheme.accentColor as string) || "#8B5CF6",
      },
      userBubble: {
        background: getUserBubbleStyle(
          "backgroundColor",
          "linear-gradient(135deg, #8B5CF6, #EC4899)"
        ),
        text: getUserBubbleStyle("textColor", "#FFFFFF"),
        border: "none",
      },
      aiBubble: {
        background: getAiBubbleStyle("backgroundColor", "#FFFFFF"),
        text: getAiBubbleStyle("textColor", "#1F2937"),
        border: "1px solid #E5E7EB",
      },
    },
    typography: {
      fontFamily: (backendTheme.fontFamily as string) || "Inter, sans-serif",
      fontSize: {
        small: "0.875rem",
        medium: "1rem",
        large: "1.125rem",
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 600,
      },
    },
    layout: {
      borderRadius: getUserBubbleStyle("borderRadius", "12px"),
      spacing: "16px",
      shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
    background: {
      type: "gradient",
      value:
        (backendTheme.backgroundImage as string) ||
        "linear-gradient(135deg, #F8FAFC 0%, #E0E7FF 100%)",
    },
    animations: {
      messageAppear: getAnimation("messageAppear", true),
      typingIndicator: getAnimation("typingIndicator", true),
      bubbleHover: getAnimation("bubbleHover", true),
      themeTransition: true,
    },
  };
}

/**
 * 프론트엔드 테마를 백엔드 형식으로 변환
 *
 * @param frontendTheme - 프론트엔드 테마 객체
 * @returns 백엔드 형식 테마 객체
 */
function convertFrontendThemeToBackend(
  frontendTheme: ChatTheme
): Record<string, unknown> {
  return {
    primaryColor: frontendTheme.colors.primary,
    secondaryColor: frontendTheme.colors.secondary,
    backgroundColor: frontendTheme.colors.background,
    textColor: frontendTheme.colors.text.primary,
    accentColor: frontendTheme.colors.text.accent,
    userBubbleStyle: {
      backgroundColor: frontendTheme.colors.userBubble.background,
      textColor: frontendTheme.colors.userBubble.text,
      borderRadius: frontendTheme.layout.borderRadius,
    },
    aiBubbleStyle: {
      backgroundColor: frontendTheme.colors.aiBubble.background,
      textColor: frontendTheme.colors.aiBubble.text,
      borderRadius: frontendTheme.layout.borderRadius,
    },
    fontFamily: frontendTheme.typography.fontFamily,
    fontSize: frontendTheme.typography.fontSize.medium,
    backgroundImage: frontendTheme.background.value,
    backgroundPattern:
      frontendTheme.background.type === "pattern"
        ? frontendTheme.background.value
        : undefined,
    animations: {
      messageAppear: frontendTheme.animations.messageAppear,
      typingIndicator: frontendTheme.animations.typingIndicator,
      bubbleHover: frontendTheme.animations.bubbleHover,
    },
  };
}
