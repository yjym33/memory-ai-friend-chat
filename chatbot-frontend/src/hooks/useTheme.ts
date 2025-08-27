import { useState, useEffect, useCallback } from "react";
import { ChatTheme, getDefaultTheme } from "../types/theme";
import { ChatService } from "../services/chatService";

export function useTheme(conversationId: number) {
  const [currentTheme, setCurrentTheme] = useState<ChatTheme | null>(null);
  const [loading, setLoading] = useState(true);

  // 테마 불러오기
  const loadTheme = useCallback(async () => {
    try {
      const response = await ChatService.getConversationTheme(conversationId);
      if (response.theme && Object.keys(response.theme).length > 0) {
        // 백엔드 테마를 프론트엔드 형식으로 변환
        const convertedTheme = convertBackendThemeToFrontend(
          response.theme,
          response.themeName
        );
        setCurrentTheme(convertedTheme);
      } else {
        // 기본 테마 적용
        setCurrentTheme(getDefaultTheme());
      }
    } catch (error) {
      console.error("테마 불러오기 실패:", error);
      // 기본 테마 적용
      setCurrentTheme(getDefaultTheme());
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // 테마 저장
  const saveTheme = async (theme: ChatTheme) => {
    try {
      // 프론트엔드 테마를 백엔드 형식으로 변환
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
  };

  // CSS 변수로 테마 적용
  const applyTheme = (theme: ChatTheme) => {
    const root = document.documentElement;

    // 색상 변수 설정
    root.style.setProperty("--color-primary", theme.colors.primary);
    root.style.setProperty("--color-secondary", theme.colors.secondary);
    root.style.setProperty("--color-background", theme.colors.background);
    root.style.setProperty("--color-surface", theme.colors.surface);
    root.style.setProperty("--color-text-primary", theme.colors.text.primary);
    root.style.setProperty(
      "--color-text-secondary",
      theme.colors.text.secondary
    );
    root.style.setProperty("--color-text-accent", theme.colors.text.accent);

    // 사용자 버블 스타일
    root.style.setProperty(
      "--user-bubble-bg",
      theme.colors.userBubble.background
    );
    root.style.setProperty("--user-bubble-text", theme.colors.userBubble.text);
    root.style.setProperty(
      "--user-bubble-border",
      theme.colors.userBubble.border
    );

    // AI 버블 스타일
    root.style.setProperty("--ai-bubble-bg", theme.colors.aiBubble.background);
    root.style.setProperty("--ai-bubble-text", theme.colors.aiBubble.text);
    root.style.setProperty("--ai-bubble-border", theme.colors.aiBubble.border);

    // 타이포그래피
    root.style.setProperty("--font-family", theme.typography.fontFamily);
    root.style.setProperty(
      "--font-size-small",
      theme.typography.fontSize.small
    );
    root.style.setProperty(
      "--font-size-medium",
      theme.typography.fontSize.medium
    );
    root.style.setProperty(
      "--font-size-large",
      theme.typography.fontSize.large
    );

    // 레이아웃
    root.style.setProperty("--border-radius", theme.layout.borderRadius);
    root.style.setProperty("--spacing", theme.layout.spacing);
    root.style.setProperty("--shadow", theme.layout.shadow);

    // 배경
    if (theme.background.type === "gradient") {
      root.style.setProperty("--background", theme.background.value);
    } else if (theme.background.type === "image") {
      root.style.setProperty("--background", `url(${theme.background.value})`);
    } else {
      root.style.setProperty("--background", theme.background.value);
    }
  };

  useEffect(() => {
    if (conversationId) {
      loadTheme();
    }
  }, [loadTheme]);

  useEffect(() => {
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentTheme]);

  return {
    currentTheme,
    loading,
    saveTheme,
    applyTheme,
    loadTheme,
  };
}

// 백엔드 테마를 프론트엔드 형식으로 변환
function convertBackendThemeToFrontend(
  backendTheme: Record<string, unknown>,
  themeName: string
): ChatTheme {
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
        background:
          ((backendTheme.userBubbleStyle as Record<string, unknown>)
            ?.backgroundColor as string) ||
          "linear-gradient(135deg, #8B5CF6, #EC4899)",
        text:
          ((backendTheme.userBubbleStyle as Record<string, unknown>)
            ?.textColor as string) || "#FFFFFF",
        border: "none",
      },
      aiBubble: {
        background:
          ((backendTheme.aiBubbleStyle as Record<string, unknown>)
            ?.backgroundColor as string) || "#FFFFFF",
        text:
          ((backendTheme.aiBubbleStyle as Record<string, unknown>)
            ?.textColor as string) || "#1F2937",
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
      borderRadius:
        ((backendTheme.userBubbleStyle as Record<string, unknown>)
          ?.borderRadius as string) || "12px",
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
      messageAppear:
        ((backendTheme.animations as Record<string, unknown>)
          ?.messageAppear as boolean) || true,
      typingIndicator:
        ((backendTheme.animations as Record<string, unknown>)
          ?.typingIndicator as boolean) || true,
      bubbleHover:
        ((backendTheme.animations as Record<string, unknown>)
          ?.bubbleHover as boolean) || true,
      themeTransition: true,
    },
  };
}

// 프론트엔드 테마를 백엔드 형식으로 변환
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
