// src/components/Chat/ChatMessageBubble.tsx

import { ChatMessage } from "@/services/chatApi";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end w-full mb-4" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%]",
          isUser
            ? "rounded-lg border border-[#2D67F6] p-4 min-w-[200px] w-fit max-w-2xl bg-[#EFF4FF] text-left"
            : "w-full rounded-lg border border-gray-200 bg-gray-50 p-3"
        )}
      >
        <div className={cn(
          "break-words",
          isUser ? "text-[#344054]" : "markdown-content" // Add special class for styling
        )}>
          {isUser ? (
            message.content
          ) : (
            <div className="text-[15px] leading-relaxed text-gray-900">
              <ReactMarkdown components={{
                p: ({node, ...props}) => <span className="inline" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
                li: ({node, ...props}) => <li className="my-1 last:mb-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-xl font-bold my-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-bold my-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-bold my-2" {...props} />,
              }}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
