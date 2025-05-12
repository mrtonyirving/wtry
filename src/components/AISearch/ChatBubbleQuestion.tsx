// src/components/AISearch/ChatBubbleQuestion.tsx

interface ChatBubbleQuestionProps {
  message: string;
}

export default function ChatBubbleQuestion({
  message,
}: ChatBubbleQuestionProps): JSX.Element {
  return (
    <div className="flex justify-end w-full mb-4">
      <div className="rounded-lg border border-[#2D67F6] p-4 min-w-[200px] w-fit max-w-2xl bg-[#EFF4FF] text-left">
        <div className="flex items-start gap-3">
          <div className="flex-grow">
            <p className="text-[#344054] break-words">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
