import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import { Message } from "../types";

interface ChatWindowProps {
  messages: Message[];
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <section className="flex-1 flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 h-full min-h-0 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 py-8">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">
            대화를 시작해보세요!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-${
                msg.role === "user" ? "end" : "start"
              }`}
            >
              <div
                className={`rounded-2xl shadow p-5 mb-2 max-w-full break-words whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-pink-100 to-purple-100 text-right"
                    : "bg-white/90"
                }`}
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              >
                <div
                  className={`font-bold mb-1 flex items-center gap-2 ${
                    msg.role === "user"
                      ? "justify-end text-pink-700"
                      : "text-purple-700"
                  }`}
                >
                  {msg.role === "user" ? (
                    "나"
                  ) : (
                    <>
                      AI <span className="text-lg">🤔</span>{" "}
                      <span className="text-xs text-gray-400 ml-2">루나</span>
                    </>
                  )}
                </div>
                <div className="text-gray-700 mb-2 whitespace-pre-line break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code({ className, children, ...props }) {
                        return (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                      pre({ className, children, ...props }) {
                        return (
                          <pre className={className} {...props}>
                            {children}
                          </pre>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
    </section>
  );
}
