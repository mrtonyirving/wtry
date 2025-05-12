// src/hooks/useSourceManager.ts
import { useCallback, useMemo } from 'react';
import { Source } from '@/services/threadManagementApi';
import { getSourceUniqueId } from '@/utils/sourceUtils';

/**
 * Custom hook for managing and deduplicating sources
 * @param rawSources The original sources array from the API
 * @returns Deduplicated sources and mapping utilities
 */
export const useSourceManager = (rawSources: Source[]) => {
  // Create a map of unique sources
  const uniqueSources = useMemo(() => {
    const sourceMap = new Map<string, Source & { originalIndex: number }>();
    
    // First pass - add all sources to the map
    rawSources.forEach((source, index) => {
      const uniqueId = getSourceUniqueId(source);
      // Only keep the first occurrence of each source to preserve original ordering
      if (!sourceMap.has(uniqueId)) {
        sourceMap.set(uniqueId, { ...source, originalIndex: index });
      }
    });
    
    return Array.from(sourceMap.values());
  }, [rawSources]);
  
  // Create a mapping from original source indices to unique source indices
  const sourceIndexMapping = useMemo(() => {
    const mapping = new Map<number, number>();
    
    rawSources.forEach((source, originalIndex) => {
      const uniqueId = getSourceUniqueId(source);
      const uniqueIndex = uniqueSources.findIndex(
        s => getSourceUniqueId(s) === uniqueId
      );
      mapping.set(originalIndex, uniqueIndex);
    });
    
    return mapping;
  }, [rawSources, uniqueSources]);
  
  // Function to convert a reference index (from the raw sources array) to an index in the unique sources array
  const mapSourceIndex = useCallback(
    (originalIndex: number): number => {
      return sourceIndexMapping.get(originalIndex) ?? originalIndex;
    },
    [sourceIndexMapping]
  );
  
  return {
    uniqueSources,
    mapSourceIndex,
    totalRawSources: rawSources.length,
    totalUniqueSources: uniqueSources.length
  };
};
