interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-3 whitespace-pre-wrap ${
          isUser
            ? 'bg-gray-100 text-gray-800'
            : 'bg-blue-500 text-white'
        }`}
      >
        {message.content.split('\n').map((line, index) => (
          <p key={index} className="mb-1 last:mb-0">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
} 