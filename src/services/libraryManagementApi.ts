// src/services/libraryManagementApi.ts

import { fetchAuthSession } from "aws-amplify/auth";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL =
  "https://q3tiqbz2p1.execute-api.eu-north-1.amazonaws.com/prod";
const API_KEY = "mjOEDZp0xk805jnLkZmVI8HshfKc41oDvNjiNof7";

const headers = {
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

export const getCurrentUserId = async (): Promise<string> => {
  const session = await fetchAuthSession();
  const sub = session.tokens?.idToken?.payload?.sub ?? "";
  return sub;
};

export interface StoredSource {
  source_id?: string;
  user_uid: string;
  title: string;
  authors: string[];
  journal: string;
  publication_date: string;
  abstract?: string;
  keywords?: string[];
  mesh_terms?: string[];
  publication_type?: string[];
  pmc_id?: string | null;
  country?: string | null;
  citation_format?: string;
  number_of_citations?: number;
  relevancy_score?: number;
  doi?: string | null;
  pmid?: string;
  is_full_text_available?: boolean;
  is_pdf_saved?: boolean;
  s3_pdf_url?: string;
  s3_text_url?: string;
  path?: string;
  created_at?: string;
  last_accessed?: string;
  tags?: string[];
  user_paper_title?: string | null;
}

export const getUserSources = async (
  path?: string
): Promise<StoredSource[]> => {
  const userUid = await getCurrentUserId();

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  let url = `${API_BASE_URL}/user_storage/${userUid}/sources`;
  if (path) {
    url += `?path=${encodeURIComponent(path)}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    console.error(
      "Failed to fetch user sources:",
      response.status,
      response.statusText
    );
    throw new Error("Failed to fetch user sources");
  }

  return response.json();
};

export const getUserSource = async (
  sourceId: string
): Promise<StoredSource> => {
  const userUid = await getCurrentUserId();

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(
    `${API_BASE_URL}/user_storage/${userUid}/source/${sourceId}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Source not found");
    }
    console.error(
      "Failed to fetch user source:",
      response.status,
      response.statusText
    );
    throw new Error("Failed to fetch user source");
  }

  return response.json();
};

export const addUserSource = async (
  source: Partial<StoredSource>
): Promise<StoredSource> => {
  const userUid = await getCurrentUserId();

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  // Ensure user_uid is set
  const sourceWithUser: StoredSource = {
    ...source,
    user_uid: userUid,
    source_id: source.source_id || `src_${uuidv4().substring(0, 8)}`,
  } as StoredSource;

  // Log the source object for debugging
  console.log(
    "Source object to be saved:",
    JSON.stringify(sourceWithUser, null, 2)
  );

  const response = await fetch(
    `${API_BASE_URL}/user_storage/${userUid}/source`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(sourceWithUser),
    }
  );

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Source already exists");
    }
    console.error(
      "Failed to add user source:",
      response.status,
      response.statusText
    );
    throw new Error("Failed to add user source");
  }

  return response.json();
};

export const deleteUserSource = async (sourceId: string): Promise<void> => {
  const userUid = await getCurrentUserId();

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(
    `${API_BASE_URL}/user_storage/${userUid}/source/${sourceId}`,
    {
      method: "DELETE",
      headers,
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Source not found");
    }
    console.error(
      "Failed to delete user source:",
      response.status,
      response.statusText
    );
    throw new Error("Failed to delete user source");
  }
};

// Helper function to add a source from a thread to the user's library
export const addSourceFromThread = async (
  source: any,
  path: string = "/"
): Promise<StoredSource> => {
  // Transform the thread source format to the library source format
  const librarySource: Partial<StoredSource> = {
    title: source.title,
    authors: source.authors,
    journal: source.journal,
    publication_date: source.publication_date,
    abstract: source.abstract,
    keywords: source.keywords,
    mesh_terms: source.mesh_terms,
    publication_type: source.publication_type,
    pmc_id: source.pmc_id,
    country: source.country,
    citation_format: source.citation_format,
    number_of_citations: source.number_of_citations,
    doi: source.doi,
    pmid: source.pmid,
    is_full_text_available: source.is_full_text_available,
    is_pdf_saved: source.is_pdf_saved || false,
    s3_pdf_url: source.s3_pdf_url || null,
    s3_text_url: source.s3_text_url || null,
    path: path,
    tags: [],
  };

  return addUserSource(librarySource);
};

export const moveUserSource = async (
  sourceId: string,
  newPath: string
): Promise<StoredSource> => {
  const userUid = await getCurrentUserId();

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  // Normalize the path
  let normalizedPath = newPath;
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }
  if (!normalizedPath.endsWith("/")) {
    normalizedPath = `${normalizedPath}/`;
  }

  const response = await fetch(
    `${API_BASE_URL}/user_storage/${userUid}/source/${sourceId}/move`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ new_path: normalizedPath }),
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Source not found");
    }
    console.error(
      "Failed to move user source:",
      response.status,
      response.statusText
    );
    throw new Error("Failed to move user source");
  }

  return response.json();
};

// Get a presigned URL for uploading a PDF file
export const getUploadUrl = async (
  filename: string,
  contentType: string = "application/pdf",
  title?: string
): Promise<{
  upload_url: string;
  key: string;
  content_type: string;
  expires_in: number;
}> => {
  const userUid = await getCurrentUserId();

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  const url = `${API_BASE_URL}/user_pdf_storage/${userUid}/get_upload_url`;

  // Prepare payload with optional metadata
  const payload: any = {
    filename,
    content_type: contentType,
  };

  // Add title as metadata if provided
  if (title) {
    // Sanitize non-ASCII characters
    const sanitizedTitle = title.replace(/[^\x00-\x7F]/g, "-");
    payload.metadata = { title: sanitizedTitle };
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error(
      "Failed to get upload URL:",
      response.status,
      response.statusText
    );
    throw new Error("Failed to get upload URL");
  }

  return response.json();
};

// Upload a file to S3 using a presigned URL
export const uploadFileToS3 = async (
  file: File,
  presignedData: { upload_url: string; content_type: string }
): Promise<boolean> => {
  try {
    const response = await fetch(presignedData.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": presignedData.content_type,
      },
      body: file,
    });

    return response.ok;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
};

// Register an uploaded PDF in the database
export const registerUpload = async (
  s3Key: string,
  title: string,
  path: string = "/"
): Promise<StoredSource> => {
  const userUid = await getCurrentUserId();

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  const url = `${API_BASE_URL}/user_pdf_storage/${userUid}/register_upload`;

  // Normalize the path
  let normalizedPath = path;
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }
  if (!normalizedPath.endsWith("/")) {
    normalizedPath = `${normalizedPath}/`;
  }

  const payload = {
    key: s3Key,
    title,
    path: normalizedPath,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Check for 409 Conflict status FIRST
      if (response.status === 409) {
        console.warn(`Register upload conflict (409): Source already exists.`);
        // Throw the specific error message for 409 conflict
        throw new Error("Source already exists in this location.");
      }

      // For other errors, try to get a detailed message
      let errorMessage = `Failed to register upload (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.detail) {
          errorMessage = errorData.detail;
        } else {
          // Use statusText if detail is not available
          errorMessage = response.statusText || errorMessage;
        }
      } catch (parseError) {
        // If parsing fails, use status text or the generic message
        errorMessage = response.statusText || errorMessage;
        console.warn("Could not parse error response body.");
      }

      console.error(
        `Failed to register upload (${response.status}): ${errorMessage}`
      );
      // Throw a more informative error for non-409 errors
      throw new Error(`Failed to register upload: ${errorMessage}`);
    }

    // If response is ok
    return response.json();
  } catch (error) {
    // Catch errors from the fetch call itself (network errors) or the specific errors thrown above
    console.error("Error during registerUpload process:", error);
    // Re-throw the caught error to be handled by the caller
    // Ensure it's an Error object for consistent handling upstream
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unknown error occurred during upload registration.");
    }
  }
};
