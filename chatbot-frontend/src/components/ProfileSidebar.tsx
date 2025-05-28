import React from "react";

export default function ProfileSidebar() {
  return (
    <aside className="w-full sm:w-64 bg-gradient-to-b from-purple-100 to-pink-50 p-6 flex flex-col items-center border-r border-gray-200 min-h-screen">
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gray-200 mb-3 border-4 border-purple-200" />
        <div className="text-lg font-bold text-purple-700 mb-1">루나</div>
        <div className="text-xs text-gray-500 mb-2">♡ 당신의 AI 친구</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
          <span className="text-xs text-green-600">온라인</span>
          <span className="text-xs text-gray-400 ml-2">|</span>
          <span className="text-xs text-gray-400">친근함</span>
        </div>
      </div>
      <button className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold shadow mb-6 hover:from-purple-500 hover:to-pink-500 transition">
        AI 친구 설정
      </button>
    </aside>
  );
}
