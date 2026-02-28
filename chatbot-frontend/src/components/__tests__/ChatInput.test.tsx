import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import ChatInput from "../ChatInput";
import { ChatMode } from "../ChatModeSwitch";

// Mock the file upload component
jest.mock("../upload/EnhancedFileUpload", () => {
  return function MockFileUpload({ onFileUploaded }: { onFileUploaded: (file: { id: string; originalName: string; size: number }) => void }) {
    return (
      <div data-testid="file-upload">
        <button
          onClick={() => onFileUploaded({ id: "test-file", originalName: "test.txt", size: 1024 })}
          data-testid="upload-file"
        >
          Upload File
        </button>
      </div>
    );
  };
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Send: () => <div data-testid="send-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  X: () => <div data-testid="x-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Mic: () => <div data-testid="mic-icon" />,
  MicOff: () => <div data-testid="mic-off-icon" />,
}));

// Mock useSTT hook
jest.mock("../../hooks/useSTT", () => ({
  useSTT: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    isListening: false,
    transcript: "",
    interimTranscript: "",
    isSupported: true,
    error: null,
  }),
}));

describe("ChatInput", () => {
  const mockProps = {
    input: "",
    setInput: jest.fn(),
    sendMessage: jest.fn(),
    loading: false,
    chatMode: ChatMode.PERSONAL,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render input field", () => {
    render(<ChatInput {...mockProps} />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
  });

  it("should display placeholder based on chat mode", () => {
    const { rerender } = render(<ChatInput {...mockProps} />);
    expect(screen.getByPlaceholderText(/AI 친구 루나/)).toBeInTheDocument();

    rerender(<ChatInput {...mockProps} chatMode={ChatMode.BUSINESS} />);
    expect(screen.getByPlaceholderText(/업로드된 문서/)).toBeInTheDocument();
  });

  it("should call setInput when typing", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);
    const textarea = screen.getByRole("textbox");
    
    await user.type(textarea, "Hello");
    expect(mockProps.setInput).toHaveBeenCalled();
  });

  it("should call sendMessage when send button is clicked", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} input="Hello world" />);
    
    const sendButton = screen.getByTestId("send-icon").closest("button");
    if (sendButton) {
      await user.click(sendButton);
    }

    expect(mockProps.sendMessage).toHaveBeenCalledWith("Hello world");
  });

  it("should disable send button when input is empty and no file", () => {
    render(<ChatInput {...mockProps} input="" />);
    const sendButton = screen.getByTestId("send-icon").closest("button");
    expect(sendButton).toBeDisabled();
  });

  it("should enable send button when file is uploaded even if input is empty", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} input="" />);
    
    const plusButton = screen.getByTestId("plus-icon").closest("button");
    if (plusButton) await user.click(plusButton);
    
    const uploadButton = screen.getByTestId("upload-file");
    await user.click(uploadButton);
    
    const sendButton = screen.getByTestId("send-icon").closest("button");
    expect(sendButton).not.toBeDisabled();
  });

  it("should toggle file upload panel", async () => {
    const user = userEvent.setup();
    render(<ChatInput {...mockProps} />);
    
    const plusButton = screen.getByTestId("plus-icon").closest("button");
    
    expect(screen.queryByTestId("file-upload")).not.toBeInTheDocument();
    
    if (plusButton) await user.click(plusButton);
    expect(screen.getByTestId("file-upload")).toBeInTheDocument();
    
    if (plusButton) await user.click(plusButton);
    expect(screen.queryByTestId("file-upload")).not.toBeInTheDocument();
  });
});
