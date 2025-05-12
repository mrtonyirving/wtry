// src/components/AISearch/ListedSources.tsx

import SourceCard from "./SourceCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";

interface Source {
  sourceNumber: number;
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  publication_date: string;
  abstract: string;
  keywords: string[];
  mesh_terms: string[];
  publication_type: string[];
  pmc_id: string | null;
  country: string;
  citation_format: string;
  number_of_citations: number;
  relevancy_score: number;
  doi: string | null;
  is_full_text_available: boolean;
}

interface ListedSourcesProps {
  sources: Source[];
  hoveredSourceId?: number | null;
  onSourceHover?: (id: number | null) => void;
  scrollOnHover?: boolean; // Add new prop to control scroll behavior
  totalCount?: number; // Add new prop to display total unique source count
  sidebar_open?: boolean;
}

export default function ListedSources({
  sources,
  hoveredSourceId,
  onSourceHover,
  scrollOnHover = false, // Default to false to disable autoscrolling
  totalCount,
  sidebar_open = false,
}: ListedSourcesProps): JSX.Element {
  const sourceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isInternalHover, setIsInternalHover] = useState(false);

  useEffect(() => {
    if (hoveredSourceId !== null && hoveredSourceId !== undefined && !isInternalHover && scrollOnHover) {
      const sourceElement = sourceRefs.current[hoveredSourceId - 1];
      const scrollArea = document.querySelector('.sources-scroll-area > [data-radix-scroll-area-viewport]');
      
      if (sourceElement && scrollArea) {
        // Smoothly scroll the source into view
        scrollArea.scrollTo({
          top: sourceElement.offsetTop - 100, // Add some vertical padding
          behavior: 'smooth'
        });
        
        // Prevent the event from affecting other parts of the page
        sourceElement.addEventListener('mouseenter', (e) => {
          e.stopPropagation();
        }, { once: true });
      }
    }
  }, [hoveredSourceId, isInternalHover, scrollOnHover]);

  // Create modified handlers for source card hover events
  const handleSourceHover = (id: number | null) => {
    setIsInternalHover(id !== null);
    if (onSourceHover) {
      onSourceHover(id);
    }
  };

  // Use totalCount if provided, otherwise fall back to sources.length
  const displayCount = totalCount !== undefined ? totalCount : sources.length;

  return (
    <div className="h-screen bg-gray-50 border-gray-200 rounded-lg overflow-hidden pb-9">
      <div className="flex items-center gap-2 p-4 border-b">
        <h1 className="text-lg font-semibold text-gray-900">
          Retrieved sources
        </h1>
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-medium text-sm">
          {displayCount}
        </div>
      </div>
      <ScrollArea className="h-[calc(100%-73px)] sources-scroll-area" ref={scrollAreaRef}>
        <div className="p-2">
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div 
                key={index} 
                ref={(el) => (sourceRefs.current[index] = el)}
                className="relative"
              >
                <SourceCard
                  sourceNumber={index + 1}
                  title={source.title}
                  authors={source.authors}
                  journal={source.journal}
                  date={source.publication_date}
                  abstract={source.abstract}
                  citations={source.number_of_citations}
                  doi={source.doi}
                  pmid={source.pmid}
                  pmc_id={source.pmc_id}
                  isHovered={hoveredSourceId === index + 1}
                  onHover={handleSourceHover}
                  country={source.country}
                  is_full_text_available={source.is_full_text_available}
                  sidebar_open={sidebar_open}
                />
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}