const axios = require("axios");

const API_BASE_URL = "http://localhost:8080";

async function testThemeAPI() {
  try {
    console.log("🧪 테마 API 테스트 시작...\n");

    // 1. 로그인
    console.log("1️⃣ 로그인 중...");
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });

    const token = loginResponse.data.token;
    console.log("✅ 로그인 성공\n");

    // 2. 대화 목록 조회
    console.log("2️⃣ 대화 목록 조회 중...");
    const conversationsResponse = await axios.get(
      `${API_BASE_URL}/chat/conversations`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const conversations = conversationsResponse.data;
    console.log(`✅ 대화 목록 조회 성공 (${conversations.length}개 대화)\n`);

    if (conversations.length === 0) {
      console.log("❌ 테스트할 대화가 없습니다. 먼저 대화를 생성해주세요.");
      return;
    }

    const conversationId = conversations[0].id;
    console.log(`📝 테스트할 대화 ID: ${conversationId}\n`);

    // 3. 현재 테마 조회
    console.log("3️⃣ 현재 테마 조회 중...");
    try {
      const currentThemeResponse = await axios.get(
        `${API_BASE_URL}/chat/conversations/${conversationId}/theme`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("✅ 현재 테마 조회 성공");
      console.log(
        "현재 테마:",
        JSON.stringify(currentThemeResponse.data, null, 2)
      );
    } catch (error) {
      console.log("ℹ️ 현재 테마가 설정되지 않음 (기본값 사용)");
    }
    console.log("");

    // 4. 테마 업데이트
    console.log("4️⃣ 테마 업데이트 중...");
    const newTheme = {
      primaryColor: "#10B981",
      secondaryColor: "#059669",
      backgroundColor: "#F0FDF4",
      textColor: "#064E3B",
      accentColor: "#10B981",
      userBubbleStyle: {
        backgroundColor: "linear-gradient(135deg, #10B981, #059669)",
        textColor: "#FFFFFF",
        borderRadius: "16px",
      },
      aiBubbleStyle: {
        backgroundColor: "#FFFFFF",
        textColor: "#064E3B",
        borderRadius: "16px",
      },
      fontFamily: "Inter, sans-serif",
      fontSize: "1rem",
      backgroundImage: "linear-gradient(135deg, #F0FDF4 0%, #D1FAE5 100%)",
      animations: {
        messageAppear: true,
        typingIndicator: true,
        bubbleHover: true,
      },
    };

    const updateThemeResponse = await axios.put(
      `${API_BASE_URL}/chat/conversations/${conversationId}/theme`,
      {
        theme: newTheme,
        themeName: "자연 테마",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ 테마 업데이트 성공");
    console.log(
      "업데이트된 대화:",
      JSON.stringify(updateThemeResponse.data, null, 2)
    );
    console.log("");

    // 5. 업데이트된 테마 조회
    console.log("5️⃣ 업데이트된 테마 조회 중...");
    const updatedThemeResponse = await axios.get(
      `${API_BASE_URL}/chat/conversations/${conversationId}/theme`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("✅ 업데이트된 테마 조회 성공");
    console.log(
      "저장된 테마:",
      JSON.stringify(updatedThemeResponse.data, null, 2)
    );
    console.log("");

    console.log("🎉 모든 테마 API 테스트 완료!");
  } catch (error) {
    console.error(
      "❌ 테마 API 테스트 실패:",
      error.response?.data || error.message
    );
  }
}

// 스크립트 실행
testThemeAPI();
