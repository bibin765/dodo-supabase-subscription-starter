// Document Management Service
// Integrates with backend document APIs

// Type definitions based on API responses
interface Document {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  file_url: string;
  file_size: number;
  total_pages?: number;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at: string;
  folder_name?: string;
  section_count?: number;
  completed_sections?: number;
}

interface DocumentListResponse {
  success: boolean;
  documents: Document[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface DocumentResponse {
  success: boolean;
  document: Document;
  message?: string;
}

interface DocumentDeleteResponse {
  success: boolean;
  message: string;
}

interface DocumentProcessResponse {
  success: boolean;
  message: string;
  document_id: string;
  status: string;
}

interface DocumentSection {
  id: string;
  document_id?: string;
  title: string;
  content?: string;
  section_order: number;
  page_numbers?: number[];
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  updated_at?: string;
  content_length?: number;
  notes_count?: number;
  quiz_count?: number;
  flashcards_count?: number;
  document_title?: string;
}

interface DocumentSectionsResponse {
  success: boolean;
  sections: DocumentSection[];
}

interface DocumentSectionResponse {
  success: boolean;
  section: DocumentSection;
}

// Request types
interface CreateDocumentRequest {
  file: File;
  folder_id?: string;
}

interface UpdateDocumentRequest {
  title?: string;
  folder_id?: string;
}

interface ProcessDocumentRequest {
  force?: boolean;
}

interface ListDocumentsParams {
  folder_id?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  limit?: number;
  offset?: number;
}

interface SectionStatusResponse {
  success: boolean;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  last_updated: string;
  available_content: {
    notes_count: number;
    quiz_count: number;
    flashcards_count: number;
    edufeed_posts_count: number;
  };
}

interface ProcessingStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface ProcessingStatsResponse {
  success: boolean;
  stats: ProcessingStats;
}

// Import the HTTP client from folders service
const API_BASE_URL = 'http://localhost:3001/api';

// HTTP Interceptor for automatic token injection (reused from folders)
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
        return session.access_token;
      }

      console.warn('No active session found in Supabase');
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Request interceptor for regular JSON requests
  private static async interceptRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAuthToken();

    // Prepare headers (don't set Content-Type for FormData)
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Always add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  }

  // Response interceptor
  private static async interceptResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

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

  // Main request method
  public static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await this.interceptRequest(url, options);
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

  // Convenience methods
  public static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public static async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
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

export class DocumentService {
  // Upload a new PDF document
  static async uploadDocument(data: CreateDocumentRequest): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', data.file);

    if (data.folder_id) {
      formData.append('folder_id', data.folder_id);
    }

    return HttpClient.post<DocumentResponse>('/documents', formData);
  }

  // List user documents with filtering and pagination
  static async listDocuments(params?: ListDocumentsParams): Promise<DocumentListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.folder_id) {
      searchParams.append('folder_id', params.folder_id);
    }
    if (params?.status) {
      searchParams.append('status', params.status);
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      searchParams.append('offset', params.offset.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = `/documents${queryString ? `?${queryString}` : ''}`;

    return HttpClient.get<DocumentListResponse>(endpoint);
  }

  // Get detailed information about a specific document
  static async getDocumentDetails(id: string): Promise<DocumentResponse> {
    return HttpClient.get<DocumentResponse>(`/documents/${id}`);
  }

  // Update document metadata
  static async updateDocument(
    id: string,
    data: UpdateDocumentRequest
  ): Promise<DocumentResponse> {
    return HttpClient.put<DocumentResponse>(`/documents/${id}`, data);
  }

  // Delete a document and its associated files
  static async deleteDocument(id: string): Promise<DocumentDeleteResponse> {
    return HttpClient.delete<DocumentDeleteResponse>(`/documents/${id}`);
  }

  // Manually trigger or restart document processing
  static async processDocument(
    id: string,
    data?: ProcessDocumentRequest
  ): Promise<DocumentProcessResponse> {
    return HttpClient.post<DocumentProcessResponse>(`/documents/${id}/process`, data);
  }

  // Retry failed document processing
  static async retryDocumentProcessing(id: string): Promise<DocumentProcessResponse> {
    return HttpClient.post<DocumentProcessResponse>(`/documents/${id}/retry`);
  }

  // Get section processing status
  static async getSectionStatus(sectionId: string): Promise<SectionStatusResponse> {
    return HttpClient.get<SectionStatusResponse>(`/sections/${sectionId}/status`);
  }

  // Get processing statistics
  static async getProcessingStats(): Promise<ProcessingStatsResponse> {
    const response = await this.listDocuments({ limit: 100 });

    const stats = {
      total: response.documents.length,
      pending: response.documents.filter(d => d.processing_status === 'pending').length,
      processing: response.documents.filter(d => d.processing_status === 'processing').length,
      completed: response.documents.filter(d => d.processing_status === 'completed').length,
      failed: response.documents.filter(d => d.processing_status === 'failed').length
    };

    return { success: true, stats };
  }

  // List all sections for a document
  static async getDocumentSections(id: string): Promise<DocumentSectionsResponse> {
    return HttpClient.get<DocumentSectionsResponse>(`/documents/${id}/sections`);
  }

  // Get full content of a specific section
  static async getDocumentSection(
    documentId: string,
    sectionId: string
  ): Promise<DocumentSectionResponse> {
    return HttpClient.get<DocumentSectionResponse>(`/documents/${documentId}/sections/${sectionId}`);
  }
}

export type {
  Document,
  DocumentListResponse,
  DocumentResponse,
  DocumentDeleteResponse,
  DocumentProcessResponse,
  DocumentSection,
  DocumentSectionsResponse,
  DocumentSectionResponse,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  ProcessDocumentRequest,
  ListDocumentsParams,
  SectionStatusResponse,
  ProcessingStats,
  ProcessingStatsResponse,
};