// src/services/threadManagementApi.ts

import { fetchAuthSession } from "aws-amplify/auth";
import { v4 as uuidv4 } from "uuid";
import { SourceType } from '@/contexts/ThreadContext';

const API_BASE_URL =
  "https://q3tiqbz2p1.execute-api.eu-north-1.amazonaws.com/prod/";
const API_KEY = "mjOEDZp0xk805jnLkZmVI8HshfKc41oDvNjiNof7";

const baseHeaders = {
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

export const getCurrentUserId = async (): Promise<string> => {
  const session = await fetchAuthSession();
  const sub = session.tokens?.idToken?.payload?.sub ?? "";
  //   console.log('User sub:', sub);
  return sub;
};
export interface Source {
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

interface AnswerContent {
  claim: string;
  relevant_source_quote: string;
  source_id: string;
}

export interface ThreadMessage {
  type: "question" | "answer";
  content: string | AnswerContent[];
}

export interface Thread {
  thread_uid: string;
  owner_uid: string;
  shared_with: string[];
  messages: ChatMessage[];
  sources: Source[];
  status_indicator: "searching" | "processing" | "completed";
  source_type?: SourceType | null;
}

export interface ThreadRef {
  thread_uid: string;
  thread_name: string;
  source_type?: SourceType | null;
}

export interface UserMetadata {
  user_uid: string;
  thread_refs: ThreadRef[];
}

export interface Answer {
  claim: string;
  relevant_source_quote: string;
  source_id: string;
}

export interface ChatMessage {
  type: "question" | "answer";
  content: string | Answer[];
}

export async function createNewThread(
  userId: string,
  threadName: string,
  sourceType?: SourceType
): Promise<Thread> {
  const threadUid = uuidv4();

  const newThread: Thread = {
    thread_uid: threadUid,
    owner_uid: userId,
    shared_with: [],
    messages: [],
    sources: [],
    status_indicator: "searching",
    source_type: sourceType || null,
  };

  const threadResponse = await fetch(`${API_BASE_URL}/thread`, {
    method: "POST",
    headers: {
      ...baseHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newThread),
  });

  if (!threadResponse.ok) {
    throw new Error(`Failed to create thread: ${await threadResponse.text()}`);
  }

  const threadRef: ThreadRef = {
    thread_name: threadName,
    thread_uid: threadUid,
    source_type: sourceType || null,
  };

  const mappingResponse = await fetch(
    `${API_BASE_URL}/user_metadata/${userId}/thread`,
    {
      method: "POST",
      headers: {
        ...baseHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(threadRef),
    }
  );

  if (!mappingResponse.ok) {
    await fetch(`${API_BASE_URL}/thread/${threadUid}`, {
      method: "DELETE",
      headers: baseHeaders,
    });
    throw new Error("Failed to create thread mapping");
  }

  return newThread;
}

export const getUserThreads = async (): Promise<ThreadRef[]> => {
  const userUid = await getCurrentUserId();
  console.log("Current user ID:", userUid);

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/user_metadata/${userUid}`, {
    method: "GET",
    headers: {
      ...baseHeaders,
    },
  });

  if (!response.ok) {
    console.error(
      "Failed to fetch user threads:",
      response.status,
      response.statusText
    );
    throw new Error("Failed to fetch user threads");
  }

  const data = await response.json();
  console.log("User metadata response:", data);
  // Ensure thread_refs always has source_type, default to null if missing
  const threadsWithSourceType = (data.thread_refs || []).map((ref: any) => ({
      ...ref,
      source_type: ref.source_type || null,
  }));
  return threadsWithSourceType;
};

export const getThreadStatus = async (threadId: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/thread/${threadId}/status`, {
    headers: baseHeaders,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch thread status: ${response.statusText}`);
  }

  const status = await response.json();
  console.log("[getThreadStatus] Raw API response:", status);

  // Return the status directly since it's already a string
  return status;
};

export const getThread = async (threadId: string): Promise<Thread> => {
  const response = await fetch(`${API_BASE_URL}/thread/${threadId}`, {
    method: "GET",
    headers: {
      ...baseHeaders,
    },
  });

  if (!response.ok) {
    console.error(
      "Failed to fetch thread:",
      response.status,
      response.statusText
    );
    throw new Error(`Failed to fetch thread: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Updates thread metadata including name and source type.
 * @param userId The ID of the user owning the metadata.
 * @param threadId The ID of the thread to update.
 * @param newName The new name for the thread.
 * @param sourceType The source type (either 'pubmed' or 'library').
 */
export const updateThreadMetadata = async (
  userId: string,
  threadId: string,
  newName: string,
  sourceType: SourceType | null = null
): Promise<UserMetadata> => {

  const payload = {
      thread_name: newName,
      source_type: sourceType,
  };

  console.log(`Updating thread ${threadId} metadata for user ${userId} with payload:`, payload);

  const response = await fetch(
      `${API_BASE_URL}/user_metadata/${userId}/thread/${threadId}`,
      {
          method: "PUT",
          headers: baseHeaders,
          body: JSON.stringify(payload),
      }
  );

  if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update thread metadata (${response.status}): ${errorText}`);
      // Try parsing the error detail for better feedback
      let detail = `Failed to update thread metadata: ${response.statusText}`;
      try {
          const errorJson = JSON.parse(errorText);
          if(errorJson.detail) {
              detail = errorJson.detail;
          }
      } catch(e) {
          // Ignore parse error, use original message
      }
      throw new Error(detail);
  }

  const updatedMetadata: UserMetadata = await response.json();
  console.log("Successfully updated thread metadata:", updatedMetadata);
  return updatedMetadata;
};

export const deleteThread = async (
  userId: string,
  threadId: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/user_metadata/${userId}/thread_ownership/${threadId}`,
    {
      method: "DELETE",
      headers: baseHeaders,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete thread: ${response.statusText}`);
  }
};
