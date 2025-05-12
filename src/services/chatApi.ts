// src/services/chatApi.ts

// Types for chat message interface
export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
}

// Request body for chat API
export interface ChatRequestBody {
  paper_uid: string;
  message_history: ChatMessage[];
}

// Error response from API
export interface ErrorResponse {
  error?: string;
  message?: string;
}

/**
 * Fetch a response from the chat API for a specific paper
 * @param paperId The unique identifier of the paper
 * @param history The current chat message history
 * @returns The AI's response text
 */
export async function fetchChatResponse(paperId: string, history: ChatMessage[]): Promise<string> {
  const endpointUrl = 'https://ujzm7ww8k6.execute-api.eu-north-1.amazonaws.com/prod/chat';
  // Get API key from environment variables - in Vite, use import.meta.env
  const apiKey = '7yJFj765Zl3fB4ygVe9m6aqJgFzv5Y9I41XgYaem';

  const requestBody: ChatRequestBody = {
    paper_uid: paperId,
    message_history: history,
  };

  try {
    console.log('Sending request for paper:', paperId);
    console.log('Message history:', history);
    
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    // Check if the request was successful
    if (response.ok) {
      // Success: Response body is plain text
      const textResponse = await response.text();
      return textResponse;
    } else {
      // Handle API errors (which return JSON)
      let errorData: ErrorResponse = { error: `HTTP error! Status: ${response.status}` };
      
      try {
        // Try to parse the JSON error body
        errorData = await response.json();
      } catch (parseError) {
        // If parsing fails, use the status text or a generic message
        console.error("Failed to parse error JSON:", parseError);
        errorData.error = response.statusText || `HTTP error ${response.status}`;
      }
      
      // Use errorData.message for 403, errorData.error for others
      const errorMessage = errorData.message || errorData.error;
      console.error(`API Error (${response.status}): ${errorMessage}`);
      throw new Error(`API Error: ${errorMessage}`);
    }
  } catch (error) {
    // Handle network errors or other exceptions during fetch
    console.error('Fetch failed:', error);
    if (error instanceof Error) {
      throw new Error(`Network or fetch error: ${error.message}`);
    } else {
      throw new Error('An unknown network error occurred.');
    }
  }
}
