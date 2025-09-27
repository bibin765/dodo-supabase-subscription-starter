// Document Processor with Socket.IO Real-time Integration
import { io, Socket } from 'socket.io-client';

export interface ProcessingStatus {
  documentId: string;
  status: 'processing' | 'completed' | 'failed';
  stage: 'queued' | 'started' | 'downloading' | 'extracting' | 'chunking' | 'saving' | 'completed' | 'failed' | 'retrying';
  message: string;
  progress?: number; // 0-100
  sectionsCount?: number;
  totalPages?: number;
  error?: string;
}

export interface UploadCompleteData {
  documentId: string;
  document: {
    id: string;
    title: string;
    file_size: number;
    processing_status: string;
    created_at: string;
  };
}

export interface SectionCompleteData {
  documentId: string;
  sectionId: string;
  sectionTitle: string;
  contentType: 'notes' | 'quiz' | 'flashcards' | 'edufeed';
  itemsCount: number;
}

export interface EduFeedInteractionData {
  postId: string;
  userId: string;
  interactionType: 'like' | 'comment' | 'share';
  updatedCounts: {
    likes_count: number;
    replies_count: number;
  };
}

type EventCallback<T = any> = (data: T) => void;

export class DocumentProcessor {
  private socket: Socket | null = null;
  private listeners: Map<string, EventCallback[]> = new Map();
  private userId: string;
  private token: string;
  private apiBaseUrl: string;

  constructor(userId: string, token: string, apiBaseUrl: string = 'http://localhost:3001') {
    this.userId = userId;
    this.token = token;
    this.apiBaseUrl = apiBaseUrl;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔄 Attempting to connect to Socket.IO server:', this.apiBaseUrl);
        console.log('👤 User ID:', this.userId);
        console.log('🔑 Token preview:', this.token.substring(0, 20) + '...');

        this.socket = io(this.apiBaseUrl, {
          auth: {
            token: this.token
          },
          transports: ['websocket'],
          timeout: 10000
        });

        this.socket.on('connect', () => {
          console.log('✅ Socket connected successfully:', this.socket?.id);

          // Join user-specific room
          console.log('🏠 Joining user room:', this.userId);
          this.socket?.emit('join-user-room', this.userId);

          // Setup event listeners
          this.setupEventListeners();

          resolve();
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('❌ Socket connection error:', error);
          console.error('💡 Check if backend Socket.IO server is running on:', this.apiBaseUrl);
          reject(error);
        });

        this.socket.on('disconnect', (reason: string) => {
          console.warn('⚠️ Socket disconnected:', reason);
          this.emit('disconnect', { reason });
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
        reject(error);
      }
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    console.log('📡 Setting up Socket.IO event listeners...');

    // Document upload confirmation
    this.socket.on('document-uploaded', (data: UploadCompleteData) => {
      console.log('📄 Document uploaded event received:', data);
      this.emit('upload-complete', data);
    });

    // Processing status updates
    this.socket.on('document-processing', (data: ProcessingStatus) => {
      console.log('⚙️ Processing update received:', data);
      this.emit('processing-update', data);
    });

    // Section processing complete
    this.socket.on('section-processed', (data: SectionCompleteData) => {
      console.log('✅ Section processed event received:', data);
      this.emit('section-complete', data);
    });

    // EduFeed interactions
    this.socket.on('edufeed-interaction', (data: EduFeedInteractionData) => {
      console.log('💬 EduFeed interaction event received:', data);
      this.emit('feed-update', data);
    });

    // Error handling
    this.socket.on('error', (error: any) => {
      console.error('❌ Socket error received:', error);
      this.emit('error', error);
    });

    // Test event to verify connection
    this.socket.on('test-event', (data: any) => {
      console.log('🧪 Test event received:', data);
    });

    console.log('✅ All Socket.IO event listeners set up successfully');
  }

  // Event emitter pattern
  on<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback?: EventCallback): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  private emit<T = any>(event: string, data: T): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event callback for ${event}:`, error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Manual retry connection
  async reconnect(): Promise<void> {
    this.disconnect();
    await this.connect();
  }

  // Test backend connection and processing
  testConnection(): void {
    if (!this.socket?.connected) {
      console.error('❌ Socket not connected. Cannot test.');
      return;
    }

    console.log('🧪 Testing backend connection...');

    // Test basic connectivity
    this.socket.emit('test-connection', {
      userId: this.userId,
      timestamp: new Date().toISOString()
    });

    // Test if user room joining worked
    this.socket.emit('test-user-room', {
      userId: this.userId
    });

    console.log('📤 Test events sent. Check backend logs and browser console for responses.');
  }
}

// Utility functions for processing stages
export const getStageInfo = (stage: ProcessingStatus['stage']) => {
  const stages = {
    'queued': { message: 'Queued for processing', icon: '⏳', color: 'warning' },
    'started': { message: 'Processing started', icon: '🚀', color: 'info' },
    'downloading': { message: 'Downloading PDF', icon: '⬇️', color: 'info' },
    'extracting': { message: 'Extracting text', icon: '📄', color: 'info' },
    'chunking': { message: 'Creating sections', icon: '✂️', color: 'info' },
    'saving': { message: 'Saving sections', icon: '💾', color: 'info' },
    'completed': { message: 'Processing complete', icon: '✅', color: 'success' },
    'failed': { message: 'Processing failed', icon: '❌', color: 'error' },
    'retrying': { message: 'Retrying processing', icon: '🔄', color: 'warning' }
  } as const;

  return stages[stage] || { message: stage, icon: '🔄', color: 'info' };
};

// Error handling utility
export const handleApiErrors = (error: any): string => {
  if (typeof error === 'string') return error;

  if (error?.code) {
    switch (error.code) {
      case 'DATABASE_UNAVAILABLE':
        return 'Database temporarily unavailable. Please try again.';
      case 'UPLOAD_FAILED':
        return 'File upload failed. Please check your file and try again.';
      case 'PROCESSING_ERROR':
        return 'Document processing failed. You can retry processing.';
      case 'INVALID_FILE':
        return 'Only PDF files are supported.';
      case 'FILE_TOO_LARGE':
        return 'File is too large. Maximum size is 50MB.';
      case 'QUOTA_EXCEEDED':
        return 'Processing quota exceeded. Please upgrade your plan.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  return error?.message || 'An unexpected error occurred.';
};

// Processing progress calculator
export const calculateProgress = (status: ProcessingStatus): number => {
  if (status.progress !== undefined) {
    return status.progress;
  }

  // Estimate progress based on stage
  const stageProgress = {
    'queued': 0,
    'started': 10,
    'downloading': 20,
    'extracting': 40,
    'chunking': 60,
    'saving': 80,
    'completed': 100,
    'failed': 0,
    'retrying': 5
  };

  return stageProgress[status.stage] || 0;
};