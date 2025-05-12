// src/components/Chat/ChatInterface.tsx

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/services/chatApi";
import ChatMessageBubble from "./ChatMessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

interface ChatInterfaceProps {
  messageHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
}

export default function ChatInterface({
  messageHistory,
  isLoading,
  error,
  onSendMessage,
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages display area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messageHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="mb-2">Start a conversation about this paper</p>
              <p className="text-sm">Ask questions about methods, findings, or implications</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messageHistory.map((msg, index) => (
              <ChatMessageBubble key={index} message={msg} />
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            
            {/* Invisible element for scrolling to end */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input area styled like SearchInput */}
      <div className="px-4 pb-4 w-full">
        <form onSubmit={handleSubmit} className="relative w-full">
          <Input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full pr-[68px] pl-4 h-[64px] text-4xl overflow-x-auto focus-visible:ring-gray-400"
            style={{ fontSize: "1rem" }}
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !message.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-[40px] w-[40px] p-0 bg-[#4361EE] hover:bg-[#3651DE] rounded-md"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
