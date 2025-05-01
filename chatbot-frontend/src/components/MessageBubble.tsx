import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MessageBubbleProps {
  message: {
    role: "user" | "assistant";
    content: string;
  };
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 whitespace-pre-wrap ${
          isUser ? "bg-gray-100 text-gray-800" : "bg-blue-500 text-white"
        }`}
      >
        <ReactMarkdown
          components={{
            code({ inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";

              return !inline ? (
                <SyntaxHighlighter
                  style={dracula}
                  language={language}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code
                  className={`${className} ${
                    isUser
                      ? "bg-gray-200 text-gray-800"
                      : "bg-blue-600 text-white"
                  } rounded px-1 py-0.5 font-mono text-sm`}
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
