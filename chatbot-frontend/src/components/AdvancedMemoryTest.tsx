import React, { useState } from "react";
import { ChatService } from "../services/chatService";
import { logger } from "../lib/logger";

interface TestResult {
  timestamp: string;
  category: string;
  input: string;
  question: string;
  response: string;
  score: number;
}

export default function AdvancedMemoryTest() {
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // 응답 분석 및 점수 계산
  const calculateScore = (
    expectedKeywords: string[],
    response: string
  ): number => {
    const responseText = response.toLowerCase();
    const matchedKeywords = expectedKeywords.filter((keyword) =>
      responseText.includes(keyword.toLowerCase())
    );
    return Math.round((matchedKeywords.length / expectedKeywords.length) * 100);
  };

  // 연속 기억 테스트 (여러 정보를 순차적으로 입력 후 무작위 질문)
  const runSequentialTest = async () => {
    if (isRunning) return;

    setIsRunning(true);
    logger.info("연속 기억 테스트 시작");

    const testData = [
      {
        category: "개인정보",
        info: "내 생일은 3월 15일이야.",
        question: "내 생일이 언제지?",
        expectedKeywords: ["3월", "15일", "3", "15"],
      },
      {
        category: "취미",
        info: "피아노 치는 걸 좋아해.",
        question: "내가 좋아하는 악기가 뭐야?",
        expectedKeywords: ["피아노"],
      },
      {
        category: "업무",
        info: "마케팅 팀에서 일해.",
        question: "내 직장 부서는 어디야?",
        expectedKeywords: ["마케팅", "팀"],
      },
      {
        category: "감정",
        info: "오늘 정말 행복한 하루였어.",
        question: "오늘 기분이 어땠지?",
        expectedKeywords: ["행복", "좋", "기뻐"],
      },
    ];

    try {
      // 정보 입력 단계
      for (const item of testData) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 간격
        logger.debug("정보 입력 중", {
          category: item.category,
          info: item.info,
        });

        // AI에게 정보 전달
        await ChatService.sendMessage(1, item.info);
      }

      // 잠시 대기 (기억 정착 시간)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 질문 및 채점 단계
      const newTestResults: TestResult[] = [];

      for (const item of testData) {
        logger.debug("질문 진행 중", { question: item.question });

        // AI에게 질문
        const response = await ChatService.sendMessage(1, item.question);
        const score = calculateScore(item.expectedKeywords, response.content);

        const testResult: TestResult = {
          timestamp: new Date().toLocaleString(),
          category: item.category,
          input: item.info,
          question: item.question,
          response: response.content,
          score,
        };

        newTestResults.push(testResult);

        // 결과 간 간격
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      // 테스트 히스토리 업데이트
      setTestHistory((prev) => [...prev, ...newTestResults]);

      logger.info("연속 기억 테스트 완료", {
        totalTests: newTestResults.length,
        averageScore:
          newTestResults.reduce((sum, test) => sum + test.score, 0) /
          newTestResults.length,
      });
    } catch (error) {
      logger.error("연속 기억 테스트 실패", error);
    } finally {
      setIsRunning(false);
    }
  };

  // 장기 기억 테스트
  const runLongTermTest = async () => {
    if (isRunning) return;

    setIsRunning(true);
    logger.info("장기 기억 테스트 시작");

    try {
      // 이전 대화에서 언급된 정보들을 기반으로 질문
      const longTermQuestions = [
        {
          category: "장기기억",
          question: "우리가 처음 대화했을 때 내가 어떤 이야기를 했었지?",
          expectedKeywords: ["기억", "처음", "대화"],
        },
        {
          category: "장기기억",
          question: "내가 자주 하는 고민이나 걱정이 뭐였지?",
          expectedKeywords: ["고민", "걱정", "문제"],
        },
      ];

      const newTestResults: TestResult[] = [];

      for (const item of longTermQuestions) {
        logger.debug("장기 기억 질문 중", { question: item.question });

        const response = await ChatService.sendMessage(1, item.question);
        const score = calculateScore(item.expectedKeywords, response.content);

        const testResult: TestResult = {
          timestamp: new Date().toLocaleString(),
          category: item.category,
          input: "이전 대화 내용",
          question: item.question,
          response: response.content,
          score,
        };

        newTestResults.push(testResult);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      setTestHistory((prev) => [...prev, ...newTestResults]);
      logger.info("장기 기억 테스트 완료");
    } catch (error) {
      logger.error("장기 기억 테스트 실패", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
      <h3 className="font-medium text-purple-800 mb-4">🧪 고급 기억 테스트</h3>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={runSequentialTest}
          disabled={isRunning}
          className={`p-3 rounded transition text-sm ${
            isRunning
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
          }`}
        >
          {isRunning ? "테스트 진행 중..." : "연속 기억 테스트"}
        </button>
        <button
          onClick={runLongTermTest}
          disabled={isRunning}
          className={`p-3 rounded transition text-sm ${
            isRunning
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-purple-100 text-purple-700 hover:bg-purple-200"
          }`}
        >
          {isRunning ? "테스트 진행 중..." : "장기 기억 테스트"}
        </button>
      </div>

      {/* 테스트 히스토리 */}
      {testHistory.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-purple-700 mb-2">
            📊 테스트 결과 히스토리
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {testHistory.map((test, index) => (
              <div key={index} className="bg-white p-2 rounded text-xs">
                <div className="flex justify-between">
                  <span className="font-medium">{test.category}</span>
                  <span
                    className={`font-bold ${
                      test.score >= 80
                        ? "text-green-600"
                        : test.score >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {test.score}%
                  </span>
                </div>
                <div className="text-gray-600 text-xs">{test.timestamp}</div>
                <div className="text-gray-700 text-xs mt-1">
                  Q: {test.question}
                </div>
                <div className="text-gray-600 text-xs mt-1 truncate">
                  A: {test.response.substring(0, 50)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
