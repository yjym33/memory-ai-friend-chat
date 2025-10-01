import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatInput from "../ChatInput";

// Mock the file upload component
jest.mock("../upload/EnhancedFileUpload", () => {
  return function MockFileUpload({ onFileUploaded, onFileRemoved }: any) {
    return (
      <div data-testid="file-upload">
        <button
          onClick={() => onFileUploaded({ id: "test-file", name: "test.txt" })}
          data-testid="upload-file"
        >
          Upload File
        </button>
        <button
          onClick={() => onFileRemoved("test-file")}
          data-testid="remove-file"
        >
          Remove File
        </button>
      </div>
    );
  };
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Send: () => <div data-testid="send-icon" />,
  Paperclip: () => <div data-testid="paperclip-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

describe("ChatInput", () => {
  const mockProps = {
    onSendMessage: jest.fn(),
    loading: false,
    placeholder: "Type a message...",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render input field with placeholder", () => {
    render(<ChatInput {...mockProps} />);

    const input = screen.getByPlaceholderText("Type a message...");
    expect(input).toBeInTheDocument();
  });

  it("should render send button", () => {
    render(<ChatInput {...mockProps} />);

    const sendButton = screen.getByTestId("send-icon").closest("button");
    expect(sendButton).toBeInTheDocument();
  });

  it("should render file upload toggle button", () => {
    render(<ChatInput {...mockProps} />);

    const fileButton = screen.getByTestId("paperclip-icon").closest("button");
    expect(fileButton).toBeInTheDocument();
  });

  it("should call onSendMessage when send button is clicked", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);

    const input = screen.getByPlaceholderText("Type a message...");
    const sendButton = screen.getByTestId("send-icon").closest("button");

    await user.type(input, "Hello world");
    if (sendButton) {
      await user.click(sendButton);
    }

    expect(mockProps.onSendMessage).toHaveBeenCalledWith("Hello world", []);
  });

  it("should call onSendMessage when Enter key is pressed", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);

    const input = screen.getByPlaceholderText("Type a message...");

    await user.type(input, "Hello world{enter}");

    expect(mockProps.onSendMessage).toHaveBeenCalledWith("Hello world", []);
  });

  it("should not send message when Shift+Enter is pressed", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);

    const input = screen.getByPlaceholderText("Type a message...");

    await user.type(input, "Hello world");
    await user.keyboard("{Shift>}{Enter}{/Shift}");

    expect(mockProps.onSendMessage).not.toHaveBeenCalled();
  });

  it("should not send empty message", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);

    const sendButton = screen.getByTestId("send-icon").closest("button");

    if (sendButton) {
      await user.click(sendButton);
    }

    expect(mockProps.onSendMessage).not.toHaveBeenCalled();
  });

  it("should not send message when loading", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} loading={true} />);

    const input = screen.getByPlaceholderText("Type a message...");
    const sendButton = screen.getByTestId("send-icon").closest("button");

    await user.type(input, "Hello world");
    if (sendButton) {
      await user.click(sendButton);
    }

    expect(mockProps.onSendMessage).not.toHaveBeenCalled();
  });

  it("should disable send button when loading", () => {
    render(<ChatInput {...mockProps} loading={true} />);

    const sendButton = screen.getByTestId("send-icon").closest("button");
    expect(sendButton).toBeDisabled();
  });

  it("should toggle file upload panel", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);

    const fileButton = screen.getByTestId("paperclip-icon").closest("button");

    // File upload should not be visible initially
    expect(screen.queryByTestId("file-upload")).not.toBeInTheDocument();

    // Click to show file upload
    if (fileButton) {
      await user.click(fileButton);
    }
    expect(screen.getByTestId("file-upload")).toBeInTheDocument();

    // Click again to hide file upload
    if (fileButton) {
      await user.click(fileButton);
    }
    expect(screen.queryByTestId("file-upload")).not.toBeInTheDocument();
  });

  it("should clear input after sending message", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);

    const input = screen.getByPlaceholderText(
      "Type a message..."
    ) as HTMLTextAreaElement;
    const sendButton = screen.getByTestId("send-icon").closest("button");

    await user.type(input, "Hello world");
    if (sendButton) {
      await user.click(sendButton);
    }

    expect(input.value).toBe("");
  });

  it("should handle textarea resize", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);

    const textarea = screen.getByPlaceholderText("Type a message...");

    // Type multiple lines
    await user.type(textarea, "Line 1{enter}Line 2{enter}Line 3");

    // Textarea should expand (this is handled by CSS, but we can check the content)
    expect(textarea).toHaveValue("Line 1\nLine 2\nLine 3");
  });

  it("should show correct placeholder text", () => {
    const customPlaceholder = "Custom placeholder text";
    render(<ChatInput {...mockProps} placeholder={customPlaceholder} />);

    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it("should handle special characters in message", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);

    const input = screen.getByPlaceholderText("Type a message...");
    const sendButton = screen.getByTestId("send-icon").closest("button");

    const specialMessage = "Hello! @#$%^&*()_+ 한글 测试 🎉";
    await user.type(input, specialMessage);
    if (sendButton) {
      await user.click(sendButton);
    }

    expect(mockProps.onSendMessage).toHaveBeenCalledWith(specialMessage, []);
  });

  it("should handle long text input", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);

    const input = screen.getByPlaceholderText("Type a message...");
    const longText =
      "This is a very long message that should be handled properly by the input component. ".repeat(
        5
      );

    await user.type(input, longText);

    expect(input).toHaveValue(longText);
  });

  it("should trim whitespace from messages", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);

    const input = screen.getByPlaceholderText("Type a message...");
    const sendButton = screen.getByTestId("send-icon").closest("button");

    await user.type(input, "   Hello world   ");
    if (sendButton) {
      await user.click(sendButton);
    }

    expect(mockProps.onSendMessage).toHaveBeenCalledWith("Hello world", []);
  });
});
