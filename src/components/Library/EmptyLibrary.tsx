import React from "react";
import { FileSearch, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyLibraryProps {
  onUpload?: () => void;
}

const EmptyLibrary: React.FC<EmptyLibraryProps> = ({ onUpload }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
      <div className="mb-8">
        <div className="w-32 h-32 mx-auto relative">
          <div className="absolute inset-0 bg-blue-50 rounded-full opacity-20"></div>
          <div className="absolute inset-4 bg-blue-100 rounded-full opacity-40"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FileSearch className="w-16 h-16 text-blue-500" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-3">
        There is nothing in here yet
      </h2>
      <p className="text-gray-500 mb-8">
        Try saving sources from threads for it to appear here or upload a
        document
      </p>

      <Button
        onClick={onUpload}
        className="flex items-center gap-2"
        size="lg"
        variant="outline"
      >
        <FileUp className="h-5 w-5" />
        Upload PDF
      </Button>
    </div>
  );
};

export default EmptyLibrary;
