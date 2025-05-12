// src/services/chatInterfaceApi.ts

import { getCurrentUserId } from './threadManagementApi';
import { SourceType } from '@/contexts/ThreadContext';

export const chatQuery = async (
  question: string,
  threadUid: string,
  maxSources?: number,
  sourceType: SourceType = 'pubmed'
): Promise<{ message: string }> => {
  const url = 'https://lfgcqgn053.execute-api.eu-north-1.amazonaws.com/prod/search';

  try {
    const userUid = await getCurrentUserId();

    // Create request payload
    const requestPayload = {
      query: question,
      source_type: sourceType, // Using correct parameter name
      user_uid: userUid,
      thread_uid: threadUid,
      max_returned_sources: maxSources,
    };

    // Log the complete request details
    console.log('=== API REQUEST DETAILS ===');
    console.log('URL:', url);
    console.log('Headers:', {
      "x-api-key": "TaDBlD3g9K8OHrMhXdwRO1lJC1bWDmIS32opZRtp",
      "Content-Type": "application/json"
    });
    console.log('Request Payload:', JSON.stringify(requestPayload, null, 2));
    console.log('Selected Source:', sourceType);
    console.log('========================');

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": "TaDBlD3g9K8OHrMhXdwRO1lJC1bWDmIS32opZRtp",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error) {
    console.error('Error calling search API:', error);
    throw error;
  }
};

export interface Source {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  publication_date: string;
  number_of_citations: number;
  is_full_text_available: boolean;
}

export interface Answer {
  claim: string;
  relevant_source_quote: string;
  source_id: string;
  linked_index: number | null;
}

export const createSourceMapping = (data: { sources?: Source[] }): Record<string, number> => {
  if (!data.sources || !Array.isArray(data.sources)) {
    return {};
  }
  
  return data.sources.reduce((acc: Record<string, number>, source: Source, index: number) => {
    acc[source.pmid] = index + 1;
    return acc;
  }, {});
}
