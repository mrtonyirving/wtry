// src/components/AISearch/SearchInput.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";
import { SourceType } from "@/contexts/ThreadContext";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

interface SearchInputProps {
  onSearch: (query: string, maxSources: number, sourceType: SourceType) => Promise<void>;
  placeholder?: string;
  isLoading: boolean;
  isSearchBarActive: boolean;
  isFollowup?: boolean;
  selectedSources?: SourceType[];
}

export function SearchInput({
  onSearch,
  placeholder,
  isLoading,
  isSearchBarActive,
  isFollowup = false,
  selectedSources = ['pubmed'], // Default to pubmed if not provided
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const maxSources = 10;
  
  // Set the default placeholder based on whether this is a follow-up question
  const defaultPlaceholder = isFollowup
    ? "Refine your question, ask for a comparison, or probe deeper"
    : "Get precise insights from PubMed";
  
  // Use the provided placeholder or the default
  const displayPlaceholder = placeholder || defaultPlaceholder;

  const handleSearch = async () => {
    if (!query.trim() || isLoading || !isSearchBarActive || !selectedSources || selectedSources.length === 0) return;

    const searchQuery = query.trim();
    setQuery("");
    try {
      // Use the first selected source or default to 'pubmed'
      const sourceType = selectedSources[0] || 'pubmed';
      await onSearch(searchQuery, maxSources, sourceType);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && isSearchBarActive && selectedSources && selectedSources.length > 0) {
      handleSearch();
    }
  };

  return (
    <div className="px-4 pb-14 w-full">
      <div className="relative w-full">
        <Input
          type="text"
          placeholder={displayPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pr-[68px] pl-4 h-[64px] text-4xl overflow-x-auto focus-visible:ring-gray-400"
          style={{ fontSize: "1rem" }}
          disabled={!isSearchBarActive || selectedSources.length === 0}
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading || !isSearchBarActive || selectedSources.length === 0}
          className={`absolute right-3 top-1/2 -translate-y-1/2 h-[40px] w-[40px] p-0 rounded-md ${
            selectedSources.length === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#4361EE] hover:bg-[#3651DE]'
          }`}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
      {/* <div className="mt-4 mb-2 flex items-center">
        <Select
          value={maxSources.toString()}
          onValueChange={(value) => setMaxSources(Number(value))}
          disabled={!isSearchBarActive}
        >
          <SelectTrigger className="w-[180px] bg-gray-50 border-gray-100 transition-all duration-200 hover:bg-gray-100 hover:border-gray-200">
            <span className="text-sm text-gray-500 font-medium mr-1">
              Max sources:
            </span>
            <SelectValue className="pl-0" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="15">15</SelectItem>
          </SelectContent>
        </Select>
      </div> */}
    </div>
  );
}
