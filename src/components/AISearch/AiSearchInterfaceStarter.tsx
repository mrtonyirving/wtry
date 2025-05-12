// src/components/AISearch/AiSearchInterfaceStarter.tsx

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useThread, SourceType } from "@/contexts/ThreadContext";

// Example queries component with modern styling
function ExampleQueries({
  onSelectExample,
}: {
  onSelectExample: (query: string) => void;
}) {
  const examples = [
    "What specific mechanism does auranofin use to induce apoptosis?",
    "What is the incidence of CRh among patients with AML?",
    "What is the role of LINC00673 in the regulation of cellular senescence in lung adenocarcinoma cells?",
  ];

  return (
    <div className="mt-12 space-y-4">
      <h3 className="font-medium mb-4">Try out some examples if unsure how to start:</h3>
      <div className="space-y-3">
        {examples.map((example, index) => (
          <div 
            key={index}
            onClick={() => onSelectExample(example)}
            className="flex items-center bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-sm transition-all"
          >
            <div className="bg-blue-100 rounded-full p-2 flex-shrink-0 mr-3">
              <img src="/featured-icon.svg" alt="" className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 mr-4">
              <span className="text-gray-800 block">{example}</span>
            </div>
            <div className="flex-shrink-0">
              <ArrowRight className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Source toggle component for selecting search sources
function SourceToggle({ 
  selectedSource, 
  onSourceChange 
}: { 
  selectedSource: SourceType; 
  onSourceChange: (source: SourceType) => void;
}) {
  const sources = [
    { id: 'pubmed' as SourceType, label: 'PubMed' },
    { id: 'library' as SourceType, label: 'Library' },
  ];

  // Function to select a source
  const selectSource = (sourceId: SourceType) => {
    // Set the selected source
    onSourceChange(sourceId);
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-sm text-gray-600 mr-2">Select search scope:</span>
      <div className="flex gap-2">
        {sources.map((source) => (
          <button
            key={source.id}
            onClick={() => selectSource(source.id)}
            className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
              selectedSource === source.id
                ? 'bg-blue-50 border-blue-200 text-blue-600' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {source.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface AiSearchInterfaceStarterProps {
  onSearch: (query: string, maxSources: number, source: SourceType) => Promise<void>;
  isLoading: boolean;
}

export function AiSearchInterfaceStarter({
  onSearch,
  isLoading,
}: AiSearchInterfaceStarterProps) {
  const [query, setQuery] = useState("");
  const { selectedSource, setSelectedSource } = useThread();
  const initializedRef = useRef(false);

  const handleSearch = () => {
    if (query.trim() && !isLoading) {
      onSearch(query.trim(), 10, selectedSource);
    }
  };

  const handleSelectExample = (exampleQuery: string) => {
    // Set the query in the input
    setQuery(exampleQuery);
    // Execute the search with the example query
    onSearch(exampleQuery, 10, selectedSource);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSearch();
    }
  };

  // Handle source selection changes
  const handleSourceChange = (source: SourceType) => {
    setSelectedSource(source);
  };

  // Ensure PubMed is the default selection when component mounts
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      // Make sure the selected source is set
      setSelectedSource(selectedSource);
    }
  }, [selectedSource, setSelectedSource]);

  return (
    <div className="flex flex-col h-full py-12">
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4">
        {/* Logo and Title */}
        <div className="w-full text-center mb-10">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" alt="Wayless" className="h-14 w-14" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">
            Biomedical Research Made Simple
          </h1>
        </div>

        {/* Search Input */}
        <div className="w-full">
          <div className="relative w-full">
            <textarea
              placeholder="Describe a topic you'd like to explore"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-4 pr-14 min-h-[90px] rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="absolute right-[13px] bottom-[31px] h-10 w-10 p-0 rounded-lg flex items-center justify-center bg-blue-600 hover:bg-blue-700"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Source Toggle */}
          <SourceToggle 
            selectedSource={selectedSource}
            onSourceChange={handleSourceChange} 
          />

          {/* Example Queries */}
          <ExampleQueries onSelectExample={handleSelectExample} />
        </div>
      </div>
    </div>
  );
}
