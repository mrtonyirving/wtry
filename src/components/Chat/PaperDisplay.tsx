// src/components/Chat/PaperDisplay.tsx

import { useEffect, useState } from "react";

interface PaperDisplayProps {
  s3PdfUrl: string;
}

export default function PaperDisplay({ s3PdfUrl }: PaperDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset states when URL changes
    setIsLoading(true);
    setError(null);
    
    if (!s3PdfUrl) {
      setError("No PDF URL provided");
      setIsLoading(false);
      return;
    }

    // Simulate a brief loading period for the iframe to initialize
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [s3PdfUrl]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading PDF document...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!s3PdfUrl) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">
          No PDF URL available for this source.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full border-b border-gray-200">
      <iframe
        src={s3PdfUrl}
        className="w-full h-full"
        title="PDF Document"
      />
    </div>
  );
}
