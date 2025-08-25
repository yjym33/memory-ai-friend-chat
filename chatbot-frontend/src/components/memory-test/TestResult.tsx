import React from "react";

interface TestResultProps {
  testResult: string;
  expectedKeywords: string[];
}

export default function TestResult({
  testResult,
  expectedKeywords,
}: TestResultProps) {
  if (!testResult) return null;

  const matchedKeywords = expectedKeywords.filter((keyword) =>
    testResult.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <div className="bg-green-50 border border-green-200 p-3 rounded">
      <div className="font-medium text-green-800 mb-1">🤖 AI 응답:</div>
      <div className="text-green-700 text-sm">{testResult}</div>

      {/* 키워드 매칭 결과 */}
      <div className="mt-2 pt-2 border-t border-green-200">
        <div className="text-xs text-green-600">
          예상 키워드: {expectedKeywords.join(", ")}
        </div>
        <div className="text-xs text-green-600">
          매칭 확인: {matchedKeywords.join(", ") || "없음"}
        </div>
      </div>
    </div>
  );
}
