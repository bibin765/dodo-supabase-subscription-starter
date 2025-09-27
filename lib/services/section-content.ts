// Section Content API Services
// Handles Notes, Quizzes, Flashcards, and EduFeed for document sections

const API_BASE_URL = 'http://localhost:3001/api';

// HTTP Client with bearer token authentication (reused pattern)
class HttpClient {
  private static baseURL = API_BASE_URL;

  private static async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') {
      console.warn('getAuthToken called on server side');
      return null;
    }

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting Supabase session:', error);
        return null;
      }

      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private static async interceptRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAuthToken();

    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  }

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

// ==================== NOTES TYPES & SERVICE ====================

interface Note {
  id: string;
  title: string;
  content: string;
  is_generated: boolean;
  section_title: string;
  document_title: string;
  created_at: string;
}

interface NoteResponse {
  success: boolean;
  note: Note;
}

interface UpdateNoteRequest {
  title?: string;
  content?: string;
}

interface CreateNoteRequest {
  title: string;
  content: string;
}

interface NotesListResponse {
  success: boolean;
  notes: Note[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class NotesService {
  // Get notes for a specific section
  static async getSectionNotes(sectionId: string, params?: { limit?: number; offset?: number }): Promise<NotesListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = `/notes/sections/${sectionId}${queryString ? `?${queryString}` : ''}`;

    return HttpClient.get<NotesListResponse>(endpoint);
  }

  // Create a manual note for a specific section
  static async createSectionNote(sectionId: string, data: CreateNoteRequest): Promise<NoteResponse> {
    return HttpClient.post<NoteResponse>(`/notes/sections/${sectionId}`, data);
  }

  // Get specific note details
  static async getNote(id: string): Promise<NoteResponse> {
    return HttpClient.get<NoteResponse>(`/notes/${id}`);
  }

  // Update a manual note (generated notes cannot be edited)
  static async updateNote(id: string, data: UpdateNoteRequest): Promise<NoteResponse> {
    return HttpClient.put<NoteResponse>(`/notes/${id}`, data);
  }

  // Delete a note (only user-created notes)
  static async deleteNote(id: string): Promise<{ success: boolean; message: string }> {
    return HttpClient.delete(`/notes/${id}`);
  }

  // Get user's recent notes across all documents
  static async getRecentNotes(params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = `/notes/user/recent${queryString ? `?${queryString}` : ''}`;

    return HttpClient.get(endpoint);
  }
}

// ==================== QUIZ TYPES & SERVICE ====================

interface QuizQuestion {
  question: string;
  options?: string[];
  correct_answer?: number;
  answer?: boolean | string;
  sample_answer?: string;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: {
    multiple_choice: QuizQuestion[];
    true_false: QuizQuestion[];
    fill_in_blank: QuizQuestion[];
    short_answer: QuizQuestion[];
  };
  section_title: string;
  created_at: string;
}

interface QuizAttempt {
  id: string;
  score: number;
  max_score: number;
  completed_at: string;
}

interface QuizResponse {
  success: boolean;
  quiz: Quiz;
  attempts: QuizAttempt[];
}

interface QuizAnswers {
  [key: string]: number | boolean | string;
}

interface QuizAttemptResponse {
  success: boolean;
  attempt: QuizAttempt;
  score: number;
  max_score: number;
  percentage: number;
  detailed_results: any;
}

interface CreateQuizRequest {
  title: string;
  questions: {
    multiple_choice: {
      question: string;
      options: string[];
      correct_answer: number;
      explanation?: string;
    }[];
    true_false: {
      question: string;
      answer: boolean;
      explanation?: string;
    }[];
    fill_in_blank: {
      question: string;
      answer: string;
    }[];
    short_answer: {
      question: string;
      sample_answer: string;
    }[];
  };
}

export class QuizService {
  // Get quiz for a specific section
  static async getSectionQuiz(sectionId: string): Promise<QuizResponse> {
    return HttpClient.get<QuizResponse>(`/quizzes/sections/${sectionId}`);
  }

  // Create a manual quiz for a specific section
  static async createSectionQuiz(sectionId: string, data: CreateQuizRequest): Promise<QuizResponse> {
    return HttpClient.post<QuizResponse>(`/quizzes/sections/${sectionId}`, data);
  }

  // Update an existing quiz (add more questions or modify existing ones)
  static async updateQuiz(quizId: string, data: CreateQuizRequest): Promise<QuizResponse> {
    return HttpClient.put<QuizResponse>(`/quizzes/${quizId}`, data);
  }

  // Submit quiz answers
  static async submitQuizAttempt(quizId: string, answers: QuizAnswers): Promise<QuizAttemptResponse> {
    return HttpClient.post<QuizAttemptResponse>(`/quizzes/${quizId}/attempt`, { answers });
  }

  // Get user's quiz attempt history
  static async getQuizAttempts(quizId: string, params?: { limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = `/quizzes/${quizId}/attempts${queryString ? `?${queryString}` : ''}`;

    return HttpClient.get(endpoint);
  }

  // Get user quiz statistics
  static async getUserQuizStats() {
    return HttpClient.get('/quizzes/user/stats');
  }

  // Get detailed results for a specific attempt
  static async getAttemptDetails(attemptId: string) {
    return HttpClient.get(`/quizzes/attempt/${attemptId}`);
  }
}

// ==================== FLASHCARDS TYPES & SERVICE ====================

interface Flashcard {
  id: string;
  front_text: string;
  back_text: string;
  difficulty_level: number;
  created_at: string;
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  section_title: string;
}

interface FlashcardsResponse {
  success: boolean;
  flashcards: Flashcard[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface FlashcardReviewRequest {
  quality: number; // 1-5 rating
}

interface FlashcardReviewResponse {
  success: boolean;
  review_data: {
    quality: number;
    easiness_factor: number;
    interval_days: number;
    repetitions: number;
    next_review_date: string;
  };
  message: string;
}

interface CreateFlashcardRequest {
  front_text: string;
  back_text: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
}

interface BulkCreateFlashcardsRequest {
  flashcards: CreateFlashcardRequest[];
}

interface FlashcardResponse {
  success: boolean;
  flashcard: Flashcard;
}

interface BulkFlashcardResponse {
  success: boolean;
  flashcards: Flashcard[];
  created_count: number;
}

interface UpdateFlashcardRequest {
  front_text?: string;
  back_text?: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
}

export class FlashcardsService {
  // Get flashcards for a specific section
  static async getSectionFlashcards(sectionId: string, params?: { limit?: number; offset?: number }): Promise<FlashcardsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = `/flashcards/sections/${sectionId}${queryString ? `?${queryString}` : ''}`;

    return HttpClient.get<FlashcardsResponse>(endpoint);
  }

  // Create a single flashcard for a specific section
  static async createSectionFlashcard(sectionId: string, data: CreateFlashcardRequest): Promise<FlashcardResponse> {
    return HttpClient.post<FlashcardResponse>(`/flashcards/sections/${sectionId}`, data);
  }

  // Create multiple flashcards for a specific section (bulk creation)
  static async createBulkSectionFlashcards(sectionId: string, data: BulkCreateFlashcardsRequest): Promise<BulkFlashcardResponse> {
    return HttpClient.post<BulkFlashcardResponse>(`/flashcards/sections/${sectionId}/bulk`, data);
  }

  // Update an existing flashcard
  static async updateFlashcard(flashcardId: string, data: UpdateFlashcardRequest): Promise<FlashcardResponse> {
    return HttpClient.put<FlashcardResponse>(`/flashcards/${flashcardId}`, data);
  }

  // Delete a flashcard
  static async deleteFlashcard(flashcardId: string): Promise<{ success: boolean; message: string }> {
    return HttpClient.delete(`/flashcards/${flashcardId}`);
  }

  // Get flashcards due for review
  static async getDueFlashcards(): Promise<FlashcardsResponse> {
    return HttpClient.get<FlashcardsResponse>('/flashcards/user/due');
  }

  // Submit flashcard review
  static async reviewFlashcard(flashcardId: string, review: FlashcardReviewRequest): Promise<FlashcardReviewResponse> {
    return HttpClient.post<FlashcardReviewResponse>(`/flashcards/${flashcardId}/review`, review);
  }

  // Get specific flashcard details
  static async getFlashcard(id: string) {
    return HttpClient.get(`/flashcards/${id}`);
  }

  // Get flashcard learning statistics
  static async getUserFlashcardStats() {
    return HttpClient.get('/flashcards/user/stats');
  }

  // Get review session history
  static async getReviewHistory() {
    return HttpClient.get('/flashcards/user/review-history');
  }

  // Reset flashcard learning progress
  static async resetFlashcard(id: string) {
    return HttpClient.post(`/flashcards/${id}/reset`);
  }
}

// ==================== EDUFEED TYPES & SERVICE ====================

interface EduFeedReply {
  id: string;
  personality: string;
  content: string;
  likes_count: number;
  personality_name: string;
  emoji: string;
  user_interaction: string | null;
}

interface EduFeedPost {
  id: string;
  personality: string;
  content: string;
  likes_count: number;
  replies_count: number;
  created_at: string;
  section_title: string;
  personality_name: string;
  emoji: string;
  color: string;
  user_interaction: string | null;
  replies: EduFeedReply[];
}

interface EduFeedResponse {
  success: boolean;
  posts: EduFeedPost[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface PostInteractionRequest {
  interaction_type: 'like' | 'comment' | 'share';
  content?: string; // Required for comments
}

interface PostInteractionResponse {
  success: boolean;
  interaction_type: string;
  updated_counts: {
    likes_count: number;
    replies_count: number;
  };
  message: string;
}

interface PostComment {
  id: string;
  content: string;
  created_at: string;
  full_name: string;
  email: string;
}

interface PostCommentsResponse {
  success: boolean;
  comments: PostComment[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export class EduFeedService {
  // Get AI-generated social feed posts for a section
  static async getSectionPosts(sectionId: string, params?: { limit?: number; offset?: number }): Promise<EduFeedResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = `/edufeed/sections/${sectionId}${queryString ? `?${queryString}` : ''}`;

    return HttpClient.get<EduFeedResponse>(endpoint);
  }

  // Like, comment, or share a post
  static async interactWithPost(postId: string, interaction: PostInteractionRequest): Promise<PostInteractionResponse> {
    return HttpClient.post<PostInteractionResponse>(`/edufeed/${postId}/interact`, interaction);
  }

  // Get user comments on a post
  static async getPostComments(postId: string, params?: { limit?: number; offset?: number }): Promise<PostCommentsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const endpoint = `/edufeed/${postId}/comments${queryString ? `?${queryString}` : ''}`;

    return HttpClient.get<PostCommentsResponse>(endpoint);
  }
}

// Export all types
export type {
  Note,
  NoteResponse,
  NotesListResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizResponse,
  QuizAnswers,
  QuizAttemptResponse,
  CreateQuizRequest,
  Flashcard,
  FlashcardsResponse,
  FlashcardReviewRequest,
  FlashcardReviewResponse,
  CreateFlashcardRequest,
  BulkCreateFlashcardsRequest,
  FlashcardResponse,
  BulkFlashcardResponse,
  UpdateFlashcardRequest,
  EduFeedPost,
  EduFeedReply,
  EduFeedResponse,
  PostInteractionRequest,
  PostInteractionResponse,
  PostComment,
  PostCommentsResponse,
};