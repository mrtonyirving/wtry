// src/components/AISearch/ChatBubbleAnswerSection.tsx

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ClipboardCopy, ClipboardCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatBubbleAnswerSectionProps {
  claim: string;
  relevant_source_quote: string;
  source_id?: string;
  onHover?: (id: number | null) => void;
  isFirst?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const ChatBubbleAnswerSection: React.FC<ChatBubbleAnswerSectionProps> = ({
  claim,
  relevant_source_quote,
  source_id = "0",
  onHover,
  isFirst = true,
  containerRef,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    // Prevent the event from bubbling up to parent containers
    e.stopPropagation();
    
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Default tooltip position (fallback if container ref is not available)
      let tooltipLeft = rect.left + window.scrollX;
      let tooltipTop = rect.top + window.scrollY;
      
      // Tooltip dimensions
      const tooltipWidth = 416;
      const tooltipHeight = 150; // Approximate height of tooltip
      
      // Fixed distance from the bubble for consistency
      const horizontalGap = 12; // Fixed pixel distance horizontally
      const verticalGap = 12; // Fixed pixel distance vertically
      const safetyMargin = 20; // Safety margin from window edges
      
      if (containerRef && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Calculate horizontal center of the container and bubble
        const containerCenter = containerRect.left + (containerRect.width / 2);
        const bubbleCenter = rect.left + (rect.width / 2);
        
        // Horizontal positioning based on container center
        if (bubbleCenter < containerCenter) {
          // Bubble is on left side, tooltip should go to the right
          tooltipLeft = rect.right + window.scrollX + horizontalGap;
        } else {
          // Bubble is on right side, tooltip should go to the left
          tooltipLeft = rect.left + window.scrollX - tooltipWidth - horizontalGap;
        }
        
        // Calculate where the bubble is vertically within the container
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;
        const containerHeight = containerRect.height;
        
        // Define smaller top and bottom regions (20% of container) for more subtle positioning
        const topRegion = containerTop + (containerHeight * 0.05);
        const bottomRegion = containerBottom - (containerHeight * 0.3);
        
        // Position tooltip based on where the bubble is vertically
        if (rect.top < topRegion) {
          // Bubble is very near the top - position tooltip below
          tooltipTop = rect.bottom + window.scrollY + verticalGap;
        } else if (rect.bottom > bottomRegion) {
          // Bubble is very near the bottom - position tooltip above
          tooltipTop = rect.top + window.scrollY - tooltipHeight - verticalGap;
        } else {
          // Bubble is in the middle area - center tooltip vertically with more subtle adjustment
          // Calculate how far the bubble is from the vertical center (as a percentage)
          const containerMiddle = containerTop + (containerHeight / 2);
          const distanceFromMiddle = (rect.top + (rect.height / 2) - containerMiddle) / (containerHeight / 2);
          
          // Apply a subtle shift based on position (ranges from -1 to 1)
          // -1 means at top of middle region, 1 means at bottom of middle region
          const subtleShift = distanceFromMiddle * 20; // Max 20px shift
          
          // Base position is centered on the bubble, with subtle shift applied
          tooltipTop = rect.top + window.scrollY - (tooltipHeight / 2) + (rect.height / 2) - subtleShift;
        }
        
        // Safety checks for window boundaries
        
        // Ensure tooltip doesn't extend below window
        if (tooltipTop + tooltipHeight > windowHeight - safetyMargin) {
          tooltipTop = windowHeight - tooltipHeight - safetyMargin;
        }
        
        // Ensure tooltip doesn't extend above window
        if (tooltipTop < safetyMargin) {
          tooltipTop = safetyMargin;
        }
      }
      
      setTooltipPosition({
        top: tooltipTop,
        left: tooltipLeft,
      });
    }
    setShowTooltip(true);
    onHover?.(Number(source_id));
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // Prevent the event from bubbling up to parent containers
    e.stopPropagation();
    
    setShowTooltip(false);
    onHover?.(null);
  };

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(relevant_source_quote);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 800); // Hide after 0.8 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <span className="inline">
      {!isFirst && " "}
      <span className="text-[15px] leading-relaxed text-gray-900 inline">
        <ReactMarkdown components={{
          p: ({node, ...props}) => <span className="inline" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
          li: ({node, ...props}) => <li className="my-1" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
          em: ({node, ...props}) => <em className="italic" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-600 hover:underline" {...props} />,
          h1: ({node, ...props}) => <h1 className="text-xl font-bold my-2" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-bold my-2" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-bold my-2" {...props} />,
        }}>{claim}</ReactMarkdown>
      </span>
      {source_id !== "null" && (
        <span
          ref={bubbleRef}
          className={`inline-flex items-center justify-center w-5 h-5 text-xs rounded-full transition-colors cursor-pointer ml-1 align-middle ${
            showCopied
              ? "bg-green-600 text-white"
              : showTooltip
              ? "bg-blue-600 text-white"
              : "bg-blue-100 text-blue-800 hover:bg-blue-600 hover:text-white"
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {showCopied ? (
            <ClipboardCheck className="w-3 h-3" />
          ) : showTooltip ? (
            <ClipboardCopy className="w-3 h-3" />
          ) : (
            source_id
          )}
        </span>
      )}

      {showTooltip &&
        createPortal(
          <div
            className="fixed z-50"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            <div className="bg-white p-4 rounded-lg shadow-md w-[400px] border border-gray-200">
              <div className="space-y-1">
                <p className="font-semibold text-black">Source:</p>
                <p className="text-sm text-gray-700">{relevant_source_quote}</p>
                {showCopied && (
                  <p className="text-sm text-green-600">Copied to clipboard!</p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </span>
  );
};

export default ChatBubbleAnswerSection;
