import React, { useState } from "react";

export default function AdvancedMemoryTest() {
  const [testHistory] = useState<
    Array<{
      timestamp: string;
      category: string;
      input: string;
      question: string;
      response: string;
      score: number;
    }>
  >([]);

  // 연속 기억 테스트 (여러 정보를 순차적으로 입력 후 무작위 질문)
  const runSequentialTest = async () => {
    const testData = [
      { category: "개인정보", info: "내 생일은 3월 15일이야." },
      { category: "취미", info: "피아노 치는 걸 좋아해." },
      { category: "업무", info: "마케팅 팀에서 일해." },
      { category: "감정", info: "오늘 정말 행복한 하루였어." },
    ];

    // 정보 입력
    for (const item of testData) {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 간격
      // TODO: 정보 입력 로직 구현
      console.log("Processing:", item);
    }

    // 무작위 질문
    const questions = [
      "내 생일이 언제지?",
      "내가 좋아하는 악기가 뭐야?",
      "내 직장 부서는 어디야?",
      "오늘 기분이 어땠지?",
    ];

    // TODO: 질문 및 채점 로직 구현
    console.log("Questions:", questions);
  };

  return (
    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
      <h3 className="font-medium text-purple-800 mb-4">🧪 고급 기억 테스트</h3>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={runSequentialTest}
          className="p-3 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition text-sm"
        >
          연속 기억 테스트
        </button>
        <button className="p-3 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition text-sm">
          장기 기억 테스트
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
                <div className="text-gray-800">{test.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
