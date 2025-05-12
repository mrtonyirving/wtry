// src/utils/sourceUtils.ts
import { Source } from "@/services/threadManagementApi";

/**
 * Generates a unique identifier for a source based on PMID, DOI, or content hash
 * Used for deduplicating sources in the UI
 */
export const getSourceUniqueId = (source: Source): string => {
  if (source.pmid) return `pmid:${source.pmid}`;
  if (source.doi) return `doi:${source.doi}`;
  // Fallback to a content hash if neither PMID nor DOI exists
  return `title:${source.title?.slice(0, 50)}|journal:${source.journal?.slice(0, 20)}|date:${source.publication_date}`;
};
