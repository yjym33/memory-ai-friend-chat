export interface ChatTheme {
  id: string;
  name: string;
  description: string;
  isCustom: boolean;
  isDefault: boolean;

  // 색상 팔레트
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      accent: string;
    };
    userBubble: {
      background: string;
      text: string;
      border: string;
    };
    aiBubble: {
      background: string;
      text: string;
      border: string;
    };
  };

  // 타이포그래피
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
  };

  // 레이아웃
  layout: {
    borderRadius: string;
    spacing: string;
    shadow: string;
  };

  // 배경
  background: {
    type: "solid" | "gradient" | "image" | "pattern";
    value: string;
    overlay?: string;
  };

  // 애니메이션
  animations: {
    messageAppear: boolean;
    typingIndicator: boolean;
    bubbleHover: boolean;
    themeTransition: boolean;
  };
}

export interface ThemePreset {
  id: string;
  name: string;
  category: "nature" | "technology" | "art" | "minimal" | "custom";
  preview: string; // 미리보기 이미지 URL
  theme: ChatTheme;
}

// 기본 테마 프리셋들
export const defaultThemePresets: ThemePreset[] = [
  {
    id: "default",
    name: "기본 테마",
    category: "minimal",
    preview: "/themes/default-preview.png",
    theme: {
      id: "default",
      name: "기본 테마",
      description: "깔끔하고 심플한 기본 테마",
      isCustom: false,
      isDefault: true,
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
      typography: {
        fontFamily: "Inter, sans-serif",
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
        borderRadius: "12px",
        spacing: "16px",
        shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      },
      background: {
        type: "gradient",
        value: "linear-gradient(135deg, #F8FAFC 0%, #E0E7FF 100%)",
      },
      animations: {
        messageAppear: true,
        typingIndicator: true,
        bubbleHover: true,
        themeTransition: true,
      },
    },
  },
  {
    id: "dark-mode",
    name: "다크 모드",
    category: "minimal",
    preview: "/themes/dark-preview.png",
    theme: {
      id: "dark-mode",
      name: "다크 모드",
      description: "눈의 피로를 줄이는 다크 테마",
      isCustom: false,
      isDefault: false,
      colors: {
        primary: "#6366F1",
        secondary: "#8B5CF6",
        background: "#111827",
        surface: "#1F2937",
        text: {
          primary: "#F9FAFB",
          secondary: "#D1D5DB",
          accent: "#6366F1",
        },
        userBubble: {
          background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
          text: "#FFFFFF",
          border: "none",
        },
        aiBubble: {
          background: "#374151",
          text: "#F9FAFB",
          border: "1px solid #4B5563",
        },
      },
      typography: {
        fontFamily: "Inter, sans-serif",
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
        borderRadius: "12px",
        spacing: "16px",
        shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
      },
      background: {
        type: "gradient",
        value: "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
      },
      animations: {
        messageAppear: true,
        typingIndicator: true,
        bubbleHover: true,
        themeTransition: true,
      },
    },
  },
  {
    id: "nature",
    name: "자연 테마",
    category: "nature",
    preview: "/themes/nature-preview.png",
    theme: {
      id: "nature",
      name: "자연 테마",
      description: "편안하고 자연스러운 녹색 테마",
      isCustom: false,
      isDefault: false,
      colors: {
        primary: "#10B981",
        secondary: "#059669",
        background: "#F0FDF4",
        surface: "#FFFFFF",
        text: {
          primary: "#064E3B",
          secondary: "#065F46",
          accent: "#10B981",
        },
        userBubble: {
          background: "linear-gradient(135deg, #10B981, #059669)",
          text: "#FFFFFF",
          border: "none",
        },
        aiBubble: {
          background: "#FFFFFF",
          text: "#064E3B",
          border: "1px solid #D1FAE5",
        },
      },
      typography: {
        fontFamily: "Inter, sans-serif",
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
        borderRadius: "16px",
        spacing: "16px",
        shadow: "0 4px 6px -1px rgba(16, 185, 129, 0.1)",
      },
      background: {
        type: "gradient",
        value: "linear-gradient(135deg, #F0FDF4 0%, #D1FAE5 100%)",
      },
      animations: {
        messageAppear: true,
        typingIndicator: true,
        bubbleHover: true,
        themeTransition: true,
      },
    },
  },
  {
    id: "sunset",
    name: "선셋 테마",
    category: "art",
    preview: "/themes/sunset-preview.png",
    theme: {
      id: "sunset",
      name: "선셋 테마",
      description: "따뜻하고 로맨틱한 오렌지 테마",
      isCustom: false,
      isDefault: false,
      colors: {
        primary: "#F59E0B",
        secondary: "#D97706",
        background: "#FFFBEB",
        surface: "#FFFFFF",
        text: {
          primary: "#92400E",
          secondary: "#B45309",
          accent: "#F59E0B",
        },
        userBubble: {
          background: "linear-gradient(135deg, #F59E0B, #D97706)",
          text: "#FFFFFF",
          border: "none",
        },
        aiBubble: {
          background: "#FFFFFF",
          text: "#92400E",
          border: "1px solid #FED7AA",
        },
      },
      typography: {
        fontFamily: "Inter, sans-serif",
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
        borderRadius: "20px",
        spacing: "16px",
        shadow: "0 4px 6px -1px rgba(245, 158, 11, 0.1)",
      },
      background: {
        type: "gradient",
        value: "linear-gradient(135deg, #FFFBEB 0%, #FED7AA 100%)",
      },
      animations: {
        messageAppear: true,
        typingIndicator: true,
        bubbleHover: true,
        themeTransition: true,
      },
    },
  },
];

// 기본 테마 가져오기
export const getDefaultTheme = (): ChatTheme => {
  return defaultThemePresets[0].theme;
};

// 로컬 스토리지에서 커스텀 테마 가져오기
export const getCustomThemes = (): ThemePreset[] => {
  if (typeof window === "undefined") return [];

  try {
    const customThemesJson = localStorage.getItem("customThemes");
    return customThemesJson ? JSON.parse(customThemesJson) : [];
  } catch (error) {
    console.error("커스텀 테마 로드 실패:", error);
    return [];
  }
};

// 커스텀 테마 저장하기
export const saveCustomTheme = (theme: ChatTheme): void => {
  if (typeof window === "undefined") return;

  try {
    const customThemes = getCustomThemes();
    const themePreset: ThemePreset = {
      id: theme.id,
      name: theme.name,
      category: "custom",
      preview: "", // 커스텀 테마는 미리보기 이미지가 없음
      theme: theme,
    };

    // 기존 테마가 있으면 업데이트, 없으면 추가
    const existingIndex = customThemes.findIndex((t) => t.id === theme.id);
    if (existingIndex >= 0) {
      customThemes[existingIndex] = themePreset;
    } else {
      customThemes.push(themePreset);
    }

    localStorage.setItem("customThemes", JSON.stringify(customThemes));
  } catch (error) {
    console.error("커스텀 테마 저장 실패:", error);
  }
};

// 커스텀 테마 삭제하기
export const deleteCustomTheme = (themeId: string): void => {
  if (typeof window === "undefined") return;

  try {
    const customThemes = getCustomThemes();
    const filteredThemes = customThemes.filter((t) => t.id !== themeId);
    localStorage.setItem("customThemes", JSON.stringify(filteredThemes));
  } catch (error) {
    console.error("커스텀 테마 삭제 실패:", error);
  }
};

// 모든 테마 프리셋 가져오기 (기본 + 커스텀)
export const getAllThemePresets = (): ThemePreset[] => {
  const customThemes = getCustomThemes();
  return [...defaultThemePresets, ...customThemes];
};

// 로컬 스토리지 초기화 (커스텀 테마 모두 삭제)
export const clearCustomThemes = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("customThemes");
    console.log("커스텀 테마가 모두 삭제되었습니다.");
  } catch (error) {
    console.error("커스텀 테마 초기화 실패:", error);
  }
};

// 특정 테마 ID가 기본 테마인지 확인
export const isDefaultTheme = (themeId: string): boolean => {
  return defaultThemePresets.some((preset) => preset.id === themeId);
};
