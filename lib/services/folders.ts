interface Folder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  parent_folder_name?: string;
  subfolder_count?: number;
  document_count?: number;
  created_at: string;
  updated_at: string;
}

interface FolderListResponse {
  success: boolean;
  folders: Folder[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface FolderResponse {
  success: boolean;
  folder: Folder;
  message?: string;
}

interface FolderDeleteResponse {
  success: boolean;
  message: string;
}

interface FolderMoveResponse {
  success: boolean;
  message: string;
  moved_count: number;
}

interface CreateFolderRequest {
  name: string;
  parent_folder_id?: string | null;
}

interface UpdateFolderRequest {
  name?: string;
  parent_folder_id?: string | null;
}

interface MoveItemsRequest {
  item_type: 'document' | 'folder';
  item_ids: string[];
}

const API_BASE_URL = 'http://localhost:3001/api';

// HTTP Interceptor for automatic token injection
class HttpClient {
  private static baseURL = API_BASE_URL;

  private static async getAuthToken(): Promise<string | null> {
    // Only run on client side
    if (typeof window === 'undefined') {
      console.warn('getAuthToken called on server side');
      return null;
    }

    try {
      // Use the existing Supabase client from the project
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      // Get the current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting Supabase session:', error);
        return null;
      }

      if (session?.access_token) {
        console.log('Retrieved access token from Supabase:', session.access_token.substring(0, 20) + '...');
        return session.access_token;
      }

      console.warn('No active session found in Supabase');
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Request interceptor - automatically adds Authorization header to all requests
  private static async interceptRequest(url: string, options: RequestInit = {}): Promise<Response> {
    console.log('🔄 Making request to:', url);

    const token = await this.getAuthToken();

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Always add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Authorization header added:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.warn('❌ No authentication token found. Request may fail if authentication is required.');
    }

    console.log('📤 Request headers:', headers);

    // Make the request with intercepted headers
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('📥 Response status:', response.status, response.statusText);

    return response;
  }

  // Response interceptor - handles common response logic
  private static async interceptResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Unauthorized: Please log in again');
      } else if (response.status === 403) {
        throw new Error('Forbidden: You do not have permission to perform this action');
      } else {
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    }

    return response.json();
  }

  // Main request method with full interceptor pipeline
  public static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      // Apply request interceptor
      const response = await this.interceptRequest(url, options);

      // Apply response interceptor
      return await this.interceptResponse<T>(response);
    } catch (error) {
      console.error('HTTP Request failed:', {
        url,
        method: options.method || 'GET',
        error: error instanceof Error ? error.message : error
      });
      throw error;
    }
  }

  // Convenience methods for different HTTP methods
  public static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public static async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public static async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  public static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class FolderService {

  static async listFolders(params?: {
    parent_folder_id?: string | null;
    limit?: number;
    offset?: number;
  }): Promise<FolderListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.parent_folder_id !== undefined) {
      searchParams.append('parent_folder_id', params.parent_folder_id || 'null');
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      searchParams.append('offset', params.offset.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = `/folders${queryString ? `?${queryString}` : ''}`;

    return HttpClient.get<FolderListResponse>(endpoint);
  }

  static async createFolder(data: CreateFolderRequest): Promise<FolderResponse> {
    return HttpClient.post<FolderResponse>('/folders', data);
  }

  static async getFolderDetails(id: string): Promise<FolderResponse> {
    return HttpClient.get<FolderResponse>(`/folders/${id}`);
  }

  static async updateFolder(
    id: string,
    data: UpdateFolderRequest
  ): Promise<FolderResponse> {
    return HttpClient.put<FolderResponse>(`/folders/${id}`, data);
  }

  static async deleteFolder(
    id: string,
    force?: boolean
  ): Promise<FolderDeleteResponse> {
    const searchParams = new URLSearchParams();
    if (force) {
      searchParams.append('force', 'true');
    }

    const queryString = searchParams.toString();
    const endpoint = `/folders/${id}${queryString ? `?${queryString}` : ''}`;

    return HttpClient.delete<FolderDeleteResponse>(endpoint);
  }

  static async moveItemsToFolder(
    folderId: string,
    data: MoveItemsRequest
  ): Promise<FolderMoveResponse> {
    return HttpClient.post<FolderMoveResponse>(`/folders/${folderId}/move`, data);
  }
}

export type {
  Folder,
  FolderListResponse,
  FolderResponse,
  FolderDeleteResponse,
  FolderMoveResponse,
  CreateFolderRequest,
  UpdateFolderRequest,
  MoveItemsRequest,
};