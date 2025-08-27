import React from "react";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  sendMessage: () => void;
  loading: boolean;
}

export default function ChatInput({
  input,
  setInput,
  sendMessage,
  loading,
}: ChatInputProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-center bg-gradient-to-r from-white/80 to-purple-50/80 py-4 border-t border-gray-200 z-10">
      <div className="max-w-2xl w-full flex items-center gap-2 px-4">
        <input
          type="text"
          placeholder="루나에게 메시지를 보내세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) sendMessage();
          }}
          className="flex-1 rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white shadow text-gray-900"
          disabled={loading}
        />
        <button
          className="ml-2 px-5 py-3 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 text-white font-bold shadow hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-50"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h14M12 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
