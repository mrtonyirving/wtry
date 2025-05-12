import React, { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import Fuse from "fuse.js";
import { StoredSource } from "@/services/libraryManagementApi";

interface LibrarySearchProps {
  sources: StoredSource[];
  onSearchResults: (results: StoredSource[]) => void;
}

const LibrarySearch: React.FC<LibrarySearchProps> = ({
  sources,
  onSearchResults,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [fuse, setFuse] = useState<Fuse<StoredSource> | null>(null);

  // Initialize Fuse.js when sources change
  useEffect(() => {
    const fuseOptions = {
      includeScore: true,
      threshold: 0.3, // Lower threshold for more matches
      ignoreLocation: true,
      useExtendedSearch: true,
      minMatchCharLength: 2, // Match with as few as 2 characters
      findAllMatches: true, // Find all matches in the string
      keys: [
        { name: "title", weight: 2 },
        { name: "authors", weight: 1.5 },
        { name: "journal", weight: 1 },
        { name: "abstract", weight: 0.8 },
        { name: "keywords", weight: 1.2 },
        { name: "tags", weight: 1.2 },
        { name: "doi", weight: 0.5 },
        { name: "pmid", weight: 0.5 },
        { name: "country", weight: 1 },
      ],
    };

    setFuse(new Fuse(sources, fuseOptions));
  }, [sources]);

  // Debounce search to avoid excessive re-renders
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Perform search with debounce
  const performSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim() || !fuse) {
        onSearchResults(sources);
        return;
      }

      // Direct text matching for partial words
      const directMatches = sources.filter((source) => {
        const lowerQuery = query.toLowerCase();

        // Check title for partial word matches
        if (source.title && source.title.toLowerCase().includes(lowerQuery)) {
          return true;
        }

        // Check country
        if (
          source.country &&
          source.country.toLowerCase().includes(lowerQuery)
        ) {
          return true;
        }

        // Check authors (as array)
        if (
          source.authors &&
          source.authors.some((author) =>
            author.toLowerCase().includes(lowerQuery)
          )
        ) {
          return true;
        }

        // Check journal
        if (
          source.journal &&
          source.journal.toLowerCase().includes(lowerQuery)
        ) {
          return true;
        }

        // Check abstract
        if (
          source.abstract &&
          source.abstract.toLowerCase().includes(lowerQuery)
        ) {
          return true;
        }

        // Check keywords (as array)
        if (
          source.keywords &&
          source.keywords.some((keyword) =>
            keyword.toLowerCase().includes(lowerQuery)
          )
        ) {
          return true;
        }

        return false;
      });

      // Then do fuzzy search
      const results = fuse.search(query);
      const fuzzyResults = results.map((result) => result.item);

      // Combine results, removing duplicates
      const combinedResults = [...directMatches];

      fuzzyResults.forEach((item) => {
        if (
          !combinedResults.some(
            (existing) => existing.source_id === item.source_id
          )
        ) {
          combinedResults.push(item);
        }
      });

      onSearchResults(combinedResults);
    }, 300),
    [fuse, sources, onSearchResults]
  );

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    onSearchResults(sources);
  };

  return (
    <div className="relative w-full mb-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="bg-white border border-gray-300 text-gray-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
          placeholder="Search in library by title, author, journal, country..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            onClick={handleClearSearch}
          >
            <span className="text-gray-400 hover:text-gray-600">✕</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LibrarySearch;
