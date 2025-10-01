import React from "react";
import { render, screen } from "@testing-library/react";
import MessageBubble from "../MessageBubble";
import type { Message } from "../../types";

// Mock react-markdown
jest.mock("react-markdown", () => {
  return function MockMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// Mock react-syntax-highlighter
jest.mock("react-syntax-highlighter", () => ({
  Prism: function MockPrism({ children }: { children: string }) {
    return <pre data-testid="code-block">{children}</pre>;
  },
}));

describe("MessageBubble", () => {
  const baseMessage: Message = {
    id: 1,
    content: "Hello world",
    role: "user",
    timestamp: new Date("2024-01-01T12:00:00Z"),
    conversationId: 1,
  };

  it("should render message content", () => {
    render(<MessageBubble message={baseMessage} />);

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("should apply correct CSS classes for user message", () => {
    const { container } = render(<MessageBubble message={baseMessage} />);

    const messageContainer = container.firstChild as HTMLElement;
    expect(messageContainer).toHaveClass("flex", "justify-start");
  });

  it("should apply correct CSS classes for AI message", () => {
    const aiMessage: Message = {
      ...baseMessage,
      role: "assistant",
    };

    const { container } = render(<MessageBubble message={aiMessage} />);

    const messageContainer = container.firstChild as HTMLElement;
    expect(messageContainer).toHaveClass("flex", "justify-end");
  });

  it("should render markdown content", () => {
    const message: Message = {
      ...baseMessage,
      content: "**Bold text**",
    };

    render(<MessageBubble message={message} />);

    expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
  });

  it("should handle empty message content", () => {
    const emptyMessage: Message = {
      ...baseMessage,
      content: "",
    };

    render(<MessageBubble message={emptyMessage} />);

    // Should still render the message structure
    expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
  });

  it("should handle special characters in content", () => {
    const specialMessage: Message = {
      ...baseMessage,
      content: "Hello! @#$%^&*()_+ 한글 测试 🎉",
    };

    render(<MessageBubble message={specialMessage} />);

    expect(
      screen.getByText("Hello! @#$%^&*()_+ 한글 测试 🎉")
    ).toBeInTheDocument();
  });

  it("should handle code blocks", () => {
    const codeMessage: Message = {
      ...baseMessage,
      content: '```javascript\nconsole.log("Hello World");\n```',
    };

    render(<MessageBubble message={codeMessage} />);

    expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
  });

  it("should handle message with HTML content safely", () => {
    const htmlMessage: Message = {
      ...baseMessage,
      content: '<script>alert("xss")</script>Hello',
    };

    render(<MessageBubble message={htmlMessage} />);

    // Should render as text through markdown, not execute script
    expect(screen.getByTestId("markdown-content")).toBeInTheDocument();
  });

  it("should handle user role correctly", () => {
    const userMessage: Message = {
      ...baseMessage,
      role: "user",
    };

    const { container } = render(<MessageBubble message={userMessage} />);

    const messageContainer = container.firstChild as HTMLElement;
    expect(messageContainer).toHaveClass("justify-start");
  });

  it("should handle assistant role correctly", () => {
    const assistantMessage: Message = {
      ...baseMessage,
      role: "assistant",
    };

    const { container } = render(<MessageBubble message={assistantMessage} />);

    const messageContainer = container.firstChild as HTMLElement;
    expect(messageContainer).toHaveClass("justify-end");
  });

  it("should apply correct background colors", () => {
    const { container, rerender } = render(
      <MessageBubble message={baseMessage} />
    );

    // User message should have gray background
    let messageBubble = container.querySelector(".bg-gray-100");
    expect(messageBubble).toBeInTheDocument();

    // Assistant message should have blue background
    const assistantMessage: Message = {
      ...baseMessage,
      role: "assistant",
    };

    rerender(<MessageBubble message={assistantMessage} />);
    messageBubble = container.querySelector(".bg-blue-500");
    expect(messageBubble).toBeInTheDocument();
  });
});
