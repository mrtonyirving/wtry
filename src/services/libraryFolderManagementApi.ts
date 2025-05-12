import { fetchAuthSession } from "aws-amplify/auth";

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

export interface FolderInfo {
  folder_path: string;
  display_name?: string;
  created_at?: string;
  last_modified?: string;
  parent_folder?: string;
}

export const getUserFolders = async (): Promise<FolderInfo[]> => {
  const userUid = await getCurrentUserId();

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  const url = `${API_BASE_URL}/user_storage/${userUid}/folders`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    console.error(
      "Failed to fetch user folders:",
      response.status,
      response.statusText
    );
    throw new Error("Failed to fetch user folders");
  }

  return response.json();
};

export const createUserFolder = async (
  folder: Partial<FolderInfo>
): Promise<FolderInfo> => {
  const userUid = await getCurrentUserId();

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  // Ensure folder_path is set
  if (!folder.folder_path) {
    throw new Error("Folder path is required");
  }

  // Normalize folder path (ensure it starts and ends with /)
  let folderPath = folder.folder_path;
  if (!folderPath.startsWith("/")) {
    folderPath = `/${folderPath}`;
  }
  if (!folderPath.endsWith("/")) {
    folderPath = `${folderPath}/`;
  }

  const folderInfo: FolderInfo = {
    ...folder,
    folder_path: folderPath,
  };

  const response = await fetch(
    `${API_BASE_URL}/user_storage/${userUid}/folder`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(folderInfo),
    }
  );

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Folder already exists");
    }
    console.error(
      "Failed to create user folder:",
      response.status,
      response.statusText
    );
    throw new Error("Failed to create user folder");
  }

  return response.json();
};

export const deleteUserFolder = async (folderPath: string): Promise<void> => {
  const userUid = await getCurrentUserId();

  if (!userUid) {
    throw new Error("User not authenticated");
  }

  // Normalize folder path
  if (!folderPath.startsWith("/")) {
    folderPath = `/${folderPath}`;
  }
  if (!folderPath.endsWith("/")) {
    folderPath = `${folderPath}/`;
  }

  // URL encode the folder path
  const encodedPath = encodeURIComponent(folderPath);

  const response = await fetch(
    `${API_BASE_URL}/user_storage/${userUid}/folder/${encodedPath}`,
    {
      method: "DELETE",
      headers,
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Folder not found");
    }
    console.error(
      "Failed to delete user folder:",
      response.status,
      response.statusText
    );
    throw new Error("Failed to delete user folder");
  }
};
